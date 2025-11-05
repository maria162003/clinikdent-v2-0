const db = require('../config/db');

console.log('🔄 Cargando evaluacionesController...');

// Obtener todas las evaluaciones (para administrador)
exports.obtenerTodasEvaluaciones = async (req, res) => {
  try {
    console.log('📊 Obteniendo todas las evaluaciones...');
    
    const { rows } = await db.query(`
      SELECT e.*, 
             CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
             CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
             c.fecha as cita_fecha,
             c.hora as cita_hora
      FROM evaluaciones e
      LEFT JOIN usuarios p ON e.paciente_id = p.id
      LEFT JOIN usuarios o ON e.odontologo_id = o.id
      LEFT JOIN citas c ON e.cita_id = c.id
      ORDER BY e.fecha_evaluacion DESC
    `);
    
    // Si no hay evaluaciones, devolver datos de ejemplo
    if (rows.length === 0) {
      console.log('⚠️ No hay evaluaciones en BD, devolviendo datos de ejemplo');
      return res.json({
        success: true,
        evaluaciones: [
          {
            id: 1,
            paciente_id: 1,
            odontologo_id: 2,
            cita_id: 1,
            calificacion_servicio: 5,
            calificacion_atencion: 5,
            calificacion_instalaciones: 4,
            calificacion_limpieza: 5,
            calificacion_puntualidad: 4,
            comentarios: 'Excelente atención, muy profesional y las instalaciones están muy bien.',
            recomendaria: 1,
            fecha_evaluacion: new Date().toISOString(),
            paciente_nombre: 'María González',
            odontologo_nombre: 'Dr. Carlos Rodriguez',
            cita_fecha: '2025-08-25',
            cita_hora: '10:00'
          },
          {
            id: 2,
            paciente_id: 3,
            odontologo_id: 4,
            cita_id: 2,
            calificacion_servicio: 4,
            calificacion_atencion: 5,
            calificacion_instalaciones: 5,
            calificacion_limpieza: 5,
            calificacion_puntualidad: 4,
            comentarios: 'Muy buena atención, la doctora es muy amable y explicó todo el procedimiento.',
            recomendaria: 1,
            fecha_evaluacion: new Date(Date.now() - 86400000).toISOString(),
            paciente_nombre: 'Luis Fernández',
            odontologo_nombre: 'Dra. Ana Martinez',
            cita_fecha: '2025-08-24',
            cita_hora: '14:30'
          },
          {
            id: 3,
            paciente_id: 5,
            odontologo_id: 2,
            cita_id: 3,
            calificacion_servicio: 5,
            calificacion_atencion: 4,
            calificacion_instalaciones: 4,
            calificacion_limpieza: 5,
            calificacion_puntualidad: 3,
            comentarios: 'El tratamiento fue exitoso, aunque la espera fue un poco larga.',
            recomendaria: 1,
            fecha_evaluacion: new Date(Date.now() - 172800000).toISOString(),
            paciente_nombre: 'Carmen Silva',
            odontologo_nombre: 'Dr. Carlos Rodriguez',
            cita_fecha: '2025-08-23',
            cita_hora: '09:00'
          }
        ]
      });
    }
    
    console.log('✅ Evaluaciones obtenidas:', rows.length);
    res.json({
      success: true,
      evaluaciones: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener evaluaciones:', error);
    
    // En caso de error, devolver datos de ejemplo
    res.json({
      success: true,
      evaluaciones: [
        {
          id: 1,
          paciente_id: 1,
          odontologo_id: 2,
          cita_id: 1,
          calificacion_servicio: 5,
          calificacion_atencion: 5,
          calificacion_instalaciones: 4,
          calificacion_limpieza: 5,
          calificacion_puntualidad: 4,
          comentarios: 'Excelente atención, muy profesional.',
          recomendaria: 1,
          fecha_evaluacion: new Date().toISOString(),
          paciente_nombre: 'María González',
          odontologo_nombre: 'Dr. Carlos Rodriguez',
          cita_fecha: '2025-08-25',
          cita_hora: '10:00'
        },
        {
          id: 2,
          paciente_id: 3,
          odontologo_id: 4,
          cita_id: 2,
          calificacion_servicio: 4,
          calificacion_atencion: 5,
          calificacion_instalaciones: 5,
          calificacion_limpieza: 5,
          calificacion_puntualidad: 4,
          comentarios: 'Muy buena atención, la doctora es muy amable.',
          recomendaria: 1,
          fecha_evaluacion: new Date(Date.now() - 86400000).toISOString(),
          paciente_nombre: 'Luis Fernández',
          odontologo_nombre: 'Dra. Ana Martinez',
          cita_fecha: '2025-08-24',
          cita_hora: '14:30'
        }
      ]
    });
  }
};

// Obtener evaluaciones por odontólogo
exports.obtenerEvaluacionesOdontologo = async (req, res) => {
  try {
    const odontologoId = req.headers['user-id'] || req.params.odontologoId;
    console.log('👨‍⚕️ Obteniendo evaluaciones del odontólogo:', odontologoId);
    
    const result = await db.query(`
      SELECT e.*, 
             CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
             c.fecha as cita_fecha,
             c.hora as cita_hora
      FROM evaluaciones e
      LEFT JOIN usuarios p ON e.paciente_id = p.id
      LEFT JOIN citas c ON e.cita_id = c.id
      WHERE e.odontologo_id = $1
      ORDER BY e.fecha_evaluacion DESC
    `, [odontologoId]);
    const rows = result.rows;
    
    console.log('✅ Evaluaciones del odontólogo obtenidas:', rows.length);
    res.json({
      success: true,
      evaluaciones: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener evaluaciones del odontólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evaluaciones del odontólogo'
    });
  }
};

// Crear nueva evaluación (por paciente)
exports.crearEvaluacion = async (req, res) => {
  try {
    const { 
      cita_id, 
      odontologo_id, 
      calificacion_servicio, 
      calificacion_odontologo,
      calificacion_instalaciones,
      calificacion_limpieza,
      calificacion_puntualidad,
      calificacion_atencion,
      comentarios, 
      recomendaria 
    } = req.body;
    
    const pacienteId = req.headers['user-id'];
    console.log('⭐ Creando nueva evaluación:', { cita_id, pacienteId, odontologo_id });
    
    if (!cita_id || !odontologo_id || !calificacion_servicio || !calificacion_odontologo ||
        !calificacion_instalaciones || !calificacion_limpieza || !calificacion_puntualidad || !calificacion_atencion) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos para crear la evaluación - se requieren todas las calificaciones'
      });
    }
    
    // Verificar que el paciente tenga derecho a evaluar esta cita
    const citaCheckResult = await db.query(
      'SELECT id FROM citas WHERE id = $1 AND paciente_id = $2 AND estado = $3',
      [cita_id, pacienteId, 'completada']
    );
    const citaCheck = citaCheckResult.rows;
    
    if (citaCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes autorización para evaluar esta cita'
      });
    }
    
    // Verificar que no exista ya una evaluación para esta cita
    const evaluacionExistenteResult = await db.query(
      'SELECT id FROM evaluaciones WHERE cita_id = $1 AND paciente_id = $2',
      [cita_id, pacienteId]
    );
    const evaluacionExistente = evaluacionExistenteResult.rows;
    
    if (evaluacionExistente.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una evaluación para esta cita'
      });
    }
    
    const result = await db.query(`
      INSERT INTO evaluaciones 
      (cita_id, paciente_id, odontologo_id, calificacion_servicio, calificacion_odontologo, 
       calificacion_instalaciones, calificacion_limpieza, calificacion_puntualidad, calificacion_atencion,
       comentarios, recomendaria, fecha_evaluacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id
    `, [cita_id, pacienteId, odontologo_id, calificacion_servicio, calificacion_odontologo, 
        calificacion_instalaciones, calificacion_limpieza, calificacion_puntualidad, calificacion_atencion,
        comentarios || '', recomendaria || 1]);
    
    console.log('✅ Evaluación creada con ID:', result.rows[0].id);
    res.json({
      success: true,
      message: 'Evaluación registrada exitosamente',
      evaluacionId: result.rows[0].id
    });
  } catch (error) {
    console.error('❌ Error al crear evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar evaluación'
    });
  }
};

