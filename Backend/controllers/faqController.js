const db = require('../config/db');

// Alias para compatibilidad con el dashboard
exports.obtenerFaqs = exports.listarFaqs;

exports.listarFaqs = async (req, res) => {
  try {
    console.log('❓ Obteniendo FAQs desde BD...');
    const result = await db.query(
      'SELECT id, pregunta, respuesta, activa FROM faqs ORDER BY id'
    );
    const rows = result?.rows || [];

    console.log(`✅ FAQs obtenidas (${rows.length})`);
    return res.json({ success: true, faqs: rows, total: rows.length });
  } catch (err) {
    console.error('❌ Error al obtener FAQs desde BD:', err);
    // Retornar sin datos (sin dummy)
    return res.status(500).json({ success: false, faqs: [], total: 0, msg: 'Error obteniendo FAQs' });
  }
};

exports.crearFaq = async (req, res) => {
  const { pregunta, respuesta, activa } = req.body;
  if (!pregunta || !respuesta) {
    return res.status(400).json({ success: false, message: 'Pregunta y respuesta son obligatorias.' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO faqs (pregunta, respuesta, activa) VALUES ($1, $2, $3) RETURNING id',
      [pregunta, respuesta, activa !== false] // Por defecto true si no se especifica
    );
    
    console.log('✅ FAQ creada con ID:', result.rows[0].id);
    res.json({ 
      success: true, 
      message: 'FAQ creada exitosamente',
      id: result.rows[0].id 
    });
  } catch (err) {
    console.error('❌ Error al crear FAQ:', err);
    res.status(500).json({ success: false, message: 'Error al crear FAQ.' });
  }
};

exports.actualizarFaq = async (req, res) => {
  const { id } = req.params;
  const { pregunta, respuesta, activa } = req.body;
  
  if (!pregunta || !respuesta) {
    return res.status(400).json({ success: false, message: 'Pregunta y respuesta son obligatorias.' });
  }
  
  try {
    const result = await db.query(
      'UPDATE faqs SET pregunta = $1, respuesta = $2, activa = $3 WHERE id = $4',
      [pregunta, respuesta, activa !== false, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'FAQ no encontrada.' });
    }
    
    console.log('✅ FAQ actualizada con ID:', id);
    res.json({ 
      success: true, 
      message: 'FAQ actualizada exitosamente' 
    });
  } catch (err) {
    console.error('❌ Error al actualizar FAQ:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar FAQ.' });
  }
};

exports.eliminarFaq = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query('DELETE FROM faqs WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'FAQ no encontrada.' });
    }
    
    console.log('✅ FAQ eliminada con ID:', id);
    res.json({ 
      success: true, 
      message: 'FAQ eliminada exitosamente' 
    });
  } catch (err) {
    console.error('❌ Error al eliminar FAQ:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar FAQ.' });
  }
};

// Obtener estadísticas de FAQs
exports.obtenerEstadisticasFaqs = async (req, res) => {
  try {
    console.log('📊 Calculando estadísticas de FAQs...');
    // Esquema mínimo: solo total
    const totalResult = await db.query('SELECT COUNT(*)::int AS total FROM faqs');
    const totalFaqs = totalResult?.rows?.[0]?.total || 0;

    const estadisticas = { totalFaqs };
    console.log('📊 Estadísticas de FAQs calculadas:', estadisticas);

    res.json({ success: true, data: estadisticas });
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de FAQs:', error);
    // Devolver estadísticas por defecto en caso de error
    res.json({ success: false, data: { totalFaqs: 0 } });
  }
};
