// Script simple para actualizar fechas de citas
const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'clinikdent'
    });
    
    console.log('🔗 Conectado a la base de datos');
    
    // Ver citas actuales
    const [citas] = await connection.execute(
        'SELECT id, paciente_id, fecha, hora, estado FROM citas WHERE paciente_id = 6'
    );
    
    console.log('📋 Citas actuales:');
    citas.forEach(c => console.log(`  ID: ${c.id} | ${c.fecha} ${c.hora} | ${c.estado}`));
    
    // Actualizar fechas
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    
    const semana = new Date();
    semana.setDate(semana.getDate() + 7);
    
    if (citas.length > 0) {
        await connection.execute(
            'UPDATE citas SET fecha = ?, hora = ? WHERE id = ?',
            [mañana.toISOString().split('T')[0], '10:30:00', citas[0].id]
        );
        console.log(`✅ Cita ${citas[0].id} -> ${mañana.toISOString().split('T')[0]} 10:30`);
    }
    
    if (citas.length > 1) {
        await connection.execute(
            'UPDATE citas SET fecha = ?, hora = ? WHERE id = ?',
            [semana.toISOString().split('T')[0], '14:00:00', citas[1].id]
        );
        console.log(`✅ Cita ${citas[1].id} -> ${semana.toISOString().split('T')[0]} 14:00`);
    }
    
    await connection.end();
    console.log('✅ Actualización completada');
}

main().catch(console.error);
