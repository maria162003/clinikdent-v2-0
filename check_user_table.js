const pool = require('./Backend/config/db');

async function checkUserTable() {
    try {
        console.log('🔍 Verificando estructura de tabla usuarios...');
        
        // Ver las columnas de la tabla usuarios
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Columnas en tabla usuarios:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
        });
        
        // Ver algunos usuarios de ejemplo
        const usuarios = await pool.query('SELECT * FROM usuarios LIMIT 3');
        console.log('\n👤 Usuarios de ejemplo:', usuarios.rows);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

checkUserTable();