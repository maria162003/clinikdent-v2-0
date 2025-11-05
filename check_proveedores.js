const db = require('./Backend/config/db.js');

async function checkProveedores() {
  try {
    const result = await db.query('SELECT * FROM proveedores ORDER BY id');
    console.log('=== PROVEEDORES EN BASE DE DATOS ===');
    result.rows.forEach((prov, index) => {
      console.log(`${index + 1}. ID: ${prov.id}`);
      console.log(`   Nombre: ${prov.nombre}`);
      console.log(`   Contacto: ${prov.contacto}`);
      console.log(`   Teléfono: ${prov.telefono}`);
      console.log(`   Email: ${prov.email}`);
      console.log(`   Estado: ${prov.estado}`);
      console.log(`   Última compra: ${prov.ultima_compra}`);
      console.log(`   Productos: ${prov.productos}`);
      console.log('   ---');
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkProveedores();
