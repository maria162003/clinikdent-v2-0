/**
 * ============================================================================
 * SISTEMA DE VALIDACIÓN DE CONTRASEÑAS SEGURAS - CLINIKDENT
 * Barra de sugerencias real + validación estricta
 * ============================================================================
 */

class PasswordValidator {
    constructor() {
        this.requirements = {
            minLength: 8,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSpecialChar: true,
            noCommonPasswords: true,
            noPersonalInfo: true
        };
        
        this.commonPasswords = [
            '123456789', '12345678', 'password', 'contraseña', 'qwerty',
            '123456', 'abc123', 'password123', '12345', '1234567890',
            'admin', 'clinica', 'dental', 'clinikdent', 'doctor',
            'paciente', 'odontologo', 'administrador', 'usuario'
        ];
        
        this.init();
    }

    init() {
        this.setupPasswordFields();
        this.addSecurityFeatures();
    }

    setupPasswordFields() {
    // Buscar campos de contraseña en registro
    const passwordField = document.getElementById('register-password');
    // ID real en index.html es 'register-confirm'
    const confirmField = document.getElementById('register-confirm');
        
        if (passwordField) {
            this.enhancePasswordField(passwordField, 'register');
        }
        
        if (confirmField) {
            this.enhanceConfirmField(confirmField, passwordField);
        }

        // También mejorar campos de login si existen
        const loginPasswordField = document.getElementById('login-password');
        if (loginPasswordField) {
            this.addLoginSecurity(loginPasswordField);
        }
    }

    enhancePasswordField(field, type = 'register') {
        const container = field.parentElement;
        
        // Crear contenedor de validación
        // Evitar duplicados si el modal se abre varias veces
        let validationContainer = container.querySelector('.password-validation');
        if (!validationContainer) {
            validationContainer = document.createElement('div');
            validationContainer.id = `${type}-password-validation`;
            validationContainer.className = 'password-validation mt-2';
        } else {
            // Limpiar contenido si ya existe
            validationContainer.innerHTML = '';
        }
        
        // Crear barra de fortaleza
        const strengthBar = this.createStrengthBar();
        
        // Crear lista de requisitos
        const requirementsList = this.createRequirementsList();
        
        // Crear sugerencias
        const suggestions = this.createSuggestions();
        
        validationContainer.appendChild(strengthBar);
        validationContainer.appendChild(requirementsList);
        validationContainer.appendChild(suggestions);
        
        // Insertar después del campo o dentro del placeholder si existe
        const placeholder = document.getElementById('password-strength-container-register');
        if (placeholder) {
            placeholder.innerHTML = '';
            placeholder.appendChild(validationContainer);
        } else {
            container.appendChild(validationContainer);
        }
        
        // Event listeners
        field.addEventListener('input', (e) => {
            this.validatePassword(e.target.value, type);
        });
        
        field.addEventListener('focus', () => {
            validationContainer.style.display = 'block';
        });
        
        // Mostrar/ocultar con un pequeño delay para mejor UX
        field.addEventListener('blur', () => {
            setTimeout(() => {
                if (field.value.length === 0) {
                    validationContainer.style.display = 'none';
                }
            }, 200);
        });
    }

    enhanceConfirmField(confirmField, passwordField) {
        const container = confirmField.parentElement;
        
        // Crear indicador de coincidencia
        const matchIndicator = document.createElement('div');
        matchIndicator.id = 'password-match-indicator';
        matchIndicator.className = 'password-match-indicator mt-2';
        matchIndicator.style.display = 'none';
        
        container.appendChild(matchIndicator);
        
        // Event listeners
        const checkMatch = () => {
            const password = passwordField.value;
            const confirm = confirmField.value;
            
            if (confirm.length === 0) {
                matchIndicator.style.display = 'none';
                return;
            }
            
            matchIndicator.style.display = 'block';
            
            if (password === confirm) {
                matchIndicator.innerHTML = `
                    <div class="alert alert-success py-2 small">
                        <i class="fas fa-circle-check me-2"></i>
                        Las contraseñas coinciden
                    </div>
                `;
            } else {
                matchIndicator.innerHTML = `
                    <div class="alert alert-danger py-2 small">
                        <i class="fas fa-circle-xmark me-2"></i>
                        Las contraseñas no coinciden
                    </div>
                `;
            }
        };
        
        confirmField.addEventListener('input', checkMatch);
        passwordField.addEventListener('input', checkMatch);
    }

