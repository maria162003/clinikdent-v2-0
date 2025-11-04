const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');

// 🔐 Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_demo_2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret_key_demo_2025';
const JWT_EXPIRES_IN = '15m'; // Token principal expira en 15 minutos
const REFRESH_EXPIRES_IN = '7d'; // Refresh token expira en 7 días

// 📧 Configuración de email
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🛡️ Generar tokens seguros
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.correo,
    role: user.rol,
    type: 'access'
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'clinikdent',
    audience: 'clinikdent-users'
  });

  const refreshPayload = {
    id: user.id,
    email: user.correo,
    type: 'refresh',
    tokenVersion: user.token_version || 1
  };

  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { 
    expiresIn: REFRESH_EXPIRES_IN,
    issuer: 'clinikdent',
    audience: 'clinikdent-users'
  });

  return { accessToken, refreshToken };
};

// 📝 Auditoría de acciones críticas
const logAuditAction = async (userId, action, details, ipAddress) => {
  try {
    await pool.query(`
      INSERT INTO audit_log (user_id, action, details, ip_address, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
    `, [userId, action, JSON.stringify(details), ipAddress]);
  } catch (error) {
    console.error('❌ Error logging audit:', error);
  }
};

// 📧 Enviar email de confirmación
const sendConfirmationEmail = async (email, token, nombre) => {
  const confirmationUrl = `${process.env.FRONTEND_URL}/confirmar-registro?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🦷 Confirma tu registro en Clinik Dent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00a3e1, #0077b6); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🦷 Clinik Dent</h1>
          <p style="color: white; margin: 10px 0 0 0;">Bienvenido a nuestra plataforma</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #0077b6;">¡Hola ${nombre}!</h2>
          <p>Gracias por registrarte en Clinik Dent. Para completar tu registro, confirma tu email haciendo clic en el botón:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: #00a3e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              ✅ Confirmar Email
            </a>
          </div>
          
          <p><strong>⚠️ Importante:</strong></p>
          <ul>
            <li>Este enlace expira en <strong>24 horas</strong></li>
            <li>Solo funciona una vez</li>
            <li>Si no solicitaste este registro, ignora este email</li>
          </ul>
          
          <p>Si el botón no funciona, copia y pega este enlace:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 3px;">
            ${confirmationUrl}
          </p>
        </div>
        
        <div style="background: #0077b6; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>Clinik Dent - Tu salud dental es nuestra prioridad</p>
          <p>Este email fue enviado automáticamente, no responder.</p>
        </div>
      </div>
    `
  };

  return emailTransporter.sendMail(mailOptions);
};

// 👤 Registro de usuario seguro
const registerUser = async (req, res) => {
  try {
    // 🔍 Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAuditAction(null, 'REGISTER_VALIDATION_FAILED', { errors: errors.array(), ip: req.ip }, req.ip);
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const {
      nombre,
      apellido,
      correo,
      password,
      telefono,
      tipo_documento,
      numero_documento,
      direccion,
      fecha_nacimiento
    } = req.body;

    // 🔍 Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE correo = $1',
      [correo.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      await logAuditAction(null, 'REGISTER_EMAIL_EXISTS', { email: correo }, req.ip);
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    // 🔍 Verificar si el documento ya existe
    const existingDoc = await pool.query(
      'SELECT id FROM usuarios WHERE numero_documento = $1',
      [numero_documento]
    );

    if (existingDoc.rows.length > 0) {
      await logAuditAction(null, 'REGISTER_DOCUMENT_EXISTS', { documento: numero_documento }, req.ip);
      return res.status(400).json({
        success: false,
        message: 'El número de documento ya está registrado'
      });
    }

    // 🔐 Hash de la contraseña (salt rounds = 12 para demo)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 🎫 Generar token de confirmación único
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // 💾 Insertar usuario (estado: pendiente de confirmación)
    const newUser = await pool.query(`
      INSERT INTO usuarios (
        nombre, apellido, correo, password, telefono, 
        tipo_documento, numero_documento, direccion, fecha_nacimiento,
        rol, estado, confirmation_token, confirmation_token_expires,
        token_version, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id, nombre, apellido, correo, rol, estado
    `, [
      nombre.trim(),
      apellido.trim(), 
      correo.toLowerCase(),
      hashedPassword,
      telefono,
      tipo_documento,
      numero_documento,
      direccion.trim(),
      fecha_nacimiento,
      'paciente', // rol por defecto
      'pendiente_confirmacion', // estado inicial
      confirmationToken,
      tokenExpiry,
      1 // token_version inicial
    ]);

    const user = newUser.rows[0];

    // 📧 Enviar email de confirmación
    try {
      await sendConfirmationEmail(correo, confirmationToken, nombre);
      console.log(`✅ Email de confirmación enviado a: ${correo}`);
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
      // No fallar el registro por el email, pero loggearlo
      await logAuditAction(user.id, 'REGISTER_EMAIL_FAILED', { error: emailError.message }, req.ip);
    }

    // 📝 Auditoría exitosa
    await logAuditAction(user.id, 'USER_REGISTERED', { 
      email: correo,
      nombre: nombre,
      documento: numero_documento 
    }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.',
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
        estado: user.estado
      }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    await logAuditAction(null, 'REGISTER_ERROR', { error: error.message }, req.ip);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ✅ Confirmar registro por email
const confirmRegistration = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de confirmación requerido'
      });
    }

    // 🔍 Buscar usuario con token válido
    const user = await pool.query(`
      SELECT id, nombre, correo, estado, confirmation_token_expires
      FROM usuarios 
      WHERE confirmation_token = $1 
      AND estado = 'pendiente_confirmacion'
    `, [token]);

    if (user.rows.length === 0) {
      await logAuditAction(null, 'CONFIRM_INVALID_TOKEN', { token }, req.ip);
      return res.status(400).json({
        success: false,
        message: 'Token de confirmación inválido o ya utilizado'
      });
    }

    const userData = user.rows[0];

    // ⏰ Verificar si el token ha expirado
    if (new Date() > new Date(userData.confirmation_token_expires)) {
      await logAuditAction(userData.id, 'CONFIRM_TOKEN_EXPIRED', {}, req.ip);
      return res.status(400).json({
        success: false,
        message: 'El token de confirmación ha expirado. Solicita un nuevo registro.'
      });
    }

    // ✅ Activar cuenta
    await pool.query(`
      UPDATE usuarios 
      SET estado = 'activo', 
          confirmation_token = NULL, 
          confirmation_token_expires = NULL,
          email_verified_at = NOW()
      WHERE id = $1
    `, [userData.id]);

    // 📝 Auditoría
    await logAuditAction(userData.id, 'EMAIL_CONFIRMED', { email: userData.correo }, req.ip);

    res.json({
      success: true,
      message: `¡Bienvenido ${userData.nombre}! Tu cuenta ha sido confirmada exitosamente.`,
      redirect: '/login'
    });

  } catch (error) {
    console.error('❌ Error confirmando registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// 🔐 Login seguro con JWT
const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAuditAction(null, 'LOGIN_VALIDATION_FAILED', { errors: errors.array() }, req.ip);
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { correo, password } = req.body;

    // 🔍 Buscar usuario
    const userResult = await pool.query(`
      SELECT id, nombre, apellido, correo, password, rol, estado, token_version,
             failed_login_attempts, locked_until
      FROM usuarios 
      WHERE correo = $1
    `, [correo.toLowerCase()]);

    if (userResult.rows.length === 0) {
      await logAuditAction(null, 'LOGIN_USER_NOT_FOUND', { email: correo }, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const user = userResult.rows[0];

    // 🔒 Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      await logAuditAction(user.id, 'LOGIN_ACCOUNT_LOCKED', {}, req.ip);
      return res.status(423).json({
        success: false,
        message: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos'
      });
    }

    // ✅ Verificar si la cuenta está activa
    if (user.estado !== 'activo') {
      await logAuditAction(user.id, 'LOGIN_ACCOUNT_INACTIVE', { estado: user.estado }, req.ip);
      return res.status(401).json({
        success: false,
        message: user.estado === 'pendiente_confirmacion' 
          ? 'Debes confirmar tu email antes de iniciar sesión'
          : 'Cuenta inactiva. Contacta al administrador.'
      });
    }

    // 🔐 Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Incrementar intentos fallidos
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = failedAttempts >= 5 
        ? new Date(Date.now() + 30 * 60 * 1000) // Bloquear 30 minutos
        : null;

      await pool.query(`
        UPDATE usuarios 
        SET failed_login_attempts = $1, locked_until = $2
        WHERE id = $3
      `, [failedAttempts, lockUntil, user.id]);

      await logAuditAction(user.id, 'LOGIN_FAILED_PASSWORD', { 
        attempts: failedAttempts,
        locked: !!lockUntil
      }, req.ip);

      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // ✅ Login exitoso - resetear intentos fallidos
    await pool.query(`
      UPDATE usuarios 
      SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
      WHERE id = $1
    `, [user.id]);

    // 🎫 Generar tokens
    const tokens = generateTokens(user);

    // 💾 Guardar refresh token en DB
    await pool.query(`
      INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      tokens.refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      req.ip,
      req.get('User-Agent') || 'Unknown'
    ]);

    // 📝 Auditoría de login exitoso
    await logAuditAction(user.id, 'LOGIN_SUCCESS', { 
      email: correo,
      role: user.rol 
    }, req.ip);

    // 🍪 Configurar cookies seguras
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    };

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol
      },
      accessToken: tokens.accessToken,
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    await logAuditAction(null, 'LOGIN_ERROR', { error: error.message }, req.ip);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// 🔄 Renovar token usando refresh token
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // 🔍 Verificar refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // 🔍 Verificar que el token existe en la DB y no ha expirado
    const sessionResult = await pool.query(`
      SELECT us.id, us.user_id, us.expires_at, u.nombre, u.apellido, u.correo, u.rol, u.token_version
      FROM user_sessions us
      JOIN usuarios u ON us.user_id = u.id
      WHERE us.refresh_token = $1 AND us.expires_at > NOW() AND u.estado = 'activo'
    `, [refreshToken]);

    if (sessionResult.rows.length === 0) {
      await logAuditAction(decoded.id, 'REFRESH_TOKEN_INVALID', {}, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado'
      });
    }

    const session = sessionResult.rows[0];

    // 🔍 Verificar token version (para invalidación global)
    if (decoded.tokenVersion !== session.token_version) {
      await logAuditAction(session.user_id, 'REFRESH_TOKEN_VERSION_MISMATCH', {}, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Inicia sesión nuevamente.'
      });
    }

    // 🎫 Generar nuevo access token
    const newTokens = generateTokens(session);

    // 📝 Auditoría
    await logAuditAction(session.user_id, 'TOKEN_REFRESHED', {}, req.ip);

    res.json({
      success: true,
      accessToken: newTokens.accessToken,
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    console.error('❌ Error renovando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// 🚪 Logout seguro (invalidar todas las sesiones)
const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const userId = req.user?.id; // Viene del middleware de auth

    if (refreshToken) {
      // 🗑️ Eliminar sesión específica
      await pool.query('DELETE FROM user_sessions WHERE refresh_token = $1', [refreshToken]);
    }

    if (userId) {
      // 📝 Auditoría
      await logAuditAction(userId, 'LOGOUT', {}, req.ip);
    }

    // 🍪 Limpiar cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// 🚪 Logout de todas las sesiones
const logoutAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🗑️ Eliminar todas las sesiones del usuario
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

    // 🔄 Incrementar token version para invalidar todos los JWTs
    await pool.query('UPDATE usuarios SET token_version = token_version + 1 WHERE id = $1', [userId]);

    // 📝 Auditoría
    await logAuditAction(userId, 'LOGOUT_ALL_SESSIONS', {}, req.ip);

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.json({
      success: true,
      message: 'Todas las sesiones han sido cerradas'
    });

  } catch (error) {
    console.error('❌ Error cerrando todas las sesiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  registerUser,
  confirmRegistration,
  loginUser,
  refreshToken,
  logoutUser,
  logoutAllSessions,
  generateTokens,
  logAuditAction
};