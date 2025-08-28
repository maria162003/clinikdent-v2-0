const db = require('../config/db');

exports.obtenerHistorialPorPaciente = async (req, res) => {
  const { paciente_id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM historial_clinico WHERE paciente_id = ?', [paciente_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener historial.' });
  }
};

exports.registrarHistorial = async (req, res) => {
  const { paciente_id, odontologo_id, diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado } = req.body;
  if (!paciente_id || !odontologo_id || !diagnostico || !fecha) return res.status(400).json({ msg: 'Datos incompletos.' });
  
  // Establecer estado por defecto si no se proporciona
  const estadoFinal = estado || 'en_proceso';
  
  try {
    const [result] = await db.query(
      'INSERT INTO historial_clinico (paciente_id, odontologo_id, diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [paciente_id, odontologo_id, diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estadoFinal]
    );
    
    console.log('✅ Historial registrado con ID:', result.insertId, 'Estado:', estadoFinal);
    res.json({ 
      msg: 'Historial registrado exitosamente.',
      id: result.insertId,
      estado: estadoFinal
    });
  } catch (err) {
    console.error('❌ Error al registrar historial:', err);
    res.status(500).json({ msg: 'Error al registrar historial.', error: err.message });
  }
};

exports.obtenerHistorialPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT h.*, u.nombre as paciente_nombre, u.apellido as paciente_apellido, 
             od.nombre as odontologo_nombre, od.apellido as odontologo_apellido
      FROM historial_clinico h
      LEFT JOIN usuarios u ON h.paciente_id = u.id
      LEFT JOIN usuarios od ON h.odontologo_id = od.id
      WHERE h.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Historial no encontrado.' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener historial por ID:', err);
    res.status(500).json({ msg: 'Error al obtener historial.' });
  }
};

exports.actualizarHistorial = async (req, res) => {
  const { id } = req.params;
  const { diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado } = req.body;
  
  if (!diagnostico || !fecha) {
    return res.status(400).json({ msg: 'Diagnóstico y fecha son requeridos.' });
  }
  
  try {
    const [result] = await db.query(`
      UPDATE historial_clinico 
      SET diagnostico = ?, tratamiento_resumido = ?, fecha = ?, archivo_adjuntos = ?, estado = ?
      WHERE id = ?
    `, [diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado || 'en_proceso', id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Historial no encontrado.' });
    }
    
    console.log('✅ Historial actualizado ID:', id, 'Nuevo estado:', estado || 'en_proceso');
    res.json({ msg: 'Historial actualizado exitosamente.' });
  } catch (err) {
    console.error('Error al actualizar historial:', err);
    res.status(500).json({ msg: 'Error al actualizar historial.' });
  }
};

exports.eliminarHistorial = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM historial_clinico WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Historial no encontrado.' });
    }
    
    res.json({ msg: 'Historial eliminado exitosamente.' });
  } catch (err) {
    console.error('Error al eliminar historial:', err);
    res.status(500).json({ msg: 'Error al eliminar historial.' });
  }
};
