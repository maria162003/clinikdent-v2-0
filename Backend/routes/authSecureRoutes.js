// 🛡️ RUTAS DE AUTENTICACIÓN SEGURA CON RECAPTCHA
const express = require('express');
const router = express.Router();

// Importar middleware y controladores
const {
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  authenticateToken,
  refreshAccessToken
} = require('../middleware/securityAdvanced');

const {
  registerUserSecure,
  confirmEmail,
  loginUserSecure,
  logoutUserSecure,
  refreshTokenEndpoint,
  RECAPTCHA_SITE_KEY
} = require('../controllers/authSecureController');

console.log('🔐 Configurando rutas de autenticación segura...');

// 📋 Obtener configuración del cliente (reCAPTCHA site key)
router.get('/config', (req, res) => {
  res.json({
    recaptcha: {
      siteKey: RECAPTCHA_SITE_KEY || null,
      enabled: !!RECAPTCHA_SITE_KEY
    },
    security: {
      jwtExpiration: '15m',
      refreshExpiration: '7d',
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true
      }
    }
  });
});

// 📝 Registro seguro con reCAPTCHA
router.post('/register', registrationLimiter, registerUserSecure);

// ✅ Confirmar email
router.get('/confirm-email/:token', confirmEmail);

// 🔐 Login seguro con reCAPTCHA
router.post('/login', authLimiter, loginUserSecure);

// 🚪 Logout seguro
router.post('/logout', authenticateToken, logoutUserSecure);

// 🔄 Renovar access token
router.post('/refresh', refreshAccessToken, refreshTokenEndpoint);

// 👤 Obtener perfil de usuario autenticado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const pool = require('../config/db');
    
    const userResult = await pool.query(`
      SELECT id, nombre, email, telefono, role, email_verified, 
             created_at, last_login
      FROM usuarios 
      WHERE id = $1
    `, [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      message: 'Perfil obtenido exitosamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        role: user.role,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      code: 'PROFILE_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// 🔄 Reenviar email de confirmación
router.post('/resend-confirmation', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const pool = require('../config/db');
    const { 
      generateEmailConfirmationToken,
      securityValidations,
      auditLogger 
    } = require('../middleware/securityAdvanced');
    const emailService = require('../services/emailService');
    
    // Validar email
    const emailValidation = securityValidations.validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: emailValidation.error,
        code: 'INVALID_EMAIL'
      });
    }
    
    // Buscar usuario
    const userResult = await pool.query(`
      SELECT id, nombre, email, email_verified
      FROM usuarios 
      WHERE email = $1
    `, [email.toLowerCase()]);
    
    if (userResult.rows.length === 0) {
      // No revelar si el email existe o no por seguridad
      return res.json({
        message: 'Si el email existe, se ha enviado un nuevo enlace de confirmación',
        code: 'CONFIRMATION_SENT'
      });
    }
    
    const user = userResult.rows[0];
    
    if (user.email_verified) {
      return res.status(400).json({
        error: 'Este email ya está confirmado',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }
    
    // Generar nuevo token
    const emailToken = generateEmailConfirmationToken(email.toLowerCase());
    
    // Actualizar token en BD
    await pool.query(`
      UPDATE usuarios 
      SET email_token = $1
      WHERE id = $2
    `, [emailToken, user.id]);
    
    // Enviar email
    try {
      const confirmationUrl = `${process.env.APP_URL || 'http://localhost:3001'}/auth/confirm-email/${emailToken}`;
      await emailService.sendEmailConfirmation(email, user.nombre, confirmationUrl);
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
    }
    
    // Auditoría
    auditLogger('CONFIRMATION_EMAIL_RESENT', user.id, {
      ip: req.ip,
      email: email,
      severity: 'INFO'
    });
    
    res.json({
      message: 'Nuevo enlace de confirmación enviado',
      code: 'CONFIRMATION_SENT'
    });
    
  } catch (error) {
    console.error('❌ Error reenviando confirmación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// 🔒 Verificar estado de token
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({
    message: 'Token válido',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      },
      tokenInfo: {
        issuedAt: new Date(req.user.iat * 1000),
        expiresAt: new Date(req.user.exp * 1000)
      }
    },
    code: 'TOKEN_VALID'
  });
});

console.log('✅ Rutas de autenticación segura configuradas');

module.exports = router;