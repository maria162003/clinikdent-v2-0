const pool = require('../config/db');

console.log('🔄 Cargando planesController con base de datos...');

// Obtener todos los planes de tratamiento para administrador
exports.obtenerTodosPlanes = async (req, res) => {
  try {
    console.log('📋 Obteniendo todos los planes de tratamiento...');
    
    const [rows] = await pool.query(`
      SELECT p.*, 
             CONCAT(u.nombre, ' ', u.apellido) as paciente_nombre,
             CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
             u.numero_documento
      FROM planes_tratamiento p
      LEFT JOIN usuarios u ON p.paciente_id = u.id
      LEFT JOIN usuarios o ON p.odontologo_id = o.id
      ORDER BY p.fecha_creacion DESC
    `);
    
    console.log('✅ Planes obtenidos:', rows.length);
    res.json({
      success: true,
      planes: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes de tratamiento'
    });
  }
};

// Obtener planes por odontólogo
exports.obtenerPlanesTratamientoOdontologo = async (req, res) => {
  try {
    const odontologoId = req.headers['user-id'] || req.params.odontologoId;
    console.log('📋 Obteniendo planes para odontólogo:', odontologoId);
    
    const [rows] = await pool.query(`
      SELECT p.*, 
             CONCAT(u.nombre, ' ', u.apellido) as paciente_nombre,
             u.numero_documento,
             u.telefono as paciente_telefono
      FROM planes_tratamiento p
      LEFT JOIN usuarios u ON p.paciente_id = u.id
      WHERE p.odontologo_id = ?
      ORDER BY p.fecha_creacion DESC
    `, [odontologoId]);
    
    console.log('✅ Planes del odontólogo obtenidos:', rows.length);
    res.json({
      success: true,
      planes: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener planes del odontólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes de tratamiento'
    });
  }
};

// Obtener planes por paciente
exports.obtenerPlanesTratamientoPaciente = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'] || req.params.pacienteId;
    console.log('👤 Obteniendo planes para paciente:', pacienteId);
    
    const [rows] = await pool.query(`
      SELECT p.*, 
             CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
             o.telefono as odontologo_telefono
      FROM planes_tratamiento p
      LEFT JOIN usuarios o ON p.odontologo_id = o.id
      WHERE p.paciente_id = ?
      ORDER BY p.fecha_creacion DESC
    `, [pacienteId]);
    
    console.log('✅ Planes del paciente obtenidos:', rows.length);
    res.json({
      success: true,
      planes: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener planes del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes de tratamiento'
    });
  }
};

// Crear nuevo plan de tratamiento
exports.crearPlanTratamiento = async (req, res) => {
  try {
    const { paciente_id, titulo, descripcion, costo_total, notas } = req.body;
    const odontologoId = req.headers['user-id'];
    
    console.log('➕ Creando nuevo plan de tratamiento:', { paciente_id, titulo, odontologoId });
    
    if (!paciente_id || !titulo || !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos para crear el plan'
      });
    }
    
    const [result] = await pool.query(`
      INSERT INTO planes_tratamiento 
      (paciente_id, odontologo_id, titulo, descripcion, costo_total, estado, fecha_creacion, notas)
      VALUES (?, ?, ?, ?, ?, 'pendiente', NOW(), ?)
    `, [paciente_id, odontologoId, titulo, descripcion, costo_total || 0, notas || '']);
    
    console.log('✅ Plan creado con ID:', result.insertId);
    res.json({
      success: true,
      message: 'Plan de tratamiento creado exitosamente',
      planId: result.insertId
    });
  } catch (error) {
    console.error('❌ Error al crear plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear plan de tratamiento'
    });
  }
};

// Actualizar plan de tratamiento
exports.actualizarPlanTratamiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, costo_total, estado, notas } = req.body;
    
    console.log('� Actualizando plan:', id);
    
    const [result] = await pool.query(`
      UPDATE planes_tratamiento 
      SET titulo = ?, descripcion = ?, costo_total = ?, estado = ?, notas = ?
      WHERE id = ?
    `, [titulo, descripcion, costo_total, estado, notas, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan de tratamiento no encontrado'
      });
    }
    
    console.log('✅ Plan actualizado exitosamente');
    res.json({
      success: true,
      message: 'Plan de tratamiento actualizado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al actualizar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar plan de tratamiento'
    });
  }
};

// Eliminar plan de tratamiento
exports.eliminarPlanTratamiento = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando plan:', id);
    
    const [result] = await pool.query('DELETE FROM planes_tratamiento WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan de tratamiento no encontrado'
      });
    }
    
    console.log('✅ Plan eliminado exitosamente');
    res.json({
      success: true,
      message: 'Plan de tratamiento eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar plan de tratamiento'
    });
  }
};

// Aprobar plan de tratamiento
exports.aprobarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✅ Aprobando plan:', id);
    
    const [result] = await pool.query(`
      UPDATE planes_tratamiento 
      SET estado = 'aprobado', fecha_aprobacion = NOW(), fecha_inicio = NOW()
      WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan de tratamiento no encontrado'
      });
    }
    
    console.log('✅ Plan aprobado exitosamente');
    res.json({
      success: true,
      message: 'Plan de tratamiento aprobado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al aprobar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar plan de tratamiento'
    });
  }
};

console.log('✅ planesController con base de datos cargado exitosamente');
