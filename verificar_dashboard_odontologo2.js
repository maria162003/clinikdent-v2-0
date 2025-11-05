const db = require('./Backend/config/db');

async function verificarDashboard() {
  try {
    console.log('🔍 VERIFICANDO DATOS PARA DASHBOARD ODONTÓLOGO ID 2\n');
    
    // Usar el ID correcto del dashboard
    const userId = '2'; // ID del Dr. Carlos Rodriguez
    console.log('👨‍⚕️ ID Odontólogo:', userId);
    
    // Consulta exacta del dashboard: /api/citas/agenda/odontologo
    const citasQuery = await db.query(`
      SELECT c.*, 
             p.nombre as paciente_nombre, 
             p.apellido as paciente_apellido,
             p.telefono as paciente_telefono,  
             o.nombre as odontologo_nombre, 
             o.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id  
      WHERE c.odontologo_id = $1
      ORDER BY c.fecha ASC, c.hora ASC
    `, [userId]);
    
    const citas = citasQuery.rows;
    console.log('📊 Total citas del odontólogo ID 2:', citas.length);
    
    if (citas.length === 0) {
      console.log('❌ NO HAY CITAS PARA ESTE ODONTÓLOGO');
      return;
    }
    
    console.log('\n📋 DETALLES DE LAS CITAS:');
    citas.forEach(cita => {
      console.log(`   ID ${cita.id}: ${cita.fecha.toISOString().split('T')[0]} - ${cita.estado} - ${cita.paciente_nombre} ${cita.paciente_apellido}`);
    });
    
    // Calcular estadísticas como en el dashboard
    const hoy = new Date().toISOString().split('T')[0];
    console.log('\n📅 Fecha hoy:', hoy);
    
    const citasHoy = citas.filter(cita => cita.fecha.toISOString().split('T')[0] === hoy).length;
    const pacientesAtendidos = citas.filter(cita => cita.estado === 'completada').length;
    const citasPendientes = citas.filter(cita => cita.estado === 'programada' || cita.estado === 'confirmada').length;
    
    console.log('\n📊 ESTADÍSTICAS CALCULADAS:');
    console.log('🗓️ Citas Hoy:', citasHoy);
    console.log('👥 Pacientes Atendidos (Total):', pacientesAtendidos);
    console.log('⏳ Citas Pendientes:', citasPendientes);
    
    console.log('\n🔍 ESTADOS DE CITAS:');
    const estados = {};
    citas.forEach(cita => {
      estados[cita.estado] = (estados[cita.estado] || 0) + 1;
    });
    Object.keys(estados).forEach(estado => {
      console.log(`   ${estado}: ${estados[estado]}`);
    });
    
    // Verificar fechas exactas
    console.log('\n📅 FECHAS DE CITAS DETALLADAS:');
    citas.forEach(cita => {
      const fechaFormateada = cita.fecha.toISOString().split('T')[0];
      const esHoy = fechaFormateada === hoy;
      console.log(`   ID ${cita.id}: ${fechaFormateada} ${esHoy ? '(HOY)' : ''} - ${cita.estado}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarDashboard();