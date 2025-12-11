const express = require('express');
const router = express.Router();
const db = require('../config/databaseSecure');
const emailService = require('../services/emailService');

/**
 * POST /api/react-native/citas
 * Consulta todas las citas de un paciente y opcionalmente envía resumen
 */
router.post('/citas', async (req, res) => {
  const { pacienteId, enviarEmail = false } = req.body;

  if (!pacienteId) {
    return res.status(400).json({
      success: false,
      message: 'pacienteId es requerido'
    });
  }

  try {
    const citasQuery = `
      SELECT c.id, c.fecha, c.hora, c.estado, c.servicio, c.odontologo_id,
             u.nombre as odontologo_nombre, u.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios u ON c.odontologo_id = u.id
      WHERE c.paciente_id = $1
      ORDER BY c.fecha DESC, c.hora DESC
      LIMIT 20
    `;

    const result = await db.secureQuery(citasQuery, [pacienteId]);

    if (enviarEmail && result.rows.length > 0) {
      const pacienteQuery = `SELECT nombre, apellido, correo FROM usuarios WHERE id = $1`;
      const pacienteResult = await db.secureQuery(pacienteQuery, [pacienteId]);
      
      if (pacienteResult.rows.length > 0) {
        const paciente = pacienteResult.rows[0];
        const htmlContent = `
          <h2>Resumen de tus citas - Clinikdent</h2>
          <p>Hola ${paciente.nombre},</p>
          <p>Aquí está el resumen de tus citas:</p>
          <ul>
            ${result.rows.map(cita => `
              <li>
                <strong>${cita.servicio}</strong> - ${cita.fecha} a las ${cita.hora}
                <br>Estado: ${cita.estado}
                ${cita.odontologo_nombre ? `<br>Odontólogo: ${cita.odontologo_nombre} ${cita.odontologo_apellido}` : ''}
              </li>
            `).join('')}
          </ul>
        `;
        
        await emailService.sendEmail(
          paciente.correo,
          'Resumen de tus citas - Clinikdent',
          htmlContent
        );
      }
    }

    return res.json({
      success: true,
      citas: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Error en /citas:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/react-native/tratamientos
 * Consulta tratamientos/planes de tratamiento de un paciente
 */
router.post('/tratamientos', async (req, res) => {
  const { pacienteId } = req.body;

  if (!pacienteId) {
    return res.status(400).json({
      success: false,
      message: 'pacienteId es requerido'
    });
  }

  try {
    const tratamientosQuery = `
      SELECT id, titulo, descripcion, estado, costo, fecha_inicio, fecha_fin, created_at
      FROM planes_tratamiento
      WHERE paciente_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const result = await db.secureQuery(tratamientosQuery, [pacienteId]);

    return res.json({
      success: true,
      tratamientos: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Error en /tratamientos:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/react-native/pqrs
 * Registra una nueva PQRS desde la app móvil
 */
router.post('/pqrs', async (req, res) => {
  const { pacienteId, tipo, asunto, mensaje } = req.body;

  if (!pacienteId || !tipo || !mensaje) {
    return res.status(400).json({
      success: false,
      message: 'pacienteId, tipo y mensaje son requeridos'
    });
  }

  try {
    const pacienteQuery = `SELECT nombre, apellido, correo, telefono FROM usuarios WHERE id = $1`;
    const pacienteResult = await db.secureQuery(pacienteQuery, [pacienteId]);

    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const paciente = pacienteResult.rows[0];
    const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;

    const insertQuery = `
      INSERT INTO pqr_soporte (
        telefono, 
        nombre, 
        paciente_id, 
        mensaje, 
        tipo, 
        canal, 
        estado, 
        asunto,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, telefono, nombre, mensaje, tipo, estado, asunto, created_at
    `;

    const result = await db.secureQuery(insertQuery, [
      paciente.telefono || 'N/A',
      nombreCompleto,
      pacienteId,
      mensaje,
      tipo,
      'app_movil',
      'pendiente',
      asunto || 'PQRS desde app móvil'
    ]);

    console.log('✅ PQRS registrada:', result.rows[0]);

    return res.json({
      success: true,
      pqrs: result.rows[0],
      message: 'PQRS registrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en /pqrs:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
