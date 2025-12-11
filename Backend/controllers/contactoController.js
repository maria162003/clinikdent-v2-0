const pool = require('../config/db');
const emailService = require('../services/emailService');

// Crear un nuevo mensaje de contacto
const crearContacto = async (req, res) => {
  try {
    console.log('📞 Procesando formulario de contacto:', req.body);
    
    const { nombre, correo, telefono, servicio_interes, mensaje, tipo, asunto } = req.body;

    // Validaciones básicas - ajustadas para ser más flexibles
    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({
        msg: 'Los campos nombre, correo y mensaje son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        msg: 'El formato del correo electrónico no es válido'
      });
    }

    // Preparar datos del contacto
    const contactData = {
      nombre,
      email: correo,
      telefono: telefono || 'No proporcionado',
      asunto: asunto || servicio_interes || 'Consulta general',
      mensaje
    };

    // Enviar confirmación al usuario
    console.log('📧 Enviando confirmación de contacto...');
    const confirmacionResult = await emailService.sendContactConfirmation(contactData);
    
    if (!confirmacionResult.success) {
      console.log('⚠️ Warning: Error enviando confirmación:', confirmacionResult.error);
    }

    // Notificar al equipo de soporte
    console.log('📧 Notificando al soporte sobre contacto...');
    const userData = {
      nombre_completo: nombre,
      correo: correo,
      telefono: contactData.telefono,
      numero_documento: 'No proporcionado',
      tipo: 'Contacto',
      asunto: contactData.asunto,
      resumen: mensaje.substring(0, 100) + (mensaje.length > 100 ? '...' : ''),
      descripcion: mensaje,
      servicio_relacionado: servicio_interes || null
    };

    const timestamp = Date.now().toString().slice(-6);
    const numeroRadicado = `CONT-${new Date().getFullYear()}-${timestamp}`;
    
    const notificacionResult = await emailService.notifySupport(userData, numeroRadicado);
    
    if (!notificacionResult.success) {
      console.log('⚠️ Warning: Error notificando al soporte:', notificacionResult.error);
    }

    // Opcionalmente, guardar registro mínimo para tracking
    try {
      const query = `
        INSERT INTO contactos (
          nombre, 
          correo, 
          telefono,
          servicio_interes,
          mensaje,
          tipo,
          estado,
          fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, 'enviado', NOW())
      `;

      await pool.execute(query, [
        nombre,
        correo,
        telefono || 'No proporcionado',
        servicio_interes || 'Consulta general',
        'Email enviado automáticamente', // No guardamos el mensaje completo
        tipo || 'contacto'
      ]);
      console.log('✅ Registro de tracking guardado');
    } catch (dbError) {
      console.log('⚠️ Warning: No se pudo guardar tracking en BD:', dbError.message);
      // No afecta la respuesta - el email es lo importante
    }

    console.log('✅ Formulario de contacto procesado exitosamente');

    res.status(200).json({
      success: true,
      msg: 'Su mensaje ha sido enviado exitosamente. Revise su correo electrónico para la confirmación.',
      numero_referencia: numeroRadicado,
      data: {
        nombre,
        correo,
        asunto: contactData.asunto,
        fecha: new Date().toISOString(),
        email_enviado: confirmacionResult.success,
        soporte_notificado: notificacionResult.success
      }
    });

  } catch (error) {
    console.error('❌ Error procesando contacto:', error);
    res.status(500).json({
      msg: 'Error interno del servidor al procesar su mensaje',
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
