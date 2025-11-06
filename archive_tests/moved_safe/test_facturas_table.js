const pool = require('./Backend/config/db');

async function testFacturasTable() {
    try {
        console.log('🔍 Verificando tabla facturas...');
        
        // Verificar si la tabla existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'facturas'
            );
        `);
        
        console.log('¿Tabla facturas existe?', tableCheck.rows[0].exists);
        
        if (tableCheck.rows[0].exists) {
            // Contar registros
            const countResult = await pool.query('SELECT COUNT(*) as total FROM facturas');
            console.log('📊 Total de facturas:', countResult.rows[0].total);
            
            // Mostrar algunas facturas si existen
            if (parseInt(countResult.rows[0].total) > 0) {
                const facturas = await pool.query('SELECT * FROM facturas LIMIT 5');
                console.log('📋 Facturas encontradas:', facturas.rows);
            } else {
                console.log('⚠️ No hay facturas registradas en la tabla');
                
                // Insertar datos de prueba
                console.log('📝 Insertando datos de prueba...');
                await pool.query(`
                    INSERT INTO facturas (numero_factura, paciente_id, odontologo_id, subtotal, impuestos, total, estado, fecha_emision, fecha_vencimiento, observaciones)
                    VALUES 
                    ('FAC-001', 1, 1, 100.00, 19.00, 119.00, 'pendiente', NOW(), NOW() + INTERVAL '30 days', 'Consulta dental general'),
                    ('FAC-002', 2, 1, 200.00, 38.00, 238.00, 'pagada', NOW(), NOW() + INTERVAL '30 days', 'Tratamiento de ortodoncia')
                `);
                
                console.log('✅ Datos de prueba insertados');
                
                // Verificar inserción
                const newCount = await pool.query('SELECT COUNT(*) as total FROM facturas');
                console.log('📊 Total de facturas después de insertar:', newCount.rows[0].total);
            }
        } else {
            console.log('❌ La tabla facturas no existe. Ejecutar el script de esquema primero.');
        }
        
    } catch (error) {
        console.error('❌ Error al verificar tabla facturas:', error);
    } finally {
        process.exit(0);
    }
}

testFacturasTable();