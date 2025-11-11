/**
 * 📋 SISTEMA DE AUDITORÍA Y LOGGING EMPRESARIAL
 * Tracking completo de sesiones, detección de anomalías y logs de seguridad
 * Compatible con sistemas existentes
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { DataEncryption } = require('../encryption/dataEncryption');

// 🔧 Configuración de auditoría
const AUDIT_CONFIG = {
    logDir: path.join(__dirname, '../../logs'),
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    logLevels: {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
        INFO: 4
    },
    retentionDays: 90,
    anomalyThresholds: {
        maxLoginAttempts: 5,
        maxRequestsPerMinute: 100,
        suspiciousPatterns: [
            'sql injection',
            'xss attempt',
            'path traversal',
            'brute force'
        ]
    }
};

// 📊 Sistema de Logging Empresarial
class EnterpriseLogger {
    constructor() {
        this.encryption = new DataEncryption();
        this.initializeLogDirectories();
        this.sessionTracker = new Map();
        this.anomalyDetector = new AnomalyDetector();
    }

    async initializeLogDirectories() {
        try {
            await fs.mkdir(AUDIT_CONFIG.logDir, { recursive: true });
            await fs.mkdir(path.join(AUDIT_CONFIG.logDir, 'security'), { recursive: true });
            await fs.mkdir(path.join(AUDIT_CONFIG.logDir, 'audit'), { recursive: true });
            await fs.mkdir(path.join(AUDIT_CONFIG.logDir, 'access'), { recursive: true });
            await fs.mkdir(path.join(AUDIT_CONFIG.logDir, 'errors'), { recursive: true });
        } catch (error) {
            console.error('❌ Error creando directorios de logs:', error);
        }
    }

    /**
     * Log de eventos de seguridad
     * @param {string} event - Tipo de evento
     * @param {object} data - Datos del evento
     * @param {string} level - Nivel de criticidad
     */
    async logSecurityEvent(event, data, level = 'MEDIUM') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventId: crypto.randomUUID(),
            event,
            level,
            data: {
                ...data,
                ip: data.ip || 'unknown',
                userAgent: data.userAgent || 'unknown',
                sessionId: data.sessionId || null
            },
            hash: null // Para integridad
        };

        // Generar hash para integridad
        const dataString = JSON.stringify(logEntry.data);
        logEntry.hash = crypto.createHash('sha256').update(dataString).digest('hex');

        // Encriptar datos sensibles
        if (data.sensitiveData) {
            logEntry.data.sensitiveData = this.encryption.encryptObject(data.sensitiveData);
        }

        await this.writeLog('security', logEntry);

        // Alertar si es crítico
        if (level === 'CRITICAL' || level === 'HIGH') {
            this.handleCriticalEvent(logEntry);
        }
    }

    /**
     * Log de acceso a la aplicación
     * @param {object} req - Request object
     * @param {object} res - Response object
     */
    async logAccess(req, res) {
        const accessEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || null,
            sessionId: req.user?.sessionId || null,
            statusCode: res.statusCode,
            responseTime: res.responseTime || 0,
            contentLength: res.get('content-length') || 0
        };

        await this.writeLog('access', accessEntry);

        // Detectar anomalías
        this.anomalyDetector.checkAccessAnomaly(accessEntry);
    }

    /**
     * Log de errores
     * @param {Error} error - Error object
     * @param {object} context - Contexto del error
     */
    async logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            errorId: crypto.randomUUID(),
            message: error.message,
            stack: error.stack,
            code: error.code || 'UNKNOWN',
            context: {
                ...context,
                ip: context.ip || 'unknown',
                userId: context.userId || null,
                url: context.url || 'unknown'
            }
        };

        await this.writeLog('errors', errorEntry);
    }

    /**
     * Log de auditoría para cambios importantes
     * @param {string} action - Acción realizada
     * @param {object} details - Detalles de la acción
     */
    async logAudit(action, details) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            auditId: crypto.randomUUID(),
            action,
            userId: details.userId,
            targetResource: details.targetResource || null,
            oldValue: details.oldValue || null,
            newValue: details.newValue || null,
            ip: details.ip,
            userAgent: details.userAgent,
            success: details.success !== false, // Default true
            metadata: details.metadata || {}
        };

        await this.writeLog('audit', auditEntry);
    }

    /**
     * Escribir log a archivo
     * @param {string} type - Tipo de log
     * @param {object} entry - Entrada del log
     */
    async writeLog(type, entry) {
        try {
            const logFile = path.join(AUDIT_CONFIG.logDir, type, `${type}-${new Date().toISOString().split('T')[0]}.log`);
            const logLine = JSON.stringify(entry) + '\n';
            
            await fs.appendFile(logFile, logLine);
            
            // Rotar logs si es necesario
            await this.rotateLogsIfNeeded(logFile);
        } catch (error) {
            console.error(`❌ Error escribiendo log ${type}:`, error);
        }
    }

    /**
     * Rotar logs si superan el tamaño máximo
     * @param {string} logFile - Archivo de log
     */
    async rotateLogsIfNeeded(logFile) {
        try {
            const stats = await fs.stat(logFile);
            
            if (stats.size > AUDIT_CONFIG.maxFileSize) {
                const timestamp = new Date().getTime();
                const rotatedFile = `${logFile}.${timestamp}`;
                
                await fs.rename(logFile, rotatedFile);
                console.log(`🔄 Log rotado: ${rotatedFile}`);
                
                // Limpiar logs antiguos
                await this.cleanOldLogs(path.dirname(logFile));
            }
        } catch (error) {
            // Archivo no existe aún, no hacer nada
        }
    }

    /**
     * Limpiar logs antiguos
     * @param {string} logDir - Directorio de logs
     */
    async cleanOldLogs(logDir) {
        try {
            const files = await fs.readdir(logDir);
            const cutoffTime = Date.now() - (AUDIT_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
            
            for (const file of files) {
                const filePath = path.join(logDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Log eliminado por antigüedad: ${file}`);
                }
            }
        } catch (error) {
            console.error('❌ Error limpiando logs antiguos:', error);
        }
    }

    /**
     * Manejar eventos críticos
     * @param {object} logEntry - Entrada del log crítico
     */
    handleCriticalEvent(logEntry) {
        console.error(`🚨 EVENTO CRÍTICO DETECTADO: ${logEntry.event}`, logEntry.data);
        
        // En producción, aquí se enviarían alertas por email, Slack, etc.
        // Por ahora solo loguear en consola
    }

    /**
     * Obtener métricas de seguridad
     * @param {Date} startDate - Fecha inicio
     * @param {Date} endDate - Fecha fin
     * @returns {object} - Métricas de seguridad
     */
    async getSecurityMetrics(startDate, endDate) {
        // En producción, esto leería de una base de datos optimizada
        // Por ahora retornar métricas simuladas
        return {
            totalEvents: 1250,
            criticalEvents: 5,
            loginAttempts: 890,
            failedLogins: 23,
            anomaliesDetected: 8,
            blockedRequests: 12,
            topRisks: [
                { type: 'Brute force attempt', count: 15 },
                { type: 'Suspicious IP', count: 8 },
                { type: 'Invalid token', count: 45 }
            ]
        };
    }
}

// 🔍 Detector de Anomalías
class AnomalyDetector {
    constructor() {
        this.requestTracker = new Map(); // IP -> requests array
        this.loginTracker = new Map();   // IP -> login attempts
        this.patternTracker = new Map(); // Patterns detected
    }

    /**
     * Verificar anomalías en acceso
     * @param {object} accessEntry - Entrada de acceso
     */
    checkAccessAnomaly(accessEntry) {
        const { ip, url, userAgent, statusCode } = accessEntry;
        const now = Date.now();

        // Tracking de requests por IP
        if (!this.requestTracker.has(ip)) {
            this.requestTracker.set(ip, []);
        }
        
        const requests = this.requestTracker.get(ip);
        requests.push({ timestamp: now, url, statusCode });
        
        // Limpiar requests antiguos (últimos 60 segundos)
        const recentRequests = requests.filter(r => now - r.timestamp < 60000);
        this.requestTracker.set(ip, recentRequests);

        // Detectar rate limiting
        if (recentRequests.length > AUDIT_CONFIG.anomalyThresholds.maxRequestsPerMinute) {
            this.reportAnomaly('HIGH_REQUEST_RATE', {
                ip,
                requestCount: recentRequests.length,
                timeWindow: '1 minute'
            });
        }

        // Detectar patrones sospechosos en URL
        this.detectSuspiciousPatterns(url, ip);

        // Detectar múltiples errores 4xx/5xx
        const errorRequests = recentRequests.filter(r => r.statusCode >= 400);
        if (errorRequests.length > 10) {
            this.reportAnomaly('HIGH_ERROR_RATE', {
                ip,
                errorCount: errorRequests.length,
                timeWindow: '1 minute'
            });
        }
    }

    /**
     * Detectar patrones sospechosos
     * @param {string} url - URL de la request
     * @param {string} ip - IP del cliente
     */
    detectSuspiciousPatterns(url, ip) {
        const suspiciousPatterns = [
            { pattern: /(union|select|insert|delete|drop|exec)/i, type: 'SQL_INJECTION' },
            { pattern: /<script|javascript:|onerror|onload/i, type: 'XSS_ATTEMPT' },
            { pattern: /\.\.\//g, type: 'PATH_TRAVERSAL' },
            { pattern: /\.(exe|bat|sh|php|jsp)$/i, type: 'SUSPICIOUS_FILE' }
        ];

        suspiciousPatterns.forEach(({ pattern, type }) => {
            if (pattern.test(url)) {
                this.reportAnomaly(type, { ip, url, pattern: pattern.toString() });
            }
        });
    }

    /**
     * Trackear intentos de login
     * @param {string} ip - IP del cliente
     * @param {boolean} success - Si el login fue exitoso
     * @param {string} email - Email usado
     */
    trackLoginAttempt(ip, success, email) {
        const now = Date.now();
        
        if (!this.loginTracker.has(ip)) {
            this.loginTracker.set(ip, []);
        }

        const attempts = this.loginTracker.get(ip);
        attempts.push({ timestamp: now, success, email });

        // Limpiar intentos antiguos (últimos 15 minutos)
        const recentAttempts = attempts.filter(a => now - a.timestamp < 900000);
        this.loginTracker.set(ip, recentAttempts);

        // Detectar brute force
        const failedAttempts = recentAttempts.filter(a => !a.success);
        if (failedAttempts.length >= AUDIT_CONFIG.anomalyThresholds.maxLoginAttempts) {
            this.reportAnomaly('BRUTE_FORCE_ATTEMPT', {
                ip,
                failedAttempts: failedAttempts.length,
                timeWindow: '15 minutes',
                targetEmails: [...new Set(failedAttempts.map(a => a.email))]
            });
        }
    }

    /**
     * Reportar anomalía detectada
     * @param {string} type - Tipo de anomalía
     * @param {object} details - Detalles de la anomalía
     */
    reportAnomaly(type, details) {
        console.warn(`⚠️ ANOMALÍA DETECTADA: ${type}`, details);
        
        // Log de seguridad
        const logger = new EnterpriseLogger();
        logger.logSecurityEvent('ANOMALY_DETECTED', {
            anomalyType: type,
            ...details
        }, 'HIGH');
    }
}

// 📊 Middleware de auditoría para requests
const auditMiddleware = () => {
    const logger = new EnterpriseLogger();
    
    return async (req, res, next) => {
        const startTime = process.hrtime();
        
        // Interceptar response para medir tiempo
        const originalSend = res.send;
        res.send = function(data) {
            const diff = process.hrtime(startTime);
            res.responseTime = Math.round((diff[0] * 1e9 + diff[1]) / 1e6); // en ms
            
            // Log de acceso
            logger.logAccess(req, res);
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

// 🔐 Middleware de tracking de sesiones
const sessionTracker = () => {
    const activeSessions = new Map();
    
    return (req, res, next) => {
        if (req.user && req.user.sessionId) {
            const sessionInfo = {
                userId: req.user.id,
                sessionId: req.user.sessionId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                lastActivity: new Date(),
                requests: (activeSessions.get(req.user.sessionId)?.requests || 0) + 1
            };
            
            activeSessions.set(req.user.sessionId, sessionInfo);
            
            // Limpiar sesiones inactivas (más de 1 hora)
            const oneHourAgo = new Date(Date.now() - 3600000);
            for (const [sessionId, session] of activeSessions.entries()) {
                if (session.lastActivity < oneHourAgo) {
                    activeSessions.delete(sessionId);
                }
            }
        }
        
        next();
    };
};

// 🚨 Middleware de detección de anomalías en login
const loginAnomalyDetector = () => {
    const detector = new AnomalyDetector();
    
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Solo aplicar a rutas de login
            if (req.originalUrl.includes('/login') || req.originalUrl.includes('/auth')) {
                try {
                    const responseData = typeof data === 'string' ? JSON.parse(data) : data;
                    const success = responseData.success || responseData.token || false;
                    const email = req.body.email || req.body.correo || 'unknown';
                    
                    detector.trackLoginAttempt(req.ip, success, email);
                } catch (error) {
                    // Si no se puede parsear, asumir que fue fallido
                    detector.trackLoginAttempt(req.ip, false, req.body.email || 'unknown');
                }
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    // Clases principales
    EnterpriseLogger,
    AnomalyDetector,
    
    // Middlewares
    auditMiddleware,
    sessionTracker,
    loginAnomalyDetector,
    
    // Configuración
    AUDIT_CONFIG
};