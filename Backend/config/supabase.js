const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error(' Faltan credenciales de Supabase en .env');
    throw new Error('Configuración de Supabase incompleta');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
    }
});

console.log(' Cliente de Supabase Auth inicializado correctamente');

module.exports = supabase;
