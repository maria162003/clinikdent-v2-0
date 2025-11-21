// Script temporal para verificar la estructura de la tabla inventario
const db = require('../Backend/config/db');

async function checkInventarioSchema() {
  try {
    console.log('🔍 Consultando estructura de tabla inventario...\n');
    
    const query = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'inventario'
      ORDER BY ordinal_position;
    `;
    
    const result = await db.query(query);
    
    console.log('📋 Columnas encontradas en tabla inventario:');
    console.log('================================================\n');
    
    result.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name}`);
      console.log(`   Tipo: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Default: ${col.column_default || 'N/A'}`);
      console.log('');
    });
    
    console.log(`\n✅ Total: ${result.rows.length} columnas`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkInventarioSchema();
