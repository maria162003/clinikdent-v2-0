/**
 * ============================================================================
 * SISTEMA DE SEGURIDAD AVANZADO - CLINIKDENT
 * reCAPTCHA + Bloqueo por intentos fallidos + Alertas profesionales
 * ============================================================================
 */

class SecurityManager {
    constructor() {
        this.maxAttempts = 3;
        this.blockDuration = 60000; // 1 minuto
        this.finalBlockDuration = 900000; // 15 minutos
        this.attempts = this.getAttempts();
        this.recaptchaLoaded = false;
        this.init();
    }

    init() {
        this.loadRecaptcha();
        this.setupLoginInterceptor();
        this.checkIfBlocked();
    }

    // Cargar reCAPTCHA
    loadRecaptcha() {
        if (this.recaptchaLoaded) return;
        
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=6LcxXXXXXXXXXXXXXXXXXXXXXXXX'; // Reemplazar con tu site key
        script.onload = () => {
            this.recaptchaLoaded = true;
            console.log('✅ reCAPTCHA cargado');
        };
        document.head.appendChild(script);
    }

    // Obtener intentos fallidos del localStorage
    getAttempts() {
        const stored = localStorage.getItem('loginAttempts');
        return stored ? JSON.parse(stored) : {
            count: 0,
            lastAttempt: null,
            blockedUntil: null,
            email: null,
            finallyBlocked: false
        };
    }

    // Guardar intentos en localStorage
    saveAttempts() {
        localStorage.setItem('loginAttempts', JSON.stringify(this.attempts));
    }

    // Verificar si está bloqueado
    checkIfBlocked() {
        if (this.attempts.finallyBlocked) {
            this.showFinalBlockAlert();
            return true;
        }

        if (this.attempts.blockedUntil && Date.now() < this.attempts.blockedUntil) {
            const remainingTime = Math.ceil((this.attempts.blockedUntil - Date.now()) / 1000);
            this.showTemporaryBlockAlert(remainingTime);
            return true;
        }

        // Si el bloqueo temporal expiró, resetear contador a 2
        if (this.attempts.blockedUntil && Date.now() >= this.attempts.blockedUntil) {
            this.attempts.count = 2; // Le queda 1 intento
            this.attempts.blockedUntil = null;
            this.saveAttempts();
        }

        return false;
    }

    // Interceptar formulario de login
    setupLoginInterceptor() {
        const loginForm = document.getElementById('form-login-universal');
        if (!loginForm) return;

        const originalHandler = loginForm.onsubmit;
        
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            
            // Verificar si está bloqueado
            if (this.checkIfBlocked()) {
                return false;
            }

            // Obtener datos del formulario
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                this.showAlert('Por favor complete todos los campos', 'warning');
                return false;
            }

            // Validar reCAPTCHA si hay intentos previos
            if (this.attempts.count > 0) {
                const recaptchaValid = await this.validateRecaptcha();
                if (!recaptchaValid) {
                    this.showAlert('Por favor complete la verificación reCAPTCHA', 'warning');
                    return false;
                }
            }

            // Proceder con el login
            try {
                const result = await this.attemptLogin(email, password);
                
                if (result.success) {
                    // Login exitoso - resetear intentos
                    this.resetAttempts();
                    this.handleSuccessfulLogin(result.data);
                } else {
                    // Login fallido - incrementar intentos
                    this.handleFailedLogin(email, result.message);
                }
            } catch (error) {
                console.error('Error en login:', error);
                this.showAlert('Error de conexión. Intente nuevamente.', 'danger');
            }

            return false;
        };
    }

    // Validar reCAPTCHA
    async validateRecaptcha() {
        if (!this.recaptchaLoaded) {
            await this.loadRecaptcha();
        }

        return new Promise((resolve) => {
            // Mostrar reCAPTCHA
            this.showRecaptchaChallenge((token) => {
                if (token) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    // Mostrar challenge de reCAPTCHA
    showRecaptchaChallenge(callback) {
        const overlay = document.createElement('div');
        overlay.id = 'recaptcha-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;

        modal.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <i class="bi bi-shield-check" style="color: #28a745; font-size: 3rem;"></i>
                <h4 style="margin-top: 1rem; color: #333;">Verificación de Seguridad</h4>
                <p style="color: #666;">Por motivos de seguridad, complete la verificación:</p>
            </div>
            <div id="recaptcha-container"></div>
            <div style="margin-top: 1rem;">
                <button type="button" id="recaptcha-cancel" class="btn btn-secondary">
                    Cancelar
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Simular reCAPTCHA (en producción usar la API real)
        setTimeout(() => {
            const container = document.getElementById('recaptcha-container');
            container.innerHTML = `
                <div style="
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 1rem;
                    background: #f8f9fa;
                    margin: 1rem 0;
                ">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="recaptcha-check" style="margin-right: 0.5rem; transform: scale(1.2);">
                        <span style="font-size: 0.9rem;">No soy un robot</span>
                    </label>
                </div>
                <button type="button" id="recaptcha-verify" class="btn btn-success" disabled>
                    Verificar
                </button>
            `;

            const checkbox = document.getElementById('recaptcha-check');
            const verifyBtn = document.getElementById('recaptcha-verify');

            checkbox.onchange = () => {
                verifyBtn.disabled = !checkbox.checked;
            };

            verifyBtn.onclick = () => {
                document.body.removeChild(overlay);
                callback(checkbox.checked);
            };

            document.getElementById('recaptcha-cancel').onclick = () => {
                document.body.removeChild(overlay);
                callback(false);
            };
        }, 500);
    }

    // Intentar login
    async attemptLogin(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, password: password })
        });

        const result = await response.json();
        
        return {
            success: response.ok,
            data: result,
            message: result.msg || result.message
        };
    }

    // Manejar login exitoso
    handleSuccessfulLogin(userData) {
        console.log('✅ Login exitoso:', userData);
        
        // Guardar sesión
        const userSession = { 
            id: userData.id, 
            rol: userData.rol, 
            nombre: userData.nombre,
            apellido: userData.apellido || '',
            correo: userData.correo || '',
            tokenLogin: userData.tokenLogin || false
        };
        
        localStorage.setItem('user', JSON.stringify(userSession));
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userRole', userData.rol);

        // Cerrar modal de login
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            const modal = bootstrap.Modal.getInstance(loginModal);
            if (modal) {
                modal.hide();
            }
        }

        this.showAlert('¡Bienvenido! Redirigiendo...', 'success');

        // Redirigir después de 1 segundo
        setTimeout(() => {
            if (userData.tokenLogin) {
                this.mostrarModalCambioPasswordToken();
            } else {
                this.redirigirAlDashboard(userData.rol);
            }
        }, 1000);
    }

    // Manejar login fallido
    handleFailedLogin(email, message) {
        this.attempts.count++;
        this.attempts.lastAttempt = Date.now();
        this.attempts.email = email;

        if (this.attempts.count === 1) {
            // Primer intento fallido
            this.showAlert(`Credenciales incorrectas. Le quedan ${this.maxAttempts - 1} intentos.`, 'warning');
            
        } else if (this.attempts.count === 2) {
            // Segundo intento fallido
            this.showProfessionalWarningAlert();
            
        } else if (this.attempts.count === 3) {
            // Tercer intento fallido - bloqueo temporal
            this.attempts.blockedUntil = Date.now() + this.blockDuration;
            this.showTemporaryBlockAlert(60);
            
        } else if (this.attempts.count >= 4) {
            // Cuarto intento - bloqueo final
            this.attempts.finallyBlocked = true;
            this.showFinalBlockAlert();
        }

        this.saveAttempts();
    }

    // Mostrar alerta de advertencia profesional
    showProfessionalWarningAlert() {
        this.showCustomAlert({
            type: 'warning',
            title: '⚠️ Advertencia de Seguridad',
            message: `
                <div style="text-align: left; line-height: 1.6;">
                    <p><strong>Credenciales incorrectas.</strong></p>
                    <p>Por su seguridad, le informamos que:</p>
                    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                        <li>Le queda <strong>1 intento más</strong></li>
                        <li>Si falla nuevamente, su cuenta será <strong>suspendida temporalmente</strong></li>
                        <li>Verifique cuidadosamente su usuario y contraseña</li>
                    </ul>
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                        <small><i class="bi bi-lightbulb-fill text-warning"></i> 
                        <strong>Consejo:</strong> Si olvidó su contraseña, use la opción "¿Olvidaste tu contraseña?"</small>
                    </div>
                </div>
            `,
            confirmText: 'Entendido'
        });
    }

    // Mostrar alerta de bloqueo temporal
    showTemporaryBlockAlert(seconds) {
        this.showCustomAlert({
            type: 'danger',
            title: '🔒 Cuenta Suspendida Temporalmente',
            message: `
                <div style="text-align: left; line-height: 1.6;">
                    <p><strong>Su cuenta ha sido suspendida por seguridad.</strong></p>
                    <div style="background: #f8d7da; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                        <p><strong>Motivo:</strong> Múltiples intentos fallidos de acceso</p>
                        <p><strong>Duración:</strong> ${seconds} segundos</p>
                        <p><strong>Estado:</strong> Le quedará 1 intento más después de la suspensión</p>
                    </div>
                    <p><strong>Recomendaciones:</strong></p>
                    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                        <li>Espere a que termine la suspensión</li>
                        <li>Verifique cuidadosamente sus credenciales</li>
                        <li>Si olvidó su contraseña, use "¿Olvidaste tu contraseña?"</li>
                    </ul>
                </div>
            `,
            confirmText: 'Entendido'
        });

        // Deshabilitar formulario
        this.disableLoginForm(seconds);
    }

    // Mostrar alerta de bloqueo final
    showFinalBlockAlert() {
        this.showCustomAlert({
            type: 'danger',
            title: '🚫 Cuenta Bloqueada por Seguridad',
            message: `
                <div style="text-align: left; line-height: 1.6;">
                    <p><strong style="color: #dc3545;">Su cuenta ha sido bloqueada por motivos de seguridad.</strong></p>
                    
                    <div style="background: #f8d7da; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #dc3545;">
                        <p><strong>⚠️ Demasiados intentos fallidos de acceso</strong></p>
                        <p>Para proteger su cuenta, hemos bloqueado temporalmente el acceso desde este dispositivo.</p>
                    </div>

                    <h6 style="color: #495057; margin-top: 1.5rem;">🔧 Opciones disponibles:</h6>
                    <div style="background: #e9ecef; padding: 1rem; border-radius: 6px;">
                        <p><strong>1. Recuperar contraseña:</strong></p>
                        <p style="margin-left: 1rem;">Use la opción <a href="/recuperar.html" style="color: #007bff; text-decoration: underline;">"¿Olvidaste tu contraseña?"</a></p>
                        
                        <p style="margin-top: 1rem;"><strong>2. Contactar soporte:</strong></p>
                        <p style="margin-left: 1rem;">Envíe un correo a: <strong style="color: #28a745;">camila@clinikdent.com</strong></p>
                    </div>

                    <div style="background: #d1ecf1; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                        <small><i class="bi bi-info-circle-fill text-info"></i> 
                        <strong>Nota:</strong> Este bloqueo es por su seguridad. Nuestro equipo técnico puede ayudarle a restablecer el acceso.</small>
                    </div>
                </div>
            `,
            confirmText: 'Ir a Recuperar Contraseña'
        }).then((result) => {
            if (result) {
                window.location.href = '/recuperar.html';
            }
        });

        // Deshabilitar formulario permanentemente
        this.disableLoginForm(-1);
    }

    // Deshabilitar formulario de login
    disableLoginForm(seconds) {
        const form = document.getElementById('form-login-universal');
        const inputs = form.querySelectorAll('input, button');
        
        inputs.forEach(input => input.disabled = true);

        if (seconds > 0) {
            // Countdown para bloqueo temporal
            let remaining = seconds;
            const interval = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(interval);
                    inputs.forEach(input => input.disabled = false);
                    this.showAlert('Ya puede intentar ingresar nuevamente. Le queda 1 intento.', 'info');
                }
            }, 1000);
        }
    }

    // Resetear intentos
    resetAttempts() {
        this.attempts = {
            count: 0,
            lastAttempt: null,
            blockedUntil: null,
            email: null,
            finallyBlocked: false
        };
        this.saveAttempts();
    }

    // Funciones de utilidad
    showAlert(message, type) {
        if (window.showNotificationMejorada) {
            window.showNotificationMejorada(message, type);
        } else {
            alert(message);
        }
    }

    showCustomAlert(options) {
        if (window.showCustomAlert) {
            return window.showCustomAlert(options);
        } else {
            alert(options.message);
            return Promise.resolve(true);
        }
    }

    mostrarModalCambioPasswordToken() {
        // Implementar modal de cambio de contraseña
        console.log('Mostrar modal de cambio de contraseña token');
    }

    redirigirAlDashboard(rol) {
        const dashboards = {
            'paciente': '/dashboard-paciente.html',
            'odontologo': '/dashboard-odontologo.html',
            'administrador': '/dashboard-admin.html'
        };
        
        if (dashboards[rol]) {
            window.location.href = dashboards[rol];
        }
    }
}

// Inicializar sistema de seguridad cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = new SecurityManager();
    console.log('✅ Sistema de seguridad inicializado');
});

// Exportar para uso global
window.SecurityManager = SecurityManager;