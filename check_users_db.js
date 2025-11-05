const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE,
  port: process.env.SUPABASE_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    console.log('🔍 Consultando usuarios en la base de datos...');
    
    const { rows } = await pool.query(`
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.correo, 
        u.telefono,
        u.direccion,
        r.nombre as rol,
        u.activo,
        u.created_at
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id ASC
    `);
    
    console.log('\n📋 USUARIOS EN LA BASE DE DATOS:');
    console.log('=====================================');
    
    if (rows.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      rows.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Nombre: ${user.nombre} ${user.apellido}`);
        console.log(`Email: ${user.correo}`);
        console.log(`Teléfono: ${user.telefono}`);
        console.log(`Dirección: ${user.direccion}`);
        console.log(`Rol: ${user.rol}`);
        console.log(`Activo: ${user.activo}`);
        console.log(`Creado: ${user.created_at}`);
        console.log('-------------------------------------');
      });
    }
    
  } catch (error) {
    console.error('❌ Error consultando usuarios:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();