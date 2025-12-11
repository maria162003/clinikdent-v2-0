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
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('configuracion_sistema')
      .select('clave, valor');

    if (error) throw error;

    // Convertir array a objeto config (solo las claves públicas)
    const config = {};
    const publicKeys = ['nombre_clinica', 'telefono', 'email', 'direccion', 'horario_atencion'];
    
    data?.forEach(item => {
      if (publicKeys.includes(item.clave)) {
        config[item.clave] = item.valor;
      }
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
