// 🤖 CONTROLADOR DE AUTENTICACIÓN SEGURA CON RECAPTCHA
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
const pool = require('../config/db');
const EmailService = require('../services/emailService');
const {
  generateAccessToken,
  generateRefreshToken,
  generateEmailConfirmationToken,
  verifyEmailConfirmationToken,
  invalidateEmailToken,
  invalidateTokens,
  securityValidations,
  auditLogger
} = require('../middleware/securityAdvanced');

// 🔐 Configuración reCAPTCHA
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY;

// 📧 Instancia del servicio de email (ya es una instancia)
const emailService = EmailService;

// 🤖 Verificar reCAPTCHA
async function verifyRecaptcha(recaptchaToken, userIP) {
  // Manejar token de desarrollo
  if (recaptchaToken === 'test_token_for_development') {
    console.log('🔧 Usando token de desarrollo para reCAPTCHA');
    return { valid: true, score: 1.0 };
  }
  
  if (!RECAPTCHA_SECRET_KEY) {
    console.log('⚠️ reCAPTCHA no configurado - saltando verificación');
    return { valid: true, score: 1.0 };
  }
  
  try {
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
        remoteip: userIP
      }
    });
    
    const { success, score, action, hostname } = response.data;
    
    auditLogger('RECAPTCHA_VERIFICATION', null, {
      ip: userIP,
      success,
      score,
      action,
      hostname,
      severity: success ? 'INFO' : 'WARNING'
    });
    
    return {
      valid: success && score >= 0.5, // Umbral de 0.5 para reCAPTCHA v3
      score,
      action,
      hostname
    };
  } catch (error) {
    console.error('❌ Error verificando reCAPTCHA:', error.message);
    auditLogger('RECAPTCHA_ERROR', null, {
      ip: userIP,
      error: error.message,
      severity: 'ERROR'
    });
    return { valid: false, error: 'Error verificando reCAPTCHA' };
  }
}

// 📝 Registro de usuario seguro
async function registerUserSecure(req, res) {
  const client = await pool.connect();
  
  try {
    const { 
      nombre, 
      email, 
      password, 
      telefono,
      recaptchaToken 
    } = req.body;
    
    const userIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // 1. Verificar reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, userIP);
    if (!recaptchaResult.valid) {
      auditLogger('REGISTRATION_FAILED_RECAPTCHA', null, {
        ip: userIP,
        email: email,
        severity: 'WARNING'
      });
      return res.status(400).json({
        error: 'Verificación de seguridad fallida',
        code: 'RECAPTCHA_FAILED'
      });
    }
    
    // 2. Validaciones de seguridad
    const emailValidation = securityValidations.validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: emailValidation.error,
        code: 'INVALID_EMAIL'
      });
    }
    
    const passwordValidation = securityValidations.validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.error,
        code: 'INVALID_PASSWORD'
      });
    }
    
    // 3. Sanitizar entradas
    const sanitizedNombre = securityValidations.sanitizeInput(nombre);
    const sanitizedTelefono = securityValidations.sanitizeInput(telefono);
    
    // 4. Validar SQL injection
    const sqlValidation = securityValidations.validateSQLInput(email);
    if (!sqlValidation.valid) {
      auditLogger('SQL_INJECTION_ATTEMPT', null, {
        ip: userIP,
        input: email,
        severity: 'CRITICAL'
      });
      return res.status(400).json({
        error: 'Entrada no válida',
        code: 'INVALID_INPUT'
      });
    }
    
    await client.query('BEGIN');
    
    // 5. Verificar email único
    const existingUser = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      auditLogger('REGISTRATION_FAILED_DUPLICATE_EMAIL', null, {
        ip: userIP,
        email: email,
        severity: 'INFO'
      });
      return res.status(400).json({
        error: 'Este email ya está registrado',
        code: 'EMAIL_EXISTS'
      });
    }
    
    // 6. Hash de contraseña seguro
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 7. Generar token de confirmación de email
    const emailToken = generateEmailConfirmationToken(email.toLowerCase());
    
    // 8. Insertar usuario (estado pendiente)
    const newUser = await client.query(`
      INSERT INTO usuarios (
        nombre, email, password, telefono, role, 
        email_verified, created_at, email_token
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING id, nombre, email, role, created_at
    `, [
      sanitizedNombre,
      email.toLowerCase(),
      hashedPassword,
      sanitizedTelefono,
      'paciente',
      false,
      emailToken
    ]);
    
    await client.query('COMMIT');
    
    const userId = newUser.rows[0].id;
    
    // 9. Auditoría
    auditLogger('USER_REGISTERED', userId, {
      ip: userIP,
      userAgent,
      email: email.toLowerCase(),
      recaptchaScore: recaptchaResult.score,
      severity: 'INFO'
    });
    
    // 10. Enviar email de confirmación
    try {
      const confirmationUrl = `${process.env.APP_URL || 'http://localhost:3001'}/auth/confirm-email/${emailToken}`;
      
      await emailService.sendEmailConfirmation(email, sanitizedNombre, confirmationUrl);
      
      console.log(`📧 Email de confirmación enviado a: ${email}`);
    } catch (emailError) {
      console.error('❌ Error enviando email de confirmación:', emailError);
      // No fallar el registro por error de email
    }
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      data: {
        id: userId,
        nombre: newUser.rows[0].nombre,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role,
        emailVerified: false,
        requiresEmailVerification: true
      },
      code: 'REGISTRATION_SUCCESS'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en registro seguro:', error);
    
    auditLogger('REGISTRATION_ERROR', null, {
      ip: req.ip,
      error: error.message,
      severity: 'ERROR'
    });
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  } finally {
    client.release();
  }
}

// ✅ Confirmar email
async function confirmEmail(req, res) {
  try {
    const { token } = req.params;
    const userIP = req.ip || req.connection.remoteAddress;
    
    // Verificar token
    const tokenVerification = verifyEmailConfirmationToken(token);
    if (!tokenVerification.valid) {
      return res.status(400).json({
        error: tokenVerification.error,
        code: 'INVALID_TOKEN'
      });
    }
    
    const { email } = tokenVerification;
    
    // Actualizar usuario en BD
    const result = await pool.query(`
      UPDATE usuarios 
      SET email_verified = true, email_verified_at = NOW()
      WHERE email = $1 AND email_verified = false
      RETURNING id, nombre, email
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Email ya confirmado o usuario no encontrado',
        code: 'EMAIL_ALREADY_CONFIRMED'
      });
    }
    
    const user = result.rows[0];
    
    // Invalidar token
    invalidateEmailToken(token);
    
    // Auditoría
    auditLogger('EMAIL_CONFIRMED', user.id, {
      ip: userIP,
      email: email,
      severity: 'INFO'
    });
    
    res.json({
      message: 'Email confirmado exitosamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        emailVerified: true
      },
      code: 'EMAIL_CONFIRMED'
    });
    
  } catch (error) {
    console.error('❌ Error confirmando email:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}

// 🔐 Login seguro con JWT
async function loginUserSecure(req, res) {
  try {
    const { email, password, recaptchaToken } = req.body;
    const userIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    console.log('🔍 DEBUG LOGIN - Token recibido:', recaptchaToken);
    console.log('🔍 DEBUG LOGIN - Tipo de token:', typeof recaptchaToken);
    
    // 1. Verificar reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, userIP);
    if (!recaptchaResult.valid) {
      auditLogger('LOGIN_FAILED_RECAPTCHA', null, {
        ip: userIP,
        email: email,
        severity: 'WARNING'
      });
      return res.status(400).json({
        error: 'Verificación de seguridad fallida',
        code: 'RECAPTCHA_FAILED'
      });
    }
    
    // 2. Validaciones
    const emailValidation = securityValidations.validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: emailValidation.error,
        code: 'INVALID_EMAIL'
      });
    }
    
    // 3. Buscar usuario
    const userResult = await pool.query(`
      SELECT id, nombre, email, password, role, email_verified, 
             failed_login_attempts, locked_until
      FROM usuarios 
      WHERE email = $1
    `, [email.toLowerCase()]);
    
    if (userResult.rows.length === 0) {
      auditLogger('LOGIN_FAILED_USER_NOT_FOUND', null, {
        ip: userIP,
        email: email,
        severity: 'WARNING'
      });
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const user = userResult.rows[0];
    
    // 4. Verificar bloqueo por intentos fallidos
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      auditLogger('LOGIN_FAILED_ACCOUNT_LOCKED', user.id, {
        ip: userIP,
        email: email,
        severity: 'WARNING'
      });
      return res.status(423).json({
        error: 'Cuenta bloqueada temporalmente por seguridad',
        code: 'ACCOUNT_LOCKED'
      });
    }
    
    // 5. Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      // Incrementar intentos fallidos
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = failedAttempts >= 5 ? 
        new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minutos
      
      await pool.query(`
        UPDATE usuarios 
        SET failed_login_attempts = $1, locked_until = $2
        WHERE id = $3
      `, [failedAttempts, lockUntil, user.id]);
      
      auditLogger('LOGIN_FAILED_INVALID_PASSWORD', user.id, {
        ip: userIP,
        email: email,
        failedAttempts,
        severity: 'WARNING'
      });
      
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // 6. Verificar email confirmado
    if (!user.email_verified) {
      auditLogger('LOGIN_FAILED_EMAIL_NOT_VERIFIED', user.id, {
        ip: userIP,
        email: email,
        severity: 'INFO'
      });
      return res.status(403).json({
        error: 'Debes confirmar tu email antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    // 7. Reset intentos fallidos
    await pool.query(`
      UPDATE usuarios 
      SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
      WHERE id = $1
    `, [user.id]);
    
    // 8. Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    
    // 9. Auditoría exitosa
    auditLogger('LOGIN_SUCCESS', user.id, {
      ip: userIP,
      userAgent,
      email: email,
      recaptchaScore: recaptchaResult.score,
      severity: 'INFO'
    });
    
    // 10. Configurar cookies seguras
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
    
    res.json({
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified
        },
        accessToken,
        expiresIn: '15m'
      },
      code: 'LOGIN_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Error en login seguro:', error);
    
    auditLogger('LOGIN_ERROR', null, {
      ip: req.ip,
      error: error.message,
      severity: 'ERROR'
    });
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}

// 🚪 Logout seguro
async function logoutUserSecure(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    // Invalidar tokens
    invalidateTokens(accessToken, refreshToken);
    
    // Limpiar cookie
    res.clearCookie('refreshToken');
    
    // Auditoría
    auditLogger('LOGOUT_SUCCESS', req.user?.id, {
      ip: req.ip,
      severity: 'INFO'
    });
    
    res.json({
      message: 'Logout exitoso',
      code: 'LOGOUT_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}

// 🔄 Renovar token
async function refreshTokenEndpoint(req, res) {
  try {
    const { userId, refreshToken } = req.refreshTokenData;
    
    // Obtener usuario actualizado
    const userResult = await pool.query(`
      SELECT id, nombre, email, role, email_verified
      FROM usuarios 
      WHERE id = $1 AND email_verified = true
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Usuario no válido',
        code: 'INVALID_USER'
      });
    }
    
    const user = userResult.rows[0];
    
    // Generar nuevo access token
    const newAccessToken = generateAccessToken(user);
    
    auditLogger('TOKEN_REFRESHED', userId, {
      ip: req.ip,
      severity: 'INFO'
    });
    
    res.json({
      message: 'Token renovado',
      data: {
        accessToken: newAccessToken,
        expiresIn: '15m'
      },
      code: 'TOKEN_REFRESHED'
    });
    
  } catch (error) {
    console.error('❌ Error renovando token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}

module.exports = {
  registerUserSecure,
  confirmEmail,
  loginUserSecure,
  logoutUserSecure,
  refreshTokenEndpoint,
  verifyRecaptcha,
  RECAPTCHA_SITE_KEY
};