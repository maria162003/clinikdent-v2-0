const db = require('../Backend/config/db');

(async () => {
    try {
        const res = await db.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'catalogo_servicios' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estructura de la tabla catalogo_servicios:\n');
        console.table(res.rows);
        
        process.exit(0);
    } catch(e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
})();
