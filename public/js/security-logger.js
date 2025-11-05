/**
 * ============================================================================
 * SISTEMA DE LOGS Y AUDITORÍA FRONTEND - CLINIKDENT
 * Sistema ligero de logging para monitoreo de seguridad
 * ============================================================================
 */

class SecurityLogger {
    constructor() {
        this.logBuffer = [];
        this.maxLogs = 100; // Máximo de logs en memoria
        this.logLevel = 'info'; // debug, info, warn, error
        this.persistenceDays = 7; // Días que se guardan los logs
        
        this.initStorage();
        this.startPeriodicCleanup();
        
        console.log('📊 Sistema de logs de seguridad inicializado');
    }

    initStorage() {
        // Limpiar logs antiguos al inicializar
        this.cleanupOldLogs();
        
        // Cargar logs existentes
        const existingLogs = localStorage.getItem('security_logs');
        if (existingLogs) {
            try {
                this.logBuffer = JSON.parse(existingLogs).slice(-this.maxLogs);
            } catch (e) {
                console.warn('No se pudieron cargar logs existentes:', e);
                this.logBuffer = [];
            }
        }
    }

    // Logging principal
    log(level, category, message, metadata = {}) {
        if (!this.shouldLog(level)) return;

        const logEntry = {
            id: this.generateLogId(),
            timestamp: Date.now(),
            level: level,
            category: category,
            message: message,
            metadata: {
                ...metadata,
                url: window.location.href,
                userAgent: navigator.userAgent.substring(0, 100),
                sessionId: this.getSessionId(),
                userId: localStorage.getItem('userId') || 'anonymous'
            }
        };

        this.logBuffer.push(logEntry);
        
        // Mantener buffer bajo control
        if (this.logBuffer.length > this.maxLogs) {
            this.logBuffer = this.logBuffer.slice(-this.maxLogs);
        }

        // Persistir inmediatamente para logs importantes
        if (level === 'error' || level === 'warn') {
            this.persistLogs();
        }

        // Mostrar en consola para desarrollo
        this.logToConsole(logEntry);
    }

    // Métodos de conveniencia
    debug(category, message, metadata) {
        this.log('debug', category, message, metadata);
    }

    info(category, message, metadata) {
        this.log('info', category, message, metadata);
    }

    warn(category, message, metadata) {
        this.log('warn', category, message, metadata);
    }

    error(category, message, metadata) {
        this.log('error', category, message, metadata);
    }

    // Logs específicos de seguridad
    logSecurityEvent(eventType, details = {}) {
        this.warn('security', `Evento de seguridad: ${eventType}`, {
            eventType: eventType,
            ...details,
            timestamp: new Date().toISOString(),
            severity: this.getEventSeverity(eventType)
        });
    }

    logUserAction(action, details = {}) {
        this.info('user_action', `Acción de usuario: ${action}`, {
            action: action,
            ...details,
            timestamp: new Date().toISOString()
        });
    }

    logSystemEvent(event, details = {}) {
        this.info('system', `Evento del sistema: ${event}`, {
            event: event,
            ...details,
            timestamp: new Date().toISOString()
        });
    }

    logPerformance(metric, value, details = {}) {
        this.debug('performance', `Métrica: ${metric} = ${value}`, {
            metric: metric,
            value: value,
            ...details,
            timestamp: new Date().toISOString()
        });
    }

    // Logging de errores con stack trace
    logError(error, context = '') {
        this.error('error', `Error ${context}: ${error.message}`, {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        });
    }

