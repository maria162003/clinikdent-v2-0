// Endpoint de debugging para variables de entorno
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

  return new Response(JSON.stringify({
    success: true,
    env_keys: Object.keys(env || {}),
    has_supabase_url: !!env?.SUPABASE_URL,
    has_supabase_key: !!env?.SUPABASE_ANON_KEY,
    supabase_url_length: env?.SUPABASE_URL?.length || 0,
    supabase_key_length: env?.SUPABASE_ANON_KEY?.length || 0
  }), {
    status: 200,
    headers: corsHeaders
  });
}
