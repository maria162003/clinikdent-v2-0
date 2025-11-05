const db = require('./Backend/config/db');

async function updateEvaluacionesTable() {
  try {
    console.log('🔄 Actualizando estructura de tabla evaluaciones...');
    
    // Agregar columnas una por una
    const alterCommands = [
      'ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS calificacion_atencion INTEGER',
      'ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS calificacion_instalaciones INTEGER',
      'ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS calificacion_limpieza INTEGER',
      'ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS calificacion_puntualidad INTEGER',
      'ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP'
    ];
    
    for (let command of alterCommands) {
      console.log('🔍 Ejecutando:', command);
      try {
        await db.query(command);
        console.log('✅ Comando ejecutado exitosamente');
      } catch (err) {
        console.log('⚠️ Comando omitido (posiblemente ya existe):', err.message);
      }
    }
    
    // Insertar datos de ejemplo
    console.log('📝 Insertando datos de ejemplo...');
    const insertQuery = `
      INSERT INTO evaluaciones (
        cita_id, 
        paciente_id, 
        odontologo_id, 
        calificacion_servicio, 
        calificacion_atencion, 
        calificacion_instalaciones, 
        calificacion_limpieza, 
        calificacion_puntualidad, 
        comentarios, 
        recomendaria, 
        fecha_evaluacion
      ) VALUES 
      (1, 3, 4, 5, 5, 4, 5, 4, 'Excelente atención, muy profesional y las instalaciones están muy bien.', true, '2025-09-12 10:00:00'),
      (2, 1, 2, 4, 5, 4, 4, 5, 'Muy buen servicio, la doctora muy atenta y puntual.', true, '2025-09-11 14:30:00'),
      (3, 3, 4, 4, 4, 4, 5, 3, 'Buen servicio en general, aunque llegué un poco tarde por el tráfico.', true, '2025-09-10 16:00:00')
    `;
    
    try {
      await db.query(insertQuery);
      console.log('✅ Datos de ejemplo insertados');
    } catch (err) {
      console.log('⚠️ Error al insertar datos (posiblemente ya existen):', err.message);
    }
    
    // Verificar la estructura final
    const { rows } = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'evaluaciones' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura final de la tabla evaluaciones:');
    console.table(rows);
    
    // Verificar que hay datos
    const { rows: evaluaciones } = await db.query('SELECT COUNT(*) as total FROM evaluaciones');
    console.log(`📊 Total de evaluaciones en BD: ${evaluaciones[0].total}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al actualizar tabla evaluaciones:', error);
    process.exit(1);
  }
}

updateEvaluacionesTable();