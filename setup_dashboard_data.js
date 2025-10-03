const db = require('./Backend/config/db');
const fs = require('fs');

async function insertarDatosDashboard() {
    try {
        console.log('🔄 Insertando datos de prueba para el dashboard...');
        
        // Leer el archivo SQL
        const sqlScript = fs.readFileSync('./insert_datos_dashboard.sql', 'utf8');
        
        // Ejecutar el script
        await db.query(sqlScript);
        
        console.log('✅ Datos de prueba insertados correctamente');
        
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
        
        console.log('\n✅ Verificación completada. El dashboard debería mostrar estos datos.');
        
    } catch (error) {
        console.error('❌ Error insertando datos:', error);
    } finally {
        process.exit(0);
    }
}

insertarDatosDashboard();