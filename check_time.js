const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  user: 'postgres.xzlugnkzfdurczwwwimv',
  password: 'proyecto123',
  database: 'postgres',
  port: 5432
});

async function checkTime() {
  try {
    const result = await pool.query(`
      SELECT 
        NOW() as server_time,
        timezone('America/Bogota', NOW()) as colombia_time,
        token,
        expires_at,
        expires_at > NOW() as is_valid_pg,
        usuario_id
      FROM password_reset_tokens 
      WHERE usuario_id = 5 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    console.log('⏰ Resultado completo:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTime();
