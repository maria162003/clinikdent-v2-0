const { Pool } = require('pg');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function obtenerIds() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Buscando IDs reales en la base de datos...\n');
    
    // Ver roles disponibles
    const roles = await client.query(`
      SELECT * FROM roles
    `);
    
    console.log('📋 Roles disponibles:');
    roles.rows.forEach(r => {
      console.log(`  ID: ${r.id} - ${r.nombre}`);
    });
    
    // Obtener pacientes (rol_id = 1 basado en el ejemplo)
    const pacientes = await client.query(`
      SELECT id, nombre, apellido, correo 
      FROM usuarios 
      WHERE rol_id = 1
      LIMIT 5
    `);
    
    console.log('\n👥 Pacientes disponibles:');
    pacientes.rows.forEach(p => {
      console.log(`  ID: ${p.id} - ${p.nombre} ${p.apellido}`);
    });
    
    // Obtener odontólogos (rol_id = 3 basado en los ejemplos)
    const odontologos = await client.query(`
      SELECT id, nombre, apellido, correo 
      FROM usuarios 
      WHERE rol_id = 3
      LIMIT 3
    `);
    
    console.log('\n🦷 Odontólogos disponibles:');
    odontologos.rows.forEach(o => {
      console.log(`  ID: ${o.id} - ${o.nombre} ${o.apellido}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

obtenerIds();
