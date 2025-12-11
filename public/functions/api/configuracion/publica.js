// API: Configuración pública
import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar que existen las variables de entorno
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      throw new Error(`Missing env vars - URL: ${!!env.SUPABASE_URL}, KEY: ${!!env.SUPABASE_ANON_KEY}`);
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('configuracion_sistema')
      .select('*')
      .eq('es_publica', true);

    if (error) throw error;

    // Convertir array a objeto config
    const config = {};
    data?.forEach(item => {
      config[item.clave] = item.valor;
    });

    return new Response(JSON.stringify({
      success: true,
      data: config
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al cargar configuración',
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
