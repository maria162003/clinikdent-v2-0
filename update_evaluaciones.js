const db = require('./Backend/config/db');
const fs = require('fs');

async function updateEvaluacionesTable() {
  try {
    console.log('🔄 Actualizando estructura de tabla evaluaciones...');
    
    // Leer el archivo SQL
    const sqlScript = fs.readFileSync('./fix_evaluaciones_table.sql', 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = sqlScript
      .split(';')
      .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'))
      .map(cmd => cmd.trim());
    
    // Ejecutar cada comando
    for (let command of commands) {
      if (command) {
        console.log('🔍 Ejecutando:', command.substring(0, 50) + '...');
        await db.query(command);
      }
    }
    
    console.log('✅ Tabla evaluaciones actualizada exitosamente');
    
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