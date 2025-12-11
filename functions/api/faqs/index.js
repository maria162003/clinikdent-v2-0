// API: FAQs públicas
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
      .from('faqs')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      data: data || []
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al cargar FAQs',
      data: []
    }), {
      status: 200, // 200 para que el frontend use fallback
      headers: corsHeaders
    });
  }
}
