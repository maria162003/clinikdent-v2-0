// Script simplificado para crear tablas de seguridad
const db = require('./Backend/config/db');

async function crearTablasSeguridad() {
    console.log('🔐 Creando sistema de seguridad sin afectar funcionalidades existentes...');
    
    try {
        // 1. Tabla de intentos de login
        console.log('📋 Creando tabla intentos_login...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS intentos_login (
                id SERIAL PRIMARY KEY,
                email_intento VARCHAR(255) NOT NULL,
                numero_documento VARCHAR(50),
                ip_origen VARCHAR(45) NOT NULL,
                user_agent TEXT,
                resultado VARCHAR(50) NOT NULL,
                timestamp_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                detalles_adicionales JSONB
            )
        `);
        console.log('✅ Tabla intentos_login creada');
        
        // 2. Tabla de bloqueos de seguridad
        console.log('📋 Creando tabla bloqueos_seguridad...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS bloqueos_seguridad (
                id SERIAL PRIMARY KEY,
                tipo_bloqueo VARCHAR(20) NOT NULL,
                valor_bloqueado VARCHAR(255) NOT NULL,
                razon_bloqueo VARCHAR(255) NOT NULL,
                fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_expiracion TIMESTAMP NULL,
                estado VARCHAR(20) DEFAULT 'activo',
                intentos_automaticos INT DEFAULT 0
            )
        `);
        console.log('✅ Tabla bloqueos_seguridad creada');
        
        // 3. Tabla de códigos de seguridad
        console.log('📋 Creando tabla codigos_seguridad...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS codigos_seguridad (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                numero_documento VARCHAR(50),
                codigo VARCHAR(10) NOT NULL,
                tipo_codigo VARCHAR(30) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_expiracion TIMESTAMP NOT NULL,
                intentos_usados INT DEFAULT 0,
                max_intentos INT DEFAULT 3,
                usado BOOLEAN DEFAULT FALSE,
                ip_origen VARCHAR(45)
            )
        `);
        console.log('✅ Tabla codigos_seguridad creada');
        
        // 4. Tabla de configuración
        console.log('📋 Creando tabla configuracion_seguridad...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS configuracion_seguridad (
                id SERIAL PRIMARY KEY,
                parametro VARCHAR(100) NOT NULL UNIQUE,
                valor TEXT NOT NULL,
                descripcion TEXT,
                categoria VARCHAR(50) DEFAULT 'general',
                activo BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('✅ Tabla configuracion_seguridad creada');
        
        // 5. Insertar configuración inicial
        console.log('📋 Insertando configuración inicial...');
        const configs = [
            ['max_intentos_login', '3', 'Máximo número de intentos de login antes de bloquear'],
            ['tiempo_bloqueo_minutos', '15', 'Tiempo de bloqueo automático en minutos'],
            ['duracion_codigo_seguridad_minutos', '5', 'Duración en minutos de los códigos de seguridad'],
            ['max_intentos_codigo', '3', 'Máximo número de intentos para validar código de seguridad']
        ];
        
        for (const [parametro, valor, descripcion] of configs) {
            await db.query(`
                INSERT INTO configuracion_seguridad (parametro, valor, descripcion) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (parametro) DO NOTHING
            `, [parametro, valor, descripcion]);
        }
        console.log('✅ Configuración inicial insertada');
        
        // Verificar que todo se creó correctamente
        const tablas = ['intentos_login', 'bloqueos_seguridad', 'codigos_seguridad', 'configuracion_seguridad'];
        for (const tabla of tablas) {
            const result = await db.query(`SELECT COUNT(*) FROM ${tabla}`);
            console.log(`✅ Tabla ${tabla}: ${result.rows[0].count} registros`);
        }
        
        console.log('🎉 Sistema de seguridad creado exitosamente sin afectar funcionalidades existentes');
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    
    console.log('Cerrando conexión...');
    setTimeout(() => process.exit(0), 1000);
}

crearTablasSeguridad();