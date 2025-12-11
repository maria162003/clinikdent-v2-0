const db = require('../config/db');
const supabase = require('../config/supabase');

// Las relaciones FK aún no existen en Supabase, así que enriquecemos manualmente
const HISTORIAL_BASE_SELECT = `*`;

async function enrichHistorialesWithUsuarios(rawHistoriales) {
  const isArrayInput = Array.isArray(rawHistoriales);
  const historialesList = isArrayInput
    ? rawHistoriales
    : (rawHistoriales ? [rawHistoriales] : []);

  if (!historialesList.length) {
    return isArrayInput ? [] : null;
  }

  const uniqueIds = [...new Set(historialesList
    .flatMap(hist => [hist?.paciente_id, hist?.odontologo_id])
    .filter(id => id !== null && id !== undefined))]
    .map(id => Number(id))
    .filter(id => !Number.isNaN(id));

  let usuariosMap = new Map();

  if (uniqueIds.length) {
    try {
      const { rows } = await db.query(
        'SELECT id, nombre, apellido, correo, telefono FROM usuarios WHERE id = ANY($1)',
        [uniqueIds]
      );

      usuariosMap = new Map(rows.map(row => [Number(row.id), row]));
    } catch (error) {
      console.warn('⚠️ No se pudieron enriquecer los historiales con datos de usuarios:', error.message);
    }
  }

  const historialesEnriquecidos = historialesList.map(hist => {
    const paciente = usuariosMap.get(Number(hist?.paciente_id)) || hist?.paciente || null;
    const odontologo = usuariosMap.get(Number(hist?.odontologo_id)) || hist?.odontologo || null;

    return {
      ...hist,
      paciente,
      odontologo,
      paciente_nombre: paciente?.nombre ?? hist?.paciente_nombre,
      paciente_apellido: paciente?.apellido ?? hist?.paciente_apellido,
      paciente_correo: paciente?.correo ?? hist?.paciente_correo,
      paciente_telefono: paciente?.telefono ?? hist?.paciente_telefono,
      odontologo_nombre: odontologo?.nombre ?? hist?.odontologo_nombre,
      odontologo_apellido: odontologo?.apellido ?? hist?.odontologo_apellido,
      odontologo_correo: odontologo?.correo ?? hist?.odontologo_correo
    };
  });

  return isArrayInput ? historialesEnriquecidos : historialesEnriquecidos[0] || null;
}

// Obtener todos los historiales (para administradores y odontólogos)
exports.obtenerTodosHistoriales = async (req, res) => {
  try {
    console.log('📋 Obteniendo todos los historiales...');
    
    const { data: historiales, error } = await supabase
      .from('historial_clinico')
      .select(HISTORIAL_BASE_SELECT)
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('❌ Error al obtener historiales:', error);
      throw error;
    }
    
    const historialesConDetalles = await enrichHistorialesWithUsuarios(historiales);
    console.log(`✅ Historiales encontrados: ${historialesConDetalles?.length || 0}`);
    res.json(historialesConDetalles || []);
  } catch (err) {
    console.error('❌ Error al obtener todos los historiales:', err);
    res.status(500).json({ msg: 'Error al obtener historiales.', error: err.message });
  }
};

exports.obtenerHistorialPorPaciente = async (req, res) => {
  const { paciente_id } = req.params;
  try {
    console.log(`📋 Obteniendo historiales del paciente ${paciente_id}...`);
    
    const { data: historiales, error } = await supabase
      .from('historial_clinico')
      .select(HISTORIAL_BASE_SELECT)
      .eq('paciente_id', paciente_id)
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('❌ Error al obtener historiales:', error);
      throw error;
    }
    
    const historialesConDetalles = await enrichHistorialesWithUsuarios(historiales);
    console.log(`📋 Historiales encontrados para paciente ${paciente_id}:`, historialesConDetalles?.length || 0);
    res.json(historialesConDetalles || []);
  } catch (err) {
    console.error('❌ Error al obtener historial:', err);
    res.status(500).json({ msg: 'Error al obtener historial.', error: err.message });
  }
};

