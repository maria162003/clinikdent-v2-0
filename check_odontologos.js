require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkOdontologos() {
  console.log('=== VERIFICANDO ODONTÓLOGOS ===');
  console.log('📡 Conectando a:', process.env.DB_HOST);
  
  try {
    // Verificar tabla de roles
    console.log('\n=== TABLA DE ROLES ===');
    const { rows: roles } = await pool.query(`
      SELECT * FROM roles ORDER BY id
    `);
    
    console.log('Roles disponibles:');
    roles.forEach(rol => {
      console.log(`- ID: ${rol.id}, Nombre: ${rol.nombre || rol.rol_nombre || 'N/A'}`);
    });
    
    // Obtener usuarios con sus roles
    console.log('\n=== USUARIOS CON ROLES ===');
    const { rows: usuariosConRoles } = await pool.query(`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.rol_id, r.nombre as rol_nombre, u.activo
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id
    `);
    
    console.log('Usuarios con roles:');
    usuariosConRoles.forEach((usuario, index) => {
      console.log(`${index + 1}. ID: ${usuario.id}, Nombre: ${usuario.nombre} ${usuario.apellido || ''}, Email: ${usuario.correo}, Rol ID: ${usuario.rol_id}, Rol: ${usuario.rol_nombre || 'Sin rol'}, Activo: ${usuario.activo}`);
    });
    
    // Buscar odontólogos específicamente (asumiendo que rol_id = 2 podría ser odontologo)
    console.log('\n=== ODONTÓLOGOS (ROL_ID = 2) ===');
    const { rows: odontologos } = await pool.query(`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.rol_id, r.nombre as rol_nombre, u.activo
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.rol_id = 2
      ORDER BY u.id
    `);
    
    console.log('Odontólogos encontrados:', odontologos.length);
    odontologos.forEach((odontologo, index) => {
      console.log(`${index + 1}. ID: ${odontologo.id}, Nombre: ${odontologo.nombre} ${odontologo.apellido || ''}, Email: ${odontologo.correo}, Activo: ${odontologo.activo}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOdontologos().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});