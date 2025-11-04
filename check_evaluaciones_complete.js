const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432
});

async function checkEvaluacionesComplete() {
  try {
    console.log('Verificando estructura completa de evaluaciones...');
    const result = await pool.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['evaluaciones']);
    
    console.log('Columnas de la tabla evaluaciones:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Ver datos de ejemplo
    console.log('\nDatos de ejemplo:');
    const data = await pool.query('SELECT * FROM evaluaciones LIMIT 2');
    console.log(data.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEvaluacionesComplete();
