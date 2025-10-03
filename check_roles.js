const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432
});

async function checkRoles() {
  try {
    console.log('Verificando roles disponibles...');
    
    // Verificar si existe una tabla roles
    const tablesResult = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_name LIKE $1', ['%rol%']);
    console.log('Tablas relacionadas con roles:', tablesResult.rows);
    
    // Verificar valores únicos de rol_id en usuarios
    const rolesInUsuarios = await pool.query('SELECT DISTINCT rol_id, COUNT(*) as count FROM usuarios GROUP BY rol_id ORDER BY rol_id');
    console.log('Valores de rol_id en usuarios:', rolesInUsuarios.rows);
    
    // Verificar algunos usuarios específicos
    const usuariosData = await pool.query('SELECT id, nombre, apellido, correo, rol_id FROM usuarios ORDER BY id');
    console.log('Usuarios y sus roles:', usuariosData.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRoles();
