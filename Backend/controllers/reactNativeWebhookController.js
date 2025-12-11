const db = require('../config/databaseSecure');
const emailService = require('../services/emailService');

/**
 * Formatea fecha y hora de manera legible.
 */
function formatFechaHora(fecha, hora) {
  try {
    const fechaISO = fecha instanceof Date ? fecha : new Date(fecha);
    const fechaLegible = fechaISO.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const horaLegible = hora ? hora.slice(0, 5) : 'Sin hora definida';
    return { fechaLegible, horaLegible };
  } catch (error) {
    return { fechaLegible: String(fecha), horaLegible: String(hora) };
  }
}

/**
 * Endpoint pensado para ser consumido desde React Native.
 * 1. Recibe datos del paciente (id o correo).
 * 2. Consulta información en PostgreSQL/Supabase.
 * 3. Envía un correo de resumen usando el servicio de email existente.
 * 4. Devuelve la información al cliente móvil como confirmación.
 */
async function triggerWorkflow(req, res) {
  const { pacienteId, email: emailPayload, motivo = 'Actualización desde la app móvil' } = req.body || {};

  if (!pacienteId && !emailPayload) {
    return res.status(400).json({
      success: false,
      message: 'Debes enviar al menos pacienteId o email.'
    });
  }

  const { client, release } = await db.getConnection();

  try {
    await client.query('BEGIN');

    // 1. Obtener datos del paciente
    const params = [];
    let where = '';

    if (pacienteId) {
      params.push(pacienteId);
      where = 'id = $1';
    } else {
      params.push(emailPayload.toLowerCase());
      where = 'LOWER(correo) = $1';
    }

    const pacienteQuery = `
      SELECT id, nombre, apellido, correo, telefono
      FROM usuarios
      WHERE ${where}
      LIMIT 1;
    `;

    const pacienteResult = await client.query(pacienteQuery, params);

    if (pacienteResult.rows.length === 0) {
      throw new Error('No encontramos al paciente solicitado.');
    }

    const paciente = pacienteResult.rows[0];

    // 2. Obtener últimas citas del paciente
    const citasQuery = `
      SELECT id, fecha, hora, estado, motivo, odontologo_id
      FROM citas
      WHERE paciente_id = $1
      ORDER BY fecha DESC, hora DESC
      LIMIT 3;
    `;

    const citasResult = await client.query(citasQuery, [paciente.id]);
    const citas = citasResult.rows.map((cita) => {
      const { fechaLegible, horaLegible } = formatFechaHora(cita.fecha, cita.hora);
      return {
        id: cita.id,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        motivo: cita.motivo || 'Consulta general',
        odontologo_id: cita.odontologo_id,
        fechaLegible,
        horaLegible
      };
    });

    // 3. Resumen para email
    const destinatario = emailPayload || paciente.correo;

    const htmlCitas = citas.length
      ? citas
          .map(
            (cita) => `
            <li>
              <strong>${cita.motivo}</strong> - ${cita.fechaLegible} a las ${cita.horaLegible}
              <br/>Estado: ${cita.estado || 'Programada'} | Odontólogo ID: ${cita.odontologo_id || 'N/D'}
            </li>
          `
          )
          .join('')
      : '<li>No encontramos citas recientes asociadas.</li>';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Resumen Clínico</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            h1 { color: #1976d2; }
            ul { padding-left: 18px; }
            .card { background: #f8f9fa; padding: 16px; border-radius: 12px; border: 1px solid #e0e0e0; }
            .small { color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Hola ${paciente.nombre} ${paciente.apellido || ''} 👋</h1>
            <p>Te compartimos el resumen solicitado desde la app móvil:</p>
            <p><strong>Motivo:</strong> ${motivo}</p>
            <p><strong>Contacto registrado:</strong> ${paciente.correo} | ${paciente.telefono || 'Sin teléfono'}</p>
            <h3>🗓️ Últimas citas</h3>
            <ul>${htmlCitas}</ul>
            <p class="small">Mensaje generado automáticamente por Clinikdent BOT · ${new Date().toLocaleString('es-CO')}</p>
          </div>
        </body>
      </html>
    `;

    const emailResult = await emailService.sendEmail(
      destinatario,
      'Resumen clínico solicitado desde la app',
      htmlContent
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      patient: paciente,
      appointments: citas,
      email: {
        destinatario,
        demo: emailResult?.demo || false
      }
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Error en triggerWorkflow:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      details: error.stack
    });
  } finally {
    if (typeof release === 'function') {
      release();
    }
  }
}

module.exports = {
  triggerWorkflow
};
