require('dotenv').config();
const db = require('./Backend/config/db');

async function checkTableStructure() {
    try {
        console.log('🔍 Verificando estructura de la tabla usuarios...');
        
        const query = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position
        `;
        
        const result = await db.query(query);
        
        console.log('\n📋 Estructura de la tabla usuarios:');
        console.log('=====================================');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Verificar registros existentes usando los campos correctos
        console.log('\n🔍 Verificando registros existentes...');
        const users = await db.query('SELECT id, nombre, apellido, correo, rol_id FROM usuarios LIMIT 3');
        console.log('Usuarios existentes:', users.rows);
        
        // Verificar si existe la tabla roles
        console.log('\n🔍 Verificando tabla roles...');
        try {
            const roles = await db.query('SELECT * FROM roles LIMIT 5');
            console.log('Roles existentes:', roles.rows);
        } catch (err) {
            console.log('❌ Error al consultar roles:', err.message);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al verificar estructura:', error);
        process.exit(1);
    }
}

checkTableStructure();
