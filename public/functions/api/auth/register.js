// Cloudflare Pages Function - Register
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { nombre, apellido, correo, password, telefono, rol } = body;

    // Validaciones
    if (!nombre || !apellido || !correo || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Todos los campos son requeridos'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Conectar a Supabase
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('correo', correo)
      .single();

    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        message: 'El correo ya está registrado'
      }), {
        status: 409,
        headers: corsHeaders
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert([{
        nombre,
        apellido,
        correo,
        password: hashedPassword,
        telefono: telefono || null,
        rol: rol || 'paciente',
        email_confirmed: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Usuario registrado exitosamente. Por favor revisa tu email para confirmar.',
      data: {
        id: newUser.id,
        nombre: newUser.nombre,
        correo: newUser.correo
      }
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
