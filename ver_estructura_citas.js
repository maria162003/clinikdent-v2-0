const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

async function verEstructuraCitas() {
    try {
        console.log('🔍 Consultando estructura de la tabla citas...');
        
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'citas'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Columnas de la tabla citas:');
        result.rows.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error);
        await pool.end();
    }
}

verEstructuraCitas();