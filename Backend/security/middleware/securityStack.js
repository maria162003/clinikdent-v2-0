/**
 * 🔐 MIDDLEWARE PRINCIPAL DE SEGURIDAD INTEGRADO
 * Orquesta todos los componentes de seguridad empresarial
 * Compatible con la aplicación existente - NO ROMPE FUNCIONALIDAD
 */

// Importar todos los componentes de seguridad
const { authenticateJWT, authLimiter, auditLogger } = require('./jwtAdvanced');
const { DataEncryption, SecureHashing } = require('../encryption/dataEncryption');
const { EnterpriseLogger, auditMiddleware, sessionTracker, loginAnomalyDetector } = require('../audit/enterpriseAudit');
const { 
    autoSanitizer, 
    handleValidationErrors, 
    antiCSRF, 
    inputMonitoring,
    EnterpriseValidators 
} = require('../validators/enterpriseValidation');
const { 
    enterpriseSecurityHeaders,
    intelligentSlowDown,
    antiDDoSProtection,
    secureCompression,
    customSecurityHeaders,
    botDetection,
    securityPerformanceMonitor,
    rateLimiters
} = require('./enterpriseSecurity');

// 🛡️ Configuración de Stack de Seguridad
const SECURITY_STACK_CONFIG = {
    // Niveles de seguridad por ruta
    securityLevels: {
        public: ['headers', 'compression', 'ddos', 'bot'],
        auth: ['headers', 'compression', 'ddos', 'bot', 'rateLimit', 'validation', 'audit'],
        protected: ['headers', 'compression', 'ddos', 'bot', 'rateLimit', 'jwt', 'validation', 'audit', 'csrf'],
        admin: ['headers', 'compression', 'ddos', 'bot', 'strictRateLimit', 'jwt', 'validation', 'audit', 'csrf', 'encryption']
    },
    
    // Rutas que requieren diferentes niveles
    routePatterns: {
        public: ['/health', '/test', '/api/faqs', '/api/contacto'],
        auth: ['/api/auth/login', '/api/auth/register', '/api/auth/recovery'],
        protected: ['/api/citas', '/api/tratamientos', '/api/historial', '/api/pagos'],
        admin: ['/api/usuarios', '/api/reportes', '/api/configuracion', '/api/seguridad']
    }
};

// 🔧 Clase principal del Stack de Seguridad
class SecurityStack {
    constructor() {
        this.logger = new EnterpriseLogger();
        this.encryption = new DataEncryption();
        this.isInitialized = false;
    }

    /**
     * Inicializar el stack de seguridad
     */
    initialize() {
        if (this.isInitialized) return;

        console.log('🔐 Inicializando Stack de Seguridad Empresarial...');
        
        // Verificar dependencias
        this.checkDependencies();
        
        this.isInitialized = true;
        console.log('✅ Stack de Seguridad inicializado correctamente');
    }

    /**
     * Verificar dependencias necesarias
     */
    checkDependencies() {
        const requiredEnvVars = ['JWT_SECRET'];
        const missing = requiredEnvVars.filter(env => !process.env[env]);
        
        if (missing.length > 0) {
            console.warn(`⚠️ Variables de entorno faltantes: ${missing.join(', ')}`);
        }
    }

    /**
     * Determinar nivel de seguridad por ruta
     * @param {string} path - Ruta de la request
     * @returns {string} - Nivel de seguridad
     */
    getSecurityLevel(path) {
        // Verificar cada patrón de ruta
        for (const [level, patterns] of Object.entries(SECURITY_STACK_CONFIG.routePatterns)) {
            if (patterns.some(pattern => path.startsWith(pattern))) {
                return level;
            }
        }
        
        // Por defecto, rutas API requieren protección
        if (path.startsWith('/api/')) {
            return 'protected';
        }
        
        return 'public';
    }

