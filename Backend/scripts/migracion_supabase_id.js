/**
 * Script para agregar columna supabase_user_id
 * Ejecutar con: node Backend/scripts/migracion_supabase_id.js
 */

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔄 Iniciando migración de supabase_user_id...\n');
    
    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'add_supabase_user_id.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Ejecutando script SQL...\n');
        
        // Ejecutar la migración
        await db.query(sql);
        
        console.log('\n✅ Migración completada exitosamente');
        console.log('\n📋 Verificando columna...');
        
        // Verificar que la columna exista
        const { rows } = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'usuarios'
            AND column_name = 'supabase_user_id'
        `);
        
        if (rows.length > 0) {
            console.log('\n✅ Columna encontrada:');
            rows.forEach(row => {
                console.log(`   - ${row.column_name}: ${row.data_type} (Nullable: ${row.is_nullable})`);
            });
        } else {
            console.log('\n⚠️ No se encontró la columna. Verifica la migración.');
        }
        
        console.log('\n🎉 Proceso completado - Ahora los nuevos usuarios se registrarán en Supabase Auth');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        process.exit(1);
    }
}

// Ejecutar la migración
runMigration();
