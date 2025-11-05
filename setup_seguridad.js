// Script para crear tablas de seguridad sin afectar funcionalidades existentes
const db = require('./Backend/config/db');
const fs = require('fs');

async function crearTablasSeguridad() {
    console.log('🔐 Iniciando creación de tablas de seguridad...');
    
    try {
        // Leer el archivo SQL
        const sqlContent = fs.readFileSync('./crear_sistema_seguridad_postgresql.sql', 'utf8');
        
        // Dividir en statements individuales y ejecutar uno por uno
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length > 0) {
                try {
                    console.log(`Ejecutando statement ${i + 1}/${statements.length}...`);
                    await db.query(statement + ';');
                    console.log(`✅ Statement ${i + 1} ejecutado exitosamente`);
                } catch (err) {
                    if (err.message.includes('already exists')) {
                        console.log(`⚠️ Statement ${i + 1}: ${err.message} (continuando...)`);
                    } else {
                        console.error(`❌ Error en statement ${i + 1}:`, err.message);
                        console.log('Statement:', statement.substring(0, 100) + '...');
                    }
                }
            }
        }
        
        console.log('🎉 Tablas de seguridad creadas exitosamente');
        
        // Verificar que las tablas se crearon
        const tablas = [
            'intentos_login',
            'bloqueos_seguridad', 
            'codigos_seguridad',
            'configuracion_seguridad'
        ];
        
        for (const tabla of tablas) {
            try {
                const result = await db.query(`SELECT COUNT(*) FROM ${tabla}`);
                console.log(`✅ Tabla ${tabla}: ${result.rows[0].count} registros`);
            } catch (err) {
                console.error(`❌ Error verificando tabla ${tabla}:`, err.message);
            }
        }
        
    } catch (err) {
        console.error('❌ Error general:', err);
    } finally {
        process.exit(0);
    }
}

crearTablasSeguridad();