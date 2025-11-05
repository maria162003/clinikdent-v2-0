const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const compression = require('compression');

// 🛡️ Configuración de Headers de Seguridad
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Temporal - mejorar después
        "https://cdn.jsdelivr.net",
        "https://code.jquery.com",
        "https://sdk.mercadopago.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.mercadopago.com",
        "https://*.supabase.co"
      ],
      frameSrc: ["'self'", "https://www.mercadopago.com"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  }
});

// 🚫 Rate Limiting Agresivo para Login
const strictLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: {
    error: 'Demasiados intentos de login. Intenta en 15 minutos.',
    code: 'RATE_LIMIT_LOGIN'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // No contar logins exitosos
});

// 🐌 Slow Down para APIs sensibles
const apiSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 10, // Después de 10 requests
  delayMs: 500, // Agregar 500ms de delay
  maxDelayMs: 10000 // Máximo 10 segundos de delay
});

// 🌐 Rate Limiting General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    error: 'Demasiadas peticiones. Intenta más tarde.',
    code: 'RATE_LIMIT_GENERAL'
  }
});

// 💳 Rate Limiting para Pagos (Muy Restrictivo)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Solo 10 intentos de pago por hora
  message: {
    error: 'Límite de transacciones alcanzado. Intenta en 1 hora.',
    code: 'RATE_LIMIT_PAYMENT'
  }
});

// 🧹 Sanitización de Inputs
const sanitizeInput = (req, res, next) => {
  // Sanitizar strings de XSS
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// ✅ Validaciones Comunes
const loginValidation = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Contraseña debe tener mínimo 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Contraseña debe tener al menos: 1 minúscula, 1 mayúscula, 1 número')
];

const registerValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
  body('apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres'),
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener mínimo 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Contraseña debe tener: 1 minúscula, 1 mayúscula, 1 número, 1 símbolo'),
  body('telefono')
    .isMobilePhone('es-CO')
    .withMessage('Teléfono inválido para Colombia'),
  body('numero_documento')
    .isNumeric()
    .isLength({ min: 6, max: 15 })
    .withMessage('Documento debe ser numérico entre 6 y 15 dígitos')
];

// 🚨 Middleware de Validación de Errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: errors.array()
    });
  }
  next();
};

// 🔒 Middleware de Seguridad Completo
const securityMiddleware = [
  compression(), // Compresión GZIP
  securityHeaders, // Headers de seguridad
  mongoSanitize(), // Sanitizar contra NoSQL injection
  hpp(), // Prevenir HTTP Parameter Pollution
  sanitizeInput // Sanitizar XSS
];

// 📊 Middleware de Logging de Seguridad
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i, /javascript:/i, /on\w+=/i, // XSS
    /union\s+select/i, /drop\s+table/i, // SQL Injection
    /\.\.\//g, // Path traversal
    /eval\(/i, /function\s*\(/i // Code injection
  ];

  const url = req.url;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body) || pattern.test(query)
  );

  if (isSuspicious) {
    console.warn('🚨 SECURITY ALERT:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  strictLoginLimiter,
  apiSlowDown,
  generalLimiter,
  paymentLimiter,
  sanitizeInput,
  loginValidation,
  registerValidation,
  handleValidationErrors,
  securityMiddleware,
  securityLogger
};