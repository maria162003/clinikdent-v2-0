const db = require('../Backend/config/db');

(async () => {
  try {
    console.log('🔍 Verificando esquema de historial_clinico...\n');
    
    // Consultar columnas de la tabla
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'historial_clinico' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Columnas encontradas en historial_clinico:');
    console.log('─'.repeat(80));
    
    result.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  📋 ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
    });
    
    console.log('─'.repeat(80));
    
    // Verificar si existe la columna estado
    const tieneEstado = result.rows.some(col => col.column_name === 'estado');
    
    if (tieneEstado) {
      console.log('\n✅ La columna "estado" EXISTE en historial_clinico');
      
      // Consultar valores actuales
      const valoresResult = await db.query(`
        SELECT DISTINCT estado, COUNT(*) as cantidad
        FROM historial_clinico
        GROUP BY estado
      `);
      
      if (valoresResult.rows.length > 0) {
        console.log('\n📊 Valores actuales de estado:');
        valoresResult.rows.forEach(row => {
          console.log(`  - ${row.estado || 'NULL'}: ${row.cantidad} registros`);
        });
      } else {
        console.log('\n⚠️ No hay registros en historial_clinico');
      }
    } else {
      console.log('\n❌ La columna "estado" NO EXISTE en historial_clinico');
      console.log('\n💡 Se necesita agregar la columna con esta migración:');
      console.log(`
ALTER TABLE historial_clinico 
ADD COLUMN estado VARCHAR(50) DEFAULT 'en_proceso';

-- Valores posibles: 'en_proceso', 'completado', 'pausado'
      `);
    }
    
    await db.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await db.end();
    process.exit(1);
  }
})();
