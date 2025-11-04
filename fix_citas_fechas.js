const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'clinikdent'
};

async function updateCitasFuturas() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        console.log('🔗 Conectado a la base de datos');
        
        // Primero, verificar las citas actuales del paciente Juan Lopez (ID: 6)
        const [citasActuales] = await connection.execute(
            'SELECT id, paciente_id, fecha, hora, estado FROM citas WHERE paciente_id = 6'
        );
        
        console.log('📋 Citas actuales de Juan Lopez (ID: 6):');
        citasActuales.forEach((cita, index) => {
            console.log(`  ${index + 1}. ID: ${cita.id} | Fecha: ${cita.fecha} | Hora: ${cita.hora} | Estado: ${cita.estado}`);
        });
        
        if (citasActuales.length === 0) {
            console.log('❌ No se encontraron citas para el paciente');
            return;
        }
        
        // Actualizar algunas citas a fechas futuras
        const fechaHoy = new Date();
        const mañana = new Date(fechaHoy);
        mañana.setDate(fechaHoy.getDate() + 1);
        
        const proximaSemana = new Date(fechaHoy);
        proximaSemana.setDate(fechaHoy.getDate() + 7);
        
        // Actualizar la primera cita para mañana
        if (citasActuales.length > 0) {
            await connection.execute(
                'UPDATE citas SET fecha = ?, hora = ? WHERE id = ?',
                [mañana.toISOString().split('T')[0], '10:30:00', citasActuales[0].id]
            );
            console.log(`✅ Cita ${citasActuales[0].id} actualizada para mañana ${mañana.toISOString().split('T')[0]} a las 10:30`);
        }
        
        // Actualizar la segunda cita para la próxima semana
        if (citasActuales.length > 1) {
            await connection.execute(
                'UPDATE citas SET fecha = ?, hora = ? WHERE id = ?',
                [proximaSemana.toISOString().split('T')[0], '14:00:00', citasActuales[1].id]
            );
            console.log(`✅ Cita ${citasActuales[1].id} actualizada para la próxima semana ${proximaSemana.toISOString().split('T')[0]} a las 14:00`);
        }
        
        // Verificar las citas actualizadas
        const [citasActualizadas] = await connection.execute(
            'SELECT id, paciente_id, fecha, hora, estado FROM citas WHERE paciente_id = 6'
        );
        
        console.log('\n📋 Citas después de actualizar:');
        citasActualizadas.forEach((cita, index) => {
            console.log(`  ${index + 1}. ID: ${cita.id} | Fecha: ${cita.fecha} | Hora: ${cita.hora} | Estado: ${cita.estado}`);
        });
        
        await connection.end();
        console.log('✅ Citas actualizadas exitosamente');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updateCitasFuturas();
