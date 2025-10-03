const pool = require('../config/db');
const emailService = require('../services/emailService');

// Crear un nuevo PQRS
const crearPQRS = async (req, res) => {
  try {
    console.log('>> Iniciando creación de PQRS');
    console.log('>> BODY recibido:', req.body);
    
    const { 
      nombre_completo, 
      correo, 
      telefono, 
      numero_documento, 
      tipo, 
      descripcion, 
      servicio_relacionado 
    } = req.body;

    console.log('>> Datos extraídos:', {
      nombre_completo, correo, telefono, numero_documento, 
      tipo, descripcion, servicio_relacionado
    });

    // Validaciones básicas
    if (!nombre_completo || !correo || !tipo || !descripcion) {
      console.log('>> Error: Campos faltantes');
      return res.status(400).json({
        msg: 'Los campos nombre_completo, correo, tipo y descripcion son obligatorios'
      });
    }

    // Validar tipo de PQRS
    const tiposValidos = ['Petición', 'Queja', 'Reclamo', 'Sugerencia'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        msg: 'Tipo de PQRS no válido'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        msg: 'El formato del correo electrónico no es válido'
      });
    }

    // Generar número de radicado único
    const fechaActual = new Date();
    const año = fechaActual.getFullYear();
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    const numeroRadicado = `PQRS-${año}-${timestamp}`;

    console.log('>> Número de radicado generado:', numeroRadicado);

    // Preparar datos para los emails
    const userData = {
      nombre_completo,
      correo,
      telefono: telefono || 'No proporcionado',
      numero_documento: numero_documento || 'No proporcionado',
      tipo,
      descripcion,
      servicio_relacionado: servicio_relacionado || null
    };

    // Enviar email de confirmación al usuario
    console.log('📧 Enviando confirmación al usuario...');
    const confirmacionResult = await emailService.sendPQRSConfirmation(userData, numeroRadicado);
    
    if (!confirmacionResult.success) {
      console.log('⚠️ Warning: Error enviando confirmación al usuario:', confirmacionResult.error);
    }

    // Notificar al equipo de soporte
    console.log('📧 Notificando al equipo de soporte...');
    const notificacionResult = await emailService.notifySupport(userData, numeroRadicado);
    
    if (!notificacionResult.success) {
      console.log('⚠️ Warning: Error notificando al soporte:', notificacionResult.error);
    }

    // Opcionalmente, guardar solo datos mínimos para tracking (no toda la información)
    try {
      const query = `
        INSERT INTO pqrs (
          numero_radicado,
          correo,
          tipo, 
          fecha_creacion,
          estado
        ) VALUES (?, ?, ?, NOW(), 'enviado')
      `;

      await pool.execute(query, [numeroRadicado, correo, tipo]);
      console.log('✅ Registro mínimo guardado para tracking');
    } catch (dbError) {
      console.log('⚠️ Warning: No se pudo guardar tracking en BD:', dbError.message);
      // No afecta la respuesta - el email es lo importante
    }

    console.log('>> PQRS procesado exitosamente:', numeroRadicado);

    res.status(201).json({
      success: true,
      msg: 'Su solicitud ha sido enviada exitosamente. Revise su correo electrónico para la confirmación.',
      numero_radicado: numeroRadicado,
      data: {
        tipo,
        fecha: new Date().toISOString(),
        email_enviado: confirmacionResult.success,
        soporte_notificado: notificacionResult.success
      }
    });

  } catch (error) {
    console.error('>> Error completo al procesar PQRS:', error);
    console.error('>> Stack trace:', error.stack);
    
    res.status(500).json({
      msg: 'Error interno del servidor al procesar su solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Obtener PQRS por usuario
const obtenerPQRSporUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) as total FROM pqrs WHERE usuario_id = ?';
    const [countResult] = await pool.execute(countQuery, [usuario_id]);
    const total = countResult[0].total;

    const query = `
      SELECT 
        id,
        numero_radicado,
        tipo,
        asunto,
        mensaje,
        servicio_relacionado,
        estado,
        fecha_creacion,
        fecha_respuesta,
        respuesta
      FROM pqrs 
      WHERE usuario_id = ?
      ORDER BY fecha_creacion DESC
      LIMIT ? OFFSET ?
    `;

    const [pqrs] = await pool.execute(query, [usuario_id, parseInt(limit), parseInt(offset)]);

    res.json({
      pqrs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener PQRS por usuario:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Obtener todos los PQRS (para admin)
const obtenerTodosPQRS = async (req, res) => {
  try {
    const { page = 1, limit = 10, tipo, estado, servicio } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (tipo) {
      whereClause += ' WHERE tipo = ?';
      params.push(tipo);
    }

    if (estado) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' estado = ?';
      params.push(estado);
    }

    if (servicio) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' servicio_relacionado = ?';
      params.push(servicio);
    }

    const countQuery = `SELECT COUNT(*) as total FROM pqrs${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    const query = `
      SELECT 
        id,
        numero_radicado,
        nombre,
        correo,
        telefono,
        tipo,
        asunto,
        mensaje,
        servicio_relacionado,
        estado,
        fecha_creacion,
        fecha_respuesta,
        respuesta
      FROM pqrs
      ${whereClause}
      ORDER BY fecha_creacion DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const [pqrs] = await pool.execute(query, params);

    res.json({
      pqrs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener todos los PQRS:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Responder PQRS
const responderPQRS = async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;

    if (!respuesta) {
      return res.status(400).json({ msg: 'La respuesta es obligatoria' });
    }

    const query = `
      UPDATE pqrs 
      SET estado = 'respondido', respuesta = ?, fecha_respuesta = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [respuesta, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'PQRS no encontrado' });
    }

    res.json({ msg: 'PQRS respondido correctamente' });

  } catch (error) {
    console.error('Error al responder PQRS:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Actualizar estado PQRS
const actualizarEstadoPQRS = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'en_proceso', 'respondido', 'cerrado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ msg: 'Estado no válido' });
    }

    const query = 'UPDATE pqrs SET estado = ? WHERE id = ?';
    const [result] = await pool.execute(query, [estado, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'PQRS no encontrado' });
    }

    res.json({ msg: 'Estado actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar estado PQRS:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Consultar PQRS por número de radicado
const consultarPorRadicado = async (req, res) => {
  try {
    const { numero_radicado } = req.params;

    const query = `
      SELECT 
        numero_radicado,
        tipo,
        asunto,
        mensaje,
        estado,
        fecha_creacion,
        fecha_respuesta,
        respuesta
      FROM pqrs 
      WHERE numero_radicado = ?
    `;

    const [pqrs] = await pool.execute(query, [numero_radicado]);

    if (pqrs.length === 0) {
      return res.status(404).json({ msg: 'PQRS no encontrado' });
    }

    res.json(pqrs[0]);

  } catch (error) {
    console.error('Error al consultar PQRS por radicado:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

module.exports = {
  crearPQRS,
  obtenerPQRSporUsuario,
  obtenerTodosPQRS,
  responderPQRS,
  actualizarEstadoPQRS,
  consultarPorRadicado
};
