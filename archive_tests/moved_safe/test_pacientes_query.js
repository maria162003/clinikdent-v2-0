const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

async function testPacientesQuery() {
    try {
        console.log('🧪 Probando query de pacientes del odontólogo ID 2...');
        
        const query = `
          SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.correo,
            u.telefono,
            u.fecha_nacimiento,
            u.direccion,
            u.created_at,
            CASE WHEN u.activo THEN 'Activo' ELSE 'Inactivo' END as estado,
            COALESCE(COUNT(c.id), 0) as total_citas,
            MAX(c.fecha) as ultima_cita,
            COALESCE(SUM(CASE WHEN c.estado IN ('programada', 'confirmada') THEN 1 ELSE 0 END), 0) as citas_pendientes
          FROM usuarios u
          LEFT JOIN roles r ON u.rol_id = r.id
          LEFT JOIN citas c ON u.id = c.paciente_id AND c.odontologo_id = $1
          WHERE r.nombre = 'paciente'
          GROUP BY u.id, u.nombre, u.apellido, u.correo, u.telefono, u.fecha_nacimiento, u.direccion, u.activo, u.created_at
          ORDER BY COALESCE(MAX(c.fecha), u.created_at) DESC NULLS LAST
          LIMIT 50
        `;
        
        const result = await pool.query(query, [2]);
        
        console.log('✅ Query ejecutado exitosamente');
        console.log(`📋 Pacientes encontrados: ${result.rows.length}`);
        
        result.rows.forEach((paciente, index) => {
            console.log(`\n👤 Paciente ${index + 1}:`);
            console.log(`   ID: ${paciente.id}`);
            console.log(`   Nombre: ${paciente.nombre} ${paciente.apellido}`);
            console.log(`   Correo: ${paciente.correo}`);
            console.log(`   Total citas: ${paciente.total_citas}`);
            console.log(`   Última cita: ${paciente.ultima_cita}`);
            console.log(`   Citas pendientes: ${paciente.citas_pendientes}`);
        });
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

testPacientesQuery();