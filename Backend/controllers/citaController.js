// Backend/controllers/citaController.js
const db = require('../config/db');
const emailService = require('../services/emailService');

// Obtener todas las citas (para administrador)
exports.obtenerTodasLasCitas = async (req, res) => {
  try {
    console.log('📅 Obteniendo todas las citas...');
    
    const result = await db.query(`
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
    const rows = result.rows;
    
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
  
  const { paciente_id, id_paciente, odontologo_id, fecha, hora, motivo, notas } = req.body;
  
  // Permitir tanto paciente_id como id_paciente para compatibilidad
  const userId = paciente_id || id_paciente;
  
  if (!userId || !fecha || !hora) {
    console.log('❌ Datos incompletos:', { paciente_id, id_paciente, userId, fecha, hora });
    return res.status(400).json({ msg: 'Datos incompletos. Se requiere id_paciente, fecha y hora.' });
  }
  
  try {
    // Validar fecha y determinar confirmación automática
    const fechaActual = new Date();
    const fechaCita = new Date(fecha);
    const horaCita = hora.split(':');
    const horaInt = parseInt(horaCita[0]);
    const minutosInt = parseInt(horaCita[1]);
    
    // Comparar solo las fechas (sin hora)
    const fechaActualSoloFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
    const fechaCitaSoloFecha = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());
    
    const esCitaFutura = fechaCitaSoloFecha > fechaActualSoloFecha;
    const esMismoDia = fechaCitaSoloFecha.getTime() === fechaActualSoloFecha.getTime();
    
    // Si es cita futura (para mañana o después), confirmar automáticamente
    // Si es mismo día, validar horario laboral
    let debeConfirmarse = esCitaFutura;
    
    if (esMismoDia) {
      const diaSemana = fechaCita.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      const esHorarioLaboral = (diaSemana >= 1 && diaSemana <= 5) && // Lunes a Viernes
                              (horaInt >= 8 && horaInt < 18) && // 8:00 AM a 6:00 PM
                              (horaInt !== 17 || minutosInt === 0); // Si es las 5, solo 5:00 PM exacto
      debeConfirmarse = esHorarioLaboral;
    }
    
    console.log('⏰ Verificando fecha y horario:', {
      fecha,
      hora,
      esCitaFutura,
      esMismoDia,
      debeConfirmarse
    });
    
    console.log('🔍 Buscando odontólogos disponibles...');
    const odontologosResult = await db.query(
      'SELECT u.id, u.nombre, u.apellido FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = $1 AND (u.activo = $2 OR u.activo IS NULL)',
      ['odontologo', true]
    );
    const ods = odontologosResult.rows;
    console.log('👨‍⚕️ Odontólogos encontrados:', ods);
    
    if (!ods.length) {
      console.log('❌ No hay odontólogos disponibles');
      return res.status(400).json({ msg: 'No hay odontólogos disponibles.' });
    }

    // Verificar conflictos de horario con otras citas
    const citasExistentesResult = await db.query(
      'SELECT id, odontologo_id FROM citas WHERE fecha = $1 AND hora = $2 AND estado IN ($3, $4)',
      [fecha, hora, 'programada', 'confirmada']
    );
    const citasExistentes = citasExistentesResult.rows;
    
    // Filtrar odontólogos que ya tienen cita en esa fecha/hora
    const odontologosOcupados = citasExistentes.map(cita => cita.odontologo_id);
    const odontologosDisponibles = ods.filter(od => !odontologosOcupados.includes(od.id));
    
    let odontologoSeleccionado;
    
    if (odontologo_id) {
      // Si se especificó un odontólogo, verificar que esté disponible
      console.log(`🎯 Odontólogo solicitado: ID ${odontologo_id}`);
      
      // Verificar que el odontólogo existe y está activo
      const odontologoSolicitado = ods.find(od => od.id == odontologo_id);
      if (!odontologoSolicitado) {
        return res.status(400).json({ 
          msg: 'El odontólogo seleccionado no está disponible.' 
        });
      }
      
      // Verificar que no esté ocupado en ese horario
      if (odontologosOcupados.includes(parseInt(odontologo_id))) {
        return res.status(400).json({ 
          msg: `El odontólogo seleccionado ya tiene una cita en ese horario. Por favor seleccione otro horario o odontólogo.` 
        });
      }
      
      odontologoSeleccionado = parseInt(odontologo_id);
      console.log(`✅ Odontólogo seleccionado confirmado: ID ${odontologoSeleccionado}`);
    } else {
      // Si no se especificó odontólogo, asignar uno disponible al azar
      if (!odontologosDisponibles.length) {
        console.log('❌ No hay odontólogos disponibles en ese horario');
        return res.status(400).json({ 
          msg: 'No hay odontólogos disponibles para la fecha y hora seleccionada. Por favor seleccione otro horario.' 
        });
      }
      
      odontologoSeleccionado = odontologosDisponibles[Math.floor(Math.random() * odontologosDisponibles.length)].id;
      console.log(`✅ Odontólogo asignado automáticamente: ID ${odontologoSeleccionado}`);
    }

    // Determinar el estado inicial basado en la nueva lógica
    const estadoInicial = debeConfirmarse ? 'confirmada' : 'programada';
    let mensajeEstado;
    
    if (esCitaFutura) {
      mensajeEstado = 'Cita agendada y confirmada automáticamente para fecha futura.';
    } else if (esMismoDia && debeConfirmarse) {
      mensajeEstado = 'Cita agendada y confirmada automáticamente para hoy en horario laboral.';
    } else {
      mensajeEstado = 'Cita agendada. Pendiente de confirmación por disponibilidad de horario.';
    }

    console.log('💾 Insertando cita en la base de datos...');
    const insertQuery = `INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, estado, motivo, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    const insertParams = [userId, odontologoSeleccionado, fecha, hora, estadoInicial, motivo || null, notas || null];
    console.log('📝 Query:', insertQuery);
    console.log('📝 Params:', insertParams);
    
    const result = await db.query(insertQuery, insertParams);
    const nuevaCitaId = result.rows[0].id;
    console.log('✅ Cita insertada con ID:', nuevaCitaId);

    // 📧 Enviar email de confirmación de cita
    try {
      console.log('📧 Enviando email de confirmación de cita...');
      const odontologoAsignado = ods.find(od => od.id === odontologoSeleccionado);
      const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      await emailService.enviarEmail(
        pacienteInfo.email,
        'Confirmación de Cita Agendada - Clinikdent',
        `
        <h2>🦷 Confirmación de Cita Agendada</h2>
        <p>Estimado/a <strong>${pacienteInfo.nombre} ${pacienteInfo.apellido}</strong>,</p>
        
        <p>Su cita ha sido agendada exitosamente con los siguientes detalles:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
          <p><strong>🕐 Hora:</strong> ${hora}</p>
          <p><strong>👨‍⚕️ Odontólogo:</strong> Dr. ${odontologoAsignado ? odontologoAsignado.nombre + ' ' + odontologoAsignado.apellido : 'Por asignar'}</p>
          <p><strong>📝 Motivo:</strong> ${motivo || 'Consulta general'}</p>
          <p><strong>📊 Estado:</strong> ${estadoInicial}</p>
        </div>
        
        <p><strong>Mensaje del sistema:</strong> ${mensajeEstado}</p>
        
        <p>Gracias por confiar en Clinikdent. Nos vemos pronto.</p>
        
        <p>Saludos cordiales,<br>
        <strong>Equipo Clinikdent</strong></p>
        `
      );
      console.log('✅ Email de confirmación enviado exitosamente');
    } catch (emailError) {
      console.error('❌ Error enviando email de confirmación:', emailError);
      // No falla la operación principal si el email falla
    }

    return res.json({ 
      msg: mensajeEstado,
      citaId: nuevaCitaId,
      estado: estadoInicial,
      confirmadaAutomaticamente: debeConfirmarse,
      esCitaFutura: esCitaFutura,
      odontologoAsignado: ods.find(od => od.id === odontologoSeleccionado)
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
    const result = await db.query(query);
    const citas = result.rows;
    
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
    const result = await db.query('SELECT * FROM citas WHERE id = $1', [id_cita]);
    const citaActual = result.rows || [];
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
    const nuevoOdontologoResult = await db.query(
      'SELECT u.* FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1 AND r.nombre = $2 AND (u.activo = $3 OR u.activo IS NULL)',
      [nuevo_odontologo_id, 'odontologo', true]
    );
    const nuevoOdontologo = nuevoOdontologoResult.rows;

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
      WHERE c.paciente_id = $1 
      ORDER BY c.fecha DESC, c.hora DESC
    `;
    
    console.log('🔍 Ejecutando query:', query);
    const result = await db.query(query, [id_usuario]);
    console.log(`✅ Citas encontradas: ${result.rows.length}`);
    
    return res.json(result.rows);
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
  console.log(`🔄 [citaController] Actualizando cita ID: ${id_cita}`, req.body);
  
  try {
    // Verificar que la cita existe y obtener datos actuales
    const citaActual = await db.query('SELECT * FROM citas WHERE id = $1', [id_cita]);
    if (citaActual.rows.length === 0) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaActual.rows[0];
    console.log('📋 Cita actual:', cita);

    // Verificar que no esté ya cancelada
    if (cita.estado === 'cancelada') {
      return res.status(400).json({ msg: 'No se puede modificar una cita cancelada.' });
    }

    // Actualizar la cita
    const updateData = {
      fecha: fecha || cita.fecha,
      hora: hora || cita.hora,
      motivo: motivo || cita.motivo,
      notas: notas || cita.notas
    };

    console.log('🔍 Query que se va a ejecutar: UPDATE citas SET fecha = $1, hora = $2, motivo = $3, notas = $4 WHERE id = $5');
    console.log('🔍 Parámetros:', [updateData.fecha, updateData.hora, updateData.motivo, updateData.notas, id_cita]);
    
    const result = await db.query(
      'UPDATE citas SET fecha = $1, hora = $2, motivo = $3, notas = $4 WHERE id = $5 RETURNING *',
      [updateData.fecha, updateData.hora, updateData.motivo, updateData.notas, id_cita]
    );

    console.log('✅ Cita actualizada exitosamente');
    return res.json({ 
      msg: 'Cita actualizada exitosamente.',
      cita: result.rows[0]
    });
    
  } catch (err) {
    console.error('❌ Error en reagendarCita:', err);
    return res.status(500).json({ msg: 'Error al actualizar cita.', error: err.message });
  }
};

/**
 * PATCH /api/citas/:id_cita
 * Actualizar estado de cita
 */
exports.actualizarEstadoCita = async (req, res) => {
  console.log('🔄 [citaController] Actualizando estado de cita (seguridad-odontologo)');
  const { id_cita } = req.params;
  const { estado } = req.body || {};

  // 1) Validación de entrada
  if (!estado) {
    return res.status(400).json({ msg: 'Se requiere el nuevo estado de la cita.' });
  }

  // Solo permitimos estos estados vía este endpoint
  const ESTADOS_PERMITIDOS_ENDPOINT = ['completada', 'no_show'];
  if (!ESTADOS_PERMITIDOS_ENDPOINT.includes(estado)) {
    return res.status(400).json({ msg: 'Este endpoint solo permite cambiar el estado a "completada" o "no_show".' });
  }

  try {
    // 2) Cargar cita y validar estados finales incompatibles
    const citaResult = await db.query('SELECT * FROM citas WHERE id = $1', [id_cita]);
    if (citaResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaResult.rows[0];
    console.log('📋 Cita encontrada:', cita);

    if (cita.estado === 'cancelada') {
      return res.status(400).json({ msg: 'No se puede modificar una cita cancelada.' });
    }
    if (['completada', 'no_show'].includes(cita.estado)) {
      return res.status(400).json({ msg: `La cita ya está en estado final (${cita.estado}).` });
    }

    // 3) Determinar usuario autenticado (id y rol) y validar permisos/propiedad
    const actorUserId = (req.user && req.user.id) 
      ? parseInt(req.user.id)
      : parseInt(req.headers['user-id'] || req.query.userId || req.body?.userId);

    if (!actorUserId || Number.isNaN(actorUserId)) {
      return res.status(401).json({ msg: 'Usuario no autenticado.' });
    }

    // Obtener rol del usuario desde BD para asegurar consistencia
    const rolResult = await db.query(`
      SELECT COALESCE(r.nombre, 'desconocido') AS rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [actorUserId]);

    const rolUsuario = rolResult.rows[0]?.rol || req.user?.rol || 'desconocido';
    if (rolUsuario !== 'odontologo') {
      return res.status(403).json({ msg: 'Solo los odontólogos pueden cambiar estos estados.' });
    }

    if (parseInt(cita.odontologo_id) !== actorUserId) {
      return res.status(403).json({ msg: 'No tienes permisos sobre esta cita (no eres el odontólogo asignado).' });
    }

    // 4) Construir fechas y ventanas en UTC consistentes
    const parseHora = (h) => {
      if (!h) return { hh: 0, mm: 0 };
      const parts = h.toString().split(':');
      return { hh: parseInt(parts[0] || '0'), mm: parseInt(parts[1] || '0') };
    };

    const toUTCDate = (fechaVal, horaStr) => {
      // fechaVal puede venir como Date o string
      const f = new Date(fechaVal);
      const yyyy = f.getUTCFullYear();
      const mm = f.getUTCMonth();
      const dd = f.getUTCDate();
      const { hh, mm: minutes } = parseHora(horaStr);
      // Crear instante en UTC exacto de inicio de la cita
      return new Date(Date.UTC(yyyy, mm, dd, hh, minutes, 0, 0));
    };

    const DURACION_MIN = parseInt(process.env.CITA_DURACION_MINUTOS || '60');
    const NO_SHOW_INICIO_MIN = parseInt(process.env.CITA_NO_SHOW_INICIO_MIN || '15');
    const NO_SHOW_FIN_MIN = parseInt(process.env.CITA_NO_SHOW_FIN_MIN || '20');

    const fechaHoraInicioUTC = toUTCDate(cita.fecha, (cita.hora || '').toString().slice(0,5));
    const fechaHoraFinUTC = new Date(fechaHoraInicioUTC.getTime() + DURACION_MIN * 60000);
    const nowUTC = new Date(); // Epoch comparable, independiente de TZ local

    // 5) Reglas de negocio por estado
    if (estado === 'completada') {
      const dentroVentana = nowUTC >= fechaHoraInicioUTC && nowUTC <= fechaHoraFinUTC;
      if (!dentroVentana) {
        return res.status(400).json({ msg: 'No puedes completar la cita fuera de su ventana horaria.' });
      }
    }

    if (estado === 'no_show') {
      const ventanaNoShowInicioUTC = new Date(fechaHoraInicioUTC.getTime() + NO_SHOW_INICIO_MIN * 60000);
      const ventanaNoShowFinPropuestaUTC = new Date(fechaHoraInicioUTC.getTime() + NO_SHOW_FIN_MIN * 60000);
      const ventanaNoShowFinUTC = new Date(Math.min(ventanaNoShowFinPropuestaUTC.getTime(), fechaHoraFinUTC.getTime()));

      const dentroVentanaNoShow = nowUTC >= ventanaNoShowInicioUTC && nowUTC <= ventanaNoShowFinUTC;
      if (!dentroVentanaNoShow) {
        return res.status(400).json({ msg: 'Solo puedes marcar ausencia entre 15 y 20 minutos desde el inicio de la cita y dentro de la hora programada.' });
      }
    }

    // 6) Persistir cambio y registrar historial en notas
    const estadoAnterior = cita.estado || 'sin_estado';
    const marcaTiempo = new Date().toISOString();
    const lineaHistorial = `[${marcaTiempo}] Estado cambiado: ${estadoAnterior} -> ${estado} por usuario ${actorUserId}`;
    const nuevasNotas = (cita.notas ? `${cita.notas}\n` : '') + lineaHistorial;

    await db.query(
      'UPDATE citas SET estado = $1, notas = $2 WHERE id = $3',
      [estado, nuevasNotas, id_cita]
    );

    console.log('✅ Estado actualizado y registrado en historial');
    return res.json({
      success: true,
      message: `Cita ${estado} exitosamente`,
      id_cita,
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
    const result = await db.query('SELECT * FROM citas WHERE id = $1', [id_cita]);
    const citaActual = result.rows || [];
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
    await db.query('UPDATE citas SET estado = $1 WHERE id = $2', ['cancelada', id_cita]);
    
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
    const citaResult = await db.query('SELECT * FROM citas WHERE id = $1', [id_cita]);
    if (citaResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Cita no encontrada.' });
    }

    const cita = citaResult.rows[0];

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
    await db.query('DELETE FROM citas WHERE id = $1', [id_cita]);
    
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
  
  console.log(`🦷 [DEBUG] obtenerAgendaPorRol - rol: "${rol}", id_odontologo: "${id_odontologo}"`);
  console.log(`🦷 [DEBUG] req.params:`, req.params);
  console.log(`🦷 [DEBUG] req.query:`, req.query);

  try {
    let sql = '';
    let params = [];

    if (rol === 'administrador' || rol === 'personal') {
      sql = `
        SELECT 
          c.*,
          p.nombre as paciente_nombre,
          p.apellido as paciente_apellido,
          p.correo as paciente_correo,
          o.nombre as odontologo_nombre,
          o.apellido as odontologo_apellido
        FROM citas c
        LEFT JOIN usuarios p ON c.paciente_id = p.id
        LEFT JOIN usuarios o ON c.odontologo_id = o.id
        ORDER BY c.fecha DESC, c.hora DESC
      `;
    } else if (rol === 'odontologo') {
      if (!id_odontologo) {
        console.log(`🦷 [ERROR] Falta id_odontologo para rol: ${rol}`);
        return res.status(400).json({ msg: 'Falta id_odontologo.' });
      }
      sql = `
        SELECT 
          c.*,
          p.nombre as paciente_nombre,
          p.apellido as paciente_apellido,
          p.correo as paciente_correo,
          o.nombre as odontologo_nombre,
          o.apellido as odontologo_apellido
        FROM citas c
        LEFT JOIN usuarios p ON c.paciente_id = p.id
        LEFT JOIN usuarios o ON c.odontologo_id = o.id
        WHERE c.odontologo_id = $1 
        ORDER BY c.fecha DESC, c.hora DESC
      `;
      params = [id_odontologo];
    } else {
      console.log(`🦷 [ERROR] Acceso denegado para rol: ${rol}`);
      return res.status(403).json({ msg: 'Acceso denegado.' });
    }

    console.log(`🦷 [DEBUG] Ejecutando SQL: ${sql} con params:`, params);
    const result = await db.query(sql, params);
    console.log(`🦷 [SUCCESS] Encontradas ${result.rows.length} citas`);
    
    // Log detallado de las citas para debug
    if (result.rows.length > 0) {
      console.log(`🦷 [DEBUG] Ejemplo de cita:`, {
        id: result.rows[0].id,
        fecha: result.rows[0].fecha,
        hora: result.rows[0].hora,
        fecha_type: typeof result.rows[0].fecha,
        hora_type: typeof result.rows[0].hora,
        fecha_iso: result.rows[0].fecha ? result.rows[0].fecha.toISOString() : 'null',
        hora_string: result.rows[0].hora ? result.rows[0].hora.toString() : 'null'
      });
    }
    
    return res.json(result.rows);
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
    const result = await db.query(query);
    const citas = result.rows || [];
    
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
    
    const result = await db.query(query);
    const citas = result.rows || [];
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
    const result = await db.query(`
      SELECT 
        c.*,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        o.nombre as odontologo_nombre,
        o.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      WHERE c.id = $1
    `, [id_cita]);

    const citaActual = result.rows || [];
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
    // Primero verificar que la conexión funcione
    console.log('🔍 [Historial] Verificando conexión a BD...');
    const testQuery = 'SELECT COUNT(*) as total FROM citas';
    const testResult = await db.query(testQuery);
    console.log(`✅ [Historial] Conexión OK, total citas: ${testResult.rows[0].total}`);
    
    // Consulta principal simplificada
    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        COALESCE(c.notas, '') as notas,
        COALESCE(p.nombre, 'Sin nombre') as paciente_nombre,
        COALESCE(p.apellido, '') as paciente_apellido,
        COALESCE(o.nombre, 'Sin nombre') as odontologo_nombre,
        COALESCE(o.apellido, '') as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      WHERE c.notas IS NOT NULL AND c.notas != ''
      ORDER BY c.fecha DESC, c.hora DESC
      LIMIT 100
    `;
    
    console.log('🔍 [Historial] Ejecutando consulta principal...');
    const result = await db.query(query);
    const citas = result.rows || [];
    console.log(`✅ [Historial] Citas encontradas: ${citas.length}`);
    
    // Procesar cada cita para extraer cambios de forma más segura
    const citasConHistorial = [];
    
    for (const cita of citas) {
      try {
        const notas = cita.notas || '';
        const cambios = notas.split('\n').filter(linea => {
          if (!linea || typeof linea !== 'string') return false;
          return linea.includes('Reasignación:') || 
                 linea.includes('Estado cambiado:') ||
                 linea.includes('Reprogramación:');
        });

        if (cambios.length > 0) {
          const citaConHistorial = {
            id: cita.id,
            fecha: cita.fecha,
            hora: cita.hora,
            estado: cita.estado || 'sin_estado',
            paciente: `${cita.paciente_nombre} ${cita.paciente_apellido}`.trim(),
            odontologo: `${cita.odontologo_nombre} ${cita.odontologo_apellido}`.trim(),
            total_cambios: cambios.length,
            ultimo_cambio: cambios[cambios.length - 1] || null,
            tipos_cambios: {
              reasignaciones: cambios.filter(c => c.includes('Reasignación:')).length,
              cambios_estado: cambios.filter(c => c.includes('Estado cambiado:')).length,
              reprogramaciones: cambios.filter(c => c.includes('Reprogramación:')).length
            }
          };
          citasConHistorial.push(citaConHistorial);
        }
      } catch (processingError) {
        console.warn('⚠️ [Historial] Error procesando cita:', cita.id, processingError.message);
        continue;
      }
    }

    console.log(`✅ [Historial] Citas procesadas con cambios: ${citasConHistorial.length}`);

    // Estadísticas generales con validaciones
    const estadisticas = {
      total_citas_con_cambios: citasConHistorial.length,
      total_reasignaciones: citasConHistorial.reduce((sum, cita) => {
        return sum + (cita.tipos_cambios?.reasignaciones || 0);
      }, 0),
      total_cambios_estado: citasConHistorial.reduce((sum, cita) => {
        return sum + (cita.tipos_cambios?.cambios_estado || 0);
      }, 0),
      total_reprogramaciones: citasConHistorial.reduce((sum, cita) => {
        return sum + (cita.tipos_cambios?.reprogramaciones || 0);
      }, 0)
    };

    console.log('✅ [Historial] Estadísticas calculadas:', estadisticas);

    return res.json({
      success: true,
      estadisticas: estadisticas,
      citas: citasConHistorial
    });

  } catch (err) {
    console.error('❌ [Historial] Error en obtenerHistorialGeneral:', err);
    console.error('❌ [Historial] Stack trace:', err.stack);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener historial general.',
      error: err.message,
      debug: {
        code: err.code,
        sqlState: err.sqlState
      }
    });
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
      WHERE c.odontologo_id = $1
      ORDER BY c.fecha DESC, c.hora DESC
    `;
    
    console.log('🔍 Ejecutando query para citas del odontólogo');
    const result = await db.query(query, [odontologo_id]);
    
    console.log(`✅ Citas del odontólogo encontradas: ${result.rows.length}`);
    
    // Formatear las citas con información adicional
    const citasFormateadas = result.rows.map(cita => ({
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
      total: result.rows.length,
      programadas: result.rows.filter(c => c.estado === 'programada' || !c.estado).length,
      completadas: result.rows.filter(c => c.estado === 'completada').length,
      canceladas: result.rows.filter(c => c.estado === 'cancelada').length,
      hoy: result.rows.filter(c => c.fecha && new Date(c.fecha).toDateString() === new Date().toDateString()).length,
      proximas: result.rows.filter(c => c.fecha && new Date(c.fecha) > new Date()).length
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
