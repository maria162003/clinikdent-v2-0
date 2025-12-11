// API: Citas - CRUD completo
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Helper: Verificar token
function verifyToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token));
    
    // Verificar expiración
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    
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

  // Verificar autenticación
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
    // GET: Obtener citas
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const pacienteId = url.searchParams.get('pacienteId');
      
      let query = supabase
        .from('citas')
        .select(`
          *,
          paciente:paciente_id(id, nombre, apellido, correo, telefono),
          odontologo:odontologo_id(id, nombre, apellido)
        `)
        .order('fecha_cita', { ascending: true });

      if (pacienteId) {
        query = query.eq('paciente_id', pacienteId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        data: data || []
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // POST: Crear cita
    if (request.method === 'POST') {
      const body = await request.json();
      
      const { data, error } = await supabase
        .from('citas')
        .insert([{
          paciente_id: body.paciente_id,
          odontologo_id: body.odontologo_id,
          fecha_cita: body.fecha_cita,
          hora_cita: body.hora_cita,
          motivo: body.motivo,
          estado: 'pendiente',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Cita creada exitosamente',
        data
      }), {
        status: 201,
        headers: corsHeaders
      });
    }

    // PUT: Actualizar cita
    if (request.method === 'PUT') {
      const body = await request.json();
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      const { data, error } = await supabase
        .from('citas')
        .update({
          fecha_cita: body.fecha_cita,
          hora_cita: body.hora_cita,
          motivo: body.motivo,
          estado: body.estado,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Cita actualizada',
        data
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // DELETE: Cancelar cita
    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      const { error } = await supabase
        .from('citas')
        .update({ estado: 'cancelada' })
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Cita cancelada'
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
