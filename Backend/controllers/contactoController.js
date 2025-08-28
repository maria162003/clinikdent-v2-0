const pool = require('../config/db');

// Crear un nuevo mensaje de contacto
const crearContacto = async (req, res) => {
  try {
    const { nombre, correo, telefono, servicio_interes, mensaje, tipo } = req.body;

    // Validaciones básicas
    if (!nombre || !correo || !telefono || !servicio_interes) {
      return res.status(400).json({
        msg: 'Los campos nombre, correo, teléfono y servicio son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        msg: 'El formato del correo electrónico no es válido'
      });
    }

    const query = `
      INSERT INTO contactos (
        nombre, 
        correo, 
        telefono, 
        servicio_interes, 
        mensaje, 
        tipo,
        fecha_contacto
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.execute(query, [
      nombre,
      correo,
      telefono,
      servicio_interes,
      mensaje || null,
      tipo || 'contacto'
    ]);

    res.status(201).json({
      msg: 'Mensaje de contacto enviado correctamente',
      id: result.insertId,
      data: {
        nombre,
        correo,
        servicio_interes,
        fecha: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al crear contacto:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Obtener todos los contactos (para admin)
const obtenerContactos = async (req, res) => {
  try {
    const { page = 1, limit = 10, tipo, servicio } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (tipo) {
      whereClause += ' WHERE tipo = ?';
      params.push(tipo);
    }

    if (servicio) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' servicio_interes = ?';
      params.push(servicio);
    }

    const countQuery = `SELECT COUNT(*) as total FROM contactos${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    const query = `
      SELECT 
        id,
        nombre,
        correo,
        telefono,
        servicio_interes,
        mensaje,
        tipo,
        estado,
        fecha_contacto,
        fecha_respuesta
      FROM contactos
      ${whereClause}
      ORDER BY fecha_contacto DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const [contactos] = await pool.execute(query, params);

    res.json({
      contactos,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Marcar contacto como respondido
const marcarComoRespondido = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE contactos 
      SET estado = 'respondido', fecha_respuesta = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Contacto no encontrado' });
    }

    res.json({ msg: 'Contacto marcado como respondido' });

  } catch (error) {
    console.error('Error al marcar contacto como respondido:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Eliminar contacto
const eliminarContacto = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM contactos WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Contacto no encontrado' });
    }

    res.json({ msg: 'Contacto eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    res.status(500).json({
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

module.exports = {
  crearContacto,
  obtenerContactos,
  marcarComoRespondido,
  eliminarContacto
};
