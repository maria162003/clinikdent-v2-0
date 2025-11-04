const db = require('./Backend/config/db');

async function verificarDatos() {
  try {
    console.log('🔍 VERIFICANDO COHERENCIA DE DATOS DEL DASHBOARD\n');
    
    const hoy = new Date().toISOString().split('T')[0];
    console.log('📅 Fecha de hoy:', hoy);
    
    // 1. CITAS HOY - Verificar que sean del día actual
    console.log('\n1️⃣ CITAS HOY:');
    const citasHoyQuery = await db.query(`
      SELECT COUNT(*) as total, estado
      FROM citas 
      WHERE DATE(fecha) = $1
      GROUP BY estado
    `, [hoy]);
    
    console.log('Total citas hoy por estado:');
    let totalCitasHoy = 0;
    citasHoyQuery.rows.forEach(row => {
      console.log(`   - ${row.estado}: ${row.total}`);
      totalCitasHoy += parseInt(row.total);
    });
    console.log(`📊 TOTAL CITAS HOY: ${totalCitasHoy}`);
    
    // 2. PACIENTES ATENDIDOS - Verificar si son totales o de hoy
    console.log('\n2️⃣ PACIENTES ATENDIDOS:');
    const pacientesAtendidosHoy = await db.query(`
      SELECT COUNT(*) as total 
      FROM citas 
      WHERE estado = 'completada' AND DATE(fecha) = $1
    `, [hoy]);
    
    const pacientesAtendidosTotal = await db.query(`
      SELECT COUNT(*) as total 
      FROM citas 
      WHERE estado = 'completada'
    `);
    
    console.log(`📊 PACIENTES ATENDIDOS HOY: ${pacientesAtendidosHoy.rows[0].total}`);
    console.log(`📊 PACIENTES ATENDIDOS TOTAL: ${pacientesAtendidosTotal.rows[0].total}`);
    
    // 3. CITAS PENDIENTES - Verificar qué cuenta como pendiente
    console.log('\n3️⃣ CITAS PENDIENTES:');
    const citasPendientes = await db.query(`
      SELECT COUNT(*) as total, estado
      FROM citas 
      WHERE estado IN ('programada', 'confirmada')
      GROUP BY estado
    `);
    
    console.log('Citas pendientes por estado:');
    let totalPendientes = 0;
    citasPendientes.rows.forEach(row => {
      console.log(`   - ${row.estado}: ${row.total}`);
      totalPendientes += parseInt(row.total);
    });
    console.log(`📊 TOTAL CITAS PENDIENTES: ${totalPendientes}`);
    
    // 4. Verificar todas las citas y sus estados
    console.log('\n4️⃣ RESUMEN GENERAL DE CITAS:');
    const resumenCitas = await db.query(`
      SELECT 
        COUNT(*) as total,
        estado,
        DATE(fecha) as fecha_cita
      FROM citas 
      GROUP BY estado, DATE(fecha)
      ORDER BY fecha_cita DESC, estado
    `);
    
    console.log('Todas las citas en la base de datos:');
    resumenCitas.rows.forEach(row => {
      console.log(`   ${row.fecha_cita}: ${row.estado} = ${row.total} citas`);
    });
    
    // 5. Verificar citas específicas con detalles
    console.log('\n5️⃣ DETALLES DE CITAS ESPECÍFICAS:');
    const citasDetalle = await db.query(`
      SELECT 
        id,
        fecha,
        hora,
        estado,
        motivo,
        (SELECT nombre || ' ' || apellido FROM usuarios WHERE id = paciente_id) as paciente,
        (SELECT nombre || ' ' || apellido FROM usuarios WHERE id = odontologo_id) as odontologo
      FROM citas 
      ORDER BY fecha DESC, hora ASC
      LIMIT 10
    `);
    
    console.log('Últimas 10 citas:');
    citasDetalle.rows.forEach(row => {
      console.log(`   ID ${row.id}: ${row.fecha} ${row.hora} - ${row.estado} - ${row.paciente} con ${row.odontologo}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarDatos();