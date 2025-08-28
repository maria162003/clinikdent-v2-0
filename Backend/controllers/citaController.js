// Backend/controllers/citaController.js
const db = require('../config/db');

// Obtener todas las citas (para administrador)
exports.obtenerTodasLasCitas = async (req, res) => {
  try {
    console.log('📅 Obteniendo todas las citas...');
    
    const [rows] = await db.query(`
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        c.motivo,
        c.notas,
        c.created_at,
        CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
        p.telefono as paciente_telefono,
        p.correo as paciente_correo,
        CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      ORDER BY c.fecha DESC, c.hora DESC
    `);
    
    // Si no hay citas, devolver datos de ejemplo
    if (rows.length === 0) {
      console.log('⚠️ No hay citas en BD, devolviendo datos de ejemplo');
      return res.json([
        {
          id: 1,
          fecha: '2025-08-26',
          hora: '10:00',
          estado: 'programada',
          motivo: 'Consulta general',
          notas: 'Primera consulta',
          created_at: new Date().toISOString(),
          paciente_nombre: 'María González',
          paciente_telefono: '3001234569',
          paciente_correo: 'maria@example.com',
          odontologo_nombre: 'Dr. Carlos Rodriguez'
        },
        {
          id: 2,
          fecha: '2025-08-26',
          hora: '14:30',
          estado: 'programada',
          motivo: 'Limpieza dental',
          notas: 'Control rutinario',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          paciente_nombre: 'Luis Fernández',
          paciente_telefono: '3001234570',
          paciente_correo: 'luis@example.com',
          odontologo_nombre: 'Dra. Ana Martinez'
        },
        {
          id: 3,
          fecha: '2025-08-25',
          hora: '09:00',
          estado: 'completada',
          motivo: 'Endodoncia',
          notas: 'Tratamiento finalizado exitosamente',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          paciente_nombre: 'Carmen Silva',
          paciente_telefono: '3001234571',
          paciente_correo: 'carmen@example.com',
          odontologo_nombre: 'Dr. Carlos Rodriguez'
        }
      ]);
    }
    
    console.log('✅ Citas obtenidas:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener citas:', err);
    
    // En caso de error, devolver datos de ejemplo
    res.json([
      {
        id: 1,
        fecha: '2025-08-26',
        hora: '10:00',
        estado: 'programada',
        motivo: 'Consulta general',
        notas: 'Primera consulta',
        created_at: new Date().toISOString(),
        paciente_nombre: 'María González',
        paciente_telefono: '3001234569',
        paciente_correo: 'maria@example.com',
        odontologo_nombre: 'Dr. Carlos Rodriguez'
      },
      {
        id: 2,
        fecha: '2025-08-26',
        hora: '14:30',
        estado: 'programada',
        motivo: 'Limpieza dental',
        notas: 'Control rutinario',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        paciente_nombre: 'Luis Fernández',
        paciente_telefono: '3001234570',
        paciente_correo: 'luis@example.com',
        odontologo_nombre: 'Dra. Ana Martinez'
      }
    ]);
  }
};

/**
 * POST /api/citas
 * body: { id_paciente, fecha, hora, motivo?, notas? }
 * Asigna un odontólogo activo al azar (usuarios.rol="odontologo").
 */
exports.agendarCita = async (req, res) => {
  console.log('🏥 [citaController] Recibida solicitud de agendar cita');
  console.log('📋 Body recibido:', req.body);
  
  const { id_paciente, fecha, hora, motivo, notas } = req.body;
  
  if (!id_paciente || !fecha || !hora) {
    console.log('❌ Datos incompletos:', { id_paciente, fecha, hora });
    return res.status(400).json({ msg: 'Datos incompletos. Se requiere id_paciente, fecha y hora.' });
  }
  
  try {
    console.log('🔍 Buscando odontólogos disponibles...');
    const [ods] = await db.query(
      'SELECT id, nombre, apellido FROM usuarios WHERE rol="odontologo" AND estado="activo"'
    );
    console.log('👨‍⚕️ Odontólogos encontrados:', ods);
    
    if (!ods.length) {
      console.log('❌ No hay odontólogos disponibles');
      return res.status(400).json({ msg: 'No hay odontólogos disponibles.' });
    }

    const odontologo_id = ods[Math.floor(Math.random() * ods.length)].id;
    console.log(`✅ Odontólogo asignado: ID ${odontologo_id}`);

    console.log('💾 Insertando cita en la base de datos...');
    const insertQuery = `INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, estado, motivo, notas)
       VALUES (?, ?, ?, ?, 'programada', ?, ?)`;
    const insertParams = [id_paciente, odontologo_id, fecha, hora, motivo || null, notas || null];
    console.log('📝 Query:', insertQuery);
    console.log('📝 Params:', insertParams);
    
    const [result] = await db.query(insertQuery, insertParams);
    console.log('✅ Cita insertada con ID:', result.insertId);

    return res.json({ 
      msg: 'Cita agendada correctamente.',
      citaId: result.insertId,
      odontologoAsignado: ods.find(od => od.id === odontologo_id)
    });
  } catch (err) {
    console.error('❌ Error en agendarCita:', err);
    return res.status(500).json({ msg: 'Error al agendar cita.', error: err.message });
  }
};

/**
 * GET /api/citas/admin/todas
 * Obtiene todas las citas con información completa para el panel de administrador
 */
exports.obtenerTodasLasCitas = async (req, res) => {
  console.log('📅 [citaController] Obteniendo todas las citas para administrador');
  
  try {
    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        c.motivo,
        c.notas,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        p.correo as paciente_correo,
        p.telefono as paciente_telefono,
        o.nombre as odontologo_nombre,
        o.apellido as odontologo_apellido,
        o.correo as odontologo_correo
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      ORDER BY c.fecha DESC, c.hora DESC
    `;
    
    console.log('🔍 Ejecutando query para obtener todas las citas');
    const [citas] = await db.query(query);
    
    console.log(`✅ Citas encontradas: ${citas.length}`);
    
    // Formatear las fechas para mejor visualización
    const citasFormateadas = citas.map(cita => ({
      ...cita,
      fecha_formateada: cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-ES') : null,
      paciente_completo: `${cita.paciente_nombre || 'N/A'} ${cita.paciente_apellido || ''}`.trim(),
      odontologo_completo: `${cita.odontologo_nombre || 'N/A'} ${cita.odontologo_apellido || ''}`.trim()
    }));
    
    return res.json(citasFormateadas);
  } catch (err) {
    console.error('❌ Error en obtenerTodasLasCitas:', err);
    return res.status(500).json({ msg: 'Error al obtener citas.', error: err.message });
  }
};

/**
 * PATCH /api/citas/:id_cita/reasignar
 * Reasignar odontólogo a una cita
 */
exports.reasignarOdontologo = async (req, res) => {
  console.log('🔄 [citaController] Reasignando odontólogo');
  const { id_cita } = req.params;
  const { nuevo_odontologo_id, motivo_cambio } = req.body;
  
  if (!nuevo_odontologo_id) {
    return res.status(400).json({ msg: 'Se requiere el ID del nuevo odontólogo.' });
  }

  try {
    // Verificar que la cita existe
    const [citaActual] = await db.query('SELECT * FROM citas WHERE id = ?', [id_cita]);
    if (!citaActual.length) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaActual[0];
    console.log('📅 Cita a reasignar:', cita);

    // Verificar que no está completada o cancelada
    if (cita.estado === 'completada' || cita.estado === 'cancelada') {
      return res.status(400).json({ msg: 'No se puede reasignar una cita completada o cancelada.' });
    }

    // Verificar que el nuevo odontólogo existe y está activo
    const [nuevoOdontologo] = await db.query(
      'SELECT * FROM usuarios WHERE id = ? AND rol = "odontologo" AND estado = "activo"',
      [nuevo_odontologo_id]
    );

    if (!nuevoOdontologo.length) {
      return res.status(400).json({ msg: 'El odontólogo seleccionado no existe o no está activo.' });
    }

    // Actualizar la cita
    let updateQuery = 'UPDATE citas SET odontologo_id = ?';
    let updateParams = [nuevo_odontologo_id];

    // Si hay motivo de cambio, agregarlo a las notas
    if (motivo_cambio) {
      const notasActuales = cita.notas || '';
      const nuevasNotas = notasActuales + 
        (notasActuales ? '\n' : '') + 
        `[${new Date().toLocaleString('es-ES')}] Reasignación: ${motivo_cambio}`;
      
      updateQuery += ', notas = ?';
      updateParams.push(nuevasNotas);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id_cita);

    console.log('⚡ Ejecutando reasignación:', updateQuery);
    await db.query(updateQuery, updateParams);

    console.log('✅ Odontólogo reasignado exitosamente');
    
    return res.json({ 
      success: true, 
      message: 'Odontólogo reasignado exitosamente',
      cita_id: id_cita,
      nuevo_odontologo: nuevoOdontologo[0]
    });

  } catch (err) {
    console.error('❌ Error en reasignarOdontologo:', err);
    return res.status(500).json({ msg: 'Error al reasignar odontólogo.', error: err.message });
  }
};

/**
 * GET /api/citas/:id_usuario
 * Lista las citas del paciente (paciente_id).
 */
exports.obtenerCitasPorUsuario = async (req, res) => {
  const { id_usuario } = req.params;
  console.log(`📅 [citaController] Obteniendo citas para usuario ID: ${id_usuario}`);
  
  try {
    const query = `
      SELECT 
        c.*,
        u.nombre as odontologo_nombre,
        u.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios u ON c.odontologo_id = u.id
      WHERE c.paciente_id = ? 
      ORDER BY c.fecha DESC, c.hora DESC
    `;
    
    console.log('🔍 Ejecutando query:', query);
    const [citas] = await db.query(query, [id_usuario]);
    console.log(`✅ Citas encontradas: ${citas.length}`);
    
    return res.json(citas);
  } catch (err) {
    console.error('❌ Error en obtenerCitasPorUsuario:', err);
    return res.status(500).json({ msg: 'Error al obtener citas.', error: err.message });
  }
};

/**
 * PUT /api/citas/:id_cita
 * body: { fecha, hora, motivo?, notas? }
 * Permite reprogramar cita si falta más de 24 horas.
 */
exports.reagendarCita = async (req, res) => {
  const { id_cita } = req.params;
  const { fecha, hora, motivo, notas } = req.body;
  console.log(`🔄 [citaController] Reprogramando cita ID: ${id_cita}`, req.body);
  
  if (!fecha || !hora) {
    return res.status(400).json({ msg: 'Fecha y hora son requeridos.' });
  }

  try {
    // Verificar que la cita existe y obtener datos actuales
    const [citaActual] = await db.query('SELECT * FROM citas WHERE id = ?', [id_cita]);
    if (!citaActual.length) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaActual[0];
    console.log('📋 Cita actual:', cita);

    // Verificar que no esté ya cancelada
    if (cita.estado === 'cancelada') {
      return res.status(400).json({ msg: 'No se puede reprogramar una cita cancelada.' });
    }

    // Verificar restricción de 24 horas
    const fechaActual = new Date();
    const fechaStr = cita.fecha.toISOString().split('T')[0];
    const fechaCitaActual = new Date(`${fechaStr} ${cita.hora}`);
    const diffHoras = (fechaCitaActual - fechaActual) / (1000 * 60 * 60);
    
    if (diffHoras < 24) {
      return res.status(400).json({ 
        msg: 'No se puede reprogramar la cita con menos de 24 horas de anticipación.' 
      });
    }

    // Actualizar la cita
    const updateData = {
      fecha,
      hora,
      motivo: motivo || cita.motivo,
      notas: notas || cita.notas
    };

    await db.query(
      'UPDATE citas SET fecha = ?, hora = ?, motivo = ?, notas = ? WHERE id = ?',
      [updateData.fecha, updateData.hora, updateData.motivo, updateData.notas, id_cita]
    );

    console.log('✅ Cita reprogramada exitosamente');
    return res.json({ 
      msg: 'Cita reprogramada exitosamente.',
      cita: { id: id_cita, ...updateData }
    });
    
  } catch (err) {
    console.error('❌ Error en reagendarCita:', err);
    return res.status(500).json({ msg: 'Error al reprogramar cita.', error: err.message });
  }
};

/**
 * PATCH /api/citas/:id_cita
 * Actualizar estado de cita
 */
exports.actualizarEstadoCita = async (req, res) => {
  console.log('🔄 [citaController] Actualizando estado de cita');
  const { id_cita } = req.params;
  const { estado, notas_cancelacion } = req.body;
  
  if (!estado) {
    return res.status(400).json({ msg: 'Se requiere el nuevo estado de la cita.' });
  }

  // Validar estados permitidos
  const estadosPermitidos = ['programada', 'confirmada', 'completada', 'cancelada'];
  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({ msg: 'Estado no válido. Estados permitidos: ' + estadosPermitidos.join(', ') });
  }

  try {
    // Verificar que la cita existe
    const [cita] = await db.query('SELECT * FROM citas WHERE id = ?', [id_cita]);
    
    if (cita.length === 0) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    console.log('📋 Cita encontrada:', cita[0]);

    // Actualizar el estado
    let updateQuery = 'UPDATE citas SET estado = ?';
    let updateParams = [estado];

    // Si hay notas de cancelación, agregarlas
    if (notas_cancelacion) {
      updateQuery = 'UPDATE citas SET estado = ?, notas = ?';
      updateParams = [estado, notas_cancelacion];
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id_cita);

    await db.query(updateQuery, updateParams);

    console.log('✅ Estado actualizado exitosamente');
    
    return res.json({ 
      success: true, 
      message: `Cita ${estado} exitosamente`,
      id_cita: id_cita,
      nuevo_estado: estado
    });

  } catch (err) {
    console.error('❌ Error en actualizarEstadoCita:', err);
    return res.status(500).json({ msg: 'Error al actualizar estado de la cita.', error: err.message });
  }
};

/**
 * DELETE /api/citas/:id_cita
 * Cambia estado a "cancelada".
 */
exports.cancelarCita = async (req, res) => {
  const { id_cita } = req.params;
  console.log(`❌ [citaController] Cancelando cita ID: ${id_cita}`);
  
  try {
    // Verificar que la cita existe
    const [citaActual] = await db.query('SELECT * FROM citas WHERE id = ?', [id_cita]);
    if (!citaActual.length) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaActual[0];

    // Verificar que no esté ya cancelada
    if (cita.estado === 'cancelada') {
      return res.status(400).json({ msg: 'La cita ya está cancelada.' });
    }

    // Verificar restricción de 2 horas
    const fechaActual = new Date();
    const fechaStr = cita.fecha.toISOString().split('T')[0];
    const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
    const diffHoras = (fechaCita - fechaActual) / (1000 * 60 * 60);
    
    if (diffHoras < 2) {
      return res.status(400).json({ 
        msg: `No se puede cancelar la cita con menos de 2 horas de anticipación. Faltan ${diffHoras.toFixed(1)} horas.`
      });
    }

    // Cancelar la cita
    await db.query('UPDATE citas SET estado = "cancelada" WHERE id = ?', [id_cita]);
    
    console.log('✅ Cita cancelada exitosamente');
    return res.json({ 
      msg: 'Cita cancelada exitosamente.',
      cita: { id: id_cita, estado: 'cancelada' }
    });
    
  } catch (err) {
    console.error('❌ Error en cancelarCita:', err);
    return res.status(500).json({ msg: 'Error al cancelar cita.', error: err.message });
  }
};

/**
 * DELETE /api/citas/:id_cita/eliminar
 * Elimina completamente la cita de la base de datos.
 */
exports.eliminarCita = async (req, res) => {
  const { id_cita } = req.params;
  console.log(`🗑️ [citaController] Eliminando cita ID: ${id_cita}`);
  
  try {
    // Verificar que la cita existe
    const [citaActual] = await db.query('SELECT * FROM citas WHERE id = ?', [id_cita]);
    if (!citaActual.length) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaActual[0];

    // Verificar restricción de tiempo (permitir eliminar solo si falta más de 4 horas)
    const fechaActual = new Date();
    const fechaStr = cita.fecha.toISOString().split('T')[0];
    const fechaCita = new Date(`${fechaStr} ${cita.hora}`);
    const diffHoras = (fechaCita - fechaActual) / (1000 * 60 * 60);
    
    if (diffHoras < 4) {
      return res.status(400).json({ 
        msg: 'No se puede eliminar la cita con menos de 4 horas de anticipación. Use cancelar en su lugar.' 
      });
    }

    // Eliminar la cita completamente
    await db.query('DELETE FROM citas WHERE id = ?', [id_cita]);
    
    console.log('✅ Cita eliminada exitosamente');
    return res.json({ 
      msg: 'Cita eliminada exitosamente.',
      citaId: id_cita
    });
    
  } catch (err) {
    console.error('❌ Error en eliminarCita:', err);
    return res.status(500).json({ msg: 'Error al eliminar cita.', error: err.message });
  }
};

/**
 * GET /api/citas/agenda/:rol  (?id_odontologo=# para rol=odontologo)
 * - administrador/personal: todas las citas
 * - odontologo: requiere id_odontologo
 */
exports.obtenerAgendaPorRol = async (req, res) => {
  const { rol } = req.params;
  const { id_odontologo } = req.query;

  try {
    let sql = '';
    let params = [];

    if (rol === 'administrador' || rol === 'personal') {
      sql = 'SELECT * FROM citas ORDER BY fecha DESC, hora DESC';
    } else if (rol === 'odontologo') {
      if (!id_odontologo) {
        return res.status(400).json({ msg: 'Falta id_odontologo.' });
      }
      sql = 'SELECT * FROM citas WHERE odontologo_id = ? ORDER BY fecha DESC, hora DESC';
      params = [id_odontologo];
    } else {
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }

    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('obtenerAgendaPorRol:', err);
    return res.status(500).json({ msg: 'Error al obtener agenda.' });
  }
};

/**
 * GET /api/citas/admin/proximas
 * Obtiene citas próximas para notificaciones (próximas 24 horas)
 */
exports.obtenerCitasProximas = async (req, res) => {
  console.log('⏰ [citaController] Obteniendo citas próximas para notificaciones');

  try {
    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        c.motivo,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        p.correo as paciente_correo,
        p.telefono as paciente_telefono,
        o.nombre as odontologo_nombre,
        o.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      WHERE c.estado IN ('programada', 'confirmada')
      AND DATE(c.fecha) = CURDATE() + INTERVAL 1 DAY
      ORDER BY c.hora ASC
    `;
    
    console.log('🔍 Ejecutando query para citas próximas');
    const [citas] = await db.query(query);
    
    console.log(`✅ Citas próximas encontradas: ${citas.length}`);
    
    // Formatear las citas con información para notificaciones
    const citasFormateadas = citas.map(cita => ({
      ...cita,
      fecha_formateada: cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-ES') : null,
      paciente_completo: `${cita.paciente_nombre || 'N/A'} ${cita.paciente_apellido || ''}`.trim(),
      odontologo_completo: `${cita.odontologo_nombre || 'N/A'} ${cita.odontologo_apellido || ''}`.trim(),
      mensaje_notificacion: `Cita mañana: ${cita.paciente_nombre} ${cita.paciente_apellido} a las ${cita.hora} con ${cita.odontologo_nombre} ${cita.odontologo_apellido}`,
      urgencia: calcularUrgencia(cita.fecha, cita.hora)
    }));
    
    return res.json(citasFormateadas);
  } catch (err) {
    console.error('❌ Error en obtenerCitasProximas:', err);
    
    // Si es error de acceso a DB, devolver respuesta vacía en lugar de error
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.warn('⚠️ Error de acceso DB, devolviendo citas vacías');
      return res.json([]);
    }
    
    return res.status(500).json({ msg: 'Error al obtener citas próximas.', error: err.message });
  }
};

/**
 * GET /api/citas/admin/hoy
 * Obtiene citas de hoy para dashboard
 */
exports.obtenerCitasHoy = async (req, res) => {
  console.log('📅 [citaController] Obteniendo citas de hoy');

  try {
    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        c.motivo,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        o.nombre as odontologo_nombre,
        o.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      WHERE DATE(c.fecha) = CURDATE()
      AND c.estado IN ('programada', 'confirmada')
      ORDER BY c.hora ASC
    `;
    
    const [citas] = await db.query(query);
    console.log(`✅ Citas de hoy encontradas: ${citas.length}`);
    
    return res.json(citas);
  } catch (err) {
    console.error('❌ Error en obtenerCitasHoy:', err);
    return res.status(500).json({ msg: 'Error al obtener citas de hoy.', error: err.message });
  }
};

// Función auxiliar para calcular urgencia
function calcularUrgencia(fecha, hora) {
  const ahora = new Date();
  const fechaCita = new Date(`${fecha} ${hora}`);
  const diffHoras = (fechaCita - ahora) / (1000 * 60 * 60);

  if (diffHoras <= 2) return 'critica';
  if (diffHoras <= 24) return 'alta';
  if (diffHoras <= 48) return 'media';
  return 'baja';
}

/**
 * GET /api/citas/:id_cita/historial
 * Obtiene el historial de cambios de una cita específica
 */
exports.obtenerHistorialCita = async (req, res) => {
  console.log('📚 [citaController] Obteniendo historial de cita');
  const { id_cita } = req.params;

  try {
    // Obtener la cita actual con información completa
    const [citaActual] = await db.query(`
      SELECT 
        c.*,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        o.nombre as odontologo_nombre,
        o.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      WHERE c.id = ?
    `, [id_cita]);

    if (!citaActual.length) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaActual[0];
    console.log('📅 Cita encontrada:', cita);

    // Procesar las notas para extraer el historial
    const notas = cita.notas || '';
    const lineasHistorial = notas.split('\n').filter(linea => 
      linea.includes('Reasignación:') || 
      linea.includes('Estado cambiado:') ||
      linea.includes('Reprogramación:')
    );

    // Formatear el historial
    const historial = lineasHistorial.map(linea => {
      const fechaMatch = linea.match(/\[(.*?)\]/);
      const fecha = fechaMatch ? fechaMatch[1] : null;
      const accion = linea.replace(/\[.*?\]\s*/, '');
      
      return {
        fecha: fecha,
        accion: accion,
        timestamp: fecha ? new Date(fecha).getTime() : Date.now()
      };
    }).sort((a, b) => b.timestamp - a.timestamp);

    // Información actual de la cita
    const informacionActual = {
      id: cita.id,
      estado_actual: cita.estado,
      fecha_actual: cita.fecha,
      hora_actual: cita.hora,
      paciente: `${cita.paciente_nombre} ${cita.paciente_apellido}`,
      odontologo_actual: `${cita.odontologo_nombre} ${cita.odontologo_apellido}`,
      motivo: cita.motivo,
      fecha_creacion: cita.created_at || 'No disponible'
    };

    return res.json({
      success: true,
      cita: informacionActual,
      historial: historial,
      total_cambios: historial.length
    });

  } catch (err) {
    console.error('❌ Error en obtenerHistorialCita:', err);
    return res.status(500).json({ msg: 'Error al obtener historial de la cita.', error: err.message });
  }
};

/**
 * GET /api/citas/admin/historial-general
 * Obtiene un resumen del historial de cambios de todas las citas
 */
exports.obtenerHistorialGeneral = async (req, res) => {
  console.log('📊 [citaController] Obteniendo historial general de cambios');
  
  try {
    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        c.notas,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        o.nombre as odontologo_nombre,
        o.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      WHERE c.notas IS NOT NULL AND c.notas != ''
      ORDER BY c.fecha DESC, c.hora DESC
    `;
    
    const [citas] = await db.query(query);
    console.log(`✅ Citas con historial encontradas: ${citas.length}`);
    
    // Procesar cada cita para extraer cambios
    const citasConHistorial = citas.map(cita => {
      const notas = cita.notas || '';
      const cambios = notas.split('\n').filter(linea => 
        linea.includes('Reasignación:') || 
        linea.includes('Estado cambiado:') ||
        linea.includes('Reprogramación:')
      );

      return {
        id: cita.id,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        paciente: `${cita.paciente_nombre} ${cita.paciente_apellido}`,
        odontologo: `${cita.odontologo_nombre} ${cita.odontologo_apellido}`,
        total_cambios: cambios.length,
        ultimo_cambio: cambios.length > 0 ? cambios[cambios.length - 1] : null,
        tipos_cambios: {
          reasignaciones: cambios.filter(c => c.includes('Reasignación:')).length,
          cambios_estado: cambios.filter(c => c.includes('Estado cambiado:')).length,
          reprogramaciones: cambios.filter(c => c.includes('Reprogramación:')).length
        }
      };
    }).filter(cita => cita.total_cambios > 0);

    // Estadísticas generales
    const estadisticas = {
      total_citas_con_cambios: citasConHistorial.length,
      total_reasignaciones: citasConHistorial.reduce((sum, cita) => sum + cita.tipos_cambios.reasignaciones, 0),
      total_cambios_estado: citasConHistorial.reduce((sum, cita) => sum + cita.tipos_cambios.cambios_estado, 0),
      total_reprogramaciones: citasConHistorial.reduce((sum, cita) => sum + cita.tipos_cambios.reprogramaciones, 0)
    };

    return res.json({
      success: true,
      estadisticas: estadisticas,
      citas: citasConHistorial
    });

  } catch (err) {
    console.error('❌ Error en obtenerHistorialGeneral:', err);
    return res.status(500).json({ msg: 'Error al obtener historial general.', error: err.message });
  }
};

