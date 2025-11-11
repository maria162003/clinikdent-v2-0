/**
 * 🛡️ HEADERS DE SEGURIDAD AVANZADOS Y PROTECCIÓN DDOS
 * Implementación enterprise-grade de seguridad HTTP
 * Compatible con infraestructura existente
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const compression = require('compression');
const { EnterpriseLogger } = require('../audit/enterpriseAudit');

// 🔧 Configuración de seguridad HTTP
const SECURITY_CONFIG = {
    // Rate limiting por endpoints
    rateLimits: {
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 5, // 5 intentos por ventana
            message: 'Demasiados intentos de autenticación'
        },
        api: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 1000, // 1000 requests por ventana
            message: 'Límite de API excedido'
        },
        upload: {
            windowMs: 60 * 60 * 1000, // 1 hora
            max: 50, // 50 uploads por hora
            message: 'Límite de uploads excedido'
        },
        strict: {
            windowMs: 5 * 60 * 1000, // 5 minutos
            max: 10, // 10 requests por ventana
            message: 'Endpoint protegido - límite excedido'
        }
    },
    
    // Configuración de slowdown
    slowDown: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        delayAfter: 100, // Comenzar delay después de 100 requests
        delayMs: 500, // Incremento de delay por request
        maxDelayMs: 20000 // Máximo 20 segundos de delay
    },
    
    // CSP configuración
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Solo para desarrollo
                "https://cdn.jsdelivr.net",
                "https://code.jquery.com",
                "https://cdnjs.cloudflare.com",
                "https://sdk.mercadopago.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "blob:"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            connectSrc: [
                "'self'",
                "https://api.mercadopago.com",
                "wss:"
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"]
        }
    }
};

// 🔒 Middleware de Headers de Seguridad Empresariales
const enterpriseSecurityHeaders = () => {
    return helmet({
        // Content Security Policy
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? 
            SECURITY_CONFIG.contentSecurityPolicy : false, // Desactivar en desarrollo
        
        // DNS Prefetch Control
        dnsPrefetchControl: {
            allow: false
        },
        
        // Frameguard
        frameguard: {
            action: 'deny'
        },
        
        // Hide Powered-By
        hidePoweredBy: true,
        
        // HSTS (HTTP Strict Transport Security)
        hsts: {
            maxAge: 31536000, // 1 año
            includeSubDomains: true,
            preload: true
        },
        
        // IE No Open
        ieNoOpen: true,
        
        // No Sniff
        noSniff: true,
        
        // Origin Agent Cluster
        originAgentCluster: true,
        
        // Permitted Cross Domain Policies
        permittedCrossDomainPolicies: false,
        
        // Referrer Policy
        referrerPolicy: {
            policy: ["no-referrer", "strict-origin-when-cross-origin"]
        },
        
        // X-XSS-Protection
        xssFilter: true,
        
        // Cross Origin Embedder Policy
        crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
    });
};

// 🚫 Sistema de Rate Limiting Inteligente
class IntelligentRateLimit {
    constructor() {
        this.logger = new EnterpriseLogger();
        this.suspiciousIPs = new Set();
        this.whitelistedIPs = new Set(['127.0.0.1', '::1']); // IPs locales por defecto
    }

    /**
     * Crear rate limiter por tipo
     * @param {string} type - Tipo de rate limit
     * @param {object} customConfig - Configuración personalizada
     */
    createRateLimit(type = 'api', customConfig = {}) {
        const config = { 
            ...SECURITY_CONFIG.rateLimits[type], 
            ...customConfig 
        };

        return rateLimit({
            ...config,
            keyGenerator: (req) => {
                // Usar IP + User-Agent hash para más precisión
                const userAgentHash = require('crypto')
                    .createHash('md5')
                    .update(req.get('User-Agent') || '')
                    .digest('hex')
                    .substring(0, 8);
                
                return `${req.ip}_${userAgentHash}`;
            },
            skip: (req) => {
                // Saltear IPs whitelisteadas
                return this.whitelistedIPs.has(req.ip);
            },
            onLimitReached: (req, res, options) => {
                // Log cuando se alcanza el límite
                this.logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
                    ip: req.ip,
                    url: req.originalUrl,
                    method: req.method,
                    userAgent: req.get('User-Agent'),
                    limitType: type,
                    windowMs: config.windowMs,
                    maxRequests: config.max
                }, 'MEDIUM');

                // Marcar IP como sospechosa si excede límites frecuentemente
                this.markSuspiciousIP(req.ip);
            },
            handler: (req, res) => {
                res.status(429).json({
                    success: false,
                    message: config.message || 'Demasiadas solicitudes',
                    retryAfter: Math.ceil(config.windowMs / 1000),
                    code: 'RATE_LIMIT_EXCEEDED'
                });
            },
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    /**
     * Marcar IP como sospechosa
     * @param {string} ip - Dirección IP
     */
    markSuspiciousIP(ip) {
        if (!this.whitelistedIPs.has(ip)) {
            this.suspiciousIPs.add(ip);
            
            // Auto-remover después de 1 hora
            setTimeout(() => {
                this.suspiciousIPs.delete(ip);
            }, 60 * 60 * 1000);

            this.logger.logSecurityEvent('IP_MARKED_SUSPICIOUS', {
                ip,
                reason: 'Frequent rate limit violations'
            }, 'HIGH');
        }
    }

    /**
     * Rate limiter adaptativo (más estricto para IPs sospechosas)
     */
    createAdaptiveRateLimit() {
        return (req, res, next) => {
            const isSuspicious = this.suspiciousIPs.has(req.ip);
            const config = isSuspicious ? 
                SECURITY_CONFIG.rateLimits.strict : 
                SECURITY_CONFIG.rateLimits.api;

            // Crear rate limiter dinámico
            const limiter = this.createRateLimit(isSuspicious ? 'strict' : 'api');
            
            limiter(req, res, next);
        };
    }
}

