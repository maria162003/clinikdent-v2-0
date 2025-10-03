const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

async function debugCitasPaciente() {
    try {
        console.log('🔍 Consultando citas del paciente ID 4...');
        
        const result = await pool.query(`
            SELECT 
                c.*,
                u.nombre as odontologo_nombre,
                u.apellido as odontologo_apellido
            FROM citas c
            LEFT JOIN usuarios u ON c.odontologo_id = u.id
            WHERE c.paciente_id = 4
            ORDER BY c.fecha DESC, c.hora DESC
        `);
        
        console.log('📋 Citas encontradas:', result.rows.length);
        result.rows.forEach((cita, index) => {
            console.log(`\n📅 Cita ${index + 1}:`);
            console.log(`   ID: ${cita.id}`);
            console.log(`   Fecha: ${cita.fecha}`);
            console.log(`   Hora: ${cita.hora}`);
            console.log(`   Estado: ${cita.estado}`);
            console.log(`   Odontologo ID: ${cita.odontologo_id}`);
            console.log(`   Odontologo Nombre: ${cita.odontologo_nombre}`);
            console.log(`   Odontologo Apellido: ${cita.odontologo_apellido}`);
        });
        
        // También vamos a verificar si existen odontólogos en la tabla usuarios
        console.log('\n🔍 Verificando odontólogos en la tabla usuarios...');
        const odontologos = await pool.query(`
            SELECT id, nombre, apellido, COALESCE(role, 'sin_rol') as role
            FROM usuarios 
            WHERE COALESCE(role, '') IN ('odontologo', 'admin', '')
            ORDER BY id
        `);
        
        console.log('👨‍⚕️ Odontólogos encontrados:', odontologos.rows.length);
        odontologos.rows.forEach(odontologo => {
            console.log(`   ID: ${odontologo.id}, Nombre: ${odontologo.nombre} ${odontologo.apellido}, Rol: ${odontologo.role}`);
        });
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

debugCitasPaciente();