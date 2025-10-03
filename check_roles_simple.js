// Script simple para verificar roles
const mysql = require('mysql2/promise');

async function checkRoles() {
  let connection;
  try {
    // Conectar directamente
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'clinikdent'
    });
    
    console.log('✅ Conectado a la base de datos');
    
    // Obtener roles
    const [roles] = await connection.execute('SELECT * FROM roles ORDER BY id');
    console.log('\n📋 ROLES EN LA BASE DE DATOS:');
    roles.forEach(role => {
      console.log(`   ID: ${role.id} - Nombre: "${role.nombre}"`);
    });
    
    // Obtener usuario Camila
    const [users] = await connection.execute(`
      SELECT u.*, r.nombre as rol_nombre 
      FROM usuarios u 
      LEFT JOIN roles r ON u.rol_id = r.id 
      WHERE u.correo LIKE '%camila%'
    `);
    
    console.log('\n👤 USUARIO CAMILA:');
    if (users.length > 0) {
      const user = users[0];
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   Email: ${user.correo}`);
      console.log(`   Rol ID: ${user.rol_id}`);
      console.log(`   Rol Nombre: "${user.rol_nombre}"`);
    } else {
      console.log('   ❌ No se encontró usuario Camila');
    }
    
    await connection.end();
    console.log('\n✅ Consulta completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
}

checkRoles();
