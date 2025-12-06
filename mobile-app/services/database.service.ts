/**
 * ============================================================================
 * SERVICIO DE BASE DE DATOS
 * Operaciones CRUD para pacientes, citas, tratamientos y estadísticas
 * ============================================================================
 */

import { supabase } from './supabase.service';

// Tipos de datos
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  tipo_documento?: string;
  numero_documento?: string;
  rol_id?: number;
  activo?: boolean;
  created_at?: string;
}

export interface Cita {
  id: number;
  paciente_id: number;
  odontologo_id: number;
  fecha: string;
  hora: string;
  estado: 'programada' | 'confirmada' | 'completada' | 'cancelada';
  motivo?: string;
  notas?: string;
  created_at?: string;
  // Campos relacionados
  paciente_nombre?: string;
  paciente_apellido?: string;
  paciente_correo?: string;
  odontologo_nombre?: string;
  odontologo_apellido?: string;
}

export interface Tratamiento {
  id: number;
  nombre: string;
  descripcion?: string;
  costo_estimado?: number;
}

export interface PacienteTratamiento {
  id: number;
  paciente_id: number;
  tratamiento_id: number;
  odontologo_id: number;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  costo_estimado?: number;
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
  descripcion?: string;
  observaciones?: string;
  // Campos relacionados
  nombre_tratamiento?: string;
  nombre_paciente?: string;
  apellido_paciente?: string;
}

export interface Estadisticas {
  totalPacientes: number;
  citasHoy: number;
  citasPendientes: number;
  tratamientosActivos: number;
}

// ============================================================================
// OPERACIONES DE PACIENTES
// ============================================================================

/**
 * Obtener lista de todos los pacientes
 */
export async function getPacientes(): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol_id', 4) // Rol de paciente
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener pacientes:', error.message);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getPacientes:', error);
    return [];
  }
}

/**
 * Obtener paciente por ID
 */
export async function getPacienteById(id: number): Promise<Usuario | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error al obtener paciente:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error en getPacienteById:', error);
    return null;
  }
}

/**
 * Crear nuevo paciente
 */
export async function createPaciente(data: Partial<Usuario>): Promise<Usuario | null> {
  try {
    const { data: newPaciente, error } = await supabase
      .from('usuarios')
      .insert({
        ...data,
        rol_id: 4, // Rol de paciente
        activo: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error al crear paciente:', error.message);
      throw error;
    }

    console.log('✅ Paciente creado exitosamente');
    return newPaciente;
  } catch (error) {
    console.error('❌ Error en createPaciente:', error);
    return null;
  }
}

/**
 * Actualizar paciente existente
 */
export async function updatePaciente(id: number, data: Partial<Usuario>): Promise<Usuario | null> {
  try {
    const { data: updatedPaciente, error } = await supabase
      .from('usuarios')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error al actualizar paciente:', error.message);
      throw error;
    }

    console.log('✅ Paciente actualizado exitosamente');
    return updatedPaciente;
  } catch (error) {
    console.error('❌ Error en updatePaciente:', error);
    return null;
  }
}

// ============================================================================
// OPERACIONES DE CITAS
// ============================================================================

/**
 * Obtener todas las citas
 */
export async function getCitas(): Promise<Cita[]> {
  try {
    const { data, error } = await supabase
      .from('citas')
      .select(`
        *,
        paciente:usuarios!citas_paciente_id_fkey(nombre, apellido, correo),
        odontologo:usuarios!citas_odontologo_id_fkey(nombre, apellido)
      `)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener citas:', error.message);
      throw error;
    }

    // Transformar datos para incluir nombres
    const citasFormateadas = (data || []).map((cita: { 
      id: number;
      paciente_id: number;
      odontologo_id: number;
      fecha: string;
      hora: string;
      estado: 'programada' | 'confirmada' | 'completada' | 'cancelada';
      motivo?: string;
      notas?: string;
      created_at?: string;
      paciente?: { nombre: string; apellido: string; correo: string };
      odontologo?: { nombre: string; apellido: string };
    }) => ({
      ...cita,
      paciente_nombre: cita.paciente?.nombre || '',
      paciente_apellido: cita.paciente?.apellido || '',
      paciente_correo: cita.paciente?.correo || '',
      odontologo_nombre: cita.odontologo?.nombre || '',
      odontologo_apellido: cita.odontologo?.apellido || '',
    }));

    return citasFormateadas;
  } catch (error) {
    console.error('❌ Error en getCitas:', error);
    return [];
  }
}

/**
 * Obtener citas de un paciente específico
 */
export async function getCitasByPaciente(pacienteId: number): Promise<Cita[]> {
  try {
    const { data, error } = await supabase
      .from('citas')
      .select(`
        *,
        odontologo:usuarios!citas_odontologo_id_fkey(nombre, apellido)
      `)
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener citas del paciente:', error.message);
      throw error;
    }

    const citasFormateadas = (data || []).map((cita: { 
      id: number;
      paciente_id: number;
      odontologo_id: number;
      fecha: string;
      hora: string;
      estado: 'programada' | 'confirmada' | 'completada' | 'cancelada';
      motivo?: string;
      notas?: string;
      created_at?: string;
      odontologo?: { nombre: string; apellido: string };
    }) => ({
      ...cita,
      odontologo_nombre: cita.odontologo?.nombre || '',
      odontologo_apellido: cita.odontologo?.apellido || '',
    }));

    return citasFormateadas;
  } catch (error) {
    console.error('❌ Error en getCitasByPaciente:', error);
    return [];
  }
}

/**
 * Crear nueva cita
 */
