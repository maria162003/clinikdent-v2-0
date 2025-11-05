const db = require('../config/db');

exports.obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuarios ORDER BY nombre ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener usuarios.' });
  }
};

exports.crearUsuario = async (req, res) => {
  const { nombre, apellido, correo, rol, password } = req.body;
  if (!nombre || !apellido || !correo || !rol || !password) {
    return res.status(400).json({ msg: 'Datos incompletos.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO usuarios (nombre, apellido, correo, rol, contraseña_hash) VALUES (?, ?, ?, ?, ?)', [nombre, apellido, correo, rol, hashedPassword]);
    res.json({ msg: 'Usuario creado exitosamente.' });
  } catch (err) {
    res.status(500).json({ msg: 'Error al crear usuario.' });
  }
};

exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, rol } = req.body;
  if (!nombre || !apellido || !correo || !rol) {
    return res.status(400).json({ msg: 'Datos incompletos.' });
  }
  try {
    await db.query('UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, rol = ? WHERE id = ?', [nombre, apellido, correo, rol, id]);
    res.json({ msg: 'Usuario actualizado exitosamente.' });
  } catch (err) {
    res.status(500).json({ msg: 'Error al actualizar usuario.' });
  }
};

exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ msg: 'Usuario eliminado exitosamente.' });
  } catch (err) {
    res.status(500).json({ msg: 'Error al eliminar usuario.' });
  }
};

/**
 * GET /api/usuarios/:id/perfil
 * Obtiene el perfil completo del usuario
 */
exports.obtenerPerfil = async (req, res) => {
  const { id } = req.params;
  console.log(`👤 [usuarioController] Obteniendo perfil de usuario ID: ${id}`);
  
  try {
    const [usuario] = await db.query(
      'SELECT id, nombre, apellido, correo, telefono, direccion, rol, fecha_nacimiento FROM usuarios WHERE id = ?', 
      [id]
    );
    
    if (!usuario.length) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    console.log('✅ Perfil obtenido exitosamente');
    res.json(usuario[0]);
    
  } catch (err) {
    console.error('❌ Error al obtener perfil:', err);
    res.status(500).json({ msg: 'Error al obtener perfil.', error: err.message });
  }
};

/**
 * PUT /api/usuarios/:id/perfil
 * Actualiza el perfil del usuario (nombre, apellido, correo, teléfono, dirección)
 */
exports.actualizarPerfil = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, correo, telefono, direccion } = req.body;
  
  console.log(`📝 [usuarioController] Actualizando perfil de usuario ID: ${id}`);
  console.log('📋 Datos recibidos:', { nombre, apellido, correo, telefono, direccion });
  
  // Validar datos requeridos
  if (!nombre || !apellido || !correo) {
    return res.status(400).json({ msg: 'Nombre, apellido y correo son requeridos.' });
  }
  
  try {
    // Verificar que el usuario existe
    const [usuario] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!usuario.length) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    // Verificar que el correo no esté siendo usado por otro usuario
    const [correoExistente] = await db.query('SELECT id FROM usuarios WHERE correo = ? AND id != ?', [correo, id]);
    if (correoExistente.length > 0) {
      return res.status(400).json({ msg: 'Este correo electrónico ya está siendo usado por otro usuario.' });
    }

    // Actualizar el perfil
    await db.query(
      'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, telefono = ?, direccion = ? WHERE id = ?', 
      [nombre, apellido, correo, telefono || null, direccion || null, id]
    );
    
    // Obtener los datos actualizados
    const [usuarioActualizado] = await db.query('SELECT id, nombre, apellido, correo, telefono, direccion, rol FROM usuarios WHERE id = ?', [id]);
    
    console.log('✅ Perfil actualizado exitosamente');
    res.json({ 
      msg: 'Perfil actualizado exitosamente.',
      usuario: usuarioActualizado[0]
    });
    
  } catch (err) {
    console.error('❌ Error al actualizar perfil:', err);
    res.status(500).json({ msg: 'Error al actualizar perfil.', error: err.message });
  }
};

/**
 * GET /api/usuarios/:id/pacientes
 * Obtiene todos los pacientes que han tenido citas con un odontólogo específico
 */
exports.obtenerPacientesOdontologo = async (req, res) => {
  console.log('👥 [usuarioController] Obteniendo pacientes del odontólogo - FUNCIÓN CARGADA CORRECTAMENTE');
  const { id } = req.params; // ID del odontólogo
  
  console.log('🔍 ID del odontólogo recibido:', id);
  
  try {
    // Query simplificada usando solo columnas que sabemos que existen
    const query = `
      SELECT DISTINCT 
        u.id,
        u.nombre,
        u.apellido,
        u.correo,
        u.telefono,
        COUNT(c.id) as total_citas,
        MAX(c.fecha) as ultima_cita
      FROM usuarios u
      INNER JOIN citas c ON u.id = c.paciente_id
      WHERE c.odontologo_id = ? AND u.rol = 'paciente'
      GROUP BY u.id, u.nombre, u.apellido, u.correo, u.telefono
      ORDER BY MAX(c.fecha) DESC
    `;
    
    const [pacientes] = await db.query(query, [id]);
    
    console.log(`✅ Encontrados ${pacientes.length} pacientes para el odontólogo ${id}`);
    
    // Formatear los datos
    const pacientesFormateados = pacientes.map(paciente => ({
      id: paciente.id,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      correo: paciente.correo,
      telefono: paciente.telefono,
      total_citas: paciente.total_citas,
      ultima_cita: paciente.ultima_cita ? new Date(paciente.ultima_cita).toLocaleDateString('es-ES') : 'Nunca',
      nombre_completo: `${paciente.nombre} ${paciente.apellido}`
    }));
    
    res.json(pacientesFormateados);
    
  } catch (err) {
    console.error('❌ Error al obtener pacientes del odontólogo:', err);
    res.status(500).json({ msg: 'Error al obtener pacientes.', error: err.message });
  }
};

// Nueva función simple de prueba
exports.obtenerPacientesSimple = async (req, res) => {
  console.log('🧪 Función simple ejecutada para ID:', req.params.id);
  const { id } = req.params;
  
  try {
    // Query simple para obtener pacientes
    const query = `
      SELECT DISTINCT 
        u.id,
        u.nombre,
        u.apellido,
        u.correo
      FROM usuarios u
      INNER JOIN citas c ON u.id = c.paciente_id
      WHERE c.odontologo_id = ? AND u.rol = 'paciente'
      LIMIT 10
    `;
    
    const [pacientes] = await db.query(query, [id]);
    
    console.log(`✅ Encontrados ${pacientes.length} pacientes`);
    
    res.json({
      success: true,
      odontologoId: id,
      count: pacientes.length,
      pacientes: pacientes
    });
    
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al obtener pacientes', 
      error: err.message 
    });
  }
};
