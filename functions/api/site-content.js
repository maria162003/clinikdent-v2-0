// API: Contenido del sitio (site-content)
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
      .from('site_content')
      .select('*')
      .eq('activo', true);

    if (error) throw error;

    // Organizar por secciones
    const content = {
      hero: {},
      servicios: [],
      testimonios: [],
      contacto: {}
    };

    data?.forEach(item => {
      if (item.seccion === 'hero') {
        content.hero = item.contenido;
      } else if (item.seccion === 'servicios') {
        content.servicios.push(item.contenido);
      } else if (item.seccion === 'testimonios') {
        content.testimonios.push(item.contenido);
      } else if (item.seccion === 'contacto') {
        content.contacto = item.contenido;
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: content
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Usando contenido estático',
      data: {
        hero: {},
        servicios: [],
        testimonios: [],
        contacto: {}
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}
