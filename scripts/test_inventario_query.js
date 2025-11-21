// Script para probar la consulta de inventario
const db = require('../Backend/config/db');

async function testInventarioQuery() {
  try {
    console.log('🔍 Probando consulta de inventario...\n');
    
    const query = `
      SELECT DISTINCT ON (origen, id_real)
        id,
        codigo,
        nombre,
        descripcion,
        categoria_id,
        cantidad,
        stock_minimo,
        precio_unitario,
        sede_id,
        ubicacion,
        estado,
        fecha_registro,
        fecha_actualizacion,
        sede_nombre,
        sede_ciudad,
        origen,
        id_real
      FROM (
        -- Tabla inventario
        SELECT 
          i.id,
          COALESCE(i.codigo, 'INV-' || i.id::text) as codigo,
          i.nombre,
          i.descripcion,
          i.categoria_id,
          COALESCE(i.cantidad_actual, 0) as cantidad,
          COALESCE(i.cantidad_minima, 0) as stock_minimo,
          COALESCE(i.precio_unitario, 0) as precio_unitario,
          i.sede_id,
          i.ubicacion,
          COALESCE(i.estado, 'disponible') as estado,
          i.created_at as fecha_registro,
          NULL as fecha_actualizacion,
          s.nombre as sede_nombre,
          s.ciudad as sede_ciudad,
          'inventario' as origen,
          i.id as id_real
        FROM inventario i
        LEFT JOIN sedes s ON i.sede_id = s.id
        
        UNION ALL
        
        -- Tabla inventario_equipos
        SELECT 
          ie.id,
          'EQU-' || ie.id::text as codigo,
          e.nombre,
          ie.descripcion,
          NULL as categoria_id,
          COALESCE(ie.cantidad, 0) as cantidad,
          0 as stock_minimo,
          COALESCE(e.precio, 0) as precio_unitario,
          ie.sede_id,
          NULL as ubicacion,
          'disponible' as estado,
          NULL as fecha_registro,
          NULL as fecha_actualizacion,
          s.nombre as sede_nombre,
          s.ciudad as sede_ciudad,
          'inventario_equipos' as origen,
          ie.id as id_real
        FROM inventario_equipos ie
        LEFT JOIN equipos e ON ie.equipo_id = e.id
        LEFT JOIN sedes s ON ie.sede_id = s.id
        
        UNION ALL
        
        -- Tabla equipos (equipos sin asignar a inventario)
        SELECT 
          e.id,
          'EQ-' || e.id::text as codigo,
          e.nombre,
          e.descripcion,
          NULL as categoria_id,
          0 as cantidad,
          0 as stock_minimo,
          COALESCE(e.precio, 0) as precio_unitario,
          NULL as sede_id,
          NULL as ubicacion,
          'disponible' as estado,
          e.fecha_alta as fecha_registro,
          NULL as fecha_actualizacion,
          NULL as sede_nombre,
          NULL as sede_ciudad,
          'equipos' as origen,
          e.id as id_real
        FROM equipos e
        WHERE NOT EXISTS (
          SELECT 1 FROM inventario_equipos ie2 WHERE ie2.equipo_id = e.id
        )
      ) AS inventario_completo
      ORDER BY origen, id_real, nombre ASC
    `;
    
    console.log('📊 Ejecutando query...');
    const result = await db.query(query);
    
    console.log(`\n✅ Resultados: ${result.rows.length} items`);
    console.log('\n📋 Primeros 3 registros:');
    result.rows.slice(0, 3).forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.nombre}`);
      console.log(`   ID: ${item.id} | Origen: ${item.origen}`);
      console.log(`   Cantidad: ${item.cantidad} | Stock mín: ${item.stock_minimo}`);
      console.log(`   Precio: ${item.precio_unitario}`);
      console.log(`   Sede: ${item.sede_nombre || 'N/A'}`);
    });
    
    console.log('\n✅ Query ejecutada exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error en la query:', err.message);
    console.error('📝 Código de error:', err.code);
    console.error('📝 Posición del error:', err.position);
    console.error('\n🔍 Stack trace:', err.stack);
    process.exit(1);
  }
}

testInventarioQuery();
