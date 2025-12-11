const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔄 Ejecutando script de creación de sistema de facturación DEMO...\n');

// Configuración de la conexión a Supabase
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function ejecutarSQL() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado a Supabase PostgreSQL\n');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'crear_sistema_facturacion_demo.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Ejecutando SQL desde:', sqlPath);
    console.log('📊 Tamaño del script:', sql.length, 'caracteres\n');
    
    // Ejecutar el SQL
    console.log('⏳ Ejecutando script SQL...\n');
    await client.query(sql);
    
    console.log('✅ Script SQL ejecutado exitosamente!\n');
    
    // Verificar que las tablas se crearon
    console.log('🔍 Verificando tablas creadas...\n');
    
    const tablas = [
      'catalogo_servicios',
      'facturas',
      'distribucion_ingresos',
      'configuracion_comisiones'
    ];
    
    for (const tabla of tablas) {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      `, [tabla]);
      
      if (result.rows[0].count > 0) {
        // Contar registros
        const countResult = await client.query(`SELECT COUNT(*) as total FROM ${tabla}`);
        console.log(`  ✅ Tabla "${tabla}" creada - ${countResult.rows[0].total} registros`);
      } else {
        console.log(`  ❌ Tabla "${tabla}" NO encontrada`);
      }
    }
    
    console.log('\n🔍 Verificando vistas creadas...\n');
    
    const vistas = [
      'vista_facturas_completas',
      'vista_distribucion_completa'
    ];
    
    for (const vista of vistas) {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name = $1
      `, [vista]);
      
      if (result.rows[0].count > 0) {
        console.log(`  ✅ Vista "${vista}" creada`);
      } else {
        console.log(`  ❌ Vista "${vista}" NO encontrada`);
      }
    }
    
    console.log('\n🔍 Verificando triggers creados...\n');
    
    const triggers = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND (trigger_name = 'trigger_generar_numero_factura' OR trigger_name = 'trigger_crear_distribucion_automatica')
    `);
    
    if (triggers.rows.length > 0) {
      triggers.rows.forEach(t => {
        console.log(`  ✅ Trigger "${t.trigger_name}" en tabla "${t.event_object_table}"`);
      });
    } else {
      console.log('  ⚠️ No se encontraron triggers (pueden haberse creado igualmente)');
    }
    
    // Mostrar servicios del catálogo
    console.log('\n📋 Servicios en catálogo:\n');
    const servicios = await client.query('SELECT nombre, categoria, precio_base FROM catalogo_servicios ORDER BY id');
    servicios.rows.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.nombre} (${s.categoria}) - $${s.precio_base.toLocaleString()}`);
    });
    
    console.log('\n✅ Sistema de facturación DEMO instalado correctamente!');
    console.log('🎯 Puedes usar los endpoints en /api/facturas');
    console.log('⚠️ RECUERDA: Este es un sistema DEMO - NO realiza pagos reales\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
ejecutarSQL();
