const { Pool } = require('pg');

// Configuración directa usando las credenciales correctas
const pool = new Pool({
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  user: 'postgres.xzlugnkzfdurczwwwimv',
  password: 'proyecto123',
  database: 'postgres',
  port: 5432
});

async function testTokenTable() {
  try {
    console.log('🔍 Verificando tabla password_reset_tokens...');
    
    // Verificar si la tabla existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      );
    `);
    
    console.log('📋 Tabla existe:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('🔨 Creando tabla password_reset_tokens...');
      await pool.query(`
        CREATE TABLE password_reset_tokens (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
          token VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Tabla creada exitosamente');
    }
    
    // Verificar zona horaria y tiempo
    const timeCheck = await pool.query('SELECT NOW(), timezone($1, NOW()) as colombia_time', ['America/Bogota']);
    console.log('⏰ Tiempo del servidor:', timeCheck.rows[0]);
    
    // Verificar tokens existentes (incluyendo expirados)
    const tokensCheck = await pool.query('SELECT *, NOW(), expires_at > NOW() as is_valid FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5');
    console.log('🔑 Últimos tokens (válidos e inválidos):', tokensCheck.rows.length);
    
    tokensCheck.rows.forEach(token => {
      console.log(`  - Token: ${token.token}, Usuario: ${token.usuario_id}, Válido BD: ${token.is_valid ? '✅' : '❌'}, Expira: ${token.expires_at}, NOW: ${token.now}`);
    });

    // Verificar usuario específico
    const userCheck = await pool.query("SELECT id, nombre, apellido, correo FROM usuarios WHERE correo = 'camilafontalvolopez@gmail.com'");
    console.log('👤 Usuario encontrado:', userCheck.rows.length > 0 ? userCheck.rows[0] : 'No encontrado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testTokenTable();
