const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

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

async function agregarColumnaFacturas() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Agregando columna cita_id a tabla facturas...\n');
    
    const sql = fs.readFileSync(path.join(__dirname, 'agregar_cita_id_facturas.sql'), 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Columna agregada exitosamente!\n');
    
    // Verificar
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'facturas' 
      AND column_name = 'cita_id'
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 Información de la columna:');
      console.log('  Nombre:', result.rows[0].column_name);
      console.log('  Tipo:', result.rows[0].data_type);
      console.log('  Nullable:', result.rows[0].is_nullable);
      console.log('\n✅ Sistema listo para generar facturas automáticamente al agendar citas!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

agregarColumnaFacturas();