    createStrengthBar() {
        const strengthContainer = document.createElement('div');
        strengthContainer.className = 'password-strength mb-2';
        
        strengthContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted">Fortaleza de contraseña:</small>
                <small id="strength-text" class="fw-bold">Muy débil</small>
            </div>
            <div class="progress" style="height: 6px;">
                <div id="strength-bar" class="progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
        `;
        
        return strengthContainer;
    }

    createRequirementsList() {
        const requirementsContainer = document.createElement('div');
        requirementsContainer.className = 'password-requirements mb-2';
        requirementsContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
               <span class="small text-muted fw-semibold"><i class="fas fa-shield-check me-1"></i>Requisitos de seguridad</span>
               <span class="small text-muted"><i class="fas fa-info-circle me-1"></i>Debe cumplir todos</span>
            </div>
            <div class="row">
                <div class="requirement-item" id="req-length">
                    <i class="far fa-circle text-muted"></i><small>Mínimo 8 caracteres</small>
                </div>
                <div class="requirement-item" id="req-uppercase">
                    <i class="far fa-circle text-muted"></i><small>Una letra mayúscula</small>
                </div>
                <div class="requirement-item" id="req-lowercase">
                    <i class="far fa-circle text-muted"></i><small>Una letra minúscula</small>
                </div>
                <div class="requirement-item" id="req-number">
                    <i class="far fa-circle text-muted"></i><small>Un número</small>
                </div>
                <div class="requirement-item" id="req-special">
                    <i class="far fa-circle text-muted"></i><small>Un carácter especial</small>
                </div>
                <div class="requirement-item" id="req-common">
                    <i class="far fa-circle text-muted"></i><small>No ser común</small>
                </div>
            </div>`;
        return requirementsContainer;
    }

    createSuggestions() {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'password-suggestions';
        suggestionsContainer.className = 'password-suggestions';
        suggestionsContainer.style.display = 'none';
        
        return suggestionsContainer;
    }

    validatePassword(password, type = 'register') {
        const validation = this.getPasswordValidation(password);
        this.updateUI(validation, type);
        return validation;
    }

    getPasswordValidation(password) {
        const validation = {
            isValid: true,
            strength: 0,
            strengthText: 'Muy débil',
            strengthColor: 'danger',
            requirements: {
                length: password.length >= this.requirements.minLength,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /\d/.test(password),
                special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
                common: !this.commonPasswords.some(common => 
                    password.toLowerCase().includes(common.toLowerCase())
                )
            },
            suggestions: []
        };

        // Calcular fortaleza
        let score = 0;
        Object.values(validation.requirements).forEach(req => {
            if (req) score++;
        });

        // Puntos adicionales por longitud
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Determinar fortaleza
        if (score >= 7) {
            validation.strength = 100;
            validation.strengthText = 'Muy fuerte';
            validation.strengthColor = 'success';
        } else if (score >= 6) {
            validation.strength = 80;
            validation.strengthText = 'Fuerte';
            validation.strengthColor = 'success';
        } else if (score >= 4) {
            validation.strength = 60;
            validation.strengthText = 'Media';
            validation.strengthColor = 'warning';
        } else if (score >= 2) {
            validation.strength = 40;
            validation.strengthText = 'Débil';
            validation.strengthColor = 'warning';
        } else {
            validation.strength = 20;
            validation.strengthText = 'Muy débil';
            validation.strengthColor = 'danger';
        }

        // Generar sugerencias
        validation.suggestions = this.generateSuggestions(password, validation.requirements);
        
        // La contraseña es válida solo si cumple todos los requisitos básicos
        validation.isValid = Object.values(validation.requirements).every(req => req);

        return validation;
    }

    generateSuggestions(password, requirements) {
        const suggestions = [];

        if (!requirements.length) {
            suggestions.push('Agregue más caracteres (mínimo 8)');
        }
        if (!requirements.uppercase) {
            suggestions.push('Agregue al menos una letra mayúscula (A-Z)');
        }
        if (!requirements.lowercase) {
            suggestions.push('Agregue al menos una letra minúscula (a-z)');
        }
        if (!requirements.number) {
            suggestions.push('Agregue al menos un número (0-9)');
        }
        if (!requirements.special) {
            suggestions.push('Agregue un carácter especial (!@#$%^&*)');
        }
        if (!requirements.common) {
            suggestions.push('Evite contraseñas comunes o palabras del diccionario');
        }

        // Sugerencias adicionales
        if (password.length < 12) {
            suggestions.push('💡 Para mayor seguridad, use 12+ caracteres');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('🎉 ¡Excelente! Su contraseña es segura');
        }

        return suggestions;
    }

