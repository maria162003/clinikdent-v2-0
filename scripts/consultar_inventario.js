const db = require('../Backend/config/databaseSecure');

async function consultarInventario() {
  console.log('🔍 Consultando estructura y datos de equipos...\n');
  
  try {
    // Consultar primeros registros para ver la estructura
    const datosResult = await db.query(`
      SELECT * FROM equipos LIMIT 5
    `);
    
    console.log('📋 Primeros 5 registros de equipos:');
    console.log(JSON.stringify(datosResult.rows, null, 2));
    console.log('\n');
    
    // Consultar columnas de la tabla
    const columnasResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'equipos'
      ORDER BY ordinal_position
    `);
    
    console.log('🏗️ Estructura de la tabla equipos:');
    columnasResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    console.log('\n');
    
    // Estadísticas básicas
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_equipos,
        COUNT(DISTINCT categoria) as total_categorias,
        SUM(CASE WHEN precio IS NOT NULL THEN precio ELSE 0 END) as suma_precios
      FROM equipos
    `);
    
    console.log('📊 Estadísticas básicas:');
    console.log(JSON.stringify(statsResult.rows[0], null, 2));
    console.log('\n');
    
    // Verificar si existe columna de stock/cantidad
    const tieneStock = columnasResult.rows.some(col => 
      col.column_name.toLowerCase().includes('stock') || 
      col.column_name.toLowerCase().includes('cantidad')
    );
    
    if (tieneStock) {
      console.log('✅ La tabla tiene columnas de stock/cantidad');
      const stockCol = columnasResult.rows.find(col => 
        col.column_name.toLowerCase().includes('stock') || 
        col.column_name.toLowerCase().includes('cantidad')
      );
      console.log(`   Columna encontrada: ${stockCol.column_name}`);
      
      // Consultar distribución de stock
      const stockResult = await db.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN ${stockCol.column_name} = 0 THEN 1 ELSE 0 END) as sin_stock,
          SUM(CASE WHEN ${stockCol.column_name} > 0 AND ${stockCol.column_name} < 10 THEN 1 ELSE 0 END) as stock_bajo,
          SUM(CASE WHEN ${stockCol.column_name} >= 10 THEN 1 ELSE 0 END) as stock_normal
        FROM equipos
      `);
      
      console.log('\n📦 Distribución de stock:');
      console.log(JSON.stringify(stockResult.rows[0], null, 2));
    } else {
      console.log('⚠️ La tabla NO tiene columnas obvias de stock/cantidad');
      console.log('   Necesitarás agregar una columna o usar otra lógica');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al consultar inventario:', err);
    process.exit(1);
  }
}

consultarInventario();
