const { Pool } = require('pg');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔄 Insertando facturas de prueba...\n');

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function insertarFacturasPrueba() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado a Supabase PostgreSQL\n');
    
    // Insertar facturas directamente con objetos JavaScript
    console.log('📄 Insertando Factura 1...');
    await client.query(`
      INSERT INTO facturas (
        paciente_id, odontologo_id, servicios, subtotal, descuento, total,
        fecha_emision, fecha_vencimiento, estado, metodo_pago, es_demo
      ) VALUES (
        42, 47, $1, 130000, 0, 130000,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '3 days',
        'PENDIENTE', NULL, true
      )
    `, [JSON.stringify([
      {servicio_id: 1, nombre: "Consulta general", cantidad: 1, precio_unitario: 50000, subtotal: 50000},
      {servicio_id: 2, nombre: "Limpieza dental", cantidad: 1, precio_unitario: 80000, subtotal: 80000}
    ])]);
    
    console.log('📄 Insertando Factura 2...');
    await client.query(`
      INSERT INTO facturas (
        paciente_id, odontologo_id, servicios, subtotal, descuento, total,
        fecha_emision, fecha_vencimiento, estado, metodo_pago, es_demo
      ) VALUES (
        41, 48, $1, 120000, 0, 120000,
        CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '5 days',
        'VENCIDA', NULL, true
      )
    `, [JSON.stringify([
      {servicio_id: 4, nombre: "Extracción dental", cantidad: 1, precio_unitario: 120000, subtotal: 120000}
    ])]);
    
    console.log('📄 Insertando Factura 3...');
    await client.query(`
      INSERT INTO facturas (
        paciente_id, odontologo_id, servicios, subtotal, descuento, total,
        fecha_emision, fecha_vencimiento, fecha_pago, estado, metodo_pago, es_demo
      ) VALUES (
        1, 50, $1, 100000, 10000, 90000,
        CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '23 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days', 'PAGADA', 'tarjeta_demo', true
      )
    `, [JSON.stringify([
      {servicio_id: 5, nombre: "Ortodoncia", cantidad: 1, precio_unitario: 100000, subtotal: 100000}
    ])]);
    
    console.log('📄 Insertando Factura 4...');
    await client.query(`
      INSERT INTO facturas (
        paciente_id, odontologo_id, servicios, subtotal, descuento, total,
        fecha_emision, fecha_vencimiento, estado, metodo_pago, es_demo
      ) VALUES (
        5, 47, $1, 350000, 50000, 300000,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '5 days',
        'PENDIENTE', NULL, true
      )
    `, [JSON.stringify([
      {servicio_id: 6, nombre: "Blanqueamiento dental", cantidad: 1, precio_unitario: 350000, subtotal: 350000}
    ])]);
    
    console.log('\n✅ Facturas de prueba insertadas exitosamente!\n');
    
    // Mostrar facturas creadas
    const facturas = await client.query(`
      SELECT 
        f.numero_factura,
        u1.nombre || ' ' || u1.apellido as paciente,
        u2.nombre || ' ' || u2.apellido as odontologo,
        f.total,
        f.estado,
        TO_CHAR(f.fecha_emision, 'YYYY-MM-DD') as fecha_emision,
        TO_CHAR(f.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento
      FROM facturas f
      JOIN usuarios u1 ON f.paciente_id = u1.id
      JOIN usuarios u2 ON f.odontologo_id = u2.id
      WHERE f.es_demo = true
      ORDER BY f.fecha_emision DESC
    `);
    
    console.log('📋 Facturas DEMO creadas:\n');
    facturas.rows.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.numero_factura} - ${f.estado}`);
      console.log(`     Paciente: ${f.paciente}`);
      console.log(`     Odontólogo: ${f.odontologo}`);
      console.log(`     Total: $${parseFloat(f.total).toLocaleString()}`);
      console.log(`     Emisión: ${f.fecha_emision} | Vencimiento: ${f.fecha_vencimiento}\n`);
    });
    
    // Mostrar distribuciones
    const distribuciones = await client.query(`
      SELECT 
        d.monto_total,
        d.monto_odontologo,
        d.monto_clinica,
        d.estado,
        u.nombre || ' ' || u.apellido as odontologo
      FROM distribucion_ingresos d
      JOIN facturas f ON d.factura_id = f.id
      JOIN usuarios u ON d.odontologo_id = u.id
      WHERE f.es_demo = true
      ORDER BY d.created_at DESC
    `);
    
    console.log('💰 Distribuciones de ingresos generadas:\n');
    distribuciones.rows.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.odontologo} - ${d.estado}`);
      console.log(`     Monto Total: $${parseFloat(d.monto_total).toLocaleString()}`);
      console.log(`     Para Odontólogo: $${parseFloat(d.monto_odontologo).toLocaleString()}`);
      console.log(`     Para Clínica: $${parseFloat(d.monto_clinica).toLocaleString()}\n`);
    });
    
    console.log('✅ Sistema listo para pruebas!');
    console.log('🌐 Dashboard Paciente: http://localhost:3001/dashboard-paciente.html');
    console.log('🌐 Dashboard Admin: http://localhost:3001/dashboard-admin.html\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
insertarFacturasPrueba();
