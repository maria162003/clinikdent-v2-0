const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432
});

async function checkEvaluacionesTable() {
  try {
    console.log('Verificando tabla evaluaciones...');
    const result = await pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['evaluaciones']);
    
    if (result.rows.length === 0) {
      console.log(' La tabla evaluaciones NO existe');
    } else {
      console.log(' La tabla evaluaciones existe con las siguientes columnas:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEvaluacionesTable();