    /**
     * Obtener middlewares según nivel de seguridad
     * @param {string} level - Nivel de seguridad
     * @returns {Array} - Array de middlewares
     */
    getMiddlewareStack(level) {
        const components = SECURITY_STACK_CONFIG.securityLevels[level] || [];
        const middlewares = [];

        // Mapear componentes a middlewares
        const middlewareMap = {
            headers: enterpriseSecurityHeaders(),
            compression: secureCompression(),
            ddos: antiDDoSProtection(),
            bot: botDetection(),
            rateLimit: rateLimiters.api,
            strictRateLimit: rateLimiters.strict,
            jwt: authenticateJWT,
            validation: [autoSanitizer(), inputMonitoring(), handleValidationErrors()],
            audit: [auditMiddleware(), sessionTracker()],
            csrf: antiCSRF(),
            encryption: this.encryptionMiddleware()
        };

        components.forEach(component => {
            const middleware = middlewareMap[component];
            if (middleware) {
                if (Array.isArray(middleware)) {
                    middlewares.push(...middleware);
                } else {
                    middlewares.push(middleware);
                }
            }
        });

        return middlewares;
    }

    /**
     * Middleware de encriptación para datos sensibles
     */
    encryptionMiddleware() {
        return (req, res, next) => {
            // Solo aplicar a operaciones que manejan datos sensibles
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                // Campos que requieren encriptación
                const sensitiveFields = ['contraseña', 'password', 'tarjeta', 'documento_completo'];
                
                sensitiveFields.forEach(field => {
                    if (req.body[field]) {
                        try {
                            req.body[field + '_encrypted'] = this.encryption.encrypt(req.body[field]);
                        } catch (error) {
                            console.error(`❌ Error encriptando campo ${field}:`, error);
                        }
                    }
                });
            }
            
            next();
        };
    }

    /**
     * Crear middleware adaptativo que aplica seguridad según la ruta
     */
    createAdaptiveMiddleware() {
        return (req, res, next) => {
            const securityLevel = this.getSecurityLevel(req.originalUrl);
            const middlewares = this.getMiddlewareStack(securityLevel);
            
            // Agregar headers de debugging en desarrollo
            if (process.env.NODE_ENV === 'development') {
                res.setHeader('X-Security-Level', securityLevel);
                res.setHeader('X-Security-Stack', middlewares.length.toString());
            }
            
            // Ejecutar middlewares secuencialmente
            this.executeMiddlewareStack(middlewares, req, res, next);
        };
    }

    /**
     * Ejecutar stack de middlewares secuencialmente
     * @param {Array} middlewares - Array de middlewares
     * @param {object} req - Request object
     * @param {object} res - Response object
     * @param {Function} finalNext - Callback final
     */
    executeMiddlewareStack(middlewares, req, res, finalNext) {
        let index = 0;
        
        const executeNext = (error) => {
            if (error) {
                return finalNext(error);
            }
            
            if (index >= middlewares.length) {
                return finalNext();
            }
            
            const middleware = middlewares[index++];
            
            try {
                middleware(req, res, executeNext);
            } catch (error) {
                console.error('❌ Error en middleware de seguridad:', error);
                executeNext(error);
            }
        };
        
        executeNext();
    }
}

