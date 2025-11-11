/**
 * 🛡️ VALIDACIÓN Y SANITIZACIÓN ENTERPRISE-GRADE
 * Validadores avanzados, sanitización automática y protección contra inyecciones
 * Compatible con sistemas existentes
 */

const { body, param, query, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');
const xss = require('xss');
const validator = require('validator');
const { EnterpriseLogger } = require('../audit/enterpriseAudit');

// 📋 Configuración de validación
const VALIDATION_CONFIG = {
    // Límites generales
    maxStringLength: 1000,
    maxTextLength: 10000,
    maxArrayLength: 100,
    
    // Patrones de seguridad
    securityPatterns: {
        sqlInjection: /(union|select|insert|update|delete|drop|exec|script)/i,
        xssAttempt: /<script|javascript:|onerror|onload|onclick|onmouseover/i,
        pathTraversal: /\.\.\//g,
        commandInjection: /[;&|`$(){}[\]]/,
        ldapInjection: /[()=*!&|]/
    },
    
    // Campos sensibles que requieren validación extra
    sensitiveFields: ['password', 'contraseña', 'email', 'correo', 'documento', 'telefono'],
    
    // Caracteres permitidos por tipo
    allowedChars: {
        alphanumeric: /^[a-zA-Z0-9\s]+$/,
        numeric: /^[0-9]+$/,
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        phone: /^[\+]?[1-9][\d]{0,15}$/,
        name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
        address: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s#.-]+$/
    }
};

// 🧹 Sanitizador Empresarial
class EnterpriseSanitizer {
    /**
     * Sanitizar string general
     * @param {string} input - Input a sanitizar
     * @param {object} options - Opciones de sanitización
     * @returns {string} - String sanitizado
     */
    static sanitizeString(input, options = {}) {
        if (typeof input !== 'string') return input;
        
        let sanitized = input;
        
        // Trim espacios
        sanitized = sanitized.trim();
        
        // Remover caracteres de control
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
        
        // Escapar HTML si no se especifica lo contrario
        if (!options.allowHTML) {
            sanitized = validator.escape(sanitized);
        }
        
        // Aplicar límite de longitud
        const maxLength = options.maxLength || VALIDATION_CONFIG.maxStringLength;
        sanitized = sanitized.substring(0, maxLength);
        
        return sanitized;
    }

    /**
     * Sanitizar HTML con DOMPurify
     * @param {string} html - HTML a sanitizar
     * @param {object} options - Opciones de DOMPurify
     * @returns {string} - HTML sanitizado
     */
    static sanitizeHTML(html, options = {}) {
        const config = {
            ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'u', 'strong', 'em', 'p', 'br'],
            ALLOWED_ATTR: options.allowedAttributes || ['class'],
            KEEP_CONTENT: true,
            ...options
        };
        
        return DOMPurify.sanitize(html, config);
    }

    /**
     * Sanitizar datos para SQL (prevenir inyección SQL)
     * @param {any} input - Input a sanitizar
     * @returns {any} - Input sanitizado
     */
    static sanitizeForSQL(input) {
        if (typeof input === 'string') {
            // Escapar comillas y caracteres especiales
            return input.replace(/'/g, "''").replace(/;/g, '\\;').replace(/--/g, '\\--');
        }
        return input;
    }

    /**
     * Detectar y bloquear patrones maliciosos
     * @param {string} input - Input a verificar
     * @param {string} fieldName - Nombre del campo
     * @returns {object} - Resultado de la verificación
     */
    static detectMaliciousPatterns(input, fieldName = 'unknown') {
        if (typeof input !== 'string') return { safe: true };
        
        const threats = [];
        
        Object.entries(VALIDATION_CONFIG.securityPatterns).forEach(([threat, pattern]) => {
            if (pattern.test(input)) {
                threats.push(threat);
            }
        });
        
        if (threats.length > 0) {
            // Log del intento malicioso
            const logger = new EnterpriseLogger();
            logger.logSecurityEvent('MALICIOUS_INPUT_DETECTED', {
                fieldName,
                input: input.substring(0, 100), // Solo primeros 100 caracteres
                threats,
                blocked: true
            }, 'HIGH');
            
            return {
                safe: false,
                threats,
                message: 'Input contiene patrones potencialmente maliciosos'
            };
        }
        
        return { safe: true };
    }

    /**
     * Sanitización completa de objeto
     * @param {object} obj - Objeto a sanitizar
     * @param {object} rules - Reglas de sanitización por campo
     * @returns {object} - Objeto sanitizado
     */
    static sanitizeObject(obj, rules = {}) {
        const sanitized = {};
        
        Object.entries(obj).forEach(([key, value]) => {
            const rule = rules[key] || {};
            
            if (typeof value === 'string') {
                // Verificar patrones maliciosos
                const securityCheck = this.detectMaliciousPatterns(value, key);
                if (!securityCheck.safe) {
                    sanitized[key] = ''; // Limpiar completamente si es malicioso
                    return;
                }
                
                // Aplicar sanitización
                sanitized[key] = this.sanitizeString(value, rule);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map((item, index) => 
                    typeof item === 'string' 
                        ? this.sanitizeString(item, rule)
                        : item
                ).slice(0, VALIDATION_CONFIG.maxArrayLength);
            } else {
                sanitized[key] = value;
            }
        });
        
        return sanitized;
    }
}

// 🔍 Validadores Empresariales Específicos
const EnterpriseValidators = {
    /**
     * Validador de email colombiano mejorado
     */
    emailColombian: () => [
        body(['email', 'correo'])
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage('Email inválido')
            .isLength({ max: 320 })
            .withMessage('Email muy largo')
            .custom(async (email) => {
                // Verificar dominios sospechosos
                const suspiciousDomains = ['10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
                const domain = email.split('@')[1]?.toLowerCase();
                
                if (suspiciousDomains.includes(domain)) {
                    throw new Error('Dominio de email no permitido');
                }
                
                return true;
            })
    ],

    /**
     * Validador de contraseña empresarial
     */
    passwordEnterprise: (fieldName = 'password') => [
        body(fieldName)
            .isLength({ min: 12 })
            .withMessage('La contraseña debe tener al menos 12 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_-])[A-Za-z\d@$!%*?&_-]/)
            .withMessage('Contraseña debe contener: mayúscula, minúscula, número y símbolo (@$!%*?&_-)')
            .custom((password) => {
                // Verificar patrones comunes débiles
                const weakPatterns = [
                    /(.)\1{2,}/, // Caracteres repetidos
                    /123456|abcdef|qwerty/i, // Secuencias comunes
                    /password|contraseña|admin/i // Palabras comunes
                ];
                
                const isWeak = weakPatterns.some(pattern => pattern.test(password));
                if (isWeak) {
                    throw new Error('Contraseña contiene patrones débiles');
                }
                
                return true;
            })
    ],

    /**
     * Validador de documento colombiano
     */
    documentoColombian: () => [
        body('tipo_documento')
            .isIn(['CC', 'CE', 'TI', 'PA', 'NIT'])
            .withMessage('Tipo de documento inválido'),
        
        body('numero_documento')
            .trim()
            .isNumeric()
            .withMessage('Documento debe ser numérico')
            .isLength({ min: 6, max: 15 })
            .withMessage('Documento debe tener entre 6 y 15 dígitos')
            .custom((numero, { req }) => {
                const tipo = req.body.tipo_documento;
                
                // Validaciones específicas por tipo
                if (tipo === 'CC' && (numero.length < 8 || numero.length > 10)) {
                    throw new Error('Cédula debe tener entre 8 y 10 dígitos');
                }
                
                if (tipo === 'NIT' && numero.length < 9) {
                    throw new Error('NIT debe tener al menos 9 dígitos');
                }
                
                return true;
            })
    ],

    /**
     * Validador de teléfono colombiano
     */
    telefonoColombian: () => [
        body('telefono')
            .trim()
            .matches(/^(\+57|57)?[13-9]\d{9}$/)
            .withMessage('Teléfono colombiano inválido (debe incluir código de área)')
            .isLength({ max: 15 })
            .withMessage('Teléfono muy largo')
    ],

    /**
     * Validador de fecha de nacimiento
     */
    fechaNacimiento: () => [
        body('fecha_nacimiento')
            .isISO8601()
            .withMessage('Fecha inválida')
            .custom((fecha) => {
                const fechaNac = new Date(fecha);
                const hoy = new Date();
                const edad = hoy.getFullYear() - fechaNac.getFullYear();
                
                if (edad < 0 || edad > 120) {
                    throw new Error('Edad debe estar entre 0 y 120 años');
                }
                
                if (fechaNac > hoy) {
                    throw new Error('Fecha de nacimiento no puede ser futura');
                }
                
                return true;
            })
    ],

    /**
     * Validador de dirección colombiana
     */
    direccionColombian: () => [
        body('direccion')
            .trim()
            .isLength({ min: 10, max: 200 })
            .withMessage('Dirección debe tener entre 10 y 200 caracteres')
            .matches(VALIDATION_CONFIG.allowedChars.address)
            .withMessage('Dirección contiene caracteres no válidos')
    ],

    /**
     * Validador genérico seguro para IDs
     */
    secureId: (fieldName = 'id') => [
        param(fieldName)
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo')
            .toInt()
    ],

    /**
     * Validador para paginación
     */
    pagination: () => [
        query('page')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Página debe estar entre 1 y 1000')
            .toInt(),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Límite debe estar entre 1 y 100')
            .toInt()
    ]
};

// 🛡️ Middleware de sanitización automática
const autoSanitizer = (rules = {}) => {
    return (req, res, next) => {
        try {
            // Sanitizar body
            if (req.body && typeof req.body === 'object') {
                req.body = EnterpriseSanitizer.sanitizeObject(req.body, rules);
            }
            
            // Sanitizar query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = EnterpriseSanitizer.sanitizeObject(req.query, rules);
            }
            
            next();
        } catch (error) {
            console.error('❌ Error en sanitización automática:', error);
            next(); // Continuar sin sanitizar para no romper funcionalidad
        }
    };
};

// 🔍 Middleware de validación de resultados
const handleValidationErrors = () => {
    return (req, res, next) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            const logger = new EnterpriseLogger();
            
            // Log de error de validación
            logger.logSecurityEvent('VALIDATION_ERROR', {
                ip: req.ip,
                url: req.originalUrl,
                method: req.method,
                errors: errors.array(),
                body: Object.keys(req.body || {}), // Solo las keys, no los valores
                userAgent: req.get('User-Agent')
            }, 'MEDIUM');
            
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg,
                    value: err.value ? '[OCULTO]' : undefined // No exponer valores por seguridad
                }))
            });
        }
        
        next();
    };
};

// 🔒 Middleware anti-CSRF básico
const antiCSRF = () => {
    return (req, res, next) => {
        // Solo aplicar a métodos que modifican datos
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const referer = req.get('Referer');
            const origin = req.get('Origin');
            const host = req.get('Host');
            
            // Verificar que la request viene del mismo dominio
            const validOrigins = [
                `http://${host}`,
                `https://${host}`,
                `http://localhost:3001`,
                `http://127.0.0.1:3001`
            ];
            
            if (origin && !validOrigins.includes(origin)) {
                const logger = new EnterpriseLogger();
                logger.logSecurityEvent('CSRF_ATTEMPT', {
                    ip: req.ip,
                    origin,
                    referer,
                    host,
                    url: req.originalUrl
                }, 'HIGH');
                
                return res.status(403).json({
                    success: false,
                    message: 'Request bloqueada por protección CSRF'
                });
            }
        }
        
        next();
    };
};

// 📊 Middleware de monitoreo de inputs
const inputMonitoring = () => {
    return (req, res, next) => {
        const logger = new EnterpriseLogger();
        
        // Monitorear inputs sospechosos
        const inputData = { ...req.body, ...req.query };
        
        Object.entries(inputData).forEach(([key, value]) => {
            if (typeof value === 'string') {
                const securityCheck = EnterpriseSanitizer.detectMaliciousPatterns(value, key);
                
                if (!securityCheck.safe) {
                    logger.logSecurityEvent('SUSPICIOUS_INPUT', {
                        ip: req.ip,
                        url: req.originalUrl,
                        field: key,
                        threats: securityCheck.threats,
                        userAgent: req.get('User-Agent')
                    }, 'HIGH');
                }
            }
        });
        
        next();
    };
};

module.exports = {
    // Clases principales
    EnterpriseSanitizer,
    EnterpriseValidators,
    
    // Middlewares
    autoSanitizer,
    handleValidationErrors,
    antiCSRF,
    inputMonitoring,
    
    // Configuración
    VALIDATION_CONFIG
};