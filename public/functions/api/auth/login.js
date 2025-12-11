// Cloudflare Pages Function - Login
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { correo, password } = body;

    if (!correo || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email y contraseña son requeridos'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Conectar a Supabase
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    // Buscar usuario
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .single();

    if (error || !usuarios) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuarios.password);

    if (!passwordMatch) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Verificar email confirmado
    if (!usuarios.email_confirmed) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Por favor confirma tu email antes de iniciar sesión',
        requiresConfirmation: true
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Generar token JWT (simplificado para Pages Functions)
    const token = btoa(JSON.stringify({
      id: usuarios.id,
      correo: usuarios.correo,
      rol: usuarios.rol,
      exp: Date.now() + (15 * 60 * 1000) // 15 minutos
    }));

    // Actualizar último login
    await supabase
      .from('usuarios')
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', usuarios.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: usuarios.id,
          nombre: usuarios.nombre,
          apellido: usuarios.apellido,
          correo: usuarios.correo,
          rol: usuarios.rol
        }
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error en login:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
