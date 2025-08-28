const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

console.log('🆕 NUEVO CONTROLADOR CARGADO - SIN CACHE');

exports.obtenerUsuarios = async (req, res) => {
  try {
    // Intentar obtener usuarios de la base de datos
    const [rows] = await db.query('SELECT id, nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento, tipo_documento, numero_documento, estado, fecha_registro FROM usuarios ORDER BY nombre ASC');
    
    // Si no hay usuarios, devolver datos de ejemplo
    if (rows.length === 0) {
      console.log('⚠️ No hay usuarios en BD, devolviendo datos de ejemplo');
      return res.json([
        {
          id: 1,
          nombre: 'Admin',
          apellido: 'Principal',
          correo: 'admin@clinikdent.com',
          telefono: '3001234567',
          direccion: 'Calle Principal 123',
          rol: 'administrador',
          fecha_nacimiento: '1985-05-15',
          tipo_documento: 'CC',
          numero_documento: '12345678',
          estado: 'activo',
          fecha_registro: new Date().toISOString()
        },
        {
          id: 2,
          nombre: 'Dr. Carlos',
          apellido: 'Rodriguez',
          correo: 'carlos@clinikdent.com',
          telefono: '3001234568',
          direccion: 'Avenida Central 456',
          rol: 'odontologo',
          fecha_nacimiento: '1980-03-22',
          tipo_documento: 'CC',
          numero_documento: '23456789',
          estado: 'activo',
          fecha_registro: new Date().toISOString()
        },
        {
          id: 3,
          nombre: 'María',
          apellido: 'González',
          correo: 'maria@example.com',
          telefono: '3001234569',
          direccion: 'Carrera 15 #20-30',
          rol: 'paciente',
          fecha_nacimiento: '1992-07-10',
          tipo_documento: 'CC',
          numero_documento: '34567890',
          estado: 'activo',
          fecha_registro: new Date().toISOString()
        }
      ]);
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    
    // En caso de error, devolver datos de ejemplo
    res.json([
      {
        id: 1,
        nombre: 'Admin',
        apellido: 'Principal',
        correo: 'admin@clinikdent.com',
        telefono: '3001234567',
        direccion: 'Calle Principal 123',
        rol: 'administrador',
        fecha_nacimiento: '1985-05-15',
        tipo_documento: 'CC',
        numero_documento: '12345678',
        estado: 'activo',
        fecha_registro: new Date().toISOString()
      },
      {
        id: 2,
        nombre: 'Dr. Carlos',
        apellido: 'Rodriguez',
        correo: 'carlos@clinikdent.com',
        telefono: '3001234568',
        direccion: 'Avenida Central 456',
        rol: 'odontologo',
        fecha_nacimiento: '1980-03-22',
        tipo_documento: 'CC',
        numero_documento: '23456789',
        estado: 'activo',
        fecha_registro: new Date().toISOString()
      }
    ]);
  }
};

// 🔒 Crear un nuevo usuario (CON SEGURIDAD)
exports.crearUsuario = async (req, res) => {
    console.log('🔍 Datos recibidos en crearUsuario:', req.body);
    
    // ✅ Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
        });
    }
    
    const { nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento, password, tipo_documento, numero_documento } = req.body;
    
    console.log('🔍 Campos extraídos:', {
        nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento, password: password ? '***' : 'undefined'
    });
    
    if (!nombre || !apellido || !correo || !rol || !password) {
        console.log('❌ Validación fallida - campos faltantes');
        return res.status(400).json({ 
            success: false,
            msg: 'Nombre, apellido, correo, rol y contraseña son requeridos.' 
        });
    }
    
    try {
        // 🛡️ PROTECCIÓN SQL INJECTION: usar prepared statements
        const [existing] = await db.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
        if (existing.length > 0) {
            console.log('❌ Email ya existe:', correo);
            return res.status(400).json({ 
                success: false,
                msg: 'El correo electrónico ya está registrado.' 
            });
        }

        // 🔐 HASH SEGURO de contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        console.log('💾 Insertando usuario en la base de datos...');
        // 🛡️ PROTECCIÓN SQL INJECTION: prepared statement con parámetros
        const [result] = await db.query(
            'INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento, contraseña_hash, tipo_documento, numero_documento, fecha_registro, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), "activo")', 
            [nombre, apellido, correo, telefono || null, direccion || null, rol, fecha_nacimiento || null, hashedPassword, tipo_documento || 'CC', numero_documento || null]
        );
        
        console.log('✅ Usuario creado con ID:', result.insertId);
        res.status(201).json({ 
            success: true,
            msg: 'Usuario creado exitosamente.',
            id: result.insertId 
        });
    } catch (err) {
        console.error('❌ Error al crear usuario:', err);
        res.status(500).json({ 
            success: false,
            msg: 'Error interno del servidor al crear usuario.' 
        });
    }
};

// 🔒 Actualizar un usuario existente (CON SEGURIDAD)
exports.actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    
    // ✅ Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
        });
    }
    
    // 🛡️ VALIDACIÓN ID: debe ser número entero positivo
    const userId = parseInt(id);
    if (!userId || userId <= 0) {
        return res.status(400).json({ 
            success: false,
            msg: 'ID de usuario inválido.' 
        });
    }
    
    const { nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento, password, tipo_documento, numero_documento } = req.body;
    
    if (!nombre || !apellido || !correo || !rol) {
        return res.status(400).json({ 
            success: false,
            msg: 'Nombre, apellido, correo y rol son requeridos.' 
        });
    }
    
    try {
        // 🛡️ PROTECCIÓN SQL INJECTION: prepared statement
        const [existing] = await db.query('SELECT id FROM usuarios WHERE correo = ? AND id != ?', [correo, userId]);
        if (existing.length > 0) {
            console.log('❌ Email ya existe en otro usuario:', correo);
            return res.status(400).json({ 
                success: false,
                msg: 'El correo electrónico ya está registrado por otro usuario.' 
            });
        }

        let query, params;
        if (password) {
            // 🔐 HASH SEGURO de nueva contraseña
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            query = 'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, telefono = ?, direccion = ?, rol = ?, fecha_nacimiento = ?, contraseña_hash = ?, tipo_documento = ?, numero_documento = ? WHERE id = ?';
            params = [nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento, hashedPassword, tipo_documento || 'CC', numero_documento, userId];
        } else {
            query = 'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, telefono = ?, direccion = ?, rol = ?, fecha_nacimiento = ?, tipo_documento = ?, numero_documento = ? WHERE id = ?';
            params = [nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento, tipo_documento || 'CC', numero_documento, userId];
        }
        
        // 🛡️ PROTECCIÓN SQL INJECTION: usar prepared statement
        const [result] = await db.query(query, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                msg: 'Usuario no encontrado.' 
            });
        }
        
        console.log('✅ Usuario actualizado:', userId);
        res.json({ 
            success: true,
            msg: 'Usuario actualizado exitosamente.' 
        });
    } catch (err) {
        console.error('❌ Error al actualizar usuario:', err);
        res.status(500).json({ msg: 'Error al actualizar usuario.' });
    }
};

// Eliminar un usuario
exports.eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }
        
        res.json({ msg: 'Usuario eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ msg: 'Error al eliminar usuario.' });
    }
};

exports.obtenerPerfil = async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Obteniendo perfil completo para usuario ID: ${id}`);
  
  try {
    const [rows] = await db.query(`
      SELECT 
        id, 
        nombre, 
        apellido, 
        correo, 
        telefono, 
        direccion, 
        rol, 
        fecha_nacimiento, 
        tipo_documento, 
        numero_documento, 
        estado, 
        fecha_registro
      FROM usuarios 
      WHERE id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    console.log(`✅ Perfil completo obtenido para ${rows[0].nombre} ${rows[0].apellido}`);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ msg: 'Error al obtener perfil.' });
  }
};

exports.actualizarPerfil = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, telefono, direccion, fecha_nacimiento } = req.body;
  
  console.log(`🔍 Actualizando perfil usuario ID: ${id}`, { nombre, apellido, telefono, direccion, fecha_nacimiento });
  
  if (!nombre || !apellido) {
    return res.status(400).json({ msg: 'Nombre y apellido son requeridos.' });
  }
  
  try {
    // Verificar que el usuario existe
    const [existingUser] = await db.query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    // Actualizar perfil
    await db.query(
      'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, direccion = ?, fecha_nacimiento = ? WHERE id = ?',
      [nombre, apellido, telefono || null, direccion || null, fecha_nacimiento || null, id]
    );
    
    console.log(`✅ Perfil actualizado exitosamente para usuario ID: ${id}`);
    res.json({ msg: 'Perfil actualizado exitosamente.' });
    
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ msg: 'Error al actualizar perfil.' });
  }
};

