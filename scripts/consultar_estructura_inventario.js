const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function consultarEstructuraInventario() {
  console.log('🔍 Consultando estructura de tablas de inventario...\n');
  
  try {
    // Consultar columnas de tabla inventario
    console.log('📋 Estructura de tabla INVENTARIO:');
    const columnasInventario = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventario'
      ORDER BY ordinal_position
    `);
    
    if (columnasInventario.rows.length > 0) {
      columnasInventario.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('  ⚠️ Tabla inventario no existe o está vacía');
    }
    console.log('\n');
    
    // Consultar columnas de tabla inventario_equipos
    console.log('📋 Estructura de tabla INVENTARIO_EQUIPOS:');
    const columnasInventarioEquipos = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventario_equipos'
      ORDER BY ordinal_position
    `);
    
    if (columnasInventarioEquipos.rows.length > 0) {
      columnasInventarioEquipos.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('  ⚠️ Tabla inventario_equipos no existe o está vacía');
    }
    console.log('\n');
    
    // Consultar columnas de tabla equipos
    console.log('📋 Estructura de tabla EQUIPOS:');
    const columnasEquipos = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'equipos'
      ORDER BY ordinal_position
    `);
    
    columnasEquipos.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    console.log('\n');
    
    // Mostrar datos de ejemplo
    console.log('📊 Datos de ejemplo:');
    const datosEquipos = await db.query('SELECT * FROM equipos LIMIT 3');
    console.log('Equipos:', JSON.stringify(datosEquipos.rows, null, 2));
    
    if (columnasInventario.rows.length > 0) {
      const datosInventario = await db.query('SELECT * FROM inventario LIMIT 3');
      console.log('\nInventario:', JSON.stringify(datosInventario.rows, null, 2));
    }
    
    if (columnasInventarioEquipos.rows.length > 0) {
      const datosInventarioEquipos = await db.query('SELECT * FROM inventario_equipos LIMIT 3');
      console.log('\nInventario Equipos:', JSON.stringify(datosInventarioEquipos.rows, null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al consultar estructura:', err);
    process.exit(1);
  }
}

consultarEstructuraInventario();
