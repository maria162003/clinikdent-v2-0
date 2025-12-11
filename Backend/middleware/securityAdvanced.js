// 🛡️ MIDDLEWARE DE SEGURIDAD AVANZADA
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');

// 🔐 Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// 🚫 Store para tokens invalidados (blacklist)
const tokenBlacklist = new Set();
const refreshTokenStore = new Map();

// 📧 Store para tokens de confirmación de email
const emailConfirmationTokens = new Map();

// 🔄 Rate Limiters específicos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: {
    error: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
    code: 'TOO_MANY_AUTH_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por IP por hora
  message: {
    error: 'Demasiados registros desde esta IP. Intenta en 1 hora.',
    code: 'TOO_MANY_REGISTRATIONS'
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos de reset por IP por hora
  message: {
    error: 'Demasiados intentos de recuperación. Intenta en 1 hora.',
    code: 'TOO_MANY_PASSWORD_RESETS'
  }
});

// 🐌 Slow down para requests sospechosos
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 10, // después de 10 requests
  delayMs: () => 500, // agregar 500ms de delay (nueva sintaxis)
  maxDelayMs: 20000, // máximo 20 segundos de delay
  validate: { delayMs: false } // Deshabilitar warning
});

// 🔐 Generar JWT Token
function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'paciente',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutos
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// 🔄 Generar Refresh Token
function generateRefreshToken(userId) {
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  
  // Guardar refresh token
  refreshTokenStore.set(refreshToken, {
    userId,
    createdAt: new Date(),
    lastUsed: new Date()
  });
  
  return refreshToken;
}

// 📧 Generar token de confirmación de email
function generateEmailConfirmationToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  
  emailConfirmationTokens.set(token, {
    email,
    expires,
    confirmed: false
  });
  
  return token;
}

// ✅ Verificar email token
function verifyEmailConfirmationToken(token) {
  const tokenData = emailConfirmationTokens.get(token);
  
  if (!tokenData) {
    return { valid: false, error: 'Token no encontrado' };
  }
  
  if (new Date() > tokenData.expires) {
    emailConfirmationTokens.delete(token);
    return { valid: false, error: 'Token expirado' };
  }
  
  if (tokenData.confirmed) {
    return { valid: false, error: 'Token ya utilizado' };
  }
  
  return { valid: true, email: tokenData.email };
}

// 🗑️ Invalidar token de email
function invalidateEmailToken(token) {
  const tokenData = emailConfirmationTokens.get(token);
  if (tokenData) {
    tokenData.confirmed = true;
  }
}

// 🔒 Middleware de autenticación JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      code: 'NO_TOKEN'
    });
  }
  
  // Verificar si el token está en blacklist
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ 
      error: 'Token invalidado',
      code: 'TOKEN_BLACKLISTED'
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    req.user = user;
    next();
  });
}

// 🔄 Renovar access token con refresh token
function refreshAccessToken(req, res, next) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ 
      error: 'Refresh token requerido',
      code: 'NO_REFRESH_TOKEN'
    });
  }
  
  const tokenData = refreshTokenStore.get(refreshToken);
  if (!tokenData) {
    return res.status(403).json({ 
      error: 'Refresh token inválido',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
  
  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      refreshTokenStore.delete(refreshToken);
      return res.status(403).json({ 
        error: 'Refresh token expirado',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    
    // Actualizar último uso
    tokenData.lastUsed = new Date();
    
    req.refreshTokenData = { refreshToken, userId: decoded.userId };
    next();
  });
}

// 🗑️ Invalidar tokens (logout)
function invalidateTokens(accessToken, refreshToken) {
  // Agregar access token a blacklist
  if (accessToken) {
    tokenBlacklist.add(accessToken);
  }
  
  // Remover refresh token
  if (refreshToken) {
    refreshTokenStore.delete(refreshToken);
  }
}

// 🛡️ Validaciones de seguridad
const securityValidations = {
  // Validar email
  validateEmail: (email) => {
    if (!email || !validator.isEmail(email)) {
      return { valid: false, error: 'Email inválido' };
    }
    if (email.length > 254) {
      return { valid: false, error: 'Email demasiado largo' };
    }
    return { valid: true };
  },
  
  // Validar contraseña segura
  validatePassword: (password) => {
    if (!password) {
      return { valid: false, error: 'Contraseña requerida' };
    }
    if (password.length < 8) {
      return { valid: false, error: 'Contraseña debe tener mínimo 8 caracteres' };
    }
    if (password.length > 128) {
      return { valid: false, error: 'Contraseña demasiado larga' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, error: 'Contraseña debe tener al menos una minúscula' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, error: 'Contraseña debe tener al menos una mayúscula' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, error: 'Contraseña debe tener al menos un número' };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { valid: false, error: 'Contraseña debe tener al menos un símbolo (@$!%*?&)' };
    }
    return { valid: true };
  },
  
  // Sanitizar input para prevenir XSS
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return validator.escape(input);
  },
  
  // Validar entrada contra SQL injection
  validateSQLInput: (input) => {
    if (typeof input !== 'string') return { valid: true };
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|\||&|\+|\-|<|>)/,
      /(\b(OR|AND)\b.*=)/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return { 
          valid: false, 
          error: 'Entrada contiene caracteres no permitidos',
          code: 'POTENTIAL_SQL_INJECTION'
        };
      }
    }
    
    return { valid: true };
  }
};

// 🔍 Auditoría de acciones críticas
function auditLogger(action, userId, details = {}) {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    ip: details.ip,
    userAgent: details.userAgent,
    details,
    severity: details.severity || 'INFO'
  };
  
  console.log(`🔍 AUDIT [${auditLog.severity}]: ${action} - User: ${userId} - IP: ${details.ip}`);
  
  // En producción, esto debería guardarse en base de datos
  // TODO: Implementar guardado en BD
  
  return auditLog;
}

// 🧹 Limpieza automática de tokens expirados
setInterval(() => {
  const now = new Date();
  
  // Limpiar tokens de email expirados
  for (const [token, data] of emailConfirmationTokens.entries()) {
    if (now > data.expires) {
      emailConfirmationTokens.delete(token);
    }
  }
  
  // Limpiar refresh tokens viejos (más de 30 días sin usar)
  for (const [token, data] of refreshTokenStore.entries()) {
    const daysSinceLastUse = (now - data.lastUsed) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse > 30) {
      refreshTokenStore.delete(token);
    }
  }
  
  console.log('🧹 Limpieza automática de tokens completada');
}, 60 * 60 * 1000); // Cada hora

module.exports = {
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  speedLimiter,
  generateAccessToken,
  generateRefreshToken,
  generateEmailConfirmationToken,
  verifyEmailConfirmationToken,
  invalidateEmailToken,
  authenticateToken,
  refreshAccessToken,
  invalidateTokens,
  securityValidations,
  auditLogger,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};