const db = require('./Backend/config/db');

async function verificarYCrearDatos() {
    try {
        console.log('🔄 Verificando y creando datos base...');
        
        // Primero crear roles si no existen
        console.log('📋 Creando roles...');
        await db.query(`
            INSERT INTO roles (id, nombre) VALUES 
            (1, 'administrador'),
            (2, 'odontologo'),
            (3, 'paciente'),
            (4, 'auxiliar')
            ON CONFLICT (id) DO UPDATE SET 
            nombre = EXCLUDED.nombre
        `);
        
        // Crear usuarios base si no existen
        console.log('👥 Creando usuarios base...');
        await db.query(`
            INSERT INTO usuarios (id, nombre, apellido, correo, telefono, direccion, rol_id, activo, created_at) VALUES 
            (1, 'Admin', 'Principal', 'admin@clinikdent.com', '3001234567', 'Calle Principal 123', 1, true, CURRENT_TIMESTAMP),
            (2, 'Dr. Carlos', 'Rodriguez', 'carlos@clinikdent.com', '3001234568', 'Avenida Central 456', 2, true, CURRENT_TIMESTAMP),
            (3, 'María', 'González', 'maria@clinikdent.com', '3001234569', 'Calle Secundaria 789', 3, true, CURRENT_TIMESTAMP),
            (4, 'Juan', 'Pérez', 'juan@clinikdent.com', '3001234570', 'Avenida Norte 101', 3, true, CURRENT_TIMESTAMP),
            (5, 'Camila', 'Perez', 'camila@clinikdent.com', '3001234571', 'Calle Sur 202', 1, true, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            apellido = EXCLUDED.apellido,
            rol_id = EXCLUDED.rol_id,
            activo = EXCLUDED.activo
        `);
        
        // Insertar pagos del mes
        console.log('💰 Insertando pagos...');
        await db.query(`
            INSERT INTO pagos (paciente_id, monto, metodo_pago, referencia_pago, estado, fecha_pago, created_at) VALUES
            (3, 150000.00, 'tarjeta_credito', 'TXN001', 'completado', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
            (4, 200000.00, 'efectivo', 'EFE001', 'completado', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
            (3, 350000.00, 'transferencia', 'TRF001', 'completado', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
            (4, 120000.00, 'tarjeta_debito', 'DEB001', 'completado', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
            (3, 180000.00, 'efectivo', 'EFE002', 'completado', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
            (4, 250000.00, 'tarjeta_credito', 'TXN002', 'completado', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
            (3, 90000.00, 'efectivo', 'EFE003', 'completado', CURRENT_TIMESTAMP - INTERVAL '1 days', CURRENT_TIMESTAMP - INTERVAL '1 days'),
            (4, 300000.00, 'transferencia', 'TRF002', 'completado', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '12 days')
            ON CONFLICT DO NOTHING
        `);
        
        // Insertar citas
        console.log('📅 Insertando citas...');
        await db.query(`
            INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, motivo, estado, fecha_creacion) VALUES
            (3, 2, CURRENT_DATE, '10:00:00', 'Consulta general', 'confirmada', CURRENT_TIMESTAMP),
            (4, 2, CURRENT_DATE, '14:30:00', 'Limpieza dental', 'confirmada', CURRENT_TIMESTAMP),
            (3, 2, CURRENT_DATE, '16:00:00', 'Revisión', 'pendiente', CURRENT_TIMESTAMP),
            (4, 2, CURRENT_DATE + INTERVAL '1 day', '09:00:00', 'Endodoncia', 'confirmada', CURRENT_TIMESTAMP),
            (3, 2, CURRENT_DATE + INTERVAL '1 day', '11:30:00', 'Ortodoncia', 'confirmada', CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
        `);
        
        console.log('✅ Datos base creados correctamente');
        
        // Verificar estadísticas
        console.log('\n📊 Verificando estadísticas...');
        
        // Total pacientes
        const pacientes = await db.query(`
            SELECT COUNT(*) as total 
            FROM usuarios u 
            LEFT JOIN roles r ON u.rol_id = r.id 
            WHERE r.nombre = 'paciente'
        `);
        console.log(`👥 Total pacientes: ${pacientes.rows[0].total}`);
        
        // Citas de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const citasHoy = await db.query(`
            SELECT COUNT(*) as total 
            FROM citas 
            WHERE DATE(fecha) = $1
        `, [hoy]);
        console.log(`📅 Citas de hoy: ${citasHoy.rows[0].total}`);
        
        // Ingresos del mes
        const mesActual = new Date();
        const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
        const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
        
        const ingresos = await db.query(`
            SELECT COALESCE(SUM(monto), 0) as total 
            FROM pagos 
            WHERE fecha_pago >= $1 AND fecha_pago <= $2 
            AND estado = 'completado'
        `, [primerDiaMes, ultimoDiaMes]);
        console.log(`💰 Ingresos del mes: $${parseFloat(ingresos.rows[0].total).toLocaleString()}`);
        
        // Odontólogos activos
        const odontologos = await db.query(`
            SELECT COUNT(*) as total 
            FROM usuarios u 
            LEFT JOIN roles r ON u.rol_id = r.id 
            WHERE r.nombre = 'odontologo' 
            AND u.activo = true
        `);
        console.log(`👨‍⚕️ Odontólogos activos: ${odontologos.rows[0].total}`);
        
        console.log('\n✅ ¡Datos insertados correctamente! El dashboard debería mostrar estas estadísticas.');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

verificarYCrearDatos();