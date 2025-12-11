// API: Usuarios - CRUD
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function verifyToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token));
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const user = verifyToken(request);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      message: 'No autorizado'
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  try {
    // GET: Listar usuarios
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (id && id !== 'index.js') {
        // Obtener usuario específico
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre, apellido, correo, telefono, rol, created_at')
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          data
        }), {
          status: 200,
          headers: corsHeaders
        });
      } else {
        // Listar todos los usuarios
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre, apellido, correo, telefono, rol, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          data: data || []
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
    }

    // POST: Crear usuario
    if (request.method === 'POST') {
      const body = await request.json();
      
      const hashedPassword = await bcrypt.hash(body.password, 10);

      const { data, error } = await supabase
        .from('usuarios')
        .insert([{
          nombre: body.nombre,
          apellido: body.apellido,
          correo: body.correo,
          password: hashedPassword,
          telefono: body.telefono,
          rol: body.rol || 'paciente',
          created_at: new Date().toISOString()
        }])
        .select('id, nombre, apellido, correo, telefono, rol')
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Usuario creado',
        data
      }), {
        status: 201,
        headers: corsHeaders
      });
    }

    // PUT: Actualizar usuario
    if (request.method === 'PUT') {
      const body = await request.json();
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      const updateData = {
        nombre: body.nombre,
        apellido: body.apellido,
        telefono: body.telefono,
        updated_at: new Date().toISOString()
      };

      if (body.password) {
        updateData.password = await bcrypt.hash(body.password, 10);
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select('id, nombre, apellido, correo, telefono, rol')
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Usuario actualizado',
        data
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // DELETE: Eliminar usuario
    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Usuario eliminado'
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error en la operación',
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
