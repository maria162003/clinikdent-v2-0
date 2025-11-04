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

async function swapUsers() {
  try {
    console.log('🔄 Intercambiando datos de usuarios ID 3 y ID 4...');
    
    // Primero, obtener los datos actuales
    const { rows: usuarios } = await pool.query(`
      SELECT id, nombre, apellido, correo, telefono, direccion, rol_id
      FROM usuarios 
      WHERE id IN (3, 4)
      ORDER BY id
    `);
    
    if (usuarios.length !== 2) {
      console.log('❌ Error: No se encontraron ambos usuarios');
      return;
    }
    
    const user3 = usuarios[0]; // María González
    const user4 = usuarios[1]; // Juan Pérez
    
    console.log('📋 ANTES DEL INTERCAMBIO:');
    console.log(`ID 3: ${user3.nombre} ${user3.apellido} (${user3.correo})`);
    console.log(`ID 4: ${user4.nombre} ${user4.apellido} (${user4.correo})`);
    
    // Intercambiar los datos (juan@gmail.com debe quedar en ID 3)
    await pool.query('BEGIN');
    
    // Actualizar ID 3 con datos de Juan
    await pool.query(`
      UPDATE usuarios 
      SET nombre = $1, apellido = $2, correo = $3, telefono = $4, direccion = $5
      WHERE id = 3
    `, [user4.nombre, user4.apellido, user4.correo, user4.telefono, user4.direccion]);
    
    // Actualizar ID 4 con datos de María
    await pool.query(`
      UPDATE usuarios 
      SET nombre = $1, apellido = $2, correo = $3, telefono = $4, direccion = $5
      WHERE id = 4
    `, [user3.nombre, user3.apellido, user3.correo, user3.telefono, user3.direccion]);
    
    await pool.query('COMMIT');
    
    // Verificar el cambio
    const { rows: verificacion } = await pool.query(`
      SELECT id, nombre, apellido, correo
      FROM usuarios 
      WHERE id IN (3, 4)
      ORDER BY id
    `);
    
    console.log('\n✅ DESPUÉS DEL INTERCAMBIO:');
    console.log(`ID 3: ${verificacion[0].nombre} ${verificacion[0].apellido} (${verificacion[0].correo})`);
    console.log(`ID 4: ${verificacion[1].nombre} ${verificacion[1].apellido} (${verificacion[1].correo})`);
    
    console.log('\n🎯 Ahora juan@gmail.com está en ID 3 y mostrará el perfil correcto');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error intercambiando usuarios:', error);
  } finally {
    await pool.end();
  }
}

swapUsers();