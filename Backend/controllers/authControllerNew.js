const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('../services/emailService');

/**
 * POST /api/auth/register
 * body: { nombre, apellido, correo, telefono, password, rol, numero_documento, tipo_documento }
 */
exports.registerUser = async (req, res) => {
  console.log('🔐 registerUser - Datos recibidos:', req.body);
  console.log('🔍 Headers recibidos:', req.headers);
  
  const { nombre, apellido, correo, telefono, password, rol, numero_documento, tipo_documento, direccion, fecha_nacimiento } = req.body;
  
  console.log('📋 Datos extraídos:', { nombre, apellido, correo, telefono, rol, numero_documento, tipo_documento });
  
  if (!nombre || !apellido || !correo || !password || !rol) {
    console.log('❌ Validación fallida - Campos requeridos faltantes');
    return res.status(400).json({ msg: 'Nombre, apellido, correo, contraseña y rol son requeridos.' });
  }
  
  if (password.length < 6) {
    console.log('❌ Validación fallida - Contraseña muy corta');
    return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  
  try {
    // Verificar si el email ya existe
    const { rows: existing } = await db.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (existing.length > 0) {
      console.log('❌ Email ya existe:', correo);
      return res.status(400).json({ msg: 'El correo electrónico ya está registrado.' });
    }
    
    // Verificar si el número de documento ya existe
    if (numero_documento) {
      const { rows: existingDoc } = await db.query('SELECT id FROM usuarios WHERE numero_documento = $1', [numero_documento]);
      if (existingDoc.length > 0) {
        console.log('❌ Número de documento ya existe:', numero_documento);
        return res.status(400).json({ msg: 'El número de documento ya está registrado.' });
      }
    }
    
    // Verificar y normalizar el rol
    let rolNormalizado = rol.toLowerCase();
    if (rolNormalizado === 'admin') {
      rolNormalizado = 'administrador';
    }
    
    // Validar que el rol sea uno de los permitidos
    if (!['paciente', 'odontologo', 'administrador'].includes(rolNormalizado)) {
      console.log('❌ Rol no válido:', rol);
      return res.status(400).json({ msg: `Rol no válido: ${rol}. Roles permitidos: paciente, odontologo, administrador` });
    }
    
    // Obtener el rol_id basado en el nombre del rol
    const { rows: rolResult } = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNormalizado]);
    if (rolResult.length === 0) {
      console.log('❌ Rol no encontrado en la base de datos:', rolNormalizado);
      return res.status(400).json({ msg: `Rol "${rolNormalizado}" no encontrado en la base de datos` });
    }
    const rol_id = rolResult[0].id;
    
    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('💾 Insertando usuario en la base de datos...');
    // Insertar usuario usando los campos correctos de la tabla
    const { rows: result } = await db.query(
      'INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, rol_id, fecha_nacimiento, contraseña_hash, tipo_documento, numero_documento, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING id', 
      [nombre, apellido, correo, telefono || null, direccion || null, rol_id, fecha_nacimiento || null, passwordHash, tipo_documento || 'CC', numero_documento || null]
    );
    
    console.log('✅ Usuario creado con ID:', result[0].id);
    
    // Enviar correo de bienvenida
    try {
      const emailService = require('../services/emailService');
      console.log('📧 Enviando correo de bienvenida...');
      const emailResult = await emailService.sendWelcomeEmail(correo, nombre, rolNormalizado);
      
      if (emailResult.success) {
        console.log('✅ Correo de bienvenida enviado exitosamente');
      } else {
        console.log('⚠️ No se pudo enviar el correo de bienvenida:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error al enviar correo de bienvenida:', emailError);
      // No fallar el registro por problemas de email
    }
    
    res.status(201).json({ 
      msg: 'Usuario registrado exitosamente.',
      id: result[0].id,
      success: true
    });
    
  } catch (err) {
    console.error('❌ Error en registerUser:', err);
    return res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * POST /api/auth/recuperar
 * body: { correo, numero_documento }
 */
exports.recuperarPassword = async (req, res) => {
  console.log('=== NUEVA FUNCION DE RECUPERACION EJECUTANDOSE ===');
  console.log('Datos recibidos:', req.body);
  
  const { correo, numero_documento } = req.body;
  if (!correo || !numero_documento) {
    return res.status(400).json({ msg: 'Debe ingresar correo y documento.' });
  }
  
  try {
    // Verificar que el usuario existe
    const { rows } = await db.query(
      'SELECT id, nombre, apellido FROM usuarios WHERE correo = $1 AND numero_documento = $2',
      [correo, numero_documento]
    );
    
    if (!rows.length) {
      return res.status(400).json({ msg: 'Los datos ingresados no coinciden con ninguna cuenta.' });
    }
    
    const usuario = rows[0];
    console.log('Usuario encontrado:', usuario.nombre, usuario.apellido);
    
    // Generar token simple de 6 dígitos
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Token generado:', resetToken);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    console.log('🕐 Tiempo actual JS:', new Date());
    console.log('🕐 Token expira JS:', expiresAt);
    console.log('🕐 Token expira ISO:', expiresAt.toISOString());
    
    // ARREGLO DEFINITIVO: Usar UTC directo sin conversiones
    const nowUtc = Math.floor(Date.now() / 1000); // Tiempo actual en UTC segundos
    const expiresUtc = nowUtc + (60 * 60); // +1 hora en segundos UTC
    const expiresAtDate = new Date(expiresUtc * 1000); // Convertir a Date para BD
    
    console.log('🕐 DEFINITIVO - Ahora UTC segundos:', nowUtc);
    console.log('🕐 DEFINITIVO - Expira UTC segundos:', expiresUtc);
    console.log('🕐 DEFINITIVO - Expira como Date:', expiresAtDate.toISOString());
    
    // Limpiar tokens antiguos del usuario
    await db.query(
      'DELETE FROM password_reset_tokens WHERE usuario_id = $1 OR expires_at < NOW()',
      [usuario.id]
    );
    
    // Guardar nuevo token usando el timestamp corregido
    await db.query(
      'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)',
      [usuario.id, resetToken, expiresAtDate]
    );
    
    console.log('Token guardado en BD');
    
    // Enviar email de recuperación
    console.log('Enviando email de recuperacion...');
    const emailResult = await emailService.sendPasswordResetEmail(
      correo,
      resetToken, 
      `${usuario.nombre} ${usuario.apellido}`
    );
    console.log('Resultado del email:', emailResult);
    
    if (emailResult.success) {
      console.log(`Email enviado exitosamente a ${correo}`);
      return res.json({ 
        msg: 'Se enviaron las instrucciones de recuperación a tu correo electrónico.',
        success: true
      });
    } else {
      console.error('Error enviando email:', emailResult.error);
      return res.json({ 
        msg: 'Token generado, pero hubo un problema enviando el email.',
        success: true,
        debug: { token: resetToken, error: emailResult.error }
      });
    }
    
  } catch (err) {
    console.error('Error en recuperarPassword:', err);
    return res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

// Función de login unificado con detección automática de rol
exports.loginUser = async (req, res) => {
  const { correo, password, rol } = req.body;
  
  console.log('🔐 Intento de login:', { correo, rol, password: password ? '***' : 'undefined' });
  
  if (!correo || !password) {
    console.log('❌ Campos faltantes en login');
    return res.status(400).json({ msg: 'Correo y contraseña son obligatorios.' });
  }

  try {
    // Buscar usuario por correo con JOIN para obtener el nombre del rol
    const { rows } = await db.query(`
      SELECT u.*, r.nombre as rol 
      FROM usuarios u 
      LEFT JOIN roles r ON u.rol_id = r.id 
      WHERE u.correo = $1
    `, [correo]);
    
    if (!rows.length) {
      console.log('❌ Usuario no encontrado:', correo);
      return res.status(400).json({ msg: 'Usuario no encontrado.' });
    }

    const u = rows[0];
    console.log('👤 Usuario encontrado - Email:', u.correo, '| Rol DB:', u.rol, '| Rol solicitado:', rol || 'AUTO-DETECTAR');
    // Verificar que la cuenta esté activa
    // En la BD la columna puede ser boolean (true/false) o valores textuales; manejamos ambos casos
    if (u.activo === false || u.activo === 'false' || u.activo === 'f' || u.activo === 0) {
      console.log('⛔ Intento de login en cuenta inactiva:', correo);
      return res.status(403).json({ msg: 'La cuenta está inactiva. Contacta al administrador.' });
    }
    
    // Si se especifica un rol, verificar que coincida
    if (rol && u.rol !== rol) {
      console.log('❌ Rol incorrecto. Esperado:', rol, 'Actual:', u.rol);
      return res.status(403).json({ msg: 'Rol incorrecto. Tu rol es: ' + (u.rol || 'sin asignar') });
    }
    
    // Si no se especifica rol, usar el rol del usuario
    const rolFinal = rol || u.rol;
    console.log('✅ Rol final determinado:', rolFinal);

    const pass = String(password).trim();
    const hash = u['contraseña_hash'];

    let ok = false;
    let isTokenLogin = false;

    // Verificar si es un token de recuperación (6 dígitos)
    if (pass.length === 6 && /^\d{6}$/.test(pass)) {
      console.log('🔑 Verificando token de recuperacion:', pass);
      console.log('🔍 Buscando para usuario ID:', u.id);
      try {
        const { rows: tokenRows } = await db.query(
          'SELECT id, expires_at FROM password_reset_tokens WHERE usuario_id = $1 AND token = $2',
          [u.id, pass]
        );
        
        console.log('🔍 Tokens encontrados:', tokenRows.length);
        if (tokenRows.length > 0) {
          const token = tokenRows[0];
          console.log('🔍 Token encontrado:', token);
          
          // Verificar manualmente usando UTC directo
          const nowUtc = Math.floor(Date.now() / 1000);
          const expiresUtc = Math.floor(new Date(token.expires_at).getTime() / 1000);
          const isValid = expiresUtc > nowUtc;
          
          console.log('🕐 Ahora UTC:', nowUtc);
          console.log('🕐 Expira UTC:', expiresUtc);
          console.log('🔍 ¿Token válido? (UTC directo):', isValid);
          
          if (isValid) {
            console.log('✅ Token de recuperacion valido (UTC directo)');
            ok = true;
            isTokenLogin = true;
            
            // Eliminar el token usado
            await db.query('DELETE FROM password_reset_tokens WHERE id = $1', [token.id]);
            console.log('🗑️ Token eliminado después del uso');
          } else {
            console.log('❌ Token expirado (UTC directo)');
          }
        }
      } catch (tokenError) {
        console.error('⚠️ Error verificando token (tabla puede no existir):', tokenError.message);
        // Continuar con verificación de contraseña normal si la tabla no existe
      }
    }

    // Si no es token válido, verificar contraseña normal
    if (!ok) {
      try {
        if (hash && hash.startsWith('$2')) {
          // Hash bcrypt
          ok = await bcrypt.compare(pass, hash);
          console.log('🔐 Verificacion bcrypt:', ok ? 'exitosa' : 'fallida');
        } else {
          // Contraseña en texto plano (legado)
          ok = pass === (hash || '');
          console.log('🔐 Verificacion texto plano:', ok ? 'exitosa' : 'fallida');
          
          // Si es correcta, actualizar a bcrypt
          if (ok) {
            console.log('🔄 Actualizando contraseña a bcrypt...');
            const newHash = await bcrypt.hash(pass, 10);
            await db.query('UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2', [newHash, u.id]);
          }
        }
      } catch (passwordError) {
        console.error('Error verificando contraseña:', passwordError);
        ok = false;
      }
    }

    // Si la contraseña/token no es correcta
    if (!ok) {
      console.log('❌ Contraseña incorrecta para usuario:', correo);
      return res.status(400).json({ msg: 'Contraseña incorrecta.' });
    }

    // Login exitoso
    const response = { 
      msg: isTokenLogin ? 'Login exitoso con token de recuperación' : 'Login exitoso', 
      rol: rolFinal || u.rol, 
      id: u.id, 
      nombre: u.nombre,
      apellido: u.apellido
    };

    if (isTokenLogin) {
      response.tokenLogin = true;
      response.suggestion = 'Se recomienda cambiar la contraseña por seguridad';
      console.log('🔑 LOGIN CON TOKEN - Enviando response con tokenLogin:', response);
    } else {
      console.log('🔐 LOGIN NORMAL - Enviando response sin tokenLogin:', response);
    }

    return res.json(response);
    
  } catch (err) {
    console.error('❌ Error inesperado en loginUser:', err);
    console.error('Stack trace:', err.stack);
    return res.status(500).json({ 
      msg: 'Error interno del servidor. Por favor, intente nuevamente.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * POST /api/auth/cambiar-password
 * body: { userId, current_password, new_password }
 */
exports.cambiarPassword = async (req, res) => {
  console.log('🔐 cambiarPassword - Datos recibidos:', req.body);
  console.log('🔐 cambiarPassword - Headers:', req.headers);
  console.log('🔐 cambiarPassword - Método:', req.method);
  
  const { userId, current_password, new_password } = req.body;
  
  if (!current_password || !new_password || !userId) {
    return res.status(400).json({ msg: 'Contraseña actual, nueva contraseña y usuario son requeridos.' });
  }
  
  if (new_password.length < 6) {
    return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  
  try {
    // Verificar que el usuario existe y obtener su contraseña actual
    const { rows } = await db.query(
      'SELECT id, contraseña_hash FROM usuarios WHERE id = $1',
      [userId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    const usuario = rows[0];
    const currentHash = usuario['contraseña_hash'];
    
    // Verificar contraseña actual
    let isValidCurrent = false;
    
    if (currentHash && currentHash.startsWith('$2')) {
      // Hash bcrypt
      isValidCurrent = await bcrypt.compare(current_password, currentHash);
    } else {
      // Contraseña en texto plano (legado)
      isValidCurrent = current_password === (currentHash || '');
    }
    
    if (!isValidCurrent) {
      return res.status(400).json({ msg: 'La contraseña actual es incorrecta.' });
    }
    
    // Generar hash de la nueva contraseña
    const newHash = await bcrypt.hash(new_password, 10);
    
    // Actualizar la contraseña
    await db.query(
      'UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2',
      [newHash, userId]
    );
    
    console.log(`Contraseña cambiada exitosamente para usuario ${userId}`);
    return res.json({ 
      msg: 'Contraseña cambiada exitosamente.',
      success: true
    });
    
  } catch (err) {
    console.error('cambiarPassword:', err);
    return res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * PUT /api/auth/actualizar-perfil
 * body: { userId, nombre, apellido, telefono, direccion, fecha_nacimiento }
 */
exports.actualizarPerfil = async (req, res) => {
  console.log('👤 actualizarPerfil - Datos recibidos:', req.body);
  const { userId, nombre, apellido, telefono, direccion, fecha_nacimiento } = req.body;
  
  if (!userId) {
    return res.status(400).json({ msg: 'ID de usuario es requerido.' });
  }
  
  try {
    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    
    let paramIdx = 1;
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIdx++}`);
      values.push(nombre);
    }
    if (apellido !== undefined) {
      updates.push(`apellido = $${paramIdx++}`);
      values.push(apellido);
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramIdx++}`);
      values.push(telefono);
    }
    if (direccion !== undefined) {
      updates.push(`direccion = $${paramIdx++}`);
      values.push(direccion);
    }
    if (fecha_nacimiento !== undefined) {
      updates.push(`fecha_nacimiento = $${paramIdx++}`);
      values.push(fecha_nacimiento);
    }
    if (updates.length === 0) {
      return res.status(400).json({ msg: 'No hay datos para actualizar.' });
    }
    values.push(userId);
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIdx}`;
    await db.query(query, values);
    
    console.log(`Perfil actualizado exitosamente para usuario ${userId}`);
    return res.json({ 
      msg: 'Perfil actualizado exitosamente.',
      success: true
    });
    
  } catch (err) {
    console.error('actualizarPerfil:', err);
    return res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * POST /api/auth/reset-password
 * body: { correo, token, nueva_password }
 * Resetea la contraseña usando el token de 6 dígitos
 */
exports.resetPasswordWithToken = async (req, res) => {
  console.log('🔐 resetPasswordWithToken - Datos recibidos:', req.body);
  
  const { correo, token, nueva_password } = req.body;
  
  if (!correo || !token || !nueva_password) {
    return res.status(400).json({ msg: 'Correo, token y nueva contraseña son requeridos.' });
  }

  if (nueva_password.length < 6) {
    return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // Buscar el usuario por correo
    const userQuery = await db.query(
      'SELECT id, nombre, apellido FROM usuarios WHERE correo = $1',
      [correo]
    );
    
    if (!userQuery.rows.length) {
      return res.status(400).json({ msg: 'Usuario no encontrado.' });
    }
    
    const usuario = userQuery.rows[0];
    console.log('Usuario encontrado:', usuario.nombre, usuario.apellido);
    
    // Verificar el token
    const tokenQuery = await db.query(
      'SELECT id, expires_at FROM password_reset_tokens WHERE usuario_id = $1 AND token = $2 AND expires_at > NOW()',
      [usuario.id, token]
    );
    
    if (!tokenQuery.rows.length) {
      return res.status(400).json({ msg: 'Token inválido o expirado.' });
    }
    
    console.log('Token válido, procediendo a cambiar contraseña...');
    
    // Generar hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(nueva_password, 10);
    
    // Actualizar la contraseña
    await db.query(
      'UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2',
      [passwordHash, usuario.id]
    );
    
    // Eliminar todos los tokens de este usuario
    await db.query(
      'DELETE FROM password_reset_tokens WHERE usuario_id = $1',
      [usuario.id]
    );
    
    console.log(`Contraseña reseteada exitosamente para usuario ${usuario.id}`);
    
    return res.json({ 
      msg: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
      success: true
    });
    
  } catch (err) {
    console.error('resetPasswordWithToken:', err);
    return res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * POST /api/auth/cambiar-password-token
 * Cambiar contraseña después de login con token (sin requerir contraseña actual)
 * body: { userId, new_password }
 */
exports.cambiarPasswordConToken = async (req, res) => {
  console.log('🔐 cambiarPasswordConToken - Datos recibidos:', req.body);
  
  const { userId, new_password } = req.body;
  
  if (!new_password || !userId) {
    return res.status(400).json({ msg: 'Nueva contraseña y usuario son requeridos.' });
  }
  
  if (new_password.length < 6) {
    return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  
  try {
    // Verificar que el usuario existe
    const { rows } = await db.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [userId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    // Generar hash de la nueva contraseña
    const newHash = await bcrypt.hash(new_password, 10);
    
    // Actualizar la contraseña
    await db.query(
      'UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2',
      [newHash, userId]
    );
    
    console.log(`✅ Contraseña cambiada exitosamente para usuario ${userId} después de login con token`);
    return res.json({ 
      msg: 'Contraseña cambiada exitosamente. Ya puedes usar tu nueva contraseña.',
      success: true
    });
    
  } catch (err) {
    console.error('cambiarPasswordConToken:', err);
    return res.status(500).json({ msg: 'Error en el servidor.' });
  }
};