// 🐌 Middleware de Slowdown (complementa rate limiting)
const intelligentSlowDown = () => {
    return slowDown({
        ...SECURITY_CONFIG.slowDown,
        keyGenerator: (req) => {
            return `${req.ip}_${req.method}_${req.originalUrl}`;
        },
        onLimitReached: (req, res, options) => {
            const logger = new EnterpriseLogger();
            logger.logSecurityEvent('SLOWDOWN_ACTIVATED', {
                ip: req.ip,
                url: req.originalUrl,
                method: req.method,
                delay: options.delay
            }, 'LOW');
        }
    });
};

// 🛡️ Protección Anti-DDoS Básica
const antiDDoSProtection = () => {
    const requestTracker = new Map();
    const logger = new EnterpriseLogger();

    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const window = 60000; // 1 minuto
        const maxRequests = 500; // 500 requests por minuto para DDoS básico

        // Inicializar tracker para la IP
        if (!requestTracker.has(ip)) {
            requestTracker.set(ip, []);
        }

        const requests = requestTracker.get(ip);
        
        // Limpiar requests antiguos
        const recentRequests = requests.filter(time => now - time < window);
        requestTracker.set(ip, recentRequests);

        // Agregar request actual
        recentRequests.push(now);

        // Verificar si excede límite de DDoS
        if (recentRequests.length > maxRequests) {
            logger.logSecurityEvent('DDOS_ATTEMPT_DETECTED', {
                ip,
                requestCount: recentRequests.length,
                window: '1 minute',
                threshold: maxRequests,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl
            }, 'CRITICAL');

            // Bloquear por 5 minutos
            setTimeout(() => {
                requestTracker.delete(ip);
            }, 5 * 60 * 1000);

            return res.status(503).json({
                success: false,
                message: 'Servicio temporalmente no disponible',
                code: 'SERVICE_UNAVAILABLE',
                retryAfter: 300 // 5 minutos
            });
        }

        next();
    };
};

// 📊 Middleware de Compresión Segura
const secureCompression = () => {
    return compression({
        level: 6, // Balancear compresión vs CPU
        threshold: 1024, // Solo comprimir archivos > 1KB
        filter: (req, res) => {
            // No comprimir si el cliente no lo soporta
            if (req.headers['x-no-compression']) {
                return false;
            }
            
            // Usar filtro por defecto para otros casos
            return compression.filter(req, res);
        }
    });
};

// 🔒 Middleware de Headers Personalizados de Seguridad
const customSecurityHeaders = () => {
    return (req, res, next) => {
        // Headers adicionales de seguridad
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        
        // Header personalizado para identificar la aplicación
        res.setHeader('X-Powered-By', 'Clinikdent Enterprise Security');
        
        // Cache control para endpoints sensibles
        if (req.originalUrl.includes('/api/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        
        next();
    };
};

// 🔍 Middleware de Detección de Bot/Crawler
const botDetection = () => {
    const logger = new EnterpriseLogger();
    
    // Patrones de User-Agents sospechosos
    const suspiciousBots = [
        /sqlmap/i,
        /nmap/i,
        /nikto/i,
        /dirb/i,
        /masscan/i,
        /python-requests/i,
        /curl/i
    ];

    return (req, res, next) => {
        const userAgent = req.get('User-Agent') || '';
        
        // Detectar bots maliciosos
        const isSuspicious = suspiciousBots.some(pattern => pattern.test(userAgent));
        
        if (isSuspicious) {
            logger.logSecurityEvent('SUSPICIOUS_BOT_DETECTED', {
                ip: req.ip,
                userAgent,
                url: req.originalUrl,
                method: req.method
            }, 'HIGH');
            
            // Responder con delay para confundir bots
            setTimeout(() => {
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado',
                    code: 'BOT_DETECTED'
                });
            }, Math.random() * 3000 + 1000); // 1-4 segundos de delay
            
            return;
        }
        
        // Detectar ausencia de User-Agent (también sospechoso)
        if (!userAgent) {
            logger.logSecurityEvent('MISSING_USER_AGENT', {
                ip: req.ip,
                url: req.originalUrl,
                method: req.method
            }, 'MEDIUM');
        }
        
        next();
    };
};

// 🛡️ Instancia global del sistema de rate limiting
const intelligentRateLimit = new IntelligentRateLimit();

// 📝 Middleware de monitoreo de performance de seguridad
const securityPerformanceMonitor = () => {
    return (req, res, next) => {
        const startTime = process.hrtime.bigint();
        
        res.on('finish', () => {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000; // Convertir a ms
            
            // Log si las verificaciones de seguridad toman mucho tiempo
            if (duration > 100) { // > 100ms
                const logger = new EnterpriseLogger();
                logger.logSecurityEvent('SLOW_SECURITY_CHECK', {
                    url: req.originalUrl,
                    method: req.method,
                    duration: `${duration.toFixed(2)}ms`,
                    statusCode: res.statusCode
                }, 'LOW');
            }
        });
        
        next();
    };
};

module.exports = {
    // Clases principales
    IntelligentRateLimit,
    
    // Middlewares de seguridad
    enterpriseSecurityHeaders,
    intelligentSlowDown,
    antiDDoSProtection,
    secureCompression,
    customSecurityHeaders,
    botDetection,
    securityPerformanceMonitor,
    
    // Rate limiters específicos
    rateLimiters: {
        auth: intelligentRateLimit.createRateLimit('auth'),
        api: intelligentRateLimit.createRateLimit('api'),
        upload: intelligentRateLimit.createRateLimit('upload'),
        strict: intelligentRateLimit.createRateLimit('strict'),
        adaptive: intelligentRateLimit.createAdaptiveRateLimit()
    },
    
    // Configuración
    SECURITY_CONFIG
};