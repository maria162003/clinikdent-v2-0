/**
 * ============================================================================
 * MEDIDAS DE SEGURIDAD ADICIONALES LIGERAS - CLINIKDENT
 * Características de seguridad que no afectan el rendimiento
 * ============================================================================
 */

class LightSecurityEnhancements {
    constructor() {
        this.sessionData = {
            startTime: Date.now(),
            interactions: 0,
            suspiciousActivity: 0
        };
        
        this.securityFeatures = {
            preventRightClick: false, // Deshabilitado por defecto para no molestar
            preventF12: false,        // Deshabilitado por defecto
            detectDevTools: true,     // Solo detectar, no bloquear
            rateLimiting: true,       // Limitar requests muy rápidos
            honeypot: true,           // Campos invisibles para bots
            CSRFProtection: true,     // Protección CSRF básica
            sessionTimeout: true      // Timeout de sesión por inactividad
        };
        
        this.init();
    }

    init() {
        this.addHoneypotFields();
        this.setupCSRFProtection();
        this.setupRateLimiting();
        this.setupSessionMonitoring();
        this.addSecurityHeaders();
        this.preventCommonAttacks();
        this.enhanceFormSecurity();
        
        console.log('✅ Medidas de seguridad ligeras activadas');
    }

    // Campos invisibles para detectar bots
    addHoneypotFields() {
        if (!this.securityFeatures.honeypot) return;

        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Campo honeypot invisible
            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = 'website'; // Nombre atractivo para bots
            honeypot.style.cssText = `
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                width: 1px !important;
                height: 1px !important;
                opacity: 0 !important;
                pointer-events: none !important;
                tab-index: -1 !important;
            `;
            honeypot.setAttribute('autocomplete', 'off');
            honeypot.setAttribute('tabindex', '-1');
            
            // Insertar al principio del formulario
            form.insertBefore(honeypot, form.firstChild);

            // Verificar en submit
            form.addEventListener('submit', (e) => {
                if (honeypot.value) {
                    e.preventDefault();
                    console.warn('🚨 Bot detectado: honeypot activado');
                    this.handleSuspiciousActivity('bot_detected');
                    return false;
                }
            });
        });
    }

    // Protección CSRF básica
    setupCSRFProtection() {
        if (!this.securityFeatures.CSRFProtection) return;

        // Generar token CSRF
        let csrfToken = localStorage.getItem('csrf_token');
        if (!csrfToken) {
            csrfToken = this.generateCSRFToken();
            localStorage.setItem('csrf_token', csrfToken);
        }

        // Agregar token a todos los formularios
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const csrfField = document.createElement('input');
            csrfField.type = 'hidden';
            csrfField.name = '_token';
            csrfField.value = csrfToken;
            form.appendChild(csrfField);
        });

        // Agregar a requests AJAX
        this.interceptAjaxRequests(csrfToken);
    }

    // Rate limiting simple
    setupRateLimiting() {
        if (!this.securityFeatures.rateLimiting) return;

        this.requestTimestamps = [];
        const maxRequestsPerMinute = 30;

        // Interceptar todos los submits
        document.addEventListener('submit', (e) => {
            const now = Date.now();
            this.requestTimestamps.push(now);

            // Limpiar timestamps antiguos (más de 1 minuto)
            this.requestTimestamps = this.requestTimestamps.filter(
                timestamp => now - timestamp < 60000
            );

            if (this.requestTimestamps.length > maxRequestsPerMinute) {
                e.preventDefault();
                this.handleSuspiciousActivity('rate_limit_exceeded');
                
                if (window.showCustomAlert) {
                    showCustomAlert({
                        type: 'warning',
                        title: '⚠️ Actividad Inusual Detectada',
                        message: 'Ha realizado demasiadas acciones muy rápido. Por favor, espere un momento antes de continuar.',
                        confirmText: 'Entiendo'
                    });
                }
                return false;
            }
        });
    }

    // Monitoreo de sesión
    setupSessionMonitoring() {
        if (!this.securityFeatures.sessionTimeout) return;

        const sessionTimeout = 30 * 60 * 1000; // 30 minutos
        let lastActivity = Date.now();
        let warningShown = false;

        // Detectar actividad del usuario
        const resetTimeout = () => {
            lastActivity = Date.now();
            warningShown = false;
            this.sessionData.interactions++;
        };

        document.addEventListener('mousedown', resetTimeout);
        document.addEventListener('keypress', resetTimeout);
        document.addEventListener('scroll', resetTimeout);
        document.addEventListener('touchstart', resetTimeout);

        // Verificar timeout cada minuto
        setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            const timeLeft = sessionTimeout - inactiveTime;

            if (timeLeft <= 5 * 60 * 1000 && !warningShown) { // 5 minutos restantes
                warningShown = true;
                this.showSessionWarning(Math.floor(timeLeft / 1000 / 60));
            } else if (timeLeft <= 0) {
                this.handleSessionTimeout();
            }
        }, 60000);
    }

    // Cabeceras de seguridad (simuladas en frontend)
    addSecurityHeaders() {
        // Simular cabeceras de seguridad añadiendo meta tags
        const securityMetas = [
            { name: 'referrer', content: 'strict-origin-when-cross-origin' },
            { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
            { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
            { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
        ];

        securityMetas.forEach(meta => {
            if (!document.querySelector(`meta[name="${meta.name}"], meta[http-equiv="${meta['http-equiv']}"]`)) {
                const metaElement = document.createElement('meta');
                if (meta.name) metaElement.name = meta.name;
                if (meta['http-equiv']) metaElement.httpEquiv = meta['http-equiv'];
                metaElement.content = meta.content;
                document.head.appendChild(metaElement);
            }
        });
    }

    // Prevenir ataques comunes
    preventCommonAttacks() {
        // Prevenir clickjacking
        if (window.self !== window.top) {
            window.top.location = window.self.location;
        }

        // Limpiar URLs con parámetros sospechosos
        const url = new URL(window.location);
        const suspiciousParams = ['<script', 'javascript:', 'data:', 'vbscript:'];
        let cleaned = false;

        for (const [key, value] of url.searchParams.entries()) {
            if (suspiciousParams.some(param => value.toLowerCase().includes(param))) {
                url.searchParams.delete(key);
                cleaned = true;
            }
        }

        if (cleaned) {
            window.history.replaceState({}, document.title, url.toString());
        }

        // Prevenir inyección en localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (typeof value === 'string' && value.includes('<script')) {
                console.warn('🚨 Intento de inyección XSS bloqueado en localStorage');
                return;
            }
            return originalSetItem.call(this, key, value);
        };
    }

    // Mejorar seguridad de formularios
    enhanceFormSecurity() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Validación de tamaño de datos
            form.addEventListener('submit', (e) => {
                const formData = new FormData(form);
                let totalSize = 0;
                
                for (const [key, value] of formData.entries()) {
                    if (typeof value === 'string') {
                        totalSize += value.length;
                    }
                }
                
                // Limitar a 10KB por formulario
                if (totalSize > 10240) {
                    e.preventDefault();
                    this.handleSuspiciousActivity('oversized_request');
                    
                    if (window.showNotificationMejorada) {
                        showNotificationMejorada(
                            'Los datos del formulario son demasiado grandes',
                            'warning'
                        );
                    }
                    return false;
                }
            });

            // Sanitizar campos de texto en tiempo real
            const textInputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
            textInputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    // Remover caracteres potencialmente peligrosos
                    const sanitized = e.target.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                    if (sanitized !== e.target.value) {
                        e.target.value = sanitized;
                        console.warn('🚨 Contenido potencialmente peligroso removido');
                    }
                });
            });
        });
    }

    // Interceptar requests AJAX para CSRF
    interceptAjaxRequests(csrfToken) {
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (options.method && options.method.toUpperCase() !== 'GET') {
                options.headers = options.headers || {};
                options.headers['X-CSRF-Token'] = csrfToken;
            }
            return originalFetch.call(this, url, options);
        };

        // También interceptar XMLHttpRequest si se usa
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._method = method;
            return originalOpen.call(this, method, url, ...args);
        };

        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(data) {
            if (this._method && this._method.toUpperCase() !== 'GET') {
                this.setRequestHeader('X-CSRF-Token', csrfToken);
            }
            return originalSend.call(this, data);
        };
    }

    // Generar token CSRF
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Manejar actividad sospechosa
    handleSuspiciousActivity(type) {
        this.sessionData.suspiciousActivity++;
        
        const activity = {
            type: type,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100) // Limitar tamaño
        };

        // Guardar en localStorage para análisis posterior
        const suspiciousActivities = JSON.parse(localStorage.getItem('suspicious_activities') || '[]');
        suspiciousActivities.push(activity);
        
        // Mantener solo los últimos 10 eventos
        if (suspiciousActivities.length > 10) {
            suspiciousActivities.shift();
        }
        
        localStorage.setItem('suspicious_activities', JSON.stringify(suspiciousActivities));

        console.warn(`🚨 Actividad sospechosa registrada: ${type}`);
    }

    // Mostrar advertencia de sesión
    showSessionWarning(minutesLeft) {
        if (window.showCustomAlert) {
            showCustomAlert({
                type: 'warning',
                title: '⏰ Sesión Expirando',
                message: `Su sesión expirará en ${minutesLeft} minutos por inactividad. ¿Desea continuar?`,
                confirmText: 'Continuar',
                cancelText: 'Cerrar Sesión'
            }).then(result => {
                if (!result) {
                    this.handleSessionTimeout();
                }
            });
        }
    }

    // Manejar timeout de sesión
    handleSessionTimeout() {
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        
        if (window.showCustomAlert) {
            showCustomAlert({
                type: 'info',
                title: '🔒 Sesión Expirada',
                message: 'Su sesión ha expirado por inactividad. Por su seguridad, debe iniciar sesión nuevamente.',
                confirmText: 'Iniciar Sesión'
            }).then(() => {
                window.location.href = '/';
            });
        } else {
            alert('Su sesión ha expirado. Redirigiendo al login...');
            window.location.href = '/';
        }
    }

    // Añadir generador de contraseñas seguras a los formularios
    addPasswordGenerator() {
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(field => {
            if (field.id && field.id.includes('register')) {
                const container = field.parentElement;
                
                const generatorButton = document.createElement('button');
                generatorButton.type = 'button';
                generatorButton.className = 'btn btn-outline-secondary btn-sm mt-1';
                generatorButton.innerHTML = '<i class="bi bi-key me-1"></i>Generar contraseña segura';
                
                generatorButton.onclick = () => {
                    if (window.passwordValidator) {
                        const securePassword = window.passwordValidator.generateSecurePassword(12);
                        field.value = securePassword;
                        field.dispatchEvent(new Event('input'));
                        
                        if (window.showNotificationMejorada) {
                            showNotificationMejorada(
                                'Contraseña segura generada. ¡Guárdela en un lugar seguro!',
                                'success',
                                4000,
                                { title: 'Contraseña Generada' }
                            );
                        }
                    }
                };
                
                container.appendChild(generatorButton);
            }
        });
    }

    // Detectar herramientas de desarrollo (solo log, no bloquear)
    detectDevTools() {
        if (!this.securityFeatures.detectDevTools) return;

        const devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                
                if (!devtools.open) {
                    devtools.open = true;
                    console.log('🔍 DevTools detectadas (esto es normal para desarrolladores)');
                    // Solo log, no molestar al usuario
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    // Obtener estadísticas de seguridad
    getSecurityStats() {
        return {
            sessionData: this.sessionData,
            suspiciousActivities: JSON.parse(localStorage.getItem('suspicious_activities') || '[]'),
            featuresEnabled: this.securityFeatures,
            csrfToken: localStorage.getItem('csrf_token'),
            sessionStartTime: new Date(this.sessionData.startTime).toLocaleString()
        };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.lightSecurity = new LightSecurityEnhancements();
    
    // Añadir generador después de que el validador esté listo
    setTimeout(() => {
        if (window.lightSecurity) {
            window.lightSecurity.addPasswordGenerator();
        }
    }, 1000);
});

// Exportar para uso global
window.LightSecurityEnhancements = LightSecurityEnhancements;