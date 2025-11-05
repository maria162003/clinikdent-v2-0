const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

async function agregarCitasFuturas() {
    try {
        console.log('📅 Agregando citas futuras para el paciente ID 4...');
        
        // Cita 1: Mañana (Sep 15)
        await pool.query(`
            INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, estado, motivo, notas)
            VALUES (4, 2, '2025-09-15', '10:00:00', 'confirmada', 'Consulta de control', 'Control post-tratamiento')
        `);
        console.log('✅ Cita 1 agregada: Sep 15, 10:00 AM');
        
        // Cita 2: Pasado mañana (Sep 16)
        await pool.query(`
            INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, estado, motivo, notas)
            VALUES (4, 2, '2025-09-16', '15:30:00', 'confirmada', 'Limpieza dental', 'Profilaxis programada')
        `);
        console.log('✅ Cita 2 agregada: Sep 16, 3:30 PM');
        
        // Cita 3: Próxima semana (Sep 20)
        await pool.query(`
            INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, estado, motivo, notas)
            VALUES (4, 2, '2025-09-20', '09:00:00', 'pendiente', 'Revisión general', 'Chequeo mensual')
        `);
        console.log('✅ Cita 3 agregada: Sep 20, 9:00 AM');
        
        // Verificar las citas
        console.log('\n🔍 Verificando todas las citas del paciente...');
        const result = await pool.query(`
            SELECT 
                c.*,
                u.nombre as odontologo_nombre,
                u.apellido as odontologo_apellido
            FROM citas c
            LEFT JOIN usuarios u ON c.odontologo_id = u.id
            WHERE c.paciente_id = 4
            ORDER BY c.fecha ASC, c.hora ASC
        `);
        
        console.log(`📋 Total de citas: ${result.rows.length}`);
        const now = new Date('2025-09-14T10:58:00-05:00');
        console.log(`🕐 Fecha actual de referencia: ${now.toISOString()}`);
        
        let futuras = 0;
        let pasadas = 0;
        
        result.rows.forEach((cita, index) => {
            const fechaCita = new Date(`${cita.fecha.toISOString().split('T')[0]}T${cita.hora}-05:00`);
            const esFutura = fechaCita > now;
            
            if (esFutura) futuras++;
            else pasadas++;
            
            console.log(`\n📅 Cita ${index + 1}: ${esFutura ? '🔮 FUTURA' : '📚 PASADA'}`);
            console.log(`   Fecha: ${cita.fecha.toDateString()} ${cita.hora}`);
            console.log(`   Estado: ${cita.estado}`);
            console.log(`   Odontólogo: ${cita.odontologo_nombre} ${cita.odontologo_apellido}`);
            console.log(`   Servicio: ${cita.motivo}`);
        });
        
        console.log(`\n📊 Resumen:`);
        console.log(`   🔮 Citas futuras: ${futuras}`);
        console.log(`   📚 Citas pasadas: ${pasadas}`);
        
        await pool.end();
        console.log('\n✅ ¡Citas futuras agregadas exitosamente!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

agregarCitasFuturas();