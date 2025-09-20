const db = require('../config/db');

exports.listarTratamientos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tratamientos');
    res.json({ success: true, tratamientos: result.rows });
  } catch (err) {
    console.error('Error al listar tratamientos:', err);
    res.status(500).json({ success: false, message: 'Error al listar tratamientos.' });
  }
};

exports.crearTratamiento = async (req, res) => {
  const { nombre, descripcion, costo_estimado } = req.body;
  if (!nombre) return res.status(400).json({ success: false, message: 'Nombre requerido.' });
  try {
    await db.query('INSERT INTO tratamientos (nombre, descripcion, costo_estimado) VALUES ($1, $2, $3)', [nombre, descripcion, costo_estimado]);
    res.json({ success: true, message: 'Tratamiento creado.' });
  } catch (err) {
    console.error('Error al crear tratamiento:', err);
    res.status(500).json({ success: false, message: 'Error al crear tratamiento.' });
  }
};

exports.asignarTratamientoAPaciente = async (req, res) => {
  const { paciente_id, tratamiento_id, fecha_inicio, fecha_fin_estimada, costo_estimado, estado, descripcion, observaciones } = req.body;
  const odontologo_id = req.user.id; // Obtenemos el ID del odontólogo del token
  
  if (!paciente_id || !tratamiento_id || !fecha_inicio) {
    return res.status(400).json({ success: false, message: 'Datos incompletos.' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO paciente_tratamientos (paciente_id, tratamiento_id, odontologo_id, fecha_inicio, fecha_fin_estimada, costo_estimado, estado, descripcion, observaciones) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id', 
      [paciente_id, tratamiento_id, odontologo_id, fecha_inicio, fecha_fin_estimada, costo_estimado, estado || 'planificado', descripcion, observaciones]
    );
    res.json({ success: true, message: 'Tratamiento asignado al paciente.', id: result.rows[0].id });
  } catch (err) {
    console.error('Error al asignar tratamiento:', err);
    res.status(500).json({ success: false, message: 'Error al asignar tratamiento.' });
  }
};

exports.tratamientosPorPaciente = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT pt.*, t.nombre as nombre_tratamiento, t.descripcion as descripcion_tratamiento FROM paciente_tratamientos pt JOIN tratamientos t ON pt.tratamiento_id = t.id WHERE pt.paciente_id = ?', 
      [id]
    );
    res.json({ success: true, tratamientos: rows });
  } catch (err) {
    console.error('Error al obtener tratamientos del paciente:', err);
    res.status(500).json({ success: false, message: 'Error al obtener tratamientos del paciente.' });
  }
};

exports.tratamientosPorOdontologo = async (req, res) => {
  const odontologo_id = req.user.id;
  console.log('🏥 Buscando tratamientos para odontólogo ID:', odontologo_id);
  
  try {
    const [rows] = await db.query(`
      SELECT 
        pt.*, 
        t.nombre as nombre_tratamiento, 
        t.descripcion as descripcion_tratamiento,
        u.nombre as nombre_paciente,
        u.apellido as apellido_paciente
      FROM paciente_tratamientos pt 
      JOIN tratamientos t ON pt.tratamiento_id = t.id 
      JOIN usuarios u ON pt.paciente_id = u.id
      WHERE pt.odontologo_id = ?
      ORDER BY pt.fecha_inicio DESC
    `, [odontologo_id]);
    
    console.log('📋 Tratamientos encontrados:', rows.length);
    console.log('📊 Datos de tratamientos:', JSON.stringify(rows, null, 2));
    
    res.json({ success: true, tratamientos: rows });
  } catch (err) {
    console.error('❌ Error al obtener tratamientos del odontólogo:', err);
    res.status(500).json({ success: false, message: 'Error al obtener tratamientos del odontólogo.' });
  }
};

exports.obtenerTratamientoPaciente = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        pt.*, 
        t.nombre as nombre_tratamiento, 
        t.descripcion as descripcion_tratamiento,
        u.nombre as nombre_paciente,
        u.apellido as apellido_paciente
      FROM paciente_tratamientos pt 
      JOIN tratamientos t ON pt.tratamiento_id = t.id 
      JOIN usuarios u ON pt.paciente_id = u.id
      WHERE pt.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tratamiento no encontrado.' });
    }
    
    res.json({ success: true, tratamiento: rows[0] });
  } catch (err) {
    console.error('Error al obtener tratamiento:', err);
    res.status(500).json({ success: false, message: 'Error al obtener tratamiento.' });
  }
};

exports.actualizarTratamientoPaciente = async (req, res) => {
  const { id } = req.params;
  const { fecha_inicio, fecha_fin_estimada, costo_estimado, estado, descripcion, observaciones } = req.body;
  
  try {
    await db.query(`
      UPDATE paciente_tratamientos 
      SET fecha_inicio = ?, fecha_fin_estimada = ?, costo_estimado = ?, estado = ?, descripcion = ?, observaciones = ?
      WHERE id = ?
    `, [fecha_inicio, fecha_fin_estimada, costo_estimado, estado, descripcion, observaciones, id]);
    
    res.json({ success: true, message: 'Tratamiento actualizado exitosamente.' });
  } catch (err) {
    console.error('Error al actualizar tratamiento:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar tratamiento.' });
  }
};

exports.eliminarTratamientoPaciente = async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query('DELETE FROM paciente_tratamientos WHERE id = $1', [id]);
    res.json({ success: true, message: 'Tratamiento eliminado exitosamente.' });
  } catch (err) {
    console.error('Error al eliminar tratamiento:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar tratamiento.' });
  }
};
