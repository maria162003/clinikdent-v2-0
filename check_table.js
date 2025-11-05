const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432
});

async function checkUsuariosTable() {
  try {
    console.log('Verificando estructura de tabla usuarios...');
    const result = await pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['usuarios']);
    
    console.log('Columnas de la tabla usuarios:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\nDatos de ejemplo:');
    const userData = await pool.query('SELECT * FROM usuarios LIMIT 2');
    console.log(userData.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsuariosTable();
