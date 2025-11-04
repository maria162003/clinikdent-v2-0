// Script para insertar datos de prueba de transacciones MercadoPago
console.log('🧪 Insertando datos de prueba para MercadoPago...');

const db = require('./Backend/config/db');

async function insertarDatosPrueba() {
    try {
        // Insertar algunas transacciones de ejemplo para el usuario ID 3 (juan)
        const transacciones = [
            {
                preference_id: 'PREF_001_PRUEBA',
                external_reference: 'CITA_001',
                tipo: 'paciente',
                usuario_id: 3,
                monto: 150000,
                estado: 'pending',
                datos_pago: JSON.stringify({
                    description: 'Consulta de odontología general',
                    payer_email: 'juan@gmail.com',
                    created: new Date().toISOString()
                })
            },
            {
                preference_id: 'PREF_002_PRUEBA',
                external_reference: 'CITA_002',
                tipo: 'paciente',
                usuario_id: 3,
                monto: 200000,
                estado: 'approved',
                datos_pago: JSON.stringify({
                    description: 'Limpieza dental',
                    payer_email: 'juan@gmail.com',
                    payment_method: 'credit_card',
                    payment_id: 'MP001234',
                    created: new Date('2024-09-01').toISOString()
                })
            },
            {
                preference_id: 'PREF_003_PRUEBA',
                external_reference: 'CITA_003',
                tipo: 'paciente',
                usuario_id: 3,
                monto: 500000,
                estado: 'approved',
                datos_pago: JSON.stringify({
                    description: 'Tratamiento de conducto',
                    payer_email: 'juan@gmail.com',
                    payment_method: 'debit_card',
                    payment_id: 'MP001235',
                    created: new Date('2024-08-15').toISOString()
                })
            }
        ];

        for (const transaccion of transacciones) {
            await db.query(`
                INSERT INTO transacciones_mercadopago 
                (preference_id, external_reference, tipo, usuario_id, monto, estado, datos_pago)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (preference_id) DO NOTHING
            `, [
                transaccion.preference_id,
                transaccion.external_reference,
                transaccion.tipo,
                transaccion.usuario_id,
                transaccion.monto,
                transaccion.estado,
                transaccion.datos_pago
            ]);
        }

        console.log('✅ Datos de prueba insertados exitosamente');
        
        // Verificar los datos insertados
        const result = await db.query(
            'SELECT * FROM transacciones_mercadopago WHERE usuario_id = $1 ORDER BY fecha_creacion DESC',
            [3]
        );
        
        console.log(`📊 Total transacciones para usuario 3: ${result.rows.length}`);
        result.rows.forEach(row => {
            console.log(`   - ${row.preference_id}: $${row.monto} (${row.estado})`);
        });

    } catch (error) {
        console.error('❌ Error insertando datos de prueba:', error);
    }
    
    process.exit(0);
}

insertarDatosPrueba();
