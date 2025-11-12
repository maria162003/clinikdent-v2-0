const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function crearTablaPreferencias() {
    const client = await pool.connect();
    
    try {
        console.log('📋 Creando tabla usuarios_preferencias...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS usuarios_preferencias (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
                acepta_notificaciones BOOLEAN DEFAULT false,
                acepta_ofertas BOOLEAN DEFAULT false,
                canales_preferidos JSONB DEFAULT '[]'::jsonb,
                ip_consentimiento VARCHAR(50),
                user_agent TEXT,
                fecha_consentimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabla usuarios_preferencias creada exitosamente');
        
        // Crear índice para búsquedas rápidas
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_usuarios_preferencias_usuario_id 
            ON usuarios_preferencias(usuario_id)
        `);
        
        console.log('✅ Índice creado exitosamente');
        
        console.log('\n📊 Estructura de la tabla:');
        const { rows } = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'usuarios_preferencias'
            ORDER BY ordinal_position
        `);
        
        console.table(rows);
        
    } catch (error) {
        console.error('❌ Error creando tabla:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

crearTablaPreferencias();
