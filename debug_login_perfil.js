// Debug del login y carga de perfil para identificar el problema de sobrecarga
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'clinikdent_supabase_1',
  user: 'postgres',
  password: 'postgres123'
});

async function debugLoginPerfil() {
  console.log('🔍 === DEBUG LOGIN Y PERFIL ===');
  
  try {
    // 1. Verificar usuario juan@gmail.com en la base de datos
    console.log('\n1️⃣ Verificando usuario juan@gmail.com:');
    const loginResult = await pool.query(
      'SELECT id, nombre, apellido, correo, rol_id FROM usuarios WHERE correo = $1',
      ['juan@gmail.com']
    );
    
    if (loginResult.rows.length === 0) {
      console.log('❌ Usuario juan@gmail.com no encontrado');
      return;
    }
    
    const user = loginResult.rows[0];
    console.log('✅ Usuario encontrado:', user);
    
    // 2. Simular lo que hace el endpoint obtenerPerfil
    console.log('\n2️⃣ Obteniendo perfil completo para ID:', user.id);
    const perfilResult = await pool.query(`
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.correo, 
        u.telefono, 
        u.direccion, 
        r.nombre as rol, 
        u.fecha_nacimiento, 
        u.tipo_documento, 
        u.numero_documento, 
        u.activo as estado, 
        u.created_at as fecha_registro
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [user.id]);
    
    if (perfilResult.rows.length === 0) {
      console.log('❌ No se encontró perfil para ID:', user.id);
      return;
    }
    
    console.log('✅ Perfil obtenido:', perfilResult.rows[0]);
    
    // 3. Verificar si hay algún conflicto de ID
    console.log('\n3️⃣ Verificando todos los usuarios en la tabla:');
    const allUsers = await pool.query('SELECT id, nombre, apellido, correo FROM usuarios ORDER BY id');
    console.log('👥 Todos los usuarios:');
    allUsers.rows.forEach(user => {
      console.log(`   ID ${user.id}: ${user.nombre} ${user.apellido} (${user.correo})`);
    });
    
    // 4. Verificar si hay datos en localStorage que puedan estar causando conflicto
    console.log('\n4️⃣ Información que debería estar en localStorage después del login:');
    console.log('   userId:', user.id);
    console.log('   user object:', JSON.stringify({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo
    }));
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await pool.end();
  }
}

debugLoginPerfil();