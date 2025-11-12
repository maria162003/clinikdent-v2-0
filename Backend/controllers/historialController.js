const db = require('../config/db');

exports.obtenerHistorialPorPaciente = async (req, res) => {
  const { paciente_id } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT id, paciente_id, odontologo_id, diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado FROM historial_clinico WHERE paciente_id = $1 ORDER BY fecha DESC', 
      [paciente_id]
    );
    console.log(`📋 Historiales encontrados para paciente ${paciente_id}:`, rows.length);
    if (rows.length > 0) {
      console.log('📊 Ejemplo de historial con estado:', { id: rows[0].id, estado: rows[0].estado });
    }
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener historial:', err);
    res.status(500).json({ msg: 'Error al obtener historial.', error: err.message });
  }
};

exports.registrarHistorial = async (req, res) => {
  const {
    paciente_id,
    odontologo_id,
    diagnostico,
    tratamiento_resumido,
    fecha,
    archivo_adjuntos,
    estado
  } = req.body;
  if (!paciente_id || !odontologo_id || !diagnostico || !fecha) return res.status(400).json({ msg: 'Datos incompletos.' });
  const estadoTratamiento = estado || 'en_proceso';
  
  try {
    const { rows: result } = await db.query(
      'INSERT INTO historial_clinico (paciente_id, odontologo_id, diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, estado', 
      [paciente_id, odontologo_id, diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estadoTratamiento]
    );
    
    console.log('✅ Historial registrado con ID:', result[0].id);
    res.json({ 
      msg: 'Historial registrado exitosamente.',
      id: result[0].id,
      estado: result[0].estado
    });
  } catch (err) {
    console.error('❌ Error al registrar historial:', err);
    res.status(500).json({ msg: 'Error al registrar historial.', error: err.message });
  }
};

exports.obtenerHistorialPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT h.*, u.nombre as paciente_nombre, u.apellido as paciente_apellido, 
             od.nombre as odontologo_nombre, od.apellido as odontologo_apellido
      FROM historial_clinico h
      LEFT JOIN usuarios u ON h.paciente_id = u.id
      LEFT JOIN usuarios od ON h.odontologo_id = od.id
      WHERE h.id = $1
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
  
  console.log('📝 Datos recibidos para actualizar historial ID:', id);
  console.log('Body completo:', req.body);
  console.log('Estado recibido:', estado);
  
  if (!diagnostico || !fecha) {
    return res.status(400).json({ msg: 'Diagnóstico y fecha son requeridos.' });
  }
  
  try {
    const { rows: result, rowCount } = await db.query(`
      UPDATE historial_clinico 
      SET diagnostico = $1, tratamiento_resumido = $2, fecha = $3, archivo_adjuntos = $4, estado = COALESCE($5, estado)
      WHERE id = $6
      RETURNING id, estado, diagnostico, tratamiento_resumido, fecha, archivo_adjuntos
    `, [diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado ?? null, id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ msg: 'Historial no encontrado.' });
    }
    
    console.log('✅ Historial actualizado ID:', id);
    console.log('✅ Nuevo estado guardado:', result[0].estado);
    res.json({ 
      msg: 'Historial actualizado exitosamente.',
      historial: result[0]
    });
  } catch (err) {
    console.error('❌ Error al actualizar historial:', err);
    res.status(500).json({ msg: 'Error al actualizar historial.', error: err.message });
  }
};

exports.eliminarHistorial = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM historial_clinico WHERE id = $1', [id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ msg: 'Historial no encontrado.' });
    }
    
    res.json({ msg: 'Historial eliminado exitosamente.' });
  } catch (err) {
    console.error('Error al eliminar historial:', err);
    res.status(500).json({ msg: 'Error al eliminar historial.' });
  }
};
