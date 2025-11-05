const db = require('./Backend/config/db');

async function crearCitas() {
  try {
    console.log('📅 Creando citas de ejemplo...');
    
    // Crear primera cita
    const result1 = await db.query(
      `INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, motivo, estado) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [3, 4, '2025-09-15', '10:00:00', 'Consulta general', 'programada']
    );
    console.log('✅ Cita 1 creada con ID:', result1.rows[0].id);
    
    // Crear segunda cita
    const result2 = await db.query(
      `INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, motivo, estado) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [3, 4, '2025-09-08', '14:30:00', 'Limpieza dental', 'completada']
    );
    console.log('✅ Cita 2 creada con ID:', result2.rows[0].id);
    
    console.log('✅ Citas de ejemplo creadas exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearCitas();
