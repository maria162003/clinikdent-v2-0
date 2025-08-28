const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('../services/emailService');

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
    const [rows] = await db.query(
      'SELECT id, nombre, apellido FROM usuarios WHERE correo = ? AND numero_documento = ?',
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
    
    // Limpiar tokens antiguos del usuario
    await db.query(
      'DELETE FROM password_reset_tokens WHERE usuario_id = ? OR expires_at < NOW()',
      [usuario.id]
    );
    
    // Guardar nuevo token
    await db.query(
      'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
      [usuario.id, resetToken, expiresAt]
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

// Función temporal simple para login
exports.loginUser = async (req, res) => {
  const { correo, password, rol } = req.body;
  
  console.log('🔐 Intento de login:', { correo, rol, password: password ? '***' : 'undefined' });
  
  if (!correo || !password || !rol) {
    console.log('❌ Campos faltantes en login');
    return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
  }

  try {
    // Buscar usuario por correo
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    
    if (!rows.length) {
      console.log('❌ Usuario no encontrado:', correo);
      return res.status(400).json({ msg: 'Usuario no encontrado.' });
    }

    const u = rows[0];
    
    // Verificar rol
    if (u.rol !== rol) {
      console.log('❌ Rol incorrecto. Esperado:', rol, 'Actual:', u.rol);
      return res.status(403).json({ msg: 'Rol incorrecto.' });
    }

    const pass = String(password).trim();
    const hash = u['contraseña_hash'];

    let ok = false;
    let isTokenLogin = false;

    // Verificar si es un token de recuperación (6 dígitos)
    if (pass.length === 6 && /^\d{6}$/.test(pass)) {
      console.log('🔑 Verificando token de recuperacion:', pass);
      try {
        const [tokenRows] = await db.query(
          'SELECT id FROM password_reset_tokens WHERE usuario_id = ? AND token = ? AND expires_at > NOW()',
          [u.id, pass]
        );
        
        if (tokenRows.length > 0) {
          console.log('✅ Token de recuperacion valido');
          ok = true;
          isTokenLogin = true;
          
          // Eliminar el token usado
          await db.query('DELETE FROM password_reset_tokens WHERE id = ?', [tokenRows[0].id]);
        } else {
          console.log('❌ Token de recuperacion invalido o expirado');
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
            await db.query('UPDATE usuarios SET `contraseña_hash` = ? WHERE id = ?', [newHash, u.id]);
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
      rol: u.rol, 
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
    const [rows] = await db.query(
      'SELECT id, contraseña_hash FROM usuarios WHERE id = ?',
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
      'UPDATE usuarios SET contraseña_hash = ? WHERE id = ?',
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
    
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (apellido !== undefined) {
      updates.push('apellido = ?');
      values.push(apellido);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono);
    }
    if (direccion !== undefined) {
      updates.push('direccion = ?');
      values.push(direccion);
    }
    if (fecha_nacimiento !== undefined) {
      updates.push('fecha_nacimiento = ?');
      values.push(fecha_nacimiento);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ msg: 'No hay datos para actualizar.' });
    }
    
    values.push(userId);
    
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
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
