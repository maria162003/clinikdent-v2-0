/**
 * Script para migrar usuarios existentes a Supabase Auth
 * ADVERTENCIA: Solo ejecutar UNA VEZ
 * Ejecutar con: node Backend/scripts/migrar_usuarios_a_supabase.js
 */

const db = require('../config/db');
const supabase = require('../config/supabase');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function pregunta(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function migrarUsuarios() {
    console.log('\n' + '='.repeat(70));
    console.log('🔄 MIGRACIÓN DE USUARIOS EXISTENTES A SUPABASE AUTH');
    console.log('='.repeat(70) + '\n');
    
    try {
        // Obtener usuarios sin supabase_user_id
        const { rows: usuarios } = await db.query(`
            SELECT id, nombre, apellido, correo, numero_documento
            FROM usuarios 
            WHERE supabase_user_id IS NULL
            AND correo IS NOT NULL
            ORDER BY id
        `);
        
        if (usuarios.length === 0) {
            console.log('✅ No hay usuarios pendientes de migrar');
            console.log('   Todos los usuarios ya tienen supabase_user_id\n');
            rl.close();
            process.exit(0);
        }
        
        console.log(`📊 Usuarios encontrados sin Supabase Auth: ${usuarios.length}\n`);
        
        // Mostrar lista de usuarios
        console.log('📋 Usuarios a migrar:');
        usuarios.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.nombre} ${user.apellido} (${user.correo})`);
        });
        
        console.log('\n⚠️  IMPORTANTE:');
        console.log('   - Se creará cada usuario en Supabase Auth');
        console.log('   - La contraseña temporal será: "ClinikDent2025!"');
        console.log('   - Los usuarios deberán cambiar su contraseña usando "Olvidé mi contraseña"');
        console.log('   - Esta operación NO se puede deshacer\n');
        
        const respuesta = await pregunta('¿Deseas continuar? (si/no): ');
        
        if (respuesta.toLowerCase() !== 'si' && respuesta.toLowerCase() !== 'sí') {
            console.log('\n❌ Operación cancelada por el usuario\n');
            rl.close();
            process.exit(0);
        }
        
        console.log('\n🚀 Iniciando migración...\n');
        
        let exitosos = 0;
        let fallidos = 0;
        const errores = [];
        
        for (const usuario of usuarios) {
            try {
                console.log(`   Procesando: ${usuario.correo}...`);
                
                // Crear usuario en Supabase Auth con contraseña temporal
                const { data: supabaseUser, error: supabaseError } = await supabase.auth.admin.createUser({
                    email: usuario.correo,
                    password: 'ClinikDent2025!', // Contraseña temporal
                    email_confirm: true,
                    user_metadata: {
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        numero_documento: usuario.numero_documento,
                        migrado: true,
                        fecha_migracion: new Date().toISOString()
                    }
                });
                
                if (supabaseError) {
                    throw new Error(supabaseError.message);
                }
                
                // Actualizar PostgreSQL con el supabase_user_id
                await db.query(
                    'UPDATE usuarios SET supabase_user_id = $1 WHERE id = $2',
                    [supabaseUser.user.id, usuario.id]
                );
                
                console.log(`   ✅ ${usuario.correo} - Migrado exitosamente`);
                exitosos++;
                
            } catch (error) {
                console.log(`   ❌ ${usuario.correo} - Error: ${error.message}`);
                fallidos++;
                errores.push({
                    usuario: usuario.correo,
                    error: error.message
                });
            }
        }
        
        // Resumen
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMEN DE MIGRACIÓN');
        console.log('='.repeat(70));
        console.log(`   Total usuarios:     ${usuarios.length}`);
        console.log(`   ✅ Exitosos:        ${exitosos}`);
        console.log(`   ❌ Fallidos:        ${fallidos}`);
        
        if (errores.length > 0) {
            console.log('\n❌ Errores encontrados:');
            errores.forEach(err => {
                console.log(`   - ${err.usuario}: ${err.error}`);
            });
        }
        
        console.log('\n📧 SIGUIENTE PASO:');
        console.log('   Notifica a los usuarios que deben:');
        console.log('   1. Ir a "Olvidé mi contraseña"');
        console.log('   2. Solicitar recuperación de contraseña');
        console.log('   3. Crear una nueva contraseña segura');
        console.log('\n✅ Migración completada\n');
        
        rl.close();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        rl.close();
        process.exit(1);
    }
}

// Ejecutar
migrarUsuarios();
