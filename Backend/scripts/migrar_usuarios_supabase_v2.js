/**
 * Script V2 - Migración masiva de usuarios a Supabase Auth
 * Usa Service Role Key para crear usuarios con permisos de admin
 * Ejecutar: node Backend/scripts/migrar_usuarios_supabase_v2.js
 */

require('dotenv').config();
const db = require('../config/db');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validaciones iniciales
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ ERROR: Configuración incompleta\n');
    
    if (!supabaseUrl) {
        console.log('Falta: SUPABASE_URL en .env');
    }
    
    if (!supabaseServiceKey) {
        console.log('Falta: SUPABASE_SERVICE_ROLE_KEY en .env');
        console.log('\n📋 Para obtener el Service Role Key:');
        console.log('1. Ve a: https://supabase.com/dashboard/project/xzlugnkzfdurczwwwimv/settings/api');
        console.log('2. Copia el "service_role" key (secret)');
        console.log('3. Agrégalo al .env como:');
        console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n');
    }
    
    process.exit(1);
}

// Cliente Supabase Admin (con permisos elevados)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('✅ Supabase Admin Client configurado correctamente\n');

async function verificarColumnaSupabaseId() {
    const { rows } = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'supabase_user_id'
    `);
    
    if (rows.length === 0) {
        console.log('📝 Agregando columna supabase_user_id a la tabla usuarios...');
        await db.query(`ALTER TABLE usuarios ADD COLUMN supabase_user_id UUID`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_supabase_user_id ON usuarios(supabase_user_id)`);
        console.log('✅ Columna agregada\n');
    }
}

async function obtenerUsuariosDeSupabase() {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        
        if (error) {
            console.error('❌ Error al listar usuarios de Supabase:', error);
            return [];
        }
        
        return data.users || [];
    } catch (error) {
        console.error('❌ Error al conectar con Supabase:', error.message);
        return [];
    }
}

async function migrarUsuario(usuario, usuariosSupabase) {
    const { id, nombre, apellido, correo, numero_documento } = usuario;
    
    console.log(`\n🔄 Procesando: ${correo} (ID PostgreSQL: ${id})`);
    
    try {
        // Verificar si ya existe en Supabase por email
        const existeEnSupabase = usuariosSupabase.find(u => u.email === correo);
        
        if (existeEnSupabase) {
            console.log(`   ℹ️  Ya existe en Supabase Auth (${existeEnSupabase.id})`);
            
            // Actualizar PostgreSQL con el supabase_user_id
            await db.query(
                'UPDATE usuarios SET supabase_user_id = $1 WHERE id = $2',
                [existeEnSupabase.id, id]
            );
            
            console.log(`   ✅ Vinculado en PostgreSQL`);
            return { status: 'ya_existe', supabase_id: existeEnSupabase.id };
        }
        
        // Generar contraseña temporal fuerte
        const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 4).toUpperCase()}!`;
        
        // Crear usuario en Supabase Auth
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: correo,
            password: tempPassword,
            email_confirm: true, // Auto-confirmar email
            user_metadata: {
                nombre: nombre || '',
                apellido: apellido || '',
                numero_documento: numero_documento || '',
                nombre_completo: `${nombre || ''} ${apellido || ''}`.trim(),
                migrado_desde_postgres: true,
                fecha_migracion: new Date().toISOString(),
                postgres_id: id
            }
        });
        
        if (error) {
            console.error(`   ❌ Error de Supabase:`, error.message);
            return { status: 'error', error: error.message };
        }
        
        console.log(`   ✅ Creado en Supabase Auth (${data.user.id})`);
        
        // Actualizar PostgreSQL con supabase_user_id
        await db.query(
            'UPDATE usuarios SET supabase_user_id = $1 WHERE id = $2',
            [data.user.id, id]
        );
        
        console.log(`   ✅ Vinculado en PostgreSQL`);
        console.log(`   🔑 Contraseña temporal: ${tempPassword}`);
        
        return { 
            status: 'creado', 
            supabase_id: data.user.id, 
            temp_password: tempPassword 
        };
        
    } catch (error) {
        console.error(`   ❌ Error inesperado:`, error.message);
        return { status: 'error', error: error.message };
    }
}

async function migrarTodos() {
    console.log('='.repeat(70));
    console.log('🚀 MIGRACIÓN MASIVA DE USUARIOS A SUPABASE AUTH');
    console.log('='.repeat(70) + '\n');
    
    try {
        // Verificar/crear columna
        await verificarColumnaSupabaseId();
        
        // Obtener usuarios de PostgreSQL sin supabase_user_id
        const { rows: usuarios } = await db.query(`
            SELECT id, nombre, apellido, correo, numero_documento
            FROM usuarios
            WHERE correo IS NOT NULL
            ORDER BY id
        `);
        
        if (usuarios.length === 0) {
            console.log('ℹ️  No hay usuarios para migrar\n');
            process.exit(0);
        }
        
        console.log(`📊 Encontrados ${usuarios.length} usuarios en PostgreSQL\n`);
        
        // Obtener usuarios existentes en Supabase
        console.log('🔍 Verificando usuarios existentes en Supabase...');
        const usuariosSupabase = await obtenerUsuariosDeSupabase();
        console.log(`✅ ${usuariosSupabase.length} usuarios ya en Supabase Auth\n`);
        
        // Estadísticas
        let creados = 0;
        let yaExistian = 0;
        let errores = 0;
        const passwordsTemporales = [];
        
        // Migrar cada usuario
        for (const usuario of usuarios) {
            const resultado = await migrarUsuario(usuario, usuariosSupabase);
            
            if (resultado.status === 'creado') {
                creados++;
                passwordsTemporales.push({
                    correo: usuario.correo,
                    password: resultado.temp_password,
                    nombre: `${usuario.nombre} ${usuario.apellido}`
                });
            } else if (resultado.status === 'ya_existe') {
                yaExistian++;
            } else if (resultado.status === 'error') {
                errores++;
            }
            
            // Pausa para no saturar la API de Supabase
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Resumen
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMEN DE MIGRACIÓN');
        console.log('='.repeat(70));
        console.log(`✅ Usuarios creados en Supabase:    ${creados}`);
        console.log(`ℹ️  Usuarios que ya existían:        ${yaExistian}`);
        console.log(`❌ Errores:                          ${errores}`);
        console.log(`📋 Total procesados:                 ${usuarios.length}`);
        console.log('='.repeat(70) + '\n');
        
        // Mostrar contraseñas temporales
        if (passwordsTemporales.length > 0) {
            console.log('🔑 CONTRASEÑAS TEMPORALES (Usuarios nuevos):\n');
            passwordsTemporales.forEach(({ correo, password, nombre }) => {
                console.log(`   ${nombre}`);
                console.log(`   📧 ${correo}`);
                console.log(`   🔑 ${password}\n`);
            });
            
            console.log('⚠️  IMPORTANTE:');
            console.log('Guarda estas contraseñas o envía emails de recuperación a los usuarios.');
            console.log('Las contraseñas NO se volverán a mostrar.\n');
            console.log('💡 Para enviar emails de recuperación masivos:');
            console.log('   node Backend/scripts/enviar_emails_reseteo.js\n');
        }
        
        console.log('🎉 Migración completada\n');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    }
}

// Ejecutar migración
migrarTodos();
