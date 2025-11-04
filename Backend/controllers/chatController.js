const db = require('../config/db');

// Enviar mensaje de chat de soporte
exports.enviarMensaje = async (req, res) => {
  const { remitente_id, destinatario_id, mensaje } = req.body;
  
  console.log('💬 Enviando mensaje de chat:', { remitente_id, destinatario_id, mensaje });
  
  if (!remitente_id || !destinatario_id || !mensaje) {
    return res.status(400).json({ msg: 'Datos incompletos.' });
  }
  
  try {
    const [result] = await db.query(
      'INSERT INTO chat_soporte (remitente_id, destinatario_id, mensaje, fecha_envio, leido) VALUES (?, ?, ?, NOW(), FALSE)', 
      [remitente_id, destinatario_id, mensaje]
    );
    
    console.log('✅ Mensaje guardado con ID:', result.insertId);
    
    res.json({ 
      msg: 'Mensaje enviado exitosamente.',
      id: result.insertId,
      success: true
    });
  } catch (err) {
    console.error('❌ Error al enviar mensaje:', err);
    res.status(500).json({ msg: 'Error al enviar mensaje.' });
  }
};

// Obtener conversación entre usuarios
exports.obtenerConversacion = async (req, res) => {
  const { remitente_id, destinatario_id } = req.params;
  
  console.log('🔍 Obteniendo conversación:', { remitente_id, destinatario_id });
  
  try {
    const [rows] = await db.query(
      `SELECT * FROM chat_soporte 
       WHERE (remitente_id = ? AND destinatario_id = ?) 
       OR (remitente_id = ? AND destinatario_id = ?) 
       ORDER BY fecha_envio ASC`, 
      [remitente_id, destinatario_id, destinatario_id, remitente_id]
    );
    
    console.log(`✅ Conversación obtenida: ${rows.length} mensajes`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener conversación:', err);
    res.status(500).json({ msg: 'Error al obtener conversación.' });
  }
};

// Guardar interacción con bot de soporte
exports.guardarInteraccionBot = async (req, res) => {
  const { sesion_id, mensaje_usuario, respuesta_bot, ip_address } = req.body;
  
  console.log('🤖 Guardando interacción con bot:', { sesion_id, mensaje_usuario });
  
  try {
    // Usar remitente_id como NULL para el bot (o crear un ID especial para el bot)
    const BOT_ID = 'bot'; // Identificador especial para el bot
    
    // Guardar mensaje del usuario
    await db.query(
      'INSERT INTO chat_soporte (remitente_id, destinatario_id, mensaje, fecha_envio, leido) VALUES (?, ?, ?, NOW(), TRUE)', 
      [sesion_id || ip_address || 'anonimo', BOT_ID, mensaje_usuario]
    );
    
    // Guardar respuesta del bot
    await db.query(
      'INSERT INTO chat_soporte (remitente_id, destinatario_id, mensaje, fecha_envio, leido) VALUES (?, ?, ?, NOW(), FALSE)', 
      [BOT_ID, sesion_id || ip_address || 'anonimo', respuesta_bot]
    );
    
    console.log('✅ Interacción con bot guardada exitosamente');
    
    res.json({ 
      msg: 'Interacción guardada exitosamente.',
      success: true
    });
  } catch (err) {
    console.error('❌ Error al guardar interacción con bot:', err);
    res.status(500).json({ msg: 'Error al guardar interacción.' });
  }
};

// Obtener estadísticas del chat bot
exports.obtenerEstadisticasBot = async (req, res) => {
  console.log('📊 Obteniendo estadísticas del bot');
  
  try {
    // Contar mensajes totales del bot
    const [totalMensajes] = await db.query(
      "SELECT COUNT(*) as total FROM chat_soporte WHERE remitente_id = 'bot'"
    );
    
    // Contar sesiones únicas
    const [sesionesUnicas] = await db.query(
      "SELECT COUNT(DISTINCT destinatario_id) as total FROM chat_soporte WHERE remitente_id = 'bot'"
    );
    
    // Mensajes por día (últimos 7 días)
    const [mensajesPorDia] = await db.query(
      `SELECT 
         DATE(fecha_envio) as fecha, 
         COUNT(*) as cantidad 
       FROM chat_soporte 
       WHERE remitente_id = 'bot' 
       AND fecha_envio >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(fecha_envio) 
       ORDER BY fecha DESC`
    );
    
    const estadisticas = {
      total_mensajes: totalMensajes[0].total,
      sesiones_unicas: sesionesUnicas[0].total,
      mensajes_por_dia: mensajesPorDia
    };
    
    console.log('✅ Estadísticas del bot obtenidas:', estadisticas);
    res.json(estadisticas);
  } catch (err) {
    console.error('❌ Error al obtener estadísticas:', err);
    res.status(500).json({ msg: 'Error al obtener estadísticas.' });
  }
};
