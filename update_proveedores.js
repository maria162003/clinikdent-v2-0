const db = require('./Backend/config/db.js');

async function updateProveedores() {
  try {
    // Actualizar proveedores con datos más completos
    const updates = [
      {
        id: 1,
        productos: 'Instrumentos Dentales',
        ultima_compra: '2024-08-15'
      },
      {
        id: 2,
        productos: 'Equipos Médicos',
        ultima_compra: '2024-07-22'
      },
      {
        id: 3,
        productos: 'Material Instrumental',
        ultima_compra: '2024-09-01'
      }
    ];
    
    for (const update of updates) {
      await db.query(`
        UPDATE proveedores 
        SET productos = $1, ultima_compra = $2
        WHERE id = $3
      `, [update.productos, update.ultima_compra, update.id]);
    }
    
    console.log('✅ Proveedores actualizados exitosamente');
    
    // Verificar la actualización
    const result = await db.query('SELECT * FROM proveedores ORDER BY id');
    console.log('\n=== PROVEEDORES ACTUALIZADOS ===');
    result.rows.forEach((prov, index) => {
      console.log(`${index + 1}. ${prov.nombre}`);
      console.log(`   Contacto: ${prov.contacto}`);
      console.log(`   Estado: ${prov.estado}`);
      console.log(`   Productos: ${prov.productos}`);
      console.log(`   Última compra: ${prov.ultima_compra}`);
      console.log('   ---');
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

updateProveedores();
