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

async function generarEndpointDataOdontologos() {
  try {
    console.log('🦷 Obteniendo odontólogos activos para el frontend...');
    
    const { rows } = await pool.query(`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.telefono, u.activo
      FROM usuarios u 
      LEFT JOIN roles r ON u.rol_id = r.id 
      WHERE r.nombre = 'odontologo' AND u.activo = true
      ORDER BY u.nombre ASC
    `);
    
    console.log(`✅ Odontólogos encontrados: ${rows.length}`);
    rows.forEach((odontologo, index) => {
      console.log(`${index + 1}. ID: ${odontologo.id}, Nombre: ${odontologo.nombre} ${odontologo.apellido || ''}, Email: ${odontologo.correo}`);
    });
    
    // Generar código para el frontend
    console.log('\n📝 Código para el frontend (como respaldo):');
    const jsArray = JSON.stringify(rows, null, 2);
    console.log(`const odontologosRespaldo = ${jsArray};`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

generarEndpointDataOdontologos();