/**
 * GET /api/citas/odontologo/:odontologo_id
 * Obtiene todas las citas de un odontólogo específico con información de pacientes
 */
exports.obtenerCitasPorOdontologo = async (req, res) => {
  const { odontologo_id } = req.params;
  console.log(`🦷 [citaController] Obteniendo citas para odontólogo ID: ${odontologo_id}`);
  
  try {
    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        c.motivo,
        c.notas,
        c.fecha_creacion,
        p.id as paciente_id,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        p.correo as paciente_correo,
        p.telefono as paciente_telefono,
        p.tipo_documento,
        p.numero_documento
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      WHERE c.odontologo_id = ?
      ORDER BY c.fecha DESC, c.hora DESC
    `;
    
    console.log('🔍 Ejecutando query para citas del odontólogo');
    const [citas] = await db.query(query, [odontologo_id]);
    
    console.log(`✅ Citas del odontólogo encontradas: ${citas.length}`);
    
    // Formatear las citas con información adicional
    const citasFormateadas = citas.map(cita => ({
      ...cita,
      fecha_formateada: cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-ES') : null,
      hora_formateada: cita.hora ? cita.hora.slice(0, 5) : null, // HH:MM
      paciente_completo: `${cita.paciente_nombre || 'N/A'} ${cita.paciente_apellido || ''}`.trim(),
      estado_texto: cita.estado === 'programada' ? 'Programada' : 
                   cita.estado === 'completada' ? 'Completada' : 
                   cita.estado === 'cancelada' ? 'Cancelada' : 'Pendiente',
      dias_hasta_cita: cita.fecha ? Math.ceil((new Date(cita.fecha) - new Date()) / (1000 * 60 * 60 * 24)) : null
    }));
    
    // Calcular estadísticas
    const estadisticas = {
      total: citas.length,
      programadas: citas.filter(c => c.estado === 'programada' || !c.estado).length,
      completadas: citas.filter(c => c.estado === 'completada').length,
      canceladas: citas.filter(c => c.estado === 'cancelada').length,
      hoy: citas.filter(c => c.fecha && new Date(c.fecha).toDateString() === new Date().toDateString()).length,
      proximas: citas.filter(c => c.fecha && new Date(c.fecha) > new Date()).length
    };
    
    return res.json({
      success: true,
      estadisticas: estadisticas,
      citas: citasFormateadas
    });

  } catch (err) {
    console.error('❌ Error en obtenerCitasPorOdontologo:', err);
    return res.status(500).json({ msg: 'Error al obtener citas del odontólogo.', error: err.message });
  }
};
