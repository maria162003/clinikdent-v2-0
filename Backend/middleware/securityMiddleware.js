/**
 * 🛡️ MIDDLEWARE DE SEGURIDAD AVANZADO
 * Implementa protección contra múltiples vulnerabilidades
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('express-validator');
const sanitizeHtml = require('sanitize-html');

/**
 * 🔒 Configuración de Headers de Seguridad
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Para compatibilidad con imágenes
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

/**
 * 🚫 Rate Limiting - Prevención de ataques DDoS
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        error: 'Demasiadas solicitudes desde esta IP. Intenta más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60 // 15 minutos
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * 🔐 Rate Limiting para Autenticación (más estricto)
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos de login
    message: {
        error: 'Demasiados intentos de login. Cuenta bloqueada temporalmente.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * 🧹 Sanitización de Inputs
 */
const sanitizeInput = (req, res, next) => {
    // Sanitizar body
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeHtml(req.body[key], {
                    allowedTags: [], // No permitir HTML
                    allowedAttributes: {},
                    disallowedTagsMode: 'discard'
                });
            }
        }
    }

    // Sanitizar query parameters
    if (req.query) {
        for (let key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeHtml(req.query[key], {
                    allowedTags: [],
                    allowedAttributes: {},
                    disallowedTagsMode: 'discard'
                });
            }
        }
    }

    // Sanitizar params
    if (req.params) {
        for (let key in req.params) {
            if (typeof req.params[key] === 'string') {
                req.params[key] = sanitizeHtml(req.params[key], {
                    allowedTags: [],
                    allowedAttributes: {},
                    disallowedTagsMode: 'discard'
                });
            }
        }
    }

    next();
};

/**
 * 🎯 Validadores Específicos
 */
const validationRules = {
    // Validación para email
    email: [
        validator.body('email')
            .isEmail()
            .withMessage('Email inválido')
            .normalizeEmail()
            .isLength({ max: 100 })
            .withMessage('Email demasiado largo')
    ],

    // Validación para contraseña
    password: [
        validator.body('password')
            .isLength({ min: 8, max: 128 })
            .withMessage('Contraseña debe tener entre 8 y 128 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Contraseña debe contener mayúscula, minúscula, número y símbolo')
    ],

    // Validación para ID
    id: [
        validator.param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo')
    ],

    // Validación para nombres
    nombre: [
        validator.body('nombre')
            .isLength({ min: 2, max: 50 })
            .withMessage('Nombre debe tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
            .withMessage('Nombre solo puede contener letras y espacios')
    ],

    // Validación para fechas
    fecha: [
        validator.body('fecha')
            .isISO8601()
            .withMessage('Fecha debe estar en formato ISO8601')
            .toDate()
    ],

    // Validación para teléfono
    telefono: [
        validator.body('telefono')
            .isMobilePhone('es-CO')
            .withMessage('Número de teléfono inválido para Colombia')
    ]
};

/**
 * 🚨 Manejo de Errores de Validación
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validator.validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

/**
 * 🛡️ Prevención de CSRF
 */
const csrfProtection = (req, res, next) => {
    // Solo aplicar CSRF para métodos que modifican datos
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
        const sessionToken = req.session?.csrfToken;

        if (!csrfToken || csrfToken !== sessionToken) {
            return res.status(403).json({
                success: false,
                message: 'Token CSRF inválido o faltante',
                code: 'CSRF_TOKEN_MISMATCH'
            });
        }
    }
    
    next();
};

/**
 * 🔍 Logging de Seguridad
 */
const securityLogger = (req, res, next) => {
    // Log de actividades sospechosas
    const suspiciousPatterns = [
        /script/i,
        /javascript/i,
        /vbscript/i,
        /onload/i,
        /onerror/i,
        /union.*select/i,
        /drop.*table/i,
        /insert.*into/i,
        /delete.*from/i
    ];

    const requestData = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
    });

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

    if (isSuspicious) {
        console.warn(`🚨 ACTIVIDAD SOSPECHOSA DETECTADA:`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.url,
            data: requestData,
            timestamp: new Date().toISOString()
        });
    }

    next();
};

module.exports = {
    securityHeaders,
    generalLimiter,
    authLimiter,
    sanitizeInput,
    validationRules,
    handleValidationErrors,
    csrfProtection,
    securityLogger
};