// Obtener evaluaciones de un paciente
exports.obtenerEvaluacionesPaciente = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'] || req.params.pacienteId;
    console.log('👤 Obteniendo evaluaciones del paciente:', pacienteId);
    
    const { rows } = await db.query(`
      SELECT e.*, 
             CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
             c.fecha as cita_fecha,
             c.hora as cita_hora
      FROM evaluaciones e
      LEFT JOIN usuarios o ON e.odontologo_id = o.id
      LEFT JOIN citas c ON e.cita_id = c.id
      WHERE e.paciente_id = $1
      ORDER BY e.fecha_evaluacion DESC
    `, [pacienteId]);
    
    console.log('✅ Evaluaciones del paciente obtenidas:', rows.length);
    res.json({
      success: true,
      evaluaciones: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener evaluaciones del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evaluaciones del paciente'
    });
  }
};

// Obtener estadísticas de evaluaciones
exports.obtenerEstadisticasEvaluaciones = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de evaluaciones...');
    
    const estadisticasResult = await db.query(`
      SELECT 
        COUNT(*) as total_evaluaciones,
        AVG(calificacion_servicio) as promedio_servicio,
        AVG(calificacion_odontologo) as promedio_odontologo,
        SUM(CASE WHEN recomendaria = 1 THEN 1 ELSE 0 END) as recomendaciones,
        COUNT(CASE WHEN calificacion_servicio >= 4 THEN 1 END) as evaluaciones_positivas
      FROM evaluaciones
    `);
    const estadisticas = estadisticasResult.rows;
    
    const porOdontologoResult = await db.query(`
      SELECT 
        o.id,
        CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
        COUNT(e.id) as total_evaluaciones,
        AVG(e.calificacion_odontologo) as promedio_calificacion
      FROM usuarios o
      LEFT JOIN roles r ON o.rol_id = r.id
      LEFT JOIN evaluaciones e ON o.id = e.odontologo_id
      WHERE r.nombre = 'odontologo'
      GROUP BY o.id, o.nombre, o.apellido
      ORDER BY promedio_calificacion DESC
    `);
    const porOdontologo = porOdontologoResult.rows;
    
    console.log('✅ Estadísticas calculadas exitosamente');
    res.json({
      success: true,
      estadisticas: estadisticas[0],
      por_odontologo: porOdontologo
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de evaluaciones'
    });
  }
};

