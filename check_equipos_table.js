const db = require('./Backend/config/db');

async function checkEquiposTable() {
  try {
    console.log('🔍 Verificando estructura de tabla equipos...');
    
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'equipos'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columnas en la tabla equipos:');
    result.rows.forEach(row => {
      console.log(` - ${row.column_name} (${row.data_type})`);
    });
    
    // También vamos a ver algunos datos de ejemplo
    const sampleData = await db.query('SELECT * FROM equipos LIMIT 1');
    console.log('\n📄 Ejemplo de datos:');
    console.log(sampleData.rows[0]);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkEquiposTable();
