// Verificar correos exactos en la base de datos usando pg Pool
require('dotenv').config();
const { Pool } = require('pg');

// Usar la configuración de conexión de la app
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkEmailsInDatabase() {
    console.log('🔍 === VERIFICANDO CORREOS EN BASE DE DATOS ===');
    console.log('📡 Conectando a:', process.env.DB_HOST);
    
    try {
        // Obtener todos los usuarios con sus correos
        const result = await pool.query(`
            SELECT id, nombre, apellido, correo 
            FROM usuarios 
            ORDER BY id
        `);
        
        console.log('\n📋 Usuarios en la base de datos:');
        result.rows.forEach(user => {
            console.log(`   ID ${user.id}: ${user.nombre} ${user.apellido} - ${user.correo}`);
            
            if (user.correo === 'juan@gmail.com') {
                console.log(`   ✅ ENCONTRADO: juan@gmail.com corresponde a ID ${user.id} (${user.nombre} ${user.apellido})`);
            }
            
            if (user.nombre === 'Juan' && user.apellido === 'Pérez') {
                console.log(`   🎯 Juan Pérez encontrado con ID ${user.id} y correo: ${user.correo}`);
            }
        });
        
        // Verificar específicamente juan@gmail.com
        console.log('\n🔍 Verificando específicamente juan@gmail.com...');
        const juanResult = await pool.query(`
            SELECT * FROM usuarios WHERE correo = $1
        `, ['juan@gmail.com']);
        
        if (juanResult.rows.length === 0) {
            console.log('❌ No se encontró usuario con correo juan@gmail.com');
        } else {
            console.log('✅ Usuario encontrado para juan@gmail.com:');
            juanResult.rows.forEach(user => {
                console.log(`   ID: ${user.id}`);
                console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
                console.log(`   Correo: ${user.correo}`);
                console.log(`   Rol ID: ${user.rol_id}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error al consultar base de datos:', error);
    } finally {
        await pool.end();
    }
}

checkEmailsInDatabase();