    // Determinar si debe loggearse según el nivel
    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.logLevel];
    }

    // Obtener severidad del evento
    getEventSeverity(eventType) {
        const severityMap = {
            'login_attempt': 'medium',
            'login_failure': 'high',
            'account_locked': 'high',
            'suspicious_activity': 'high',
            'bot_detected': 'critical',
            'rate_limit_exceeded': 'medium',
            'session_timeout': 'low',
            'csrf_violation': 'critical',
            'xss_attempt': 'critical',
            'sql_injection_attempt': 'critical',
            'file_upload_violation': 'high',
            'unauthorized_access': 'critical'
        };
        
        return severityMap[eventType] || 'medium';
    }

    // Generar ID único para log
    generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Obtener ID de sesión persistente
    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = this.generateLogId();
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }

    // Mostrar log en consola
    logToConsole(entry) {
        const styles = {
            debug: 'color: #888',
            info: 'color: #0066cc',
            warn: 'color: #ff9900',
            error: 'color: #cc0000; font-weight: bold'
        };

        const style = styles[entry.level] || '';
        const time = new Date(entry.timestamp).toLocaleTimeString();
        
        console.log(
            `%c[${time}] ${entry.level.toUpperCase()} [${entry.category}] ${entry.message}`,
            style,
            entry.metadata
        );
    }

    // Persistir logs en localStorage
    persistLogs() {
        try {
            localStorage.setItem('security_logs', JSON.stringify(this.logBuffer));
            localStorage.setItem('logs_last_update', Date.now().toString());
        } catch (e) {
            console.warn('No se pudieron persistir los logs:', e);
            // Si hay problemas de espacio, limpiar logs antiguos
            this.cleanupOldLogs();
            try {
                localStorage.setItem('security_logs', JSON.stringify(this.logBuffer.slice(-50)));
            } catch (e2) {
                console.error('Error crítico al persistir logs:', e2);
            }
        }
    }

    // Limpiar logs antiguos
    cleanupOldLogs() {
        const cutoffTime = Date.now() - (this.persistenceDays * 24 * 60 * 60 * 1000);
        
        // Limpiar buffer en memoria
        this.logBuffer = this.logBuffer.filter(log => log.timestamp > cutoffTime);
        
        // Limpiar localStorage
        try {
            const storedLogs = localStorage.getItem('security_logs');
            if (storedLogs) {
                const logs = JSON.parse(storedLogs);
                const cleanLogs = logs.filter(log => log.timestamp > cutoffTime);
                localStorage.setItem('security_logs', JSON.stringify(cleanLogs));
            }
        } catch (e) {
            console.warn('Error al limpiar logs antiguos:', e);
        }
    }

    // Limpieza periódica cada hora
    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupOldLogs();
            this.persistLogs();
        }, 60 * 60 * 1000); // Cada hora
    }

    // Obtener estadísticas de logs
    getLogStats() {
        const stats = {
            total: this.logBuffer.length,
            byLevel: {},
            byCategory: {},
            lastCleanup: localStorage.getItem('logs_last_cleanup') || 'Nunca',
            oldestLog: null,
            newestLog: null
        };

        if (this.logBuffer.length > 0) {
            // Agrupar por nivel
            this.logBuffer.forEach(log => {
                stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
                stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
            });

            // Fechas
            const timestamps = this.logBuffer.map(log => log.timestamp);
            stats.oldestLog = new Date(Math.min(...timestamps)).toLocaleString();
            stats.newestLog = new Date(Math.max(...timestamps)).toLocaleString();
        }

        return stats;
    }

    // Buscar logs
    searchLogs(criteria = {}) {
        return this.logBuffer.filter(log => {
            if (criteria.level && log.level !== criteria.level) return false;
            if (criteria.category && log.category !== criteria.category) return false;
            if (criteria.message && !log.message.toLowerCase().includes(criteria.message.toLowerCase())) return false;
            if (criteria.userId && log.metadata.userId !== criteria.userId) return false;
            if (criteria.fromTime && log.timestamp < criteria.fromTime) return false;
            if (criteria.toTime && log.timestamp > criteria.toTime) return false;
            
            return true;
        });
    }

    // Exportar logs para análisis
    exportLogs(format = 'json') {
        const data = {
            exportTime: new Date().toISOString(),
            totalLogs: this.logBuffer.length,
            logs: this.logBuffer
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data.logs);
        }
        
        return data;
    }

    // Convertir logs a CSV
    convertToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'url'];
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                new Date(log.timestamp).toISOString(),
                log.level,
                log.category,
                `"${log.message.replace(/"/g, '""')}"`,
                log.metadata.userId,
                `"${log.metadata.url}"`
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    // Generar reporte de seguridad
    generateSecurityReport() {
        const securityLogs = this.searchLogs({ category: 'security' });
        const recentErrors = this.searchLogs({ 
            level: 'error', 
            fromTime: Date.now() - (24 * 60 * 60 * 1000) // Últimas 24 horas
        });

        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalSecurityEvents: securityLogs.length,
                recentErrors: recentErrors.length,
                criticalEvents: securityLogs.filter(log => 
                    log.metadata.severity === 'critical'
                ).length,
                topCategories: this.getTopCategories(5),
                systemHealth: this.getSystemHealth()
            },
            securityEvents: securityLogs.slice(-20), // Últimos 20 eventos
            recentErrors: recentErrors.slice(-10),   // Últimos 10 errores
            recommendations: this.getSecurityRecommendations(securityLogs)
        };

        return report;
    }

    // Obtener principales categorías
    getTopCategories(limit = 5) {
        const categoryCount = {};
        this.logBuffer.forEach(log => {
            categoryCount[log.category] = (categoryCount[log.category] || 0) + 1;
        });

        return Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([category, count]) => ({ category, count }));
    }

    // Evaluar salud del sistema
    getSystemHealth() {
        const recentLogs = this.logBuffer.filter(log => 
            log.timestamp > Date.now() - (60 * 60 * 1000) // Última hora
        );

        const errorRate = recentLogs.filter(log => log.level === 'error').length / Math.max(recentLogs.length, 1);
        const warningRate = recentLogs.filter(log => log.level === 'warn').length / Math.max(recentLogs.length, 1);

        let health = 'excelente';
        if (errorRate > 0.1) health = 'crítico';
        else if (errorRate > 0.05 || warningRate > 0.2) health = 'precaución';
        else if (warningRate > 0.1) health = 'advertencia';

        return {
            status: health,
            errorRate: Math.round(errorRate * 100),
            warningRate: Math.round(warningRate * 100),
            totalEvents: recentLogs.length
        };
    }

    // Obtener recomendaciones de seguridad
    getSecurityRecommendations(securityLogs) {
        const recommendations = [];
        
        const criticalEvents = securityLogs.filter(log => log.metadata.severity === 'critical');
        if (criticalEvents.length > 0) {
            recommendations.push({
                priority: 'alta',
                message: `Se detectaron ${criticalEvents.length} eventos críticos de seguridad`,
                action: 'Revisar inmediatamente los eventos críticos y tomar medidas correctivas'
            });
        }

        const loginFailures = securityLogs.filter(log => 
            log.metadata.eventType === 'login_failure'
        );
        if (loginFailures.length > 5) {
            recommendations.push({
                priority: 'media',
                message: `${loginFailures.length} intentos de login fallidos detectados`,
                action: 'Considerar implementar medidas adicionales de protección'
            });
        }

        const botActivity = securityLogs.filter(log => 
            log.metadata.eventType === 'bot_detected'
        );
        if (botActivity.length > 0) {
            recommendations.push({
                priority: 'media',
                message: `Actividad de bots detectada (${botActivity.length} eventos)`,
                action: 'Revisar y mejorar las medidas anti-bot'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'baja',
                message: 'No se detectaron problemas de seguridad importantes',
                action: 'Continuar monitoreando la actividad del sistema'
            });
        }

        return recommendations;
    }

    // Limpiar todos los logs (para testing o reset)
    clearAllLogs() {
        this.logBuffer = [];
        localStorage.removeItem('security_logs');
        localStorage.removeItem('logs_last_update');
        console.log('🗑️ Todos los logs han sido limpiados');
    }
}

// Inicializar sistema de logs
window.securityLogger = new SecurityLogger();

// Intercepción automática de errores
window.addEventListener('error', (event) => {
    window.securityLogger.logError(event.error, 'Global Error Handler');
});

window.addEventListener('unhandledrejection', (event) => {
    window.securityLogger.error('promise', 'Promise rechazada no manejada', {
        reason: event.reason,
        promise: event.promise
    });
});

// Logs automáticos de navegación
window.addEventListener('beforeunload', () => {
    window.securityLogger.logUserAction('page_unload', {
        duration: Date.now() - window.securityLogger.getSessionId()
    });
    window.securityLogger.persistLogs();
});

// Exportar para uso global
window.SecurityLogger = SecurityLogger;