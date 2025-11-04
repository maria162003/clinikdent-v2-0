const db = require('./Backend/config/db');

async function debugCitas() {
    try {
        console.log('=== VERIFICANDO TABLA CITAS ===');
        
        // Verificar si la tabla existe
        const [tableInfo] = await db.query('DESCRIBE citas');
        console.log('✅ Tabla citas existe con columnas:');
        tableInfo.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
        });
        
        console.log('\n=== VERIFICANDO ODONTÓLOGOS ===');
        const [odontologos] = await db.query('SELECT id, nombre, apellido FROM usuarios WHERE rol_id = 2');
        console.log(`Found ${odontologos.length} odontólogos:`);
        odontologos.forEach(od => {
            console.log(`  - ID: ${od.id}, Nombre: ${od.nombre} ${od.apellido}`);
        });
        
        if (odontologos.length > 0) {
            console.log('\n=== PROBANDO INSERTAR CITA ===');
            const testData = {
                paciente_id: 6,
                odontologo_id: odontologos[0].id,
                fecha: '2025-09-05',
                hora: '10:00',
                estado: 'programada',
                motivo: 'Test desde debug'
            };
            
            console.log('Datos a insertar:', testData);
            
            const [result] = await db.query(
                'INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, estado, motivo) VALUES (?, ?, ?, ?, ?, ?)',
                [testData.paciente_id, testData.odontologo_id, testData.fecha, testData.hora, testData.estado, testData.motivo]
            );
            
            console.log('✅ Cita insertada exitosamente con ID:', result.insertId);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code) console.error('Código de error:', error.code);
        if (error.sqlState) console.error('SQL State:', error.sqlState);
    } finally {
        process.exit(0);
    }
}

debugCitas();
