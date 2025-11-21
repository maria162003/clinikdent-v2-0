/**
 * Script para crear la tabla de notificaciones de citas
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const crearTabla = async () => {
    console.log('🔄 Creando tabla notificaciones_citas...');
    
    try {
        await pool.query(`
            -- Crear tabla si no existe
            CREATE TABLE IF NOT EXISTS notificaciones_citas (
                id SERIAL PRIMARY KEY,
                cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
                tipo VARCHAR(50) NOT NULL, -- 'confirmacion', 'recordatorio', 'cancelacion'
                enviado BOOLEAN DEFAULT FALSE,
                fecha_envio TIMESTAMP DEFAULT NOW(),
                detalles JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT unique_notificacion UNIQUE(cita_id, tipo)
            );
        `);
        
        console.log('✅ Tabla creada exitosamente');
        
        // Crear índices
        console.log('🔄 Creando índices...');
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_cita_id ON notificaciones_citas(cita_id);
            CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_tipo ON notificaciones_citas(tipo);
            CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_enviado ON notificaciones_citas(enviado);
            CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_fecha_envio ON notificaciones_citas(fecha_envio);
        `);
        
        console.log('✅ Índices creados exitosamente');
        
        // Verificar estructura
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'notificaciones_citas'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n📋 Estructura de la tabla:');
        console.table(result.rows);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando tabla:', error);
        process.exit(1);
    }
};

crearTabla();