export async function createCita(data: Partial<Cita>): Promise<Cita | null> {
  try {
    const { data: newCita, error } = await supabase
      .from('citas')
      .insert({
        paciente_id: data.paciente_id,
        odontologo_id: data.odontologo_id,
        fecha: data.fecha,
        hora: data.hora,
        estado: data.estado || 'programada',
        motivo: data.motivo,
        notas: data.notas,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error al crear cita:', error.message);
      throw error;
    }

    console.log('✅ Cita creada exitosamente');
    return newCita;
  } catch (error) {
    console.error('❌ Error en createCita:', error);
    return null;
  }
}

/**
 * Actualizar cita existente
 */
export async function updateCita(id: number, data: Partial<Cita>): Promise<Cita | null> {
  try {
    const { data: updatedCita, error } = await supabase
      .from('citas')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error al actualizar cita:', error.message);
      throw error;
    }

    console.log('✅ Cita actualizada exitosamente');
    return updatedCita;
  } catch (error) {
    console.error('❌ Error en updateCita:', error);
    return null;
  }
}

// ============================================================================
// OPERACIONES DE TRATAMIENTOS
// ============================================================================

/**
 * Obtener todos los tratamientos disponibles
 */
export async function getTratamientos(): Promise<Tratamiento[]> {
  try {
    const { data, error } = await supabase
      .from('tratamientos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener tratamientos:', error.message);
      // Devolver datos de respaldo si hay error
      return [
        { id: 1, nombre: 'Limpieza Dental', descripcion: 'Limpieza profesional completa', costo_estimado: 80000 },
        { id: 2, nombre: 'Blanqueamiento', descripcion: 'Blanqueamiento dental profesional', costo_estimado: 200000 },
        { id: 3, nombre: 'Ortodoncia', descripcion: 'Tratamiento de ortodoncia completo', costo_estimado: 150000 },
        { id: 4, nombre: 'Endodoncia', descripcion: 'Tratamiento de conducto', costo_estimado: 250000 },
        { id: 5, nombre: 'Implante Dental', descripcion: 'Colocación de implante dental', costo_estimado: 800000 },
        { id: 6, nombre: 'Extracción', descripcion: 'Extracción dental', costo_estimado: 120000 },
        { id: 7, nombre: 'Corona Dental', descripcion: 'Colocación de corona', costo_estimado: 350000 },
        { id: 8, nombre: 'Puente Dental', descripcion: 'Colocación de puente fijo', costo_estimado: 600000 },
      ];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getTratamientos:', error);
    return [];
  }
}

/**
 * Obtener tratamientos de un paciente específico
 */
export async function getTratamientosByPaciente(pacienteId: number): Promise<PacienteTratamiento[]> {
  try {
    const { data, error } = await supabase
      .from('paciente_tratamientos')
      .select(`
        *,
        tratamiento:tratamientos(nombre, descripcion),
        paciente:usuarios!paciente_tratamientos_paciente_id_fkey(nombre, apellido)
      `)
      .eq('paciente_id', pacienteId)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener tratamientos del paciente:', error.message);
      throw error;
    }

    const tratamientosFormateados = (data || []).map((t: { 
      id: number;
      paciente_id: number;
      tratamiento_id: number;
      odontologo_id: number;
      fecha_inicio: string;
      fecha_fin_estimada?: string;
      costo_estimado?: number;
      estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
      descripcion?: string;
      observaciones?: string;
      tratamiento?: { nombre: string; descripcion: string };
      paciente?: { nombre: string; apellido: string };
    }) => ({
      ...t,
      nombre_tratamiento: t.tratamiento?.nombre || '',
      nombre_paciente: t.paciente?.nombre || '',
      apellido_paciente: t.paciente?.apellido || '',
    }));

    return tratamientosFormateados;
  } catch (error) {
    console.error('❌ Error en getTratamientosByPaciente:', error);
    return [];
  }
}

// ============================================================================
// ESTADÍSTICAS DEL DASHBOARD
// ============================================================================

/**
 * Obtener estadísticas generales para el dashboard
 */
export async function getEstadisticas(): Promise<Estadisticas> {
  try {
    // Total de pacientes
    const { count: totalPacientes, error: errorPacientes } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol_id', 4);

    // Citas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const { count: citasHoy, error: errorCitasHoy } = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', hoy)
      .in('estado', ['programada', 'confirmada']);

    // Citas pendientes
    const { count: citasPendientes, error: errorCitasPendientes } = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .in('estado', ['programada', 'confirmada'])
      .gte('fecha', hoy);

    // Tratamientos activos
    const { count: tratamientosActivos, error: errorTratamientos } = await supabase
      .from('paciente_tratamientos')
      .select('*', { count: 'exact', head: true })
      .in('estado', ['planificado', 'en_progreso']);

    if (errorPacientes || errorCitasHoy || errorCitasPendientes || errorTratamientos) {
      console.warn('⚠️ Error en algunas estadísticas');
    }

    return {
      totalPacientes: totalPacientes || 0,
      citasHoy: citasHoy || 0,
      citasPendientes: citasPendientes || 0,
      tratamientosActivos: tratamientosActivos || 0,
    };
  } catch (error) {
    console.error('❌ Error en getEstadisticas:', error);
    return {
      totalPacientes: 0,
      citasHoy: 0,
      citasPendientes: 0,
      tratamientosActivos: 0,
    };
  }
}

/**
 * Obtener odontólogos disponibles
 */
export async function getOdontologos(): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol_id', 2) // Rol de odontólogo
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener odontólogos:', error.message);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getOdontologos:', error);
    return [];
  }
}
