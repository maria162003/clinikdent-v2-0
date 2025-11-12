const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Intento inicial: cargar .env desde el CWD (donde se ejecuta node app.js)
require('dotenv').config();

// Si faltan variables, intentar cargar explícitamente el .env del proyecto anidado
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const nestedEnvPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(nestedEnvPath)) {
        require('dotenv').config({ path: nestedEnvPath });
        console.log(`🔄 Variables re-cargadas desde fallback: ${nestedEnvPath}`);
    } else {
        console.warn('⚠️ No se encontró .env en ruta fallback:', nestedEnvPath);
    }
}

const supabaseUrl = process.env.SUPABASE_URL;
// Preferir Service Role; si falta usar anon para evitar romper toda la app (operaciones admin fallarán explícitamente)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan credenciales de Supabase (SUPABASE_URL o SERVICE_ROLE/ANON) tras intentos de carga');
    console.error('   Necesitas: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o al menos SUPABASE_ANON_KEY)');
    throw new Error('Configuración de Supabase incompleta');
}

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
    }
});

console.log(`✅ Cliente de Supabase inicializado. Modo clave: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'}`);

module.exports = supabase;