    updateUI(validation, type = 'register') {
        // Actualizar barra de fortaleza
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        if (strengthBar && strengthText) {
            strengthBar.style.width = validation.strength + '%';
            strengthBar.className = `progress-bar bg-${validation.strengthColor}`;
            strengthText.textContent = validation.strengthText;
            strengthText.className = `fw-bold text-${validation.strengthColor}`;
        }

        // Actualizar requisitos
        Object.keys(validation.requirements).forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                const icon = element.querySelector('i');
                const isMet = validation.requirements[req];
                
                if (isMet) {
                    icon.className = 'fas fa-circle-check text-success me-1';
                    element.classList.add('text-success');
                    element.classList.remove('text-muted');
                } else {
                    icon.className = 'far fa-circle text-muted me-1';
                    element.classList.remove('text-success');
                    element.classList.add('text-muted');
                }
            }
        });

        // Actualizar sugerencias
        const suggestionsContainer = document.getElementById('password-suggestions');
        if (suggestionsContainer && validation.suggestions.length > 0) {
            suggestionsContainer.style.display = 'block';
            suggestionsContainer.innerHTML = `
                <div class=\"alert alert-info py-2 small mt-2\">
                    <div class=\"fw-bold mb-1\">
                        <i class=\"far fa-lightbulb me-1\"></i>
                        Sugerencias:
                    </div>
                    <ul class=\"mb-0 ps-3\">
                        ${validation.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    addLoginSecurity(loginField) {
        // Agregar indicador de Caps Lock
        const container = loginField.parentElement;
        
        const capsLockIndicator = document.createElement('div');
        capsLockIndicator.id = 'caps-lock-indicator';
        capsLockIndicator.className = 'caps-lock-indicator mt-1';
        capsLockIndicator.style.display = 'none';
        capsLockIndicator.innerHTML = `
            <div class="alert alert-warning py-1 small">
                <i class="fas fa-lock me-1"></i>
                Bloq Mayús está activado
            </div>
        `;
        
        container.appendChild(capsLockIndicator);
        
        // Detectar Caps Lock
        loginField.addEventListener('keypress', (e) => {
            const char = String.fromCharCode(e.which);
            if (char.match(/[a-zA-Z]/)) {
                const isShiftPressed = e.shiftKey;
                const isUpperCase = char === char.toUpperCase();
                const capsLockOn = isUpperCase && !isShiftPressed || !isUpperCase && isShiftPressed;
                
                capsLockIndicator.style.display = capsLockOn ? 'block' : 'none';
            }
        });

        loginField.addEventListener('blur', () => {
            capsLockIndicator.style.display = 'none';
        });
    }

    addSecurityFeatures() {
        // Prevenir pegado de contraseñas en el campo de confirmación
    const confirmField = document.getElementById('register-confirm');
        if (confirmField) {
            confirmField.addEventListener('paste', (e) => {
                e.preventDefault();
                if (window.showNotificationMejorada) {
                    showNotificationMejorada(
                        'Por seguridad, debe escribir la confirmación manualmente', 
                        'warning',
                        3000,
                        { title: 'Acción Bloqueada' }
                    );
                }
            });
        }

        // Validación en tiempo real del formulario
        this.setupFormValidation();
    }

    setupFormValidation() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;

        const passwordField = document.getElementById('register-password');
        const confirmField = document.getElementById('register-confirm');
        
        registerForm.addEventListener('submit', (e) => {
            // Re-validar confirmación manual antes de validar reglas de complejidad
            if (passwordField && confirmField && passwordField.value !== confirmField.value) {
                e.preventDefault();
                if (window.notify) {
                    window.notify.warning('Las contraseñas no coinciden');
                } else {
                    alert('Las contraseñas no coinciden');
                }
                confirmField.focus();
                return false;
            }
            
            if (passwordField && confirmField) {
                const validation = this.validatePassword(passwordField.value);
                
                if (!validation.isValid) {
                    e.preventDefault();
                    
                    if (window.showCustomAlert) {
                        showCustomAlert({
                            type: 'warning',
                            title: '🔒 Contraseña No Válida',
                            message: `
                                <div style="text-align: left;">
                                    <p>Su contraseña no cumple con los requisitos de seguridad mínimos.</p>
                                    <p><strong>Problemas encontrados:</strong></p>
                                    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                                        ${validation.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                                    </ul>
                                    <div style="background: #e9ecef; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                                        <small><i class="fas fa-shield-check text-primary"></i> 
                                        <strong>Importante:</strong> Una contraseña segura protege su información médica personal.</small>
                                    </div>
                                </div>
                            `,
                            confirmText: 'Entiendo'
                        });
                    } else {
                        alert('Por favor, cree una contraseña que cumpla con todos los requisitos de seguridad.');
                    }
                    
                    passwordField.focus();
                    return false;
                }
            }
        });
    }

    // Función para validar desde fuera de la clase
    isPasswordValid(password) {
        const validation = this.getPasswordValidation(password);
        return validation.isValid;
    }

    // Función para generar contraseña segura
    generateSecurePassword(length = 12) {
        const charset = {
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            numbers: '0123456789',
            special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };
        
        let password = '';
        
        // Asegurar al menos un carácter de cada tipo
        password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
        password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
        password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
        password += charset.special[Math.floor(Math.random() * charset.special.length)];
        
        // Completar con caracteres aleatorios
        const allChars = Object.values(charset).join('');
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Mezclar caracteres
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.passwordValidator = new PasswordValidator();
    console.log('✅ Sistema de validación de contraseñas inicializado');
});

// Exportar para uso global
window.PasswordValidator = PasswordValidator;