// Verificar correos exactos en la base de datos de Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Faltan variables de entorno de Supabase');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmailsInDatabase() {
    console.log('🔍 === VERIFICANDO CORREOS EN BASE DE DATOS ===');
    
    try {
        // Obtener todos los usuarios con sus correos
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('id, nombre, apellido, correo')
            .order('id');
            
        if (error) {
            console.error('❌ Error al consultar usuarios:', error);
            return;
        }
        
        console.log('\n📋 Usuarios en la base de datos:');
        usuarios.forEach(user => {
            console.log(`   ID ${user.id}: ${user.nombre} ${user.apellido} - ${user.correo}`);
            
            if (user.correo === 'juan@gmail.com') {
                console.log(`   ✅ ENCONTRADO: juan@gmail.com corresponde a ID ${user.id} (${user.nombre} ${user.apellido})`);
            }
            
            if (user.nombre === 'Juan' && user.apellido === 'Pérez') {
                console.log(`   🎯 Juan Pérez encontrado con ID ${user.id} y correo: ${user.correo}`);
            }
        });
        
        // Verificar específicamente juan@gmail.com
        console.log('\n🔍 Verificando específicamente juan@gmail.com...');
        const { data: juanUser, error: juanError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('correo', 'juan@gmail.com')
            .single();
            
        if (juanError) {
            console.log('❌ No se encontró usuario con correo juan@gmail.com:', juanError.message);
        } else {
            console.log('✅ Usuario encontrado para juan@gmail.com:', juanUser);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

checkEmailsInDatabase();