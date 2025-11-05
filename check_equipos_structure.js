const db = require('./Backend/config/db.js');

async function checkEquiposStructure() {
  try {
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'equipos'
      ORDER BY ordinal_position
    `);
    console.log('Estructura de la tabla equipos:');
    result.rows.forEach(col => {
      console.log('- ' + col.column_name + ' (' + col.data_type + ')');
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkEquiposStructure();
