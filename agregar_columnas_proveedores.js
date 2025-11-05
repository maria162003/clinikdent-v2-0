require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function agregarColumnasProveedores() {
  try {
    console.log('🔧 Agregando columnas faltantes a la tabla proveedores...');
    
    // Verificar columnas existentes
    const columnasExistentes = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proveedores'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas actuales:');
    columnasExistentes.rows.forEach(col => console.log(`  - ${col.column_name}`));
    
    // Agregar columnas si no existen
    const alteraciones = [
      'ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100)',
      'ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT \'Colombia\'',
      'ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS codigo VARCHAR(50)',
      'ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS especialidades TEXT',
      'ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS tiempo_entrega_dias INT DEFAULT 7'
    ];
    
    for (const alter of alteraciones) {
      console.log(`🔧 Ejecutando: ${alter}`);
      await db.query(alter);
    }
    
    // Verificar columnas después
    const columnasNuevas = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proveedores'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ Columnas después de la alteración:');
    columnasNuevas.rows.forEach(col => console.log(`  - ${col.column_name}`));
    
    console.log('\n🎉 ¡Tabla actualizada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
  }
}

agregarColumnasProveedores();