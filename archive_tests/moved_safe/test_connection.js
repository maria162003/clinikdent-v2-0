const db = require('./Backend/config/db');

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a Supabase...');
    
    const { rows } = await db.query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ Conexión exitosa a PostgreSQL/Supabase!');
    console.log('🕒 Hora actual:', rows[0].current_time);
    console.log('📦 Versión PostgreSQL:', rows[0].pg_version);
    
    // Probar si existen las tablas principales
    const { rows: tables } = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error('🔍 Detalles:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Solución: Verifica la URL del host en .env');
    } else if (error.code === '28P01') {
      console.log('💡 Solución: Verifica usuario y contraseña en .env');
    } else if (error.code === '3D000') {
      console.log('💡 Solución: Verifica el nombre de la base de datos en .env');
    }
    
    process.exit(1);
  }
}

testConnection();
