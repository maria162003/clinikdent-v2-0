const db = require('../Backend/config/db');

(async () => {
    try {
        console.log('🔍 Consultando facturas del paciente 3...\n');
        
        const { rows: facturas } = await db.query(`
            SELECT 
                id, 
                numero_factura, 
                paciente_id, 
                cita_id, 
                total, 
                estado, 
                fecha_emision, 
                es_demo,
                servicios
            FROM facturas 
            WHERE paciente_id = 3 AND es_demo = true 
            ORDER BY fecha_emision DESC
        `);
        
        console.log(`📋 Total de facturas encontradas: ${facturas.length}\n`);
        
        if (facturas.length > 0) {
            console.table(facturas.map(f => ({
                ID: f.id,
                Numero: f.numero_factura,
                'Cita ID': f.cita_id,
                Total: f.total,
                Estado: f.estado,
                Fecha: new Date(f.fecha_emision).toLocaleDateString('es-CO'),
                Demo: f.es_demo ? 'Sí' : 'No'
            })));
            
            console.log('\n📄 Detalle de servicios por factura:');
            facturas.forEach(f => {
                console.log(`\n${f.numero_factura}:`);
                if (f.servicios && Array.isArray(f.servicios)) {
                    f.servicios.forEach(s => {
                        console.log(`  - ${s.nombre} x${s.cantidad}: $${s.subtotal}`);
                    });
                } else {
                    console.log('  Sin servicios registrados');
                }
            });
        } else {
            console.log('⚠️ No se encontraron facturas para este paciente');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