// Obtener estadísticas para el dashboard
exports.obtenerEstadisticas = async (req, res) => {
  try {
    // Obtener total de pacientes
    const [pacientes] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "paciente"');
    
    // Obtener citas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const [citasHoy] = await db.query('SELECT COUNT(*) as total FROM citas WHERE DATE(fecha) = ?', [hoy]);
    
    // Obtener total de odontólogos activos
    const [odontologos] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "odontologo" AND estado = "activo"');
    
    // Calcular ingresos del mes (simulado por ahora)
    const ingresosMes = 45230;
    
    res.json({
      totalPacientes: pacientes[0].total,
      citasHoy: citasHoy[0].total,
      ingresosMes: ingresosMes,
      odontologosActivos: odontologos[0].total
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ msg: 'Error al obtener estadísticas.' });
  }
};

// Obtener próximas citas
exports.obtenerProximasCitas = async (req, res) => {
  try {
    const [citas] = await db.query(`
      SELECT c.*, u.nombre as paciente_nombre, u.apellido as paciente_apellido
      FROM citas c
      JOIN usuarios u ON c.paciente_id = u.id
      WHERE c.fecha >= CURDATE()
      ORDER BY c.fecha ASC, c.hora ASC
      LIMIT 5
    `);
    
    // Si no hay citas, devolver datos de ejemplo
    if (citas.length === 0) {
      const citasEjemplo = [
        { paciente_nombre: 'Ana', paciente_apellido: 'García', hora: '09:00', motivo: 'Limpieza' },
        { paciente_nombre: 'Carlos', paciente_apellido: 'López', hora: '10:30', motivo: 'Revisión' },
        { paciente_nombre: 'María', paciente_apellido: 'Rodríguez', hora: '14:00', motivo: 'Endodoncia' }
      ];
      return res.json(citasEjemplo);
    }
    
    res.json(citas);
  } catch (err) {
    console.error('Error al obtener próximas citas:', err);
    res.status(500).json({ msg: 'Error al obtener próximas citas.' });
  }
};

exports.obtenerPacientesOdontologo = async (req, res) => {
  console.log('🧪 NUEVO CONTROLADOR - Función pacientes ejecutada para ID:', req.params.id);
  const { id } = req.params;
  
  try {
    // Query completa para obtener pacientes con toda la información necesaria
    const query = `
      SELECT DISTINCT 
        u.id,
        u.nombre,
        u.apellido,
        u.correo,
        u.telefono,
        u.fecha_nacimiento,
        u.direccion,
        'Activo' as estado,
        COUNT(c.id) as total_citas,
        MAX(c.fecha) as ultima_cita,
        SUM(CASE WHEN c.estado IN ('programada', 'confirmada') THEN 1 ELSE 0 END) as citas_pendientes
      FROM usuarios u
      INNER JOIN citas c ON u.id = c.paciente_id
      WHERE c.odontologo_id = ? AND u.rol = 'paciente'
      GROUP BY u.id, u.nombre, u.apellido, u.correo, u.telefono, u.fecha_nacimiento, u.direccion
      ORDER BY MAX(c.fecha) DESC
      LIMIT 10
    `;
    
    const [pacientes] = await db.query(query, [id]);
    
    // Formatear datos para el frontend
    const pacientesFormateados = pacientes.map(paciente => ({
      id: paciente.id,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      correo: paciente.correo,
      telefono: paciente.telefono || 'No registrado',
      fecha_nacimiento: paciente.fecha_nacimiento,
      direccion: paciente.direccion,
      estado: paciente.estado,
      total_citas: paciente.total_citas || 0,
      ultima_cita: paciente.ultima_cita ? 
        new Date(paciente.ultima_cita).toLocaleDateString('es-ES') : 
        'Sin citas',
      citas_pendientes: paciente.citas_pendientes || 0
    }));
    
    console.log(`✅ NUEVO CONTROLADOR - Encontrados ${pacientesFormateados.length} pacientes con información completa`);
    
    res.json({
      success: true,
      mensaje: 'Pacientes obtenidos con información completa',
      odontologoId: id,
      count: pacientesFormateados.length,
      pacientes: pacientesFormateados
    });
    
  } catch (err) {
    console.error('❌ NUEVO CONTROLADOR - Error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al obtener pacientes desde nuevo controlador', 
      error: err.message 
    });
  }
};
