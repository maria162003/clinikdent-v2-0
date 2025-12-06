/**
 * ============================================================================
 * SERVICIO DE SUPABASE - Cliente Singleton
 * Configuración e inicialización del cliente de Supabase para la app móvil
 * ============================================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Obtener credenciales desde variables de entorno
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validar que las credenciales estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Credenciales de Supabase no configuradas');
  console.error('   Asegúrese de tener EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env');
}

// Crear cliente Supabase singleton
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Exportar funciones de utilidad para autenticación
export const auth = supabase.auth;

// Verificar conexión al iniciar
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.warn('⚠️ No hay sesión activa:', error.message);
  } else {
    console.log('✅ Cliente Supabase inicializado correctamente');
  }
});

export default supabase;