exports.registrarHistorial = async (req, res) => {
  const {
    paciente_id,
    odontologo_id,
    diagnostico,
    tratamiento_resumido,
    fecha,
    archivo_adjuntos,
    estado
  } = req.body;
  
  if (!paciente_id || !odontologo_id || !diagnostico || !fecha) {
    return res.status(400).json({ msg: 'Datos incompletos.' });
  }
  
  const estadoTratamiento = estado || 'en_proceso';
  
  try {
    console.log('📝 Registrando nuevo historial:', { paciente_id, odontologo_id, fecha, estado: estadoTratamiento });
    
    const { data: historial, error } = await supabase
      .from('historial_clinico')
      .insert([{
        paciente_id,
        odontologo_id,
        diagnostico,
        tratamiento_resumido,
        fecha,
        archivo_adjuntos,
        estado: estadoTratamiento
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al registrar historial:', error);
      throw error;
    }
    
    const historialConDetalles = await enrichHistorialesWithUsuarios(historial);
    console.log('✅ Historial registrado con ID:', historialConDetalles?.id || historial.id);
    res.json({ 
      msg: 'Historial registrado exitosamente.',
      id: historialConDetalles?.id || historial.id,
      estado: historialConDetalles?.estado || historial.estado,
      historial: historialConDetalles || historial
    });
  } catch (err) {
    console.error('❌ Error al registrar historial:', err);
    res.status(500).json({ msg: 'Error al registrar historial.', error: err.message });
  }
};

exports.obtenerHistorialPorId = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🔍 Obteniendo historial ID: ${id}...`);
    
    const { data: historial, error } = await supabase
      .from('historial_clinico')
      .select(HISTORIAL_BASE_SELECT)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ msg: 'Historial no encontrado.' });
      }
      console.error('❌ Error al obtener historial:', error);
      throw error;
    }
    
    // Aplanar la estructura para mantener compatibilidad con el frontend
    const historialConDetalles = await enrichHistorialesWithUsuarios(historial);
    const historialFormateado = {
      ...historialConDetalles,
      paciente_nombre: historialConDetalles?.paciente?.nombre ?? historialConDetalles?.paciente_nombre,
      paciente_apellido: historialConDetalles?.paciente?.apellido ?? historialConDetalles?.paciente_apellido,
      paciente_correo: historialConDetalles?.paciente?.correo ?? historialConDetalles?.paciente_correo,
      paciente_telefono: historialConDetalles?.paciente?.telefono ?? historialConDetalles?.paciente_telefono,
      odontologo_nombre: historialConDetalles?.odontologo?.nombre ?? historialConDetalles?.odontologo_nombre,
      odontologo_apellido: historialConDetalles?.odontologo?.apellido ?? historialConDetalles?.odontologo_apellido,
      odontologo_correo: historialConDetalles?.odontologo?.correo ?? historialConDetalles?.odontologo_correo
    };
    
    console.log('✅ Historial encontrado:', historialFormateado.id);
    res.json(historialFormateado);
  } catch (err) {
    console.error('❌ Error al obtener historial por ID:', err);
    res.status(500).json({ msg: 'Error al obtener historial.', error: err.message });
  }
};

exports.actualizarHistorial = async (req, res) => {
  const { id } = req.params;
  const { diagnostico, tratamiento_resumido, fecha, archivo_adjuntos, estado } = req.body;
  
  console.log('📝 Datos recibidos para actualizar historial ID:', id);
  console.log('Body completo:', req.body);
  console.log('Estado recibido:', estado);
  
  if (!diagnostico || !fecha) {
    return res.status(400).json({ msg: 'Diagnóstico y fecha son requeridos.' });
  }
  
  try {
    const updateData = {
      diagnostico,
      tratamiento_resumido,
      fecha,
      archivo_adjuntos
    };
    
    // Solo incluir estado si se proporciona
    if (estado !== undefined && estado !== null) {
      updateData.estado = estado;
    }
    
    const { data: historial, error } = await supabase
      .from('historial_clinico')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ msg: 'Historial no encontrado.' });
      }
      console.error('❌ Error al actualizar historial:', error);
      throw error;
    }
    
    const historialConDetalles = await enrichHistorialesWithUsuarios(historial);
    console.log('✅ Historial actualizado ID:', id);
    console.log('✅ Nuevo estado guardado:', historialConDetalles?.estado || historial.estado);
    res.json({ 
      msg: 'Historial actualizado exitosamente.',
      historial: historialConDetalles || historial
    });
  } catch (err) {
    console.error('❌ Error al actualizar historial:', err);
    res.status(500).json({ msg: 'Error al actualizar historial.', error: err.message });
  }
};

exports.eliminarHistorial = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🗑️ Eliminando historial ID: ${id}...`);
    
    const { data, error } = await supabase
      .from('historial_clinico')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ msg: 'Historial no encontrado.' });
      }
      console.error('❌ Error al eliminar historial:', error);
      throw error;
    }
    
    console.log('✅ Historial eliminado exitosamente:', id);
    res.json({ msg: 'Historial eliminado exitosamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar historial:', err);
    res.status(500).json({ msg: 'Error al eliminar historial.', error: err.message });
  }
};

// Obtener historiales por odontólogo
exports.obtenerHistorialesPorOdontologo = async (req, res) => {
  const { odontologo_id } = req.params;
  try {
    console.log(`🔍 Obteniendo historiales del odontólogo ${odontologo_id}...`);
    
    const { data: historiales, error } = await supabase
      .from('historial_clinico')
      .select(HISTORIAL_BASE_SELECT)
      .eq('odontologo_id', odontologo_id)
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('❌ Error al obtener historiales por odontólogo:', error);
      throw error;
    }
    
    const historialesConDetalles = await enrichHistorialesWithUsuarios(historiales);
    console.log(`✅ Historiales encontrados para odontólogo ${odontologo_id}:`, historialesConDetalles?.length || 0);
    res.json(historialesConDetalles || []);
  } catch (err) {
    console.error('❌ Error al obtener historiales por odontólogo:', err);
    res.status(500).json({ msg: 'Error al obtener historiales.', error: err.message });
  }
};