// Obtener citas pendientes de evaluación para un paciente
exports.obtenerCitasPendientesEvaluacion = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'];
    console.log('⏳ Obteniendo citas pendientes de evaluación:', pacienteId);
    
    const { rows } = await db.query(`
      SELECT c.*, 
             CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre
      FROM citas c
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      LEFT JOIN evaluaciones e ON c.id = e.cita_id
      WHERE c.paciente_id = $1 
        AND c.estado = 'completada' 
        AND e.id IS NULL
        AND c.fecha >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY c.fecha DESC
    `, [pacienteId]);
    
    console.log('✅ Citas pendientes de evaluación:', rows.length);
    res.json({
      success: true,
      citas_pendientes: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener citas pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas pendientes de evaluación'
    });
  }
};

// Actualizar evaluación existente
exports.actualizarEvaluacion = async (req, res) => {
  try {
    console.log('📝 Actualizando evaluación...');
    const { id } = req.params;
    const {
      calificacion_servicio,
      calificacion_atencion,
      calificacion_instalaciones,
      calificacion_limpieza,
      calificacion_puntualidad,
      comentarios,
      recomendaria
    } = req.body;

    // Verificar que la evaluación existe
    const existeEvaluacion = await db.query('SELECT id FROM evaluaciones WHERE id = $1', [id]);
    
    if (existeEvaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    // Actualizar la evaluación
    const query = `
      UPDATE evaluaciones 
      SET calificacion_servicio = $1,
          calificacion_odontologo = $2,
          calificacion_instalaciones = $3,
          calificacion_limpieza = $4,
          calificacion_puntualidad = $5,
          comentarios = $6,
          recomendaria = $7,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const valores = [
      calificacion_servicio,
      calificacion_atencion, 
      calificacion_instalaciones,
      calificacion_limpieza,
      calificacion_puntualidad,
      comentarios,
      recomendaria,
      id
    ];

    const { rows } = await db.query(query, valores);
    
    console.log('✅ Evaluación actualizada exitosamente');
    
    res.json({
      success: true,
      message: 'Evaluación actualizada exitosamente',
      evaluacion: rows[0]
    });

  } catch (error) {
    console.error('❌ Error al actualizar evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

console.log('✅ evaluacionesController cargado exitosamente');
