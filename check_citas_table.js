const pool = require('./Backend/config/db');

async function checkCitasTable() {
    try {
        console.log('🔍 Verificando estructura de tabla citas...');
        
        // Ver las columnas de la tabla citas
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'citas' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Columnas en tabla citas:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
        });
        
        // Ver algunos ejemplos de citas
        const citas = await pool.query('SELECT * FROM citas LIMIT 3');
        console.log('\n📅 Ejemplos de citas:', citas.rows);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

checkCitasTable();