// 🔄 Middleware de Monitoreo Global de Seguridad
const globalSecurityMonitor = () => {
    const logger = new EnterpriseLogger();
    
    return (req, res, next) => {
        const startTime = process.hrtime.bigint();
        
        // Marcar inicio de request
        req.securityContext = {
            startTime,
            securityLevel: null,
            checksApplied: [],
            anomaliesDetected: []
        };
        
        // Interceptar response para estadísticas finales
        const originalSend = res.send;
        res.send = function(data) {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000;
            
            // Log de estadísticas de seguridad
            if (req.securityContext) {
                logger.logSecurityEvent('SECURITY_SUMMARY', {
                    ip: req.ip,
                    url: req.originalUrl,
                    method: req.method,
                    securityLevel: req.securityContext.securityLevel,
                    duration: `${duration.toFixed(2)}ms`,
                    checksApplied: req.securityContext.checksApplied,
                    anomaliesDetected: req.securityContext.anomaliesDetected.length,
                    statusCode: res.statusCode
                }, 'INFO');
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

// 🚨 Middleware de Respuesta a Incidentes
const incidentResponse = () => {
    const logger = new EnterpriseLogger();
    
    return (error, req, res, next) => {
        // Clasificar tipo de error/incidente
        let incidentType = 'GENERAL_ERROR';
        let severity = 'MEDIUM';
        
        if (error.code === 'EBADCSRFTOKEN') {
            incidentType = 'CSRF_ATTACK';
            severity = 'HIGH';
        } else if (error.status === 429) {
            incidentType = 'RATE_LIMIT_VIOLATION';
            severity = 'MEDIUM';
        } else if (error.name === 'ValidationError') {
            incidentType = 'VALIDATION_ERROR';
            severity = 'LOW';
        }
        
        // Log del incidente
        logger.logSecurityEvent('SECURITY_INCIDENT', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            incidentType,
            errorMessage: error.message,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || null
        }, severity);
        
        // Respuesta segura sin exponer detalles internos
        if (process.env.NODE_ENV === 'production') {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                code: 'INTERNAL_ERROR',
                incidentId: require('crypto').randomUUID()
            });
        } else {
            // En desarrollo, mostrar más detalles
            res.status(error.status || 500).json({
                success: false,
                message: error.message,
                stack: error.stack,
                incidentType
            });
        }
    };
};

// 📊 Instancia global del Stack de Seguridad
const securityStack = new SecurityStack();

// 🛠️ Función de configuración fácil para la app existente
const setupEnterpriseSecurity = (app) => {
    console.log('🔐 Configurando Seguridad Empresarial en aplicación existente...');
    
    // Inicializar stack
    securityStack.initialize();
    
    // Middlewares globales (aplicar ANTES de las rutas existentes)
    
    // 1. Monitoreo global (siempre primero)
    app.use(globalSecurityMonitor());
    
    // 2. Headers de seguridad básicos (siempre)
    app.use(enterpriseSecurityHeaders());
    app.use(customSecurityHeaders());
    
    // 3. Compresión segura
    app.use(secureCompression());
    
    // 4. Protección DDoS básica
    app.use(antiDDoSProtection());
    
    // 5. Detección de bots
    app.use(botDetection());
    
    // 6. Slowdown general
    app.use(intelligentSlowDown());
    
    // 7. Monitoreo de performance
    app.use(securityPerformanceMonitor());
    
    // 8. Rate limiting específico por rutas
    
    // Rutas de autenticación (más estricto)
    app.use('/api/auth', rateLimiters.auth);
    app.use('/api/auth', loginAnomalyDetector());
    
    // Rutas de administración (muy estricto)
    app.use(['/api/usuarios', '/api/reportes', '/api/configuracion'], rateLimiters.strict);
    
    // API general
    app.use('/api', rateLimiters.api);
    
    // 9. Sanitización y validación global
    app.use('/api', autoSanitizer());
    app.use('/api', inputMonitoring());
    
    // 10. Auditoría global
    app.use(auditMiddleware());
    app.use(sessionTracker());
    
    // 11. CSRF protection para operaciones de modificación
    app.use(['/api/citas', '/api/tratamientos', '/api/pagos', '/api/usuarios'], antiCSRF());
    
    // Middleware de manejo de errores de validación (después de las rutas)
    app.use('/api', handleValidationErrors());
    
    // Middleware de respuesta a incidentes (último)
    app.use(incidentResponse());
    
    console.log('✅ Seguridad Empresarial configurada correctamente');
    console.log('📋 Stack de seguridad activo:');
    console.log('   - Headers de seguridad avanzados');
    console.log('   - Protección DDoS y rate limiting');
    console.log('   - Detección de bots maliciosos');
    console.log('   - Sanitización automática de inputs');
    console.log('   - Auditoría completa de requests');
    console.log('   - Protección CSRF');
    console.log('   - Logging de seguridad empresarial');
};

// 📚 Función para obtener métricas de seguridad
const getSecurityMetrics = async () => {
    const logger = new EnterpriseLogger();
    return await logger.getSecurityMetrics(
        new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        new Date()
    );
};

module.exports = {
    // Clase principal
    SecurityStack,
    
    // Instancia global
    securityStack,
    
    // Función de configuración fácil
    setupEnterpriseSecurity,
    
    // Middlewares individuales por si se necesitan
    globalSecurityMonitor,
    incidentResponse,
    
    // Utilidades
    getSecurityMetrics,
    
    // Validadores listos para usar
    validators: EnterpriseValidators,
    
    // Configuración
    SECURITY_STACK_CONFIG
};