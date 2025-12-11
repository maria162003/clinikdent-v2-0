/**
 * ============================================================================
 * SISTEMA DE SEGURIDAD AVANZADO V2.0 - CLINIKDENT
 * Suspensión de cuentas + Notificaciones por correo + Recuperación segura
 * ============================================================================
 */

class AdvancedSecurityManager {
    constructor() {
        this.maxAttempts = 3;
        this.suspensionThreshold = 5; // 5 intentos = suspensión permanente
        this.temporaryLockDuration = 15 * 60 * 1000; // 15 minutos
        this.attempts = this.getStoredAttempts();
        this.suspendedAccounts = this.getSuspendedAccounts();
        this.emailService = new SecurityEmailService();
        
        this.init();
    }

    init() {
        console.log('🔒 Sistema de seguridad avanzado v2.0 inicializado');
        this.setupLoginInterceptor();
        this.checkAccountStatus();
        this.startSecurityMonitoring();
    }

    // Obtener intentos del localStorage
    getStoredAttempts() {
        const stored = localStorage.getItem('securityAttempts');
        return stored ? JSON.parse(stored) : {
            count: 0,
            lastAttempt: null,
            email: null,
            temporaryLockUntil: null,
            totalFailures: 0
        };
    }

    // Obtener cuentas suspendidas
    getSuspendedAccounts() {
        const stored = localStorage.getItem('suspendedAccounts');
        return stored ? JSON.parse(stored) : {};
    }

    // Guardar datos de seguridad
    saveSecurityData() {
        localStorage.setItem('securityAttempts', JSON.stringify(this.attempts));
        localStorage.setItem('suspendedAccounts', JSON.stringify(this.suspendedAccounts));
    }

    // Verificar estado de la cuenta
    checkAccountStatus() {
        const currentEmail = this.attempts.email;
        
        // Verificar si la cuenta está suspendida
        if (currentEmail && this.suspendedAccounts[currentEmail]) {
            this.showAccountSuspendedAlert(currentEmail);
            return 'suspended';
        }

        // Verificar si está temporalmente bloqueado
        if (this.attempts.temporaryLockUntil && Date.now() < this.attempts.temporaryLockUntil) {
            const remainingTime = Math.ceil((this.attempts.temporaryLockUntil - Date.now()) / 1000);
            this.showTemporaryLockAlert(remainingTime);
            return 'locked';
        }

        // Si el bloqueo temporal expiró
        if (this.attempts.temporaryLockUntil && Date.now() >= this.attempts.temporaryLockUntil) {
            this.attempts.temporaryLockUntil = null;
            this.saveSecurityData();
        }

        return 'active';
    }

    // Interceptar login
    setupLoginInterceptor() {
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            if (!form.id || !form.id.includes('login')) return;

            e.preventDefault();
            
            const status = this.checkAccountStatus();
            if (status !== 'active') {
                return false;
            }

            const email = form.querySelector('input[type="email"], input[name="email"]')?.value;
            const password = form.querySelector('input[type="password"], input[name="password"]')?.value;

            if (!email || !password) {
                this.showSecurityAlert('Por favor complete todos los campos requeridos', 'warning');
                return false;
            }

            // Actualizar email en intentos
            this.attempts.email = email;

            try {
                const success = await this.processLogin(email, password);
                if (success) {
                    this.onLoginSuccess(email);
                } else {
                    this.onLoginFailure(email);
                }
            } catch (error) {
                console.error('Error en login:', error);
                this.showSecurityAlert('Error del sistema. Intente nuevamente.', 'error');
            }
        });
    }

    // Procesar intento de login (esto debe conectarse con tu backend)
    async processLogin(email, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Security-Token': this.generateSecurityToken()
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            return result.success || false;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    }

    // Login exitoso
    onLoginSuccess(email) {
        // Reset intentos para este email
        this.attempts = {
            count: 0,
            lastAttempt: null,
            email: null,
            temporaryLockUntil: null,
            totalFailures: 0
        };
        this.saveSecurityData();

        // Log del evento exitoso
        this.logSecurityEvent('login_success', { email });
        
        this.showSecurityAlert('Acceso autorizado correctamente', 'success');
        
        // Redirigir según el rol (esto debe adaptarse a tu lógica)
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);
    }

    // Login fallido
    onLoginFailure(email) {
        this.attempts.count++;
        this.attempts.totalFailures++;
        this.attempts.lastAttempt = Date.now();
        this.attempts.email = email;

        // Log del evento fallido
        this.logSecurityEvent('login_failure', { 
            email, 
            attemptNumber: this.attempts.count,
            totalFailures: this.attempts.totalFailures 
        });

        // Enviar notificación por email de actividad sospechosa
        this.emailService.sendSecurityAlert({
            type: 'login_failure',
            email: email,
            attempts: this.attempts.count,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'Cliente' // En producción obtener IP real
        });

        if (this.attempts.totalFailures >= this.suspensionThreshold) {
            // SUSPENSIÓN PERMANENTE
            this.suspendAccount(email);
        } else if (this.attempts.count >= this.maxAttempts) {
            // BLOQUEO TEMPORAL
            this.temporaryLockAccount();
        } else {
            // ADVERTENCIA
            this.showFailureWarning();
        }

        this.saveSecurityData();
    }

    // Suspender cuenta permanentemente
    suspendAccount(email) {
        const suspensionData = {
            suspendedAt: Date.now(),
            reason: 'Múltiples intentos fallidos de acceso',
            totalFailures: this.attempts.totalFailures,
            lastAttempt: this.attempts.lastAttempt
        };

        this.suspendedAccounts[email] = suspensionData;
        this.saveSecurityData();

        // Log del evento de suspensión
        this.logSecurityEvent('account_suspended', { email, ...suspensionData });

        // Enviar notificación crítica por email
        this.emailService.sendCriticalAlert({
            type: 'account_suspended',
            email: email,
            suspensionData: suspensionData,
            timestamp: new Date().toISOString()
        });

        this.showAccountSuspendedAlert(email);
    }

    // Bloqueo temporal
    temporaryLockAccount() {
        this.attempts.temporaryLockUntil = Date.now() + this.temporaryLockDuration;
        
        const remainingTime = Math.ceil(this.temporaryLockDuration / 1000);
        this.showTemporaryLockAlert(remainingTime);

        // Log del bloqueo temporal
        this.logSecurityEvent('temporary_lock', { 
            email: this.attempts.email,
            lockDuration: this.temporaryLockDuration,
            lockUntil: this.attempts.temporaryLockUntil
        });
    }

    // Mostrar alerta de cuenta suspendida
    showAccountSuspendedAlert(email) {
        if (window.showCustomAlert) {
            window.showCustomAlert({
                type: 'error',
                title: '🚫 Cuenta Suspendida',
                message: `
                    <div class="text-center">
                        <div class="mb-3">
                            <i class="bi bi-shield-x display-1 text-danger"></i>
                        </div>
                        <h5 class="text-danger mb-3">Acceso Denegado</h5>
                        <p><strong>Su cuenta ha sido suspendida por motivos de seguridad.</strong></p>
                        <p>Razón: Múltiples intentos fallidos de acceso</p>
                        <div class="alert alert-info mt-3">
                            <h6><i class="bi bi-info-circle me-2"></i>Opciones de Recuperación:</h6>
                            <div class="d-grid gap-2 mt-3">
                                <button class="btn btn-primary btn-sm" onclick="window.securityManager.requestAccountRecovery('${email}')">
                                    <i class="bi bi-envelope me-2"></i>Solicitar Recuperación por Email
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="window.securityManager.showContactSupport()">
                                    <i class="bi bi-headset me-2"></i>Contactar Soporte Técnico
                                </button>
                            </div>
                        </div>
                    </div>
                `,
                confirmText: 'Entendido',
                allowOutsideClick: false
            });
        }
    }

    // Mostrar alerta de bloqueo temporal
    showTemporaryLockAlert(remainingSeconds) {
        const minutes = Math.ceil(remainingSeconds / 60);
        
        if (window.showCustomAlert) {
            window.showCustomAlert({
                type: 'warning',
                title: '⏰ Acceso Temporalmente Bloqueado',
                message: `
                    <div class="text-center">
                        <div class="mb-3">
                            <i class="bi bi-clock-fill display-1 text-warning"></i>
                        </div>
                        <h5 class="text-warning mb-3">Cuenta Bloqueada Temporalmente</h5>
                        <p>Ha excedido el número máximo de intentos de acceso.</p>
                        <div class="alert alert-warning">
                            <h6><i class="bi bi-stopwatch me-2"></i>Tiempo restante: ${minutes} minutos</h6>
                        </div>
                        <div class="mt-3">
                            <p><strong>¿Olvidó su contraseña?</strong></p>
                            <button class="btn btn-primary btn-sm" onclick="window.securityManager.requestPasswordReset('${this.attempts.email}')">
                                <i class="bi bi-key me-2"></i>Recuperar Contraseña
                            </button>
                        </div>
                    </div>
                `,
                confirmText: 'Entendido',
                allowOutsideClick: false
            });
        }
    }

    // Mostrar advertencia de fallo
    showFailureWarning() {
        const remaining = this.maxAttempts - this.attempts.count;
        
        if (window.showCustomAlert) {
            window.showCustomAlert({
                type: 'warning',
                title: '⚠️ Credenciales Incorrectas',
                message: `
                    <div class="text-center">
                        <div class="mb-3">
                            <i class="bi bi-exclamation-triangle-fill display-4 text-warning"></i>
                        </div>
                        <p><strong>Email o contraseña incorrectos</strong></p>
                        <div class="alert alert-danger">
                            <strong>Advertencia de Seguridad:</strong><br>
                            Le quedan <strong>${remaining}</strong> intento(s) antes del bloqueo temporal
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-link btn-sm" onclick="window.securityManager.requestPasswordReset('${this.attempts.email}')">
                                <i class="bi bi-key me-1"></i>¿Olvidó su contraseña?
                            </button>
                        </div>
                    </div>
                `,
                confirmText: 'Intentar Nuevamente'
            });
        }
    }

    // Solicitar recuperación de cuenta
    requestAccountRecovery(email) {
        this.emailService.sendRecoveryRequest({
            email: email,
            type: 'account_recovery',
            timestamp: new Date().toISOString(),
            requestId: this.generateRecoveryToken()
        });

        if (window.showCustomAlert) {
            window.showCustomAlert({
                type: 'info',
                title: '📧 Solicitud Enviada',
                message: `
                    <div class="text-center">
                        <i class="bi bi-envelope-check display-4 text-primary mb-3"></i>
                        <p>Se ha enviado una solicitud de recuperación de cuenta al administrador del sistema.</p>
                        <div class="alert alert-info">
                            <strong>Próximos pasos:</strong><br>
                            • Revise su email en las próximas 24 horas<br>
                            • Siga las instrucciones de recuperación<br>
                            • Contacte soporte si no recibe respuesta
                        </div>
                        <p class="text-muted small">ID de solicitud: ${this.generateRecoveryToken().substring(0, 8)}</p>
                    </div>
                `,
                confirmText: 'Entendido'
            });
        }
    }

    // Solicitar reset de contraseña
    requestPasswordReset(email) {
        this.emailService.sendPasswordReset({
            email: email,
            timestamp: new Date().toISOString(),
            resetToken: this.generateRecoveryToken()
        });

        if (window.showCustomAlert) {
            window.showCustomAlert({
                type: 'info',
                title: '🔑 Recuperación de Contraseña',
                message: `
                    <div class="text-center">
                        <i class="bi bi-key-fill display-4 text-primary mb-3"></i>
                        <p>Se ha enviado un enlace de recuperación de contraseña a:</p>
                        <strong>${email}</strong>
                        <div class="alert alert-info mt-3">
                            <strong>Instrucciones:</strong><br>
                            • Revise su bandeja de entrada y spam<br>
                            • Haga clic en el enlace de recuperación<br>
                            • Siga los pasos para crear una nueva contraseña
                        </div>
                        <p class="text-muted small">El enlace expira en 24 horas</p>
                    </div>
                `,
                confirmText: 'Entendido'
            });
        }
    }

    // Mostrar contacto de soporte
    showContactSupport() {
        if (window.showCustomAlert) {
            window.showCustomAlert({
                type: 'info',
                title: '🎧 Soporte Técnico',
                message: `
                    <div class="text-center">
                        <i class="bi bi-headset display-4 text-primary mb-3"></i>
                        <h5>Contacte Nuestro Soporte</h5>
                        <div class="row text-start mt-4">
                            <div class="col-12 mb-3">
                                <strong><i class="bi bi-envelope me-2"></i>Email:</strong><br>
                                <a href="mailto:soporte@clinikdent.com">soporte@clinikdent.com</a>
                            </div>
                            <div class="col-12 mb-3">
                                <strong><i class="bi bi-telephone me-2"></i>Teléfono:</strong><br>
                                +57 (xxx) xxx-xxxx
                            </div>
                            <div class="col-12 mb-3">
                                <strong><i class="bi bi-clock me-2"></i>Horario:</strong><br>
                                Lunes a Viernes: 8:00 AM - 6:00 PM
                            </div>
                        </div>
                        <div class="alert alert-warning mt-3">
                            <small><strong>Importante:</strong> Tenga a mano su información de cuenta para una atención más rápida.</small>
                        </div>
                    </div>
                `,
                confirmText: 'Cerrar'
            });
        }
    }

    // Mostrar alerta de seguridad
    showSecurityAlert(message, type = 'info') {
        if (window.showCustomAlert) {
            const icons = {
                'success': 'bi-check-circle-fill text-success',
                'warning': 'bi-exclamation-triangle-fill text-warning',
                'error': 'bi-x-circle-fill text-danger',
                'info': 'bi-info-circle-fill text-info'
            };

            window.showCustomAlert({
                type: type,
                title: `<i class="${icons[type]} me-2"></i>${type.charAt(0).toUpperCase() + type.slice(1)}`,
                message: message,
                confirmText: 'Entendido'
            });
        }
    }

    // Monitoreo de seguridad
    startSecurityMonitoring() {
        // Verificar estado cada 30 segundos
        setInterval(() => {
            this.checkAccountStatus();
        }, 30000);

        // Log de actividad cada 5 minutos
        setInterval(() => {
            this.logSecurityEvent('security_heartbeat', {
                timestamp: new Date().toISOString(),
                activeUser: localStorage.getItem('user') ? 'yes' : 'no',
                suspendedAccounts: Object.keys(this.suspendedAccounts).length
            });
        }, 300000);
    }

    // Log de eventos de seguridad
    logSecurityEvent(eventType, data) {
        if (window.securityLogger) {
            window.securityLogger.logSecurityEvent(eventType, data);
        }
        
        // También log a consola para desarrollo
        console.log(`🔒 [SECURITY] ${eventType}:`, data);
    }

    // Generar token de seguridad
    generateSecurityToken() {
        return btoa(Date.now() + Math.random().toString(36));
    }

    // Generar token de recuperación
    generateRecoveryToken() {
        return btoa(Date.now() + Math.random().toString(36) + this.attempts.email);
    }

    // Resetear sistema (solo para administradores)
    resetSecuritySystem(adminPassword) {
        if (adminPassword !== 'clinikdent_security_reset_2024') {
            this.showSecurityAlert('Contraseña de administrador incorrecta', 'error');
            return false;
        }

        this.attempts = {
            count: 0,
            lastAttempt: null,
            email: null,
            temporaryLockUntil: null,
            totalFailures: 0
        };
        this.suspendedAccounts = {};
        
        localStorage.removeItem('securityAttempts');
        localStorage.removeItem('suspendedAccounts');
        
        this.showSecurityAlert('Sistema de seguridad reiniciado correctamente', 'success');
        console.log('🔒 Sistema de seguridad reiniciado por administrador');
        
        return true;
    }
}

// ============================================================================
// SERVICIO DE NOTIFICACIONES POR EMAIL
// ============================================================================

class SecurityEmailService {
    constructor() {
        this.adminEmail = this.getAdminEmail();
        this.apiUrl = '/api/security-notifications';
    }

    // Obtener email del administrador del .env
    getAdminEmail() {
        // En producción esto debería venir del backend
        return 'camila@clinikdent.com'; // Email por defecto
    }

    // Enviar alerta de seguridad
    async sendSecurityAlert(alertData) {
        const emailData = {
            to: this.adminEmail,
            subject: `🚨 ALERTA DE SEGURIDAD - ${alertData.type.toUpperCase()}`,
            template: 'security-alert',
            data: {
                ...alertData,
                severity: this.calculateSeverity(alertData),
                timestamp: new Date().toLocaleString('es-ES'),
                actionRequired: this.getRequiredAction(alertData)
            }
        };

        return this.sendEmail(emailData);
    }

    // Enviar alerta crítica
    async sendCriticalAlert(alertData) {
        const emailData = {
            to: this.adminEmail,
            subject: `🔴 ALERTA CRÍTICA - CUENTA SUSPENDIDA`,
            template: 'critical-alert',
            data: {
                ...alertData,
                timestamp: new Date().toLocaleString('es-ES'),
                priority: 'CRÍTICA',
                requiresImmediateAction: true
            }
        };

        return this.sendEmail(emailData);
    }

    // Enviar solicitud de recuperación
    async sendRecoveryRequest(requestData) {
        const emailData = {
            to: this.adminEmail,
            subject: `📧 SOLICITUD DE RECUPERACIÓN DE CUENTA`,
            template: 'recovery-request',
            data: {
                ...requestData,
                timestamp: new Date().toLocaleString('es-ES')
            }
        };

        return this.sendEmail(emailData);
    }

    // Enviar reset de contraseña
    async sendPasswordReset(resetData) {
        // Email al usuario
        const userEmail = {
            to: resetData.email,
            subject: `🔑 Recuperación de Contraseña - Clinikdent`,
            template: 'password-reset-user',
            data: {
                resetLink: `${window.location.origin}/reset-password?token=${resetData.resetToken}`,
                timestamp: new Date().toLocaleString('es-ES'),
                expiresIn: '24 horas'
            }
        };

        // Email al admin (notificación)
        const adminEmail = {
            to: this.adminEmail,
            subject: `📊 Solicitud de Reset de Contraseña`,
            template: 'password-reset-admin',
            data: resetData
        };

        return Promise.all([
            this.sendEmail(userEmail),
            this.sendEmail(adminEmail)
        ]);
    }

    // Enviar email (implementar con tu servicio de email)
    async sendEmail(emailData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Security-Token': this.generateToken()
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                console.log('✅ Notificación de seguridad enviada:', emailData.subject);
                return true;
            } else {
                console.error('❌ Error enviando notificación:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ Error en servicio de email:', error);
            
            // Fallback: mostrar en consola para desarrollo
            console.log('📧 [EMAIL SIMULATION]', {
                to: emailData.to,
                subject: emailData.subject,
                data: emailData.data
            });
            
            return false;
        }
    }

    // Calcular severidad del evento
    calculateSeverity(alertData) {
        if (alertData.type === 'account_suspended') return 'CRÍTICA';
        if (alertData.attempts >= 3) return 'ALTA';
        if (alertData.attempts >= 2) return 'MEDIA';
        return 'BAJA';
    }

    // Obtener acción requerida
    getRequiredAction(alertData) {
        switch (alertData.type) {
            case 'login_failure':
                return alertData.attempts >= 3 ? 
                    'Verificar si es actividad legítima del usuario' :
                    'Monitorear actividad adicional';
            case 'account_suspended':
                return 'Contactar al usuario para verificar identidad';
            default:
                return 'Revisar logs de seguridad';
        }
    }

    // Generar token para API
    generateToken() {
        return btoa(Date.now() + 'security_service');
    }
}

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Reemplazar el SecurityManager anterior
    if (window.securityManager) {
        console.log('🔄 Actualizando sistema de seguridad...');
    }
    
    window.securityManager = new AdvancedSecurityManager();
    console.log('✅ Sistema de seguridad avanzado v2.0 activado');
});

// Exportar para uso global
window.AdvancedSecurityManager = AdvancedSecurityManager;
window.SecurityEmailService = SecurityEmailService;