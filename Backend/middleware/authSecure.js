const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 🔐 Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_demo_2025';

// 🛡️ Headers de seguridad con Helmet
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Necesario para Bootstrap
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Temporal para demo - mejorarlo en producción
        "https://cdn.jsdelivr.net",
        "https://code.jquery.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'",
        "https://*.supabase.co"
      ]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
});

// 🚫 Rate Limiting para login (muy restrictivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta en 15 minutos.',
    code: 'RATE_LIMIT_LOGIN',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar logins exitosos
  keyGenerator: (req) => {
    // Rate limit por IP + email para mayor seguridad
    return `${req.ip}-${req.body.correo || 'unknown'}`;
  }
});

// 🚫 Rate Limiting para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros por hora por IP
  message: {
    success: false,
    message: 'Límite de registros excedido. Intenta en 1 hora.',
    code: 'RATE_LIMIT_REGISTER'
  }
});

// 🚫 Rate Limiting general para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta más tarde.',
    code: 'RATE_LIMIT_API'
  }
});

// ✅ Validaciones para registro
const registerValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre debe tener entre 2-50 caracteres y solo letras'),
    
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido debe tener entre 2-50 caracteres y solo letras'),
    
  body('correo')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email inválido'),
    
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Contraseña debe tener: 8+ caracteres, 1 minúscula, 1 mayúscula, 1 número, 1 símbolo'),
    
  body('telefono')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Teléfono inválido'),
    
  body('tipo_documento')
    .isIn(['CC', 'TI', 'CE', 'PA'])
    .withMessage('Tipo de documento inválido'),
    
  body('numero_documento')
    .isNumeric()
    .isLength({ min: 6, max: 15 })
    .withMessage('Documento debe ser numérico entre 6-15 dígitos'),
    
  body('direccion')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Dirección debe tener entre 10-200 caracteres'),
    
  body('fecha_nacimiento')
    .isISO8601()
    .custom(value => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 5 || age > 120) {
        throw new Error('Edad debe estar entre 5 y 120 años');
      }
      return true;
    })
];

// ✅ Validaciones para login
const loginValidation = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
    
  body('password')
    .isLength({ min: 1 })
    .withMessage('Contraseña requerida')
];

// 🔒 Middleware de autenticación JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    // 🔍 Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔍 Verificar que el usuario existe y está activo
    const userResult = await pool.query(`
      SELECT id, nombre, apellido, correo, rol, estado, token_version
      FROM usuarios 
      WHERE id = $1 AND estado = 'activo'
    `, [decoded.id]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo',
        code: 'USER_INACTIVE'
      });
    }

    const user = userResult.rows[0];

    // 🔍 Verificar token version (para invalidación global)
    if (decoded.tokenVersion && decoded.tokenVersion !== user.token_version) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Inicia sesión nuevamente.',
        code: 'TOKEN_VERSION_MISMATCH'
      });
    }

    // ✅ Usuario autenticado
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('❌ Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// 🔒 Middleware de autorización por rol
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// 🧹 Middleware de sanitización de inputs (Anti-XSS)
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Escapar caracteres peligrosos básicos
    return str
      .replace(/[<>'"]/g, (char) => {
        const map = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return map[char];
      });
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  // Sanitizar body, query y params
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// 🕵️ Middleware de logging de seguridad
const securityLogger = (req, res, next) => {
  // Patrones sospechosos
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /\.\.\//g,
    /eval\s*\(/i,
    /exec\s*\(/i
  ];

  const url = req.url;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  const allContent = `${url} ${body} ${query}`;

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(allContent)
  );

  if (isSuspicious) {
    console.warn('🚨 SECURITY ALERT - Suspicious Request:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      user: req.user?.id || 'anonymous'
    });

    // En producción, podrías bloquear la request aquí
    // return res.status(403).json({ message: 'Request blocked' });
  }

  next();
};

// 🛡️ Middleware de validación de errores
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// 🔒 Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userResult = await pool.query(
        'SELECT id, nombre, apellido, correo, rol FROM usuarios WHERE id = $1 AND estado = $2',
        [decoded.id, 'activo']
      );

      if (userResult.rows.length > 0) {
        req.user = userResult.rows[0];
      }
    }
  } catch (error) {
    // No hacer nada, continuar sin usuario
  }
  
  next();
};

module.exports = {
  // Headers y seguridad
  securityHeaders,
  
  // Rate limiting
  loginLimiter,
  registerLimiter,
  apiLimiter,
  
  // Validaciones
  registerValidation,
  loginValidation,
  handleValidationErrors,
  
  // Autenticación y autorización
  authenticateToken,
  authorizeRole,
  optionalAuth,
  
  // Sanitización y logging
  sanitizeInput,
  securityLogger
};