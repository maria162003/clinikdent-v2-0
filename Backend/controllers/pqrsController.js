const pool = require('../config/db');

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
      asunto, 
      resumen, 
      descripcion, 
      servicio_relacionado 
    } = req.body;

    console.log('>> Datos extraídos:', {
      nombre_completo, correo, telefono, numero_documento, 
      tipo, asunto, resumen, descripcion, servicio_relacionado
    });

    // Validaciones básicas
    if (!nombre_completo || !correo || !tipo || !asunto || !resumen || !descripcion) {
      console.log('>> Error: Campos faltantes');
      return res.status(400).json({
        msg: 'Los campos nombre_completo, correo, tipo, asunto, resumen y descripcion son obligatorios'
      });
    }

    // Asegurar que los campos NOT NULL tengan valores
    const telefonoFinal = telefono && telefono.trim() ? telefono.trim() : 'No proporcionado';
    const numeroDocumentoFinal = numero_documento && numero_documento.trim() ? numero_documento.trim() : 'No proporcionado';
    const servicioRelacionadoFinal = servicio_relacionado && servicio_relacionado.trim() ? servicio_relacionado.trim() : null;

    console.log('>> Valores finales:', {
      telefonoFinal, numeroDocumentoFinal, servicioRelacionadoFinal
    });

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
    const numeroAleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const numeroRadicado = `PQRS-${año}-${numeroAleatorio}`;

    console.log('>> Número de radicado generado:', numeroRadicado);

    const query = `
      INSERT INTO pqrs (
        nombre_completo, 
        correo, 
        telefono,
        numero_documento,
        tipo, 
        asunto,
        resumen,
        descripcion,
        servicio_relacionado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('>> Query SQL:', query);
    console.log('>> Parámetros:', [
      nombre_completo,
      correo,
      telefonoFinal,
      numeroDocumentoFinal,
      tipo,
      asunto,
      resumen,
      descripcion,
      servicioRelacionadoFinal
    ]);

    const [result] = await pool.execute(query, [
      nombre_completo,
      correo,
      telefonoFinal,
      numeroDocumentoFinal,
      tipo,
      asunto,
      resumen,
      descripcion,
      servicioRelacionadoFinal
    ]);

    console.log('>> Resultado de la inserción:', result);

    res.status(201).json({
      msg: 'PQRS enviado correctamente',
      id: result.insertId,
      numero_radicado: `PQRS-${año}-${result.insertId.toString().padStart(4, '0')}`,
      data: {
        nombre_completo,
        correo,
        tipo,
        asunto,
        fecha: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('>> Error completo al crear PQRS:', error);
    console.error('>> Stack trace:', error.stack);
    console.error('>> Message:', error.message);
    console.error('>> Code:', error.code);
    console.error('>> SQL State:', error.sqlState);
    
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      } : undefined
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
