/**
 * Script para ejecutar la migración de columnas de reset_token
 * Ejecutar con: node Backend/scripts/migracion_reset_token.js
 */

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔄 Iniciando migración de columnas de recuperación de contraseña...\n');
    
    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'add_reset_token_columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Ejecutando script SQL...\n');
        
        // Ejecutar la migración
        const result = await db.query(sql);
        
        console.log('\n✅ Migración completada exitosamente');
        console.log('\n📋 Verificando columnas...');
        
        // Verificar que las columnas existan
        const { rows } = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'usuarios'
            AND column_name IN ('reset_token', 'reset_token_expiry')
            ORDER BY column_name
        `);
        
        if (rows.length > 0) {
            console.log('\n✅ Columnas encontradas:');
            rows.forEach(row => {
                console.log(`   - ${row.column_name}: ${row.data_type} (Nullable: ${row.is_nullable})`);
            });
        } else {
            console.log('\n⚠️ No se encontraron las columnas. Verifica la migración.');
        }
        
        console.log('\n🎉 Proceso completado');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        process.exit(1);
    }
}

// Ejecutar la migración
runMigration();
