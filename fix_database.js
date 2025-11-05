const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: false
});

async function fixDatabase() {
    try {
        console.log('🔧 Conectando a la base de datos...');
        
        // Leer el script SQL
        const sqlScript = fs.readFileSync('./fix_citas_estado.sql', 'utf8');
        
        console.log('📝 Ejecutando script de reparación...');
        const result = await pool.query(sqlScript);
        
        console.log('✅ Script ejecutado exitosamente');
        console.log('📊 Verificando estructura de la tabla citas...');
        
        // Verificar las columnas de la tabla citas
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'citas' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Columnas en la tabla citas:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Verificar datos de ejemplo
        const citasCount = await pool.query('SELECT COUNT(*) FROM citas');
        console.log(`📅 Total de citas en la base de datos: ${citasCount.rows[0].count}`);
        
        if (citasCount.rows[0].count > 0) {
            const sampleCitas = await pool.query('SELECT id, paciente_id, fecha, estado FROM citas LIMIT 3');
            console.log('📋 Ejemplo de citas:');
            sampleCitas.rows.forEach(cita => {
                console.log(`  - ID: ${cita.id}, Paciente: ${cita.paciente_id}, Fecha: ${cita.fecha}, Estado: ${cita.estado}`);
            });
        }
        
        console.log('✅ Base de datos reparada correctamente');
        
    } catch (error) {
        console.error('❌ Error reparando la base de datos:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔒 Conexión cerrada');
    }
}

fixDatabase();