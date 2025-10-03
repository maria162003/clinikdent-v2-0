const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432
});

async function checkRolesTable() {
  try {
    console.log('Verificando tabla roles...');
    const rolesData = await pool.query('SELECT * FROM roles ORDER BY id');
    console.log('Roles disponibles:', rolesData.rows);
    
    console.log('\nUsuarios con roles:');
    const usuariosConRoles = await pool.query(`
      SELECT u.id, u.nombre, u.apellido, u.correo, r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id
    `);
    console.log(usuariosConRoles.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRolesTable();
