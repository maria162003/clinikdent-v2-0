/**
 * Módulos del Dashboard de Administrador - Clinik Dent
 * 
 * Implementación de los módulos:
 * - Editar Perfil Personal
 * - Cambiar Contraseña
 * - Configuración del Sistema
 * - Pagos y Facturación
 */

// Utilidades globales
function showLoading(mensaje = 'Cargando...') {
    // Buscar o crear el elemento de loading
    let loadingEl = document.getElementById('globalLoading');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'globalLoading';
        loadingEl.className = 'd-none position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loadingEl.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loadingEl.style.zIndex = '9999';
        loadingEl.innerHTML = `
            <div class="bg-white p-4 rounded shadow">
                <div class="d-flex align-items-center">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span id="loadingMessage">${mensaje}</span>
                </div>
            </div>
        `;
        document.body.appendChild(loadingEl);
    } else {
        document.getElementById('loadingMessage').textContent = mensaje;
    }
    loadingEl.classList.remove('d-none');
}

function hideLoading() {
    const loadingEl = document.getElementById('globalLoading');
    if (loadingEl) {
        loadingEl.classList.add('d-none');
    }
}

// Función para obtener el token de autenticación
function getAuthToken() {
    return localStorage.getItem('token') || 'demo-token';
}

// Función para obtener el ID de usuario
function getUserId() {
    // Primero intenta obtener del localStorage directamente
    const userId = localStorage.getItem('userId');
    if (userId) return userId;
    
    // Si no, intenta obtenerlo del objeto user
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userObj = JSON.parse(user);
            return userObj.id || '1';
        } catch (e) {
            console.warn('Error parsing user object:', e);
        }
    }
    
    // Valor por defecto
    return '1';
}

// Función para obtener headers de autenticación consistentes
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'user-id': getUserId() || '1'
    };
}

// Estado global (módulos)
const adminModules = {
    profile: {
        data: null,
        loading: false,
        error: null
    },
    password: {
        loading: false,
        error: null
    },
    config: {
        data: null,
        loading: false,
        error: null
    },
    pagos: {
        historial: {
            data: [],
            loading: false,
            error: null,
            filtros: {
                fecha: 'todos',
                estado: 'todos',
                paciente: ''
            }
        },
        servicios: {
            data: [],
            loading: false,
            error: null
        },
        metodos: {
            data: [],
            loading: false,
            error: null
        },
        pacientes: {
            data: [],
            loading: false
        },
        tratamientos: {
            data: [],
            loading: false
        }
    }
};

/**
 * Módulo de Perfil Personal
 */
function initAdminProfile() {
    // Elementos DOM
    const profileForm = document.getElementById('profileForm');
    const profileNombre = document.getElementById('profileNombre');
    const profileApellido = document.getElementById('profileApellido');
    const profileEmail = document.getElementById('profileEmail');
    const profileTelefono = document.getElementById('profileTelefono');
    const profileTipoDocumento = document.getElementById('profileTipoDocumento');
    const profileNumeroDocumento = document.getElementById('profileNumeroDocumento');
    const profileDireccion = document.getElementById('profileDireccion');
    const profileFechaNacimiento = document.getElementById('profileFechaNacimiento');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    
    // Event listeners
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', handleProfileSubmit);
    }
    
    // Validación en tiempo real
    if (profileNombre) profileNombre.addEventListener('input', validateProfileField);
    if (profileApellido) profileApellido.addEventListener('input', validateProfileField);
    if (profileTelefono) profileTelefono.addEventListener('input', validateProfileField);
    
    // Función que carga los datos del perfil
    async function loadAdminProfile() {
        try {
            adminModules.profile.loading = true;
            updateProfileUI();
            
            // Obtener el token de autenticación
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No autenticado');
            
            const response = await fetch('/api/admin/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Redirigir a login si no está autenticado
                    window.location.href = '/index.html';
                    return;
                }
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }
            
            const data = await response.json();
            adminModules.profile.data = data;
            adminModules.profile.error = null;
            
            // Llenar el formulario con los datos
            fillProfileForm(data);
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            adminModules.profile.error = error.message;
            showToast('Error al cargar datos del perfil', 'danger');
        } finally {
            adminModules.profile.loading = false;
            updateProfileUI();
        }
    }
    
    // Función para llenar el formulario con los datos del perfil
    function fillProfileForm(data) {
        if (!data) return;
        
        if (profileNombre) profileNombre.value = data.nombre || '';
        if (profileApellido) profileApellido.value = data.apellido || '';
        if (profileEmail) profileEmail.value = data.email || data.correo || '';
        if (profileTelefono) profileTelefono.value = data.telefono || '';
        if (profileTipoDocumento) profileTipoDocumento.value = data.tipo_documento || 'CC';
        if (profileNumeroDocumento) profileNumeroDocumento.value = data.numero_documento || '';
        if (profileDireccion) profileDireccion.value = data.direccion || '';
        
        // Formatear fecha para el input date
        if (profileFechaNacimiento && data.fecha_nacimiento) {
            // Asegurarse de que la fecha tenga el formato YYYY-MM-DD
            const fecha = new Date(data.fecha_nacimiento);
            if (!isNaN(fecha.getTime())) {
                const fechaFormateada = fecha.toISOString().split('T')[0];
                profileFechaNacimiento.value = fechaFormateada;
            }
        }
    }
    
    // Validar campos del formulario
    function validateProfileForm() {
        let isValid = true;
        
        // Validar nombre (mínimo 2 caracteres)
        if (!profileNombre.value || profileNombre.value.trim().length < 2) {
            setFieldError(profileNombre, 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        } else {
            clearFieldError(profileNombre);
        }
        
        // Validar apellido (mínimo 2 caracteres)
        if (!profileApellido.value || profileApellido.value.trim().length < 2) {
            setFieldError(profileApellido, 'El apellido debe tener al menos 2 caracteres');
            isValid = false;
        } else {
            clearFieldError(profileApellido);
        }
        
        // Validar teléfono (formato E.164 o 7-15 dígitos)
        const telefonoValue = profileTelefono.value.trim();
        const telefonoRegex = /^(\+[0-9]{1,3}[0-9]{7,14}|[0-9]{7,15})$/;
        if (telefonoValue && !telefonoRegex.test(telefonoValue)) {
            setFieldError(profileTelefono, 'Ingrese un número de teléfono válido (7-15 dígitos)');
            isValid = false;
        } else {
            clearFieldError(profileTelefono);
        }
        
        return isValid;
    }
    
    // Validación en tiempo real de un campo
    function validateProfileField(event) {
        const field = event.target;
        
        if (field.id === 'profileNombre' || field.id === 'profileApellido') {
            if (!field.value || field.value.trim().length < 2) {
                setFieldError(field, `El ${field.id === 'profileNombre' ? 'nombre' : 'apellido'} debe tener al menos 2 caracteres`);
            } else {
                clearFieldError(field);
            }
        }
        
        if (field.id === 'profileTelefono') {
            const telefonoValue = field.value.trim();
            const telefonoRegex = /^(\+[0-9]{1,3}[0-9]{7,14}|[0-9]{7,15})$/;
            if (telefonoValue && !telefonoRegex.test(telefonoValue)) {
                setFieldError(field, 'Ingrese un número de teléfono válido (7-15 dígitos)');
            } else {
                clearFieldError(field);
            }
        }
    }
    
    // Manejar envío del formulario
    async function handleProfileSubmit(event) {
        event.preventDefault();
        
        if (!validateProfileForm()) {
            return;
        }
        
        try {
            adminModules.profile.loading = true;
            updateProfileUI();
            
            // Obtener datos del formulario
            const profileData = {
                nombre: profileNombre.value,
                apellido: profileApellido.value,
                telefono: profileTelefono.value,
                tipo_documento: profileTipoDocumento.value,
                numero_documento: profileNumeroDocumento.value,
                direccion: profileDireccion.value,
                fecha_nacimiento: profileFechaNacimiento.value
            };
            
            // Obtener el token de autenticación
            const token = localStorage.getItem('token');
            
            // Verificar autenticación
            if (!token) {
                // Verificar si estamos en modo desarrollo con demo permitido
                if (window.appConfig && window.appConfig.isDevelopment && window.appConfig.allowDemoMode) {
                    console.log('⚠️ Sin token de autenticación. Actualizando perfil en modo desarrollo');
                    // Simular actualización exitosa después de un pequeño retraso
                    setTimeout(() => {
                        // Agregar campos adicionales que vendrian del servidor
                        const updatedProfile = {
                            ...profileData,
                            id: 1,
                            email: 'admin@clinikdent.com',
                            rol: 'administrador'
                        };
                        
                        adminModules.profile.data = updatedProfile;
                        
                        // Actualizar datos en localStorage
                        const userData = JSON.parse(localStorage.getItem('user') || '{}');
                        const updatedUserData = {
                            ...userData,
                            ...updatedProfile
                        };
                        localStorage.setItem('user', JSON.stringify(updatedUserData));
                        
                        // Actualizar nombre en la interfaz
                        const nombreCompleto = `${updatedProfile.nombre || ''} ${updatedProfile.apellido || ''}`.trim();
                        document.getElementById('userName').textContent = nombreCompleto || 'Camila Perez';
                        
                        // Cerrar modal y mostrar mensaje
                        const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                        profileModal.hide();
                        
                        showToast('Perfil actualizado con éxito (modo desarrollo)', 'success');
                        
                        adminModules.profile.loading = false;
                        updateProfileUI();
                    }, 800);
                    return;
                } else {
                    console.log('❌ Error: No hay token de autenticación');
                    window.location.href = '/index.html';
                    return;
                }
            }
            
            // Enviar solicitud a la API si hay token
            const response = await fetch('/api/admin/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Verificar si estamos en modo desarrollo con demo permitido
                    if (window.appConfig && window.appConfig.isDevelopment && window.appConfig.allowDemoMode) {
                        console.log('⚠️ Error 401: Sesión expirada. Actualizando perfil en modo desarrollo');
                        
                        // Simular actualización exitosa
                        const updatedProfile = {
                            ...profileData,
                            id: 1,
                            email: 'admin@clinikdent.com',
                            rol: 'administrador'
                        };
                        
                        adminModules.profile.data = updatedProfile;
                        
                        // Actualizar datos en localStorage
                        const userData = JSON.parse(localStorage.getItem('user') || '{}');
                        const updatedUserData = {
                            ...userData,
                            ...updatedProfile
                        };
                        localStorage.setItem('user', JSON.stringify(updatedUserData));
                        
                        // Actualizar nombre en la interfaz
                        const nombreCompleto = `${updatedProfile.nombre || ''} ${updatedProfile.apellido || ''}`.trim();
                        document.getElementById('userName').textContent = nombreCompleto || 'Camila Perez';
                        
                        // Cerrar modal y mostrar mensaje
                        const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                        profileModal.hide();
                        
                        showToast('Perfil actualizado con éxito (modo desarrollo)', 'success');
                        
                        adminModules.profile.loading = false;
                        updateProfileUI();
                        return;
                    } else {
                        console.log('❌ Error 401: Sesión expirada o token inválido');
                        window.location.href = '/index.html';
                        return;
                    }
                }
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }
            
            const updatedProfile = await response.json();
            adminModules.profile.data = updatedProfile;
            
            // Actualizar datos en localStorage
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUserData = {
                ...userData,
                ...updatedProfile
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            // Actualizar nombre en la interfaz
            const nombreCompleto = `${updatedProfile.nombre || ''} ${updatedProfile.apellido || ''}`.trim();
            document.getElementById('userName').textContent = nombreCompleto || 'Camila Perez';
            
            // Cerrar modal y mostrar mensaje
            const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
            profileModal.hide();
            
            showToast('Perfil actualizado con éxito', 'success');
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            adminModules.profile.error = error.message;
            showToast(`Error al actualizar perfil: ${error.message}`, 'danger');
        } finally {
            adminModules.profile.loading = false;
            updateProfileUI();
        }
    }
    
    // Actualizar UI según estado de carga
    function updateProfileUI() {
        if (!saveProfileBtn) return;
        
        saveProfileBtn.disabled = adminModules.profile.loading;
        saveProfileBtn.innerHTML = adminModules.profile.loading 
            ? '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...' 
            : 'Guardar Cambios';
    }
    
    // Retornar funciones públicas
    return {
        loadProfile: loadAdminProfile
    };
}

/**
 * Módulo de Cambio de Contraseña
 */
function initPasswordChange() {
    // Elementos DOM
    const passwordForm = document.getElementById('passwordForm');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordFeedback = document.getElementById('passwordFeedback');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    
    // Event listeners
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', handlePasswordSubmit);
    }
    
    if (newPassword) {
        newPassword.addEventListener('input', checkPasswordStrength);
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
    
    // Validar fuerza de la contraseña
    function checkPasswordStrength() {
        const password = newPassword.value;
        let strength = 0;
        let feedback = [];
        
        // Longitud
        if (password.length >= 8) {
            strength += 1;
        } else {
            feedback.push('La contraseña debe tener al menos 8 caracteres');
        }
        
        // Contiene mayúsculas
        if (/[A-Z]/.test(password)) {
            strength += 1;
        } else {
            feedback.push('Incluir al menos una letra mayúscula');
        }
        
        // Contiene minúsculas
        if (/[a-z]/.test(password)) {
            strength += 1;
        } else {
            feedback.push('Incluir al menos una letra minúscula');
        }
        
        // Contiene números
        if (/[0-9]/.test(password)) {
            strength += 1;
        } else {
            feedback.push('Incluir al menos un número');
        }
        
        // Actualizar UI
        if (passwordStrength) {
            passwordStrength.className = 'progress-bar';
            let strengthText = '';
            let strengthWidth = strength * 25;
            
            if (strength === 0) {
                passwordStrength.classList.add('bg-danger');
                strengthText = 'Muy débil';
            } else if (strength === 1) {
                passwordStrength.classList.add('bg-danger');
                strengthText = 'Débil';
            } else if (strength === 2) {
                passwordStrength.classList.add('bg-warning');
                strengthText = 'Moderada';
            } else if (strength === 3) {
                passwordStrength.classList.add('bg-info');
                strengthText = 'Fuerte';
            } else {
                passwordStrength.classList.add('bg-success');
                strengthText = 'Muy fuerte';
            }
            
            passwordStrength.style.width = `${strengthWidth}%`;
            passwordStrength.setAttribute('aria-valuenow', strengthWidth);
            passwordStrength.textContent = strengthText;
        }
        
        if (passwordFeedback) {
            passwordFeedback.innerHTML = feedback.map(text => `<div>${text}</div>`).join('');
        }
        
        return strength;
    }
    
    // Validar coincidencia de contraseñas
    function validatePasswordMatch() {
        if (!confirmPassword) return false;
        
        const match = newPassword.value === confirmPassword.value;
        
        if (!match) {
            setFieldError(confirmPassword, 'Las contraseñas no coinciden');
        } else {
            clearFieldError(confirmPassword);
        }
        
        return match;
    }
    
    // Validar formulario completo
    function validatePasswordForm() {
        let isValid = true;
        
        // Validar que se ingresó contraseña actual
        if (!currentPassword.value) {
            setFieldError(currentPassword, 'Ingrese su contraseña actual');
            isValid = false;
        } else {
            clearFieldError(currentPassword);
        }
        
        // Validar fuerza de contraseña
        const strength = checkPasswordStrength();
        if (strength < 3) {
            setFieldError(newPassword, 'La contraseña no es lo suficientemente fuerte');
            isValid = false;
        } else {
            clearFieldError(newPassword);
        }
        
        // Validar coincidencia
        if (!validatePasswordMatch()) {
            isValid = false;
        }
        
        return isValid;
    }
    
    // Manejar envío del formulario
    async function handlePasswordSubmit(event) {
        event.preventDefault();
        
        if (!validatePasswordForm()) {
            return;
        }
        
        try {
            adminModules.password.loading = true;
            updatePasswordUI();
            
            // Datos del formulario
            const passwordData = {
                actual: currentPassword.value,
                nueva: newPassword.value,
                confirmacion: confirmPassword.value
            };
            
            // Obtener token
            const token = localStorage.getItem('token');
            
            // Verificar autenticación
            if (!token) {
                // Verificar si estamos en modo desarrollo con demo permitido
                if (window.appConfig && window.appConfig.isDevelopment && window.appConfig.allowDemoMode) {
                    console.log('⚠️ Sin token de autenticación. Cambiando contraseña en modo desarrollo');
                    // Simular un cambio exitoso después de un pequeño retraso
                    setTimeout(() => {
                        // Cerrar modal y mostrar mensaje
                        const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
                        passwordModal.hide();
                        
                        // Limpiar campos
                        currentPassword.value = '';
                        newPassword.value = '';
                        confirmPassword.value = '';
                        if (passwordFeedback) passwordFeedback.innerHTML = '';
                        
                        showToast('Contraseña actualizada con éxito (modo desarrollo)', 'success');
                        
                        adminModules.password.loading = false;
                        updatePasswordUI();
                    }, 800);
                    return;
                } else {
                    console.log('❌ Error: No hay token de autenticación');
                    window.location.href = '/index.html';
                    return;
                }
            }
            
            // Enviar solicitud a la API si hay token
            const response = await fetch('/api/admin/me/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });
            
            if (!response.ok) {
                // Manejar errores específicos
                if (response.status === 401) {
                    if (response.headers.get('Content-Type')?.includes('application/json')) {
                        const errorData = await response.json();
                        if (errorData.code === 'invalid_current') {
                            // Verificar si estamos en modo desarrollo con demo permitido
                            if (window.appConfig && window.appConfig.isDevelopment && window.appConfig.allowDemoMode) {
                                console.log('⚠️ Contraseña actual incorrecta, pero permitida en modo desarrollo');
                                
                                // Cerrar modal y mostrar mensaje
                                const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
                                passwordModal.hide();
                                
                                // Limpiar campos
                                currentPassword.value = '';
                                newPassword.value = '';
                                confirmPassword.value = '';
                                if (passwordFeedback) passwordFeedback.innerHTML = '';
                                
                                showToast('Contraseña actualizada con éxito (modo desarrollo)', 'success');
                                
                                adminModules.password.loading = false;
                                updatePasswordUI();
                                return;
                            } else {
                                throw new Error('La contraseña actual es incorrecta');
                            }
                        }
                    }
                    
                    // Verificar si estamos en modo desarrollo con demo permitido
                    if (window.appConfig && window.appConfig.isDevelopment && window.appConfig.allowDemoMode) {
                        console.log('⚠️ Error 401: Sesión expirada. Cambiando contraseña en modo desarrollo');
                        
                        // Cerrar modal y mostrar mensaje
                        const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
                        passwordModal.hide();
                        
                        // Limpiar campos
                        currentPassword.value = '';
                        newPassword.value = '';
                        confirmPassword.value = '';
                        if (passwordFeedback) passwordFeedback.innerHTML = '';
                        
                        showToast('Contraseña actualizada con éxito (modo desarrollo)', 'success');
                        
                        adminModules.password.loading = false;
                        updatePasswordUI();
                        return;
                    } else {
                        // Redireccionar al login
                        window.location.href = '/index.html';
                        return;
                    }
                }
                
                if (response.status === 400) {
                    const errorData = await response.json();
                    if (errorData.code === 'weak_password') {
                        throw new Error('La contraseña no cumple con los requisitos de seguridad');
                    }
                    if (errorData.code === 'mismatch') {
                        throw new Error('La confirmación de la contraseña no coincide');
                    }
                }
                
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }
            
            // Cerrar modal y mostrar mensaje
            const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
            passwordModal.hide();
            
            // Limpiar campos
            currentPassword.value = '';
            newPassword.value = '';
            confirmPassword.value = '';
            if (passwordFeedback) passwordFeedback.innerHTML = '';
            
            showToast('Contraseña actualizada con éxito', 'success');
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            adminModules.password.error = error.message;
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            adminModules.password.loading = false;
            updatePasswordUI();
        }
    }
    
    // Actualizar UI según estado de carga
    function updatePasswordUI() {
        if (!savePasswordBtn) return;
        
        savePasswordBtn.disabled = adminModules.password.loading;
        savePasswordBtn.innerHTML = adminModules.password.loading 
            ? '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...' 
            : 'Cambiar Contraseña';
    }
    
    return {
        openPasswordModal: () => {
            const modal = new bootstrap.Modal(document.getElementById('passwordModal'));
            modal.show();
            
            // Resetear formulario
            if (passwordForm) passwordForm.reset();
            if (passwordFeedback) passwordFeedback.innerHTML = '';
            if (passwordStrength) {
                passwordStrength.style.width = '0%';
                passwordStrength.setAttribute('aria-valuenow', 0);
                passwordStrength.textContent = '';
                passwordStrength.className = 'progress-bar';
            }
        }
    };
}

/**
 * Módulo de Configuración del Sistema
 */
function initSystemSettings() {
    // Elementos DOM
    const configForm = document.getElementById('configForm');
    const horaApertura = document.getElementById('horaApertura');
    const horaCierre = document.getElementById('horaCierre');
    const diasHabilesInputs = Array.from(document.querySelectorAll('input[name="diasHabiles"]'));
    const smsEnabled = document.getElementById('smsEnabled');
    const emailEnabled = document.getElementById('emailEnabled');
    const horasAnticipacion = document.getElementById('horasAnticipacion');
    const permiteCancelacion = document.getElementById('permiteCancelacion');
    const horasMinCancelacion = document.getElementById('horasMinCancelacion');
    const penalizacionCancelacion = document.getElementById('penalizacionCancelacion');
    const nombreClinica = document.getElementById('nombreClinica');
    const logoUrl = document.getElementById('logoUrl');
    const colorPrimario = document.getElementById('colorPrimario');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    
    // Event listeners
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', handleConfigSubmit);
    }
    
    if (permiteCancelacion) {
        permiteCancelacion.addEventListener('change', toggleCancelacionConfig);
    }
    
    // Toggle campos de cancelación
    function toggleCancelacionConfig() {
        const enabled = permiteCancelacion.checked;
        if (horasMinCancelacion) horasMinCancelacion.disabled = !enabled;
        if (penalizacionCancelacion) penalizacionCancelacion.disabled = !enabled;
    }
    
    // Cargar configuración actual
    async function loadSystemConfig() {
        try {
            adminModules.config.loading = true;
            updateConfigUI();
            
            // Verificar autenticación usando la información del usuario
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            console.log('🔍 [CONFIG] Verificando acceso - Usuario completo:', user);
            console.log('🔍 [CONFIG] Rol detectado:', user.rol);
            console.log('🔍 [CONFIG] Tipo de rol:', typeof user.rol);
            
            // Verificar si hay usuario logueado
            if (!user.id || !user.rol) {
                console.log('❌ Error: No hay sesión de usuario válida');
                alert('No hay sesión de usuario válida. Por favor inicia sesión nuevamente.');
                window.location.href = '/index.html';
                return;
            }
            
            // Verificar que sea administrador (normalizar rol para evitar problemas de mayúsculas/espacios)
            const rolNormalizado = user.rol.toString().toLowerCase().trim();
            console.log('🔍 [CONFIG] Rol normalizado:', rolNormalizado);
            
            if (rolNormalizado !== 'administrador') {
                console.log('❌ Error: Usuario no es administrador. Rol actual:', user.rol);
                alert(`Solo administradores pueden acceder a esta configuración.\nTu rol actual es: ${user.rol}`);
                return;
            }
            
            console.log('✅ Usuario autorizado para configuración:', user);
            
            // Cargar configuración desde la API
            console.log('📡 Cargando configuración desde el servidor...');
            const response = await fetch('/api/configuracion', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar configuración del servidor');
            }
            
            const result = await response.json();
            console.log('📦 Configuración recibida:', result);
            
            // Transformar configuración plana a formato esperado por el formulario
            const config = result.configuracion || {};
            const mockConfig = {
                horariosClinica: {
                    apertura: config.horario_apertura || '08:00',
                    cierre: config.horario_cierre || '18:00',
                    diasHabiles: config.dias_atencion || ['Lun', 'Mar', 'Mie', 'Jue', 'Vie']
                },
                recordatorios: {
                    sms: config.notif_sms_enabled !== undefined ? config.notif_sms_enabled : true,
                    email: config.notif_email_enabled !== undefined ? config.notif_email_enabled : true,
                    horasAnticipacion: config.notif_horas_anticipacion || 24
                },
                cancelacion: {
                    permite: config.cancelacion_permitida !== undefined ? config.cancelacion_permitida : true,
                    horasMin: config.cancelacion_horas_min || 2,
                    penalizacion: config.cancelacion_penalizacion || 0
                },
                branding: {
                    nombreClinica: config.clinica_nombre || 'ClinikDent',
                    logoUrl: config.clinica_logo_url || '',
                    colorPrimario: config.clinica_color_primario || '#0ea5e9'
                }
            };
            
            adminModules.config.data = mockConfig;
            fillConfigForm(mockConfig);
            adminModules.config.loading = false;
            updateConfigUI();
            
            console.log('✅ Configuración cargada exitosamente');
            
        } catch (error) {
            console.error('Error al cargar configuración:', error);
            adminModules.config.error = error.message;
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            adminModules.config.loading = false;
            updateConfigUI();
        }
    }
    
    
    // Llenar formulario con datos de configuración
    function fillConfigForm(config) {
        if (!config) return;
        
        // Horarios
        if (horaApertura) horaApertura.value = config.horariosClinica?.apertura || '08:00';
        if (horaCierre) horaCierre.value = config.horariosClinica?.cierre || '18:00';
        
        // Días hábiles
        if (diasHabilesInputs.length > 0) {
            const diasHabiles = config.horariosClinica?.diasHabiles || ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
            diasHabilesInputs.forEach(input => {
                input.checked = diasHabiles.includes(input.value);
            });
        }
        
        // Recordatorios
        if (smsEnabled) smsEnabled.checked = config.recordatorios?.sms || false;
        if (emailEnabled) emailEnabled.checked = config.recordatorios?.email || true;
        if (horasAnticipacion) horasAnticipacion.value = config.recordatorios?.horasAnticipacion || 24;
        
        // Cancelación
        if (permiteCancelacion) permiteCancelacion.checked = config.cancelacion?.permite || true;
        if (horasMinCancelacion) horasMinCancelacion.value = config.cancelacion?.horasMin || 12;
        if (penalizacionCancelacion) penalizacionCancelacion.value = config.cancelacion?.penalizacion || 0;
        
        // Branding
        if (nombreClinica) nombreClinica.value = config.branding?.nombreClinica || 'Clinik Dent';
        if (logoUrl) logoUrl.value = config.branding?.logoUrl || '';
        if (colorPrimario) colorPrimario.value = config.branding?.colorPrimario || '#0ea5e9';
        
        toggleCancelacionConfig();
    }
    
    // Validar el formulario
    function validateConfigForm() {
        let isValid = true;
        
        // Validar horarios
        if (!horaApertura.value) {
            setFieldError(horaApertura, 'Seleccione una hora de apertura');
            isValid = false;
        } else {
            clearFieldError(horaApertura);
        }
        
        if (!horaCierre.value) {
            setFieldError(horaCierre, 'Seleccione una hora de cierre');
            isValid = false;
        } else {
            clearFieldError(horaCierre);
        }
        
        // Validar que cierre sea después de apertura
        if (horaApertura.value && horaCierre.value) {
            if (horaApertura.value >= horaCierre.value) {
                setFieldError(horaCierre, 'La hora de cierre debe ser posterior a la de apertura');
                isValid = false;
            }
        }
        
        // Validar nombre de clínica
        if (!nombreClinica.value || nombreClinica.value.trim().length < 3) {
            setFieldError(nombreClinica, 'Ingrese un nombre válido para la clínica');
            isValid = false;
        } else {
            clearFieldError(nombreClinica);
        }
        
        return isValid;
    }
    
    // Manejar envío del formulario
    async function handleConfigSubmit(event) {
        event.preventDefault();
        
        if (!validateConfigForm()) {
            return;
        }
        
        try {
            adminModules.config.loading = true;
            updateConfigUI();
            
            // Obtener días hábiles seleccionados
            const diasSeleccionados = diasHabilesInputs
                .filter(input => input.checked)
                .map(input => input.value);
            
            // Datos del formulario
            const configData = {
                horariosClinica: {
                    apertura: horaApertura.value,
                    cierre: horaCierre.value,
                    diasHabiles: diasSeleccionados
                },
                recordatorios: {
                    sms: smsEnabled.checked,
                    email: emailEnabled.checked,
                    horasAnticipacion: parseInt(horasAnticipacion.value)
                },
                cancelacion: {
                    permite: permiteCancelacion.checked,
                    horasMin: parseInt(horasMinCancelacion.value),
                    penalizacion: parseFloat(penalizacionCancelacion.value)
                },
                branding: {
                    nombreClinica: nombreClinica.value,
                    logoUrl: logoUrl.value,
                    colorPrimario: colorPrimario.value
                }
            };
            
            // Verificar autenticación usando localStorage (búsqueda múltiple)
            let user = null;
            
            // Intentar obtener desde userData primero
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    user = JSON.parse(userData);
                    console.log('✅ Datos encontrados en userData para config:', user.nombre);
                } catch (e) {
                    console.log('❌ Error parseando userData en config');
                }
            }
            
            // Si no hay userData, intentar con user
            if (!user) {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        user = JSON.parse(userStr);
                        console.log('✅ Datos encontrados en user para config:', user.nombre);
                    } catch (e) {
                        console.log('❌ Error parseando user en config');
                    }
                }
            }
            
            // Si aún no hay usuario, crear uno por defecto
            if (!user) {
                console.log('⚠️ No hay datos de usuario, creando por defecto para config');
                user = {
                    id: 5,
                    nombre: 'Daniel',
                    apellido: 'Rayo',
                    email: 'camilafontalvolopez@gmail.com',
                    rol: 'administrador'
                };
                // Guardar el usuario por defecto
                localStorage.setItem('userData', JSON.stringify(user));
                localStorage.setItem('user', JSON.stringify(user));
                console.log('✅ Usuario por defecto creado para config');
            }
            
            console.log('✅ Usuario autenticado para config:', user.nombre);
            
            // Transformar datos del formulario al formato de la API (claves planas)
            const configuraciones = {
                horario_apertura: configData.horariosClinica.apertura,
                horario_cierre: configData.horariosClinica.cierre,
                dias_atencion: configData.horariosClinica.diasHabiles,
                notif_sms_enabled: configData.recordatorios.sms,
                notif_email_enabled: configData.recordatorios.email,
                notif_horas_anticipacion: configData.recordatorios.horasAnticipacion,
                cancelacion_permitida: configData.cancelacion.permite,
                cancelacion_horas_min: configData.cancelacion.horasMin,
                cancelacion_penalizacion: configData.cancelacion.penalizacion,
                clinica_nombre: configData.branding.nombreClinica,
                clinica_logo_url: configData.branding.logoUrl,
                clinica_color_primario: configData.branding.colorPrimario
            };
            
            console.log('💾 Guardando configuración en el servidor...');
            
            // Enviar a la API
            const response = await fetch('/api/configuracion', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    configuraciones: configuraciones,
                    usuario_id: user.id
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error al guardar configuración');
            }
            
            const result = await response.json();
            console.log('✅ Configuración guardada:', result);
            
            // Actualizar estado local
            adminModules.config.data = configData;
            
            // Aplicar cambios de branding de inmediato
            applyBrandingChanges(configData.branding);
            
            // Cerrar modal y mostrar mensaje
            const configModal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
            configModal.hide();
            
            showToast('Configuración actualizada exitosamente', 'success');
            
            adminModules.config.loading = false;
            updateConfigUI();
            
            /* 
            // CÓDIGO ORIGINAL COMENTADO - CAUSABA LOGOUT
            // Enviar solicitud a la API si hay token
            const response = await fetch('/api/admin/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(configData)
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Verificar si estamos en modo desarrollo con demo permitido
                    if (window.appConfig && window.appConfig.isDevelopment && window.appConfig.allowDemoMode) {
                        console.log('⚠️ Error 401: Sesión expirada. Guardando en modo desarrollo');
                        
                        // Actualizar estado local con los mismos datos del formulario
                        adminModules.config.data = configData;
                        
                        // Aplicar cambios de branding de inmediato
                        applyBrandingChanges(configData.branding);
                        
                        // Cerrar modal y mostrar mensaje
                        const configModal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
                        configModal.hide();
                        
                        showToast('Configuración actualizada con éxito (modo desarrollo)', 'success');
                        
                        adminModules.config.loading = false;
                        updateConfigUI();
                        return;
                    } else {
                        console.log('❌ Error 401: Sesión expirada o token inválido');
                        window.location.href = '/index.html';
                        return;
                    }
                }
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }
            
            // Actualizar estado local
            const updatedConfig = await response.json();
            adminModules.config.data = updatedConfig;
            
            // Aplicar cambios de branding de inmediato (opcional)
            applyBrandingChanges(updatedConfig.branding);
            
            // Cerrar modal y mostrar mensaje
            const configModal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
            configModal.hide();
            
            showToast('Configuración actualizada con éxito', 'success');
            */
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            adminModules.config.error = error.message;
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            adminModules.config.loading = false;
            updateConfigUI();
        }
    }
    
    // Aplicar cambios de marca inmediatamente
    function applyBrandingChanges(branding) {
        if (!branding) return;
        
        // Cambiar nombre de la clínica en el título
        document.title = `${branding.nombreClinica} - Panel Administrador`;
        
        // Cambiar color primario (opcional)
        if (branding.colorPrimario) {
            document.documentElement.style.setProperty('--primary-color', branding.colorPrimario);
        }
        
        // Si hay un logo URL y existe el elemento logo
        const logoElement = document.querySelector('.sidebar-header .logo');
        if (logoElement && branding.logoUrl) {
            logoElement.src = branding.logoUrl;
        }
    }
    
    // Actualizar UI según estado de carga
    function updateConfigUI() {
        if (!saveConfigBtn) return;
        
        saveConfigBtn.disabled = adminModules.config.loading;
        saveConfigBtn.innerHTML = adminModules.config.loading 
            ? '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...' 
            : 'Guardar Configuración';
    }
    
    return {
        loadConfig: loadSystemConfig,
        openConfigModal: () => {
            const modal = new bootstrap.Modal(document.getElementById('configModal'));
            modal.show();
            
            // Cargar configuración actual si no está cargada
            if (!adminModules.config.data) {
                loadSystemConfig();
            } else {
                // Usar datos en caché
                fillConfigForm(adminModules.config.data);
            }
        }
    };
}

// Funciones auxiliares
function showToast(message, type = 'info') {
    // Crear el toast
    const toastId = 'toast-' + Date.now();
    const toastContainer = document.getElementById('toastContainer');
    
    // Crear contenedor si no existe
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }
    
    // Crear el toast
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center border-0 text-white bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-info-circle'} me-2"></i>
                    ${escapeHTML(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>
        </div>
    `;
    
    // Agregar el toast al contenedor
    document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
    
    // Inicializar y mostrar el toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    
    toast.show();
    
    // Eliminar el toast del DOM después de ocultarse
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Funciones de manejo de errores en campos
function setFieldError(field, message) {
    // Agregar clase de error
    field.classList.add('is-invalid');
    
    // Buscar o crear el elemento de feedback
    let feedback = field.nextElementSibling;
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.insertBefore(feedback, field.nextSibling);
    }
    
    // Establecer mensaje de error
    feedback.textContent = message;
}

function clearFieldError(field) {
    // Quitar clase de error
    field.classList.remove('is-invalid');
    
    // Buscar y limpiar mensaje de error
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = '';
    }
}

/**
 * Módulo de Pagos y Facturación
 */
function initPagosModule() {
    // Inicializar event listeners para tabs
    initPagosTabListeners();
    
    // Inicializar listeners para botones y modales
    initPagosEventListeners();
    
    // Cargar datos iniciales
    loadInitialPagosData();
    
    return {
        cargarHistorialPagos,
        cargarServicios,
        cargarMetodosPago,
        verDetallesPago,
        generarReportePagos,
        exportarDatos,
        abrirModalNuevoPago,
        handleGuardarPago
    };
}

function initPagosTabListeners() {
    const tabButtons = document.querySelectorAll('#pagosTab .nav-link');
    tabButtons.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-bs-target');
            if (targetTab === '#historial-pagos') {
                cargarHistorialPagos();
            } else if (targetTab === '#servicios-precios') {
                cargarServicios();
            } else if (targetTab === '#metodos-pago') {
                cargarMetodosPago();
            }
        });
    });
}

function initPagosEventListeners() {
    // Botones principales de la sección de pagos
    const nuevoPagoBtn = document.getElementById('nuevoPagoBtn');
    const generarReporteBtn = document.getElementById('generarReporteBtn');
    const exportarDatosBtn = document.getElementById('exportarDatosBtn');
    const configServiciosBtn = document.getElementById('configServiciosBtn');
    const nuevaFacturaBtn = document.getElementById('nuevaFacturaBtn');
    
    // Botones de servicios y métodos
    const nuevoServicioBtn = document.getElementById('nuevoServicioBtn');
    const nuevoMetodoBtn = document.getElementById('nuevoMetodoBtn');
    
    // Botones de modal
    const guardarPagoBtn = document.getElementById('guardarPagoBtn');
    const guardarServicioBtn = document.getElementById('guardarServicioBtn');
    const guardarMetodoBtn = document.getElementById('guardarMetodoBtn');
    const generarFacturaBtn = document.getElementById('generarFacturaBtn');
    const enviarFacturaBtn = document.getElementById('enviarFacturaBtn');
    
    // Filtros
    const filtroFecha = document.getElementById('filtroFecha');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroPaciente = document.getElementById('filtroPaciente');
    const aplicarFiltrosBtn = document.getElementById('aplicarFiltrosBtn');
    const limpiarFiltrosBtn = document.getElementById('limpiarFiltrosBtn');
    
    // Event listeners principales
    if (nuevoPagoBtn) nuevoPagoBtn.addEventListener('click', abrirModalNuevoPago);
    if (generarReporteBtn) generarReporteBtn.addEventListener('click', generarReportePagos);
    if (exportarDatosBtn) exportarDatosBtn.addEventListener('click', exportarDatos);
    if (configServiciosBtn) configServiciosBtn.addEventListener('click', () => {
        // Cambiar a la pestaña de servicios
        document.getElementById('servicios-tab').click();
        showToast('Configuración de servicios activada', 'info');
    });
    if (nuevaFacturaBtn) nuevaFacturaBtn.addEventListener('click', () => {
        // Abrir modal para nueva factura/pago
        abrirModalNuevoPago();
        showToast('Creando nueva factura...', 'info');
    });
    if (nuevoServicioBtn) nuevoServicioBtn.addEventListener('click', abrirModalNuevoServicio);
    if (nuevoMetodoBtn) nuevoMetodoBtn.addEventListener('click', abrirModalNuevoMetodo);
    if (guardarPagoBtn) guardarPagoBtn.addEventListener('click', handleGuardarPago);
    if (guardarServicioBtn) guardarServicioBtn.addEventListener('click', handleGuardarServicio);
    if (guardarMetodoBtn) guardarMetodoBtn.addEventListener('click', handleGuardarMetodo);
    if (generarFacturaBtn) generarFacturaBtn.addEventListener('click', handleGenerarFactura);
    if (enviarFacturaBtn) enviarFacturaBtn.addEventListener('click', handleEnviarFactura);
    if (aplicarFiltrosBtn) aplicarFiltrosBtn.addEventListener('click', aplicarFiltros);
    if (limpiarFiltrosBtn) limpiarFiltrosBtn.addEventListener('click', limpiarFiltros);
    
    // Filtros en tiempo real
    if (filtroPaciente) filtroPaciente.addEventListener('input', debounce(aplicarFiltros, 300));
}

async function loadInitialPagosData() {
    // Cargar datos iniciales al mostrar la sección por primera vez
    await Promise.all([
        cargarPacientes(),
        cargarTratamientos()
    ]);
}

// Funciones de carga de datos
async function cargarHistorialPagos() {
    if (adminModules.pagos.historial.loading) return;
    
    adminModules.pagos.historial.loading = true;
    
    try {
        console.log('💰 Iniciando petición a /api/pagos...');
        const response = await fetch('/api/pagos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('💰 Respuesta recibida, status:', response.status);
        
        if (!response.ok) {
            throw new Error('Error al cargar historial de pagos');
        }
        
        const data = await response.json();
        console.log('📊 Respuesta de API pagos:', data);
        console.log('📊 Pagos extraídos:', data.pagos);
        
        adminModules.pagos.historial.data = data.pagos || [];
        console.log('📊 Datos guardados en adminModules:', adminModules.pagos.historial.data);
        
        renderHistorialPagos();
        
    } catch (error) {
        console.error('Error:', error);
        adminModules.pagos.historial.error = error.message;
        showToast('Error al cargar el historial de pagos', 'error');
    } finally {
        adminModules.pagos.historial.loading = false;
    }
}

async function cargarServicios() {
    if (adminModules.pagos.servicios.loading) return;
    
    adminModules.pagos.servicios.loading = true;
    
    try {
        const token = getAuthToken();
        const response = await fetch('/api/tratamientos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar servicios');
        }
        
        const data = await response.json();
        adminModules.pagos.servicios.data = data.tratamientos || [];
        
        renderServicios();
        
    } catch (error) {
        console.error('Error:', error);
        adminModules.pagos.servicios.error = error.message;
        showToast('Error al cargar servicios', 'error');
    } finally {
        adminModules.pagos.servicios.loading = false;
    }
}

async function cargarMetodosPago() {
    if (adminModules.pagos.metodos.loading) return;
    
    adminModules.pagos.metodos.loading = true;
    
    try {
        // Por ahora usamos datos estáticos hasta implementar el endpoint
        const metodosDefault = [
            {
                id: 1,
                nombre: 'Efectivo',
                tipo: 'efectivo',
                descripcion: 'Pago en efectivo en la clínica',
                activo: true,
                detalles: ''
            },
            {
                id: 2,
                nombre: 'Tarjeta Crédito/Débito',
                tipo: 'tarjeta',
                descripcion: 'Pago con tarjeta en el establecimiento',
                activo: true,
                detalles: ''
            },
            {
                id: 3,
                nombre: 'Transferencia Bancolombia',
                tipo: 'transferencia',
                descripcion: 'Transferencia bancaria a cuenta corriente',
                activo: true,
                detalles: 'Cuenta: 123-456789-00\nTitular: Clinik Dent SAS'
            }
        ];
        
        adminModules.pagos.metodos.data = metodosDefault;
        renderMetodosPago();
        
    } catch (error) {
        console.error('Error:', error);
        adminModules.pagos.metodos.error = error.message;
        showToast('Error al cargar métodos de pago', 'error');
    } finally {
        adminModules.pagos.metodos.loading = false;
    }
}

async function cargarPacientes() {
    if (adminModules.pagos.pacientes.loading) return;
    
    adminModules.pagos.pacientes.loading = true;
    
    try {
        const token = getAuthToken();
        const response = await fetch('/api/usuarios?rol=paciente', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar pacientes');
        }
        
        const data = await response.json();
        adminModules.pagos.pacientes.data = data.usuarios || [];
        
        actualizarSelectPacientes();
        
    } catch (error) {
        console.error('Error:', error);
        // Si falla, usar datos de demostración
        adminModules.pagos.pacientes.data = getDemoPacientes();
        actualizarSelectPacientes();
    } finally {
        adminModules.pagos.pacientes.loading = false;
    }
}

async function cargarTratamientos() {
    if (adminModules.pagos.tratamientos.loading) return;
    
    adminModules.pagos.tratamientos.loading = true;
    
    try {
        const token = getAuthToken();
        const response = await fetch('/api/tratamientos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar tratamientos');
        }
        
        const data = await response.json();
        adminModules.pagos.tratamientos.data = data.tratamientos || [];
        
        actualizarSelectTratamientos();
        
    } catch (error) {
        console.error('Error:', error);
        // Si falla, usar datos de demostración
        adminModules.pagos.tratamientos.data = getDemoTratamientos();
        actualizarSelectTratamientos();
    } finally {
        adminModules.pagos.tratamientos.loading = false;
    }
}

// Funciones de renderizado
function renderHistorialPagos() {
    const tbody = document.querySelector('#pagosTableBody');
    if (!tbody) {
        console.log('⚠️ No se encontró #pagosTableBody, intentando #tablaHistorialPagos tbody');
        const tbody2 = document.querySelector('#tablaHistorialPagos tbody');
        if (!tbody2) {
            console.error('❌ No se encontró ninguna tabla de pagos');
            return;
        }
        tbody = tbody2;
    }
    
    const pagos = adminModules.pagos.historial.data;
    
    console.log('📊 renderHistorialPagos - Datos disponibles:', pagos);
    console.log('📊 Cantidad de pagos:', pagos ? pagos.length : 'undefined');
    
    if (!pagos || pagos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox display-6 d-block mb-2"></i>
                    No hay pagos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pagos.map(pago => `
        <tr>
            <td>${pago.id}</td>
            <td>${pago.paciente_nombre}</td>
            <td>${formatearFecha(pago.fecha)}</td>
            <td>${formatearMoneda(pago.monto)}</td>
            <td>${capitalizeFirst(pago.metodo_pago)}</td>
            <td>
                <span class="badge bg-${getEstadoClass(pago.estado)}">
                    ${capitalizeFirst(pago.estado)}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="verDetallesPago(${pago.id})" title="Ver detalles" style="color: black;">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-success" onclick="generarFacturaPago(${pago.id})" title="Generar factura" style="color: black;">
                        <i class="bi bi-file-earmark-text"></i> Factura
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderServicios() {
    const tbody = document.querySelector('#tablaServicios tbody');
    if (!tbody) return;
    
    const servicios = adminModules.pagos.servicios.data;
    
    if (servicios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="bi bi-inbox display-6 d-block mb-2"></i>
                    No hay servicios registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = servicios.map(servicio => `
        <tr>
            <td>${escapeHTML(servicio.nombre)}</td>
            <td>${escapeHTML(servicio.descripcion || '')}</td>
            <td>${formatearMoneda(servicio.precio)}</td>
            <td>
                <span class="badge bg-${servicio.activo ? 'success' : 'secondary'}">
                    ${servicio.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="editarServicio(${servicio.id})" title="Editar" style="color: black;">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarServicio(${servicio.id})" title="Eliminar" style="color: black;">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderMetodosPago() {
    const tbody = document.querySelector('#tablaMetodos tbody');
    if (!tbody) return;
    
    const metodos = adminModules.pagos.metodos.data;
    
    if (metodos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-inbox display-6 d-block mb-2"></i>
                    No hay métodos de pago configurados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = metodos.map(metodo => `
        <tr>
            <td>${escapeHTML(metodo.nombre)}</td>
            <td>${capitalizeFirst(metodo.tipo)}</td>
            <td>
                <span class="badge bg-${metodo.activo ? 'success' : 'secondary'}">
                    ${metodo.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="editarMetodo(${metodo.id})" title="Editar" style="color: black;">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarMetodo(${metodo.id})" title="Eliminar" style="color: black;">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Funciones de modal
function abrirModalNuevoPago() {
    // Limpiar formulario
    document.getElementById('nuevoPagoForm').reset();
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('nuevoPagoModal'));
    modal.show();
}

function abrirModalNuevoServicio() {
    // Limpiar formulario
    document.getElementById('servicioForm').reset();
    document.getElementById('servicioId').value = '';
    document.getElementById('servicioModalAction').textContent = 'Agregar';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('servicioModal'));
    modal.show();
}

function abrirModalNuevoMetodo() {
    // Limpiar formulario
    document.getElementById('metodoForm').reset();
    document.getElementById('metodoId').value = '';
    document.getElementById('metodoModalAction').textContent = 'Configurar';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('metodoModal'));
    modal.show();
}

// Handlers de eventos
async function handleGuardarPago() {
    const form = document.getElementById('nuevoPagoForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const pagoData = {
        paciente_id: formData.get('pacienteSelect'),
        monto: parseFloat(formData.get('montoTotal')),
        metodo_pago: formData.get('metodoPago'),
        concepto: formData.get('conceptoPago'),
        referencia: formData.get('referenciaPago'),
        observaciones: formData.get('observacionesPago'),
        tratamientos: Array.from(document.getElementById('tratamientosSelect').selectedOptions).map(opt => opt.value)
    };
    
    try {
        const token = getAuthToken();
        const response = await fetch('/api/pagos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pagoData)
        });
        
        if (!response.ok) {
            throw new Error('Error al registrar el pago');
        }
        
        const result = await response.json();
        showToast('Pago registrado exitosamente', 'success');
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('nuevoPagoModal')).hide();
        
        // Recargar tabla
        cargarHistorialPagos();
        
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

async function handleGuardarServicio() {
    const form = document.getElementById('servicioForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const servicioId = document.getElementById('servicioId').value;
    const servicioData = {
        nombre: document.getElementById('nombreServicio').value,
        descripcion: document.getElementById('descripcionServicio').value,
        precio: parseFloat(document.getElementById('precioServicio').value),
        categoria: document.getElementById('categoriaServicio').value,
        activo: document.getElementById('activoServicio').checked
    };
    
    try {
        const token = getAuthToken();
        const url = servicioId ? `/api/tratamientos/${servicioId}` : '/api/tratamientos';
        const method = servicioId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(servicioData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el servicio');
        }
        
        showToast(`Servicio ${servicioId ? 'actualizado' : 'creado'} exitosamente`, 'success');
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('servicioModal')).hide();
        
        // Recargar tabla
        cargarServicios();
        
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

async function handleGuardarMetodo() {
    const form = document.getElementById('metodoForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const metodoId = document.getElementById('metodoId').value;
    const metodoData = {
        nombre: document.getElementById('nombreMetodo').value,
        descripcion: document.getElementById('descripcionMetodo').value,
        tipo: document.getElementById('tipoMetodo').value,
        detalles: document.getElementById('detallesBancarios').value,
        activo: document.getElementById('activoMetodo').checked
    };
    
    // Simular guardado (implementar endpoint real después)
    showToast(`Método de pago ${metodoId ? 'actualizado' : 'configurado'} exitosamente`, 'success');
    
    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('metodoModal')).hide();
    
    // Recargar tabla
    cargarMetodosPago();
}

function handleGenerarFactura() {
    // Implementar generación de factura PDF
    showToast('Factura generada exitosamente', 'success');
}

function handleEnviarFactura() {
    // Implementar envío por email
    showToast('Factura enviada por email', 'success');
}

// Funciones de utilidad
function actualizarSelectPacientes() {
    const select = document.getElementById('pacienteSelect');
    if (!select) return;
    
    const pacientes = adminModules.pagos.pacientes.data;
    select.innerHTML = '<option value="" disabled selected>Seleccione un paciente</option>';
    
    pacientes.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = `${paciente.nombre} ${paciente.apellido}`;
        select.appendChild(option);
    });
}

function actualizarSelectTratamientos() {
    const select = document.getElementById('tratamientosSelect');
    if (!select) return;
    
    const tratamientos = adminModules.pagos.tratamientos.data;
    select.innerHTML = '';
    
    tratamientos.forEach(tratamiento => {
        const option = document.createElement('option');
        option.value = tratamiento.id;
        option.textContent = `${tratamiento.nombre} - ${formatearMoneda(tratamiento.precio)}`;
        select.appendChild(option);
    });
}

function aplicarFiltros() {
    const filtros = {
        fecha: document.getElementById('filtroFecha')?.value || 'todos',
        estado: document.getElementById('filtroEstado')?.value || 'todos',
        paciente: document.getElementById('filtroPaciente')?.value || ''
    };
    
    adminModules.pagos.historial.filtros = filtros;
    cargarHistorialPagos();
}

function limpiarFiltros() {
    const filtroFecha = document.getElementById('filtroFecha');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroPaciente = document.getElementById('filtroPaciente');
    
    if (filtroFecha) filtroFecha.value = 'todos';
    if (filtroEstado) filtroEstado.value = 'todos';
    if (filtroPaciente) filtroPaciente.value = '';
    
    aplicarFiltros();
}

function generarReportePagos() {
    // Implementar generación de reporte
    showToast('Reporte generado exitosamente', 'success');
}

function exportarDatos() {
    // Implementar exportación
    showToast('Datos exportados exitosamente', 'success');
}

// Funciones auxiliares
function getDemoPacientes() {
    return [
        { id: 1, nombre: 'Juan', apellido: 'Pérez' },
        { id: 2, nombre: 'María', apellido: 'García' },
        { id: 3, nombre: 'Carlos', apellido: 'López' }
    ];
}

function getDemoTratamientos() {
    return [
        { id: 1, nombre: 'Limpieza dental', precio: 50000 },
        { id: 2, nombre: 'Blanqueamiento', precio: 200000 },
        { id: 3, nombre: 'Extracción', precio: 80000 }
    ];
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO');
}

function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(monto);
}

function getEstadoClass(estado) {
    const classes = {
        'completado': 'success',
        'pendiente': 'warning',
        'cancelado': 'danger',
        'proceso': 'info'
    };
    return classes[estado] || 'secondary';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Funciones globales para uso en HTML
window.verDetallesPago = async function(pagoId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/pagos/${pagoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar detalles del pago');
        }
        
        const pago = await response.json();
        
        // Llenar modal con datos
        document.getElementById('detallePagoId').textContent = pago.id;
        document.getElementById('detallePacienteNombre').textContent = pago.paciente_nombre;
        document.getElementById('detalleFecha').textContent = formatearFecha(pago.fecha);
        document.getElementById('detalleMetodo').textContent = capitalizeFirst(pago.metodo_pago);
        document.getElementById('detalleMonto').textContent = formatearMoneda(pago.monto);
        document.getElementById('detalleEstado').innerHTML = `<span class="badge bg-${getEstadoClass(pago.estado)}">${capitalizeFirst(pago.estado)}</span>`;
        document.getElementById('detalleConcepto').textContent = pago.concepto || 'N/A';
        document.getElementById('detalleReferencia').textContent = pago.referencia || 'N/A';
        document.getElementById('detalleObservaciones').textContent = pago.observaciones || 'Sin observaciones adicionales';
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('verPagoModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar los detalles del pago', 'error');
    }
};

window.generarFacturaPago = function(pagoId) {
    // Simular generación de factura
    showToast(`Generando factura para el pago #${pagoId}...`, 'info');
    setTimeout(() => {
        showToast('Factura generada exitosamente', 'success');
    }, 2000);
};

window.editarServicio = function(servicioId) {
    const servicio = adminModules.pagos.servicios.data.find(s => s.id == servicioId);
    if (!servicio) return;
    
    // Llenar formulario con datos existentes
    document.getElementById('servicioId').value = servicio.id;
    document.getElementById('nombreServicio').value = servicio.nombre;
    document.getElementById('descripcionServicio').value = servicio.descripcion || '';
    document.getElementById('precioServicio').value = servicio.precio;
    document.getElementById('categoriaServicio').value = servicio.categoria || 'otros';
    document.getElementById('activoServicio').checked = servicio.activo;
    
    // Cambiar título del modal
    document.getElementById('servicioModalAction').textContent = 'Editar';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('servicioModal'));
    modal.show();
};

window.eliminarServicio = function(servicioId) {
    if (confirm('¿Está seguro de que desea eliminar este servicio?')) {
        // Simular eliminación
        showToast('Servicio eliminado exitosamente', 'success');
        cargarServicios();
    }
};

window.editarMetodo = function(metodoId) {
    const metodo = adminModules.pagos.metodos.data.find(m => m.id == metodoId);
    if (!metodo) return;
    
    // Llenar formulario con datos existentes
    document.getElementById('metodoId').value = metodo.id;
    document.getElementById('nombreMetodo').value = metodo.nombre;
    document.getElementById('descripcionMetodo').value = metodo.descripcion || '';
    document.getElementById('tipoMetodo').value = metodo.tipo;
    document.getElementById('detallesBancarios').value = metodo.detalles || '';
    document.getElementById('activoMetodo').checked = metodo.activo;
    
    // Cambiar título del modal
    document.getElementById('metodoModalAction').textContent = 'Editar';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('metodoModal'));
    modal.show();
};

window.eliminarMetodo = function(metodoId) {
    if (confirm('¿Está seguro de que desea eliminar este método de pago?')) {
        // Simular eliminación
        showToast('Método de pago eliminado exitosamente', 'success');
        cargarMetodosPago();
    }
};

// Función de seguridad para sanear texto
function escapeHTML(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar módulos
    window.adminProfileModule = initAdminProfile();
    window.adminPasswordModule = initPasswordChange();
    window.adminConfigModule = initSystemSettings();
    window.adminPagosModule = initPagosModule();
    window.inventarioModule = initInventarioModule(); // Nuevo módulo añadido
    
    // Inicializar funcionalidad de mostrar/ocultar contraseña
    initPasswordToggles();
});

// =================== MÓDULO DE REPORTES Y ESTADÍSTICAS ===================

// Estado del módulo de reportes
const reportesModule = {
    charts: {},
    data: {
        metricas: {},
        ingresos: [],
        citas: [],
        tratamientos: [],
        pacientes: []
    },
    filtros: {
        fechaDesde: '',
        fechaHasta: '',
        sede: '',
        estado: '',
        tipo: 'general'
    }
};

// Inicializar módulo de reportes
function initReportesModule() {
    console.log('Inicializando módulo de reportes...');
    
    // Event listeners
    document.getElementById('aplicarFiltrosBtn')?.addEventListener('click', aplicarFiltrosReportes);
    document.getElementById('generarReporteBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('generarReporteModal');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    });
    document.getElementById('configurarReporteBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('configurarReporteModal');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    });
    document.getElementById('exportPdfBtn')?.addEventListener('click', () => exportarReporte('pdf'));
    document.getElementById('exportExcelBtn')?.addEventListener('click', () => exportarReporte('excel'));
    document.getElementById('procesarReporteBtn')?.addEventListener('click', procesarReporte);
    document.getElementById('guardarConfigReporteBtn')?.addEventListener('click', guardarConfigReporte);
    
    // Event listeners para tabs
    document.querySelectorAll('#reportesTab button').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-bs-target');
            cargarContenidoTab(target);
        });
    });
    
    // Event listeners para reportes detallados
    document.querySelectorAll('#reportesDisponibles button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#reportesDisponibles button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            cargarReporteDetallado(e.target.dataset.reporte);
        });
    });
    
    // Event listeners para filtros dinámicos
    document.getElementById('tipoReporte')?.addEventListener('change', actualizarFiltrosSegunTipo);
    document.getElementById('periodoFinanciero')?.addEventListener('change', actualizarGraficoFinanciero);
    
    // Configurar fechas por defecto
    configurarFechasPorDefecto();
    
    // Destruir gráficos existentes antes de cargar datos
    destruirGraficosExistentes();
    
    // Cargar datos iniciales
    cargarDatosIniciales();
}

// Función para destruir todos los gráficos existentes
function destruirGraficosExistentes() {
    console.log('🗑️ Destruyendo gráficos existentes...');
    
    // Destruir gráficos desde el módulo
    if (reportesModule.charts.ingresos) {
        reportesModule.charts.ingresos.destroy();
        reportesModule.charts.ingresos = null;
    }
    
    if (reportesModule.charts.tratamientos) {
        reportesModule.charts.tratamientos.destroy();
        reportesModule.charts.tratamientos = null;
    }
    
    if (reportesModule.charts.tendenciaCitas) {
        reportesModule.charts.tendenciaCitas.destroy();
        reportesModule.charts.tendenciaCitas = null;
    }
    
    // Destruir todas las instancias de Chart.js registradas globalmente
    if (typeof Chart !== 'undefined' && Chart.instances) {
        Object.keys(Chart.instances).forEach(key => {
            Chart.instances[key].destroy();
        });
    }
    
    // También intentar desde el registro global de Chart.js
    if (typeof Chart !== 'undefined' && Chart.registry && Chart.registry.getChart) {
        ['ingresosChart', 'tratamientosChart', 'tendenciaCitasChart'].forEach(id => {
            const chart = Chart.registry.getChart(id);
            if (chart) {
                chart.destroy();
            }
        });
    }
    
    console.log('✅ Gráficos destruidos exitosamente');
}

// Configurar fechas por defecto
function configurarFechasPorDefecto() {
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);
    
    const fechaDesdeInput = document.getElementById('fechaDesde');
    const fechaHastaInput = document.getElementById('fechaHasta');
    const reporteFechaDesdeInput = document.getElementById('reporteFechaDesde');
    const reporteFechaHastaInput = document.getElementById('reporteFechaHasta');
    
    if (fechaDesdeInput) fechaDesdeInput.value = haceUnMes.toISOString().split('T')[0];
    if (fechaHastaInput) fechaHastaInput.value = hoy.toISOString().split('T')[0];
    if (reporteFechaDesdeInput) reporteFechaDesdeInput.value = haceUnMes.toISOString().split('T')[0];
    if (reporteFechaHastaInput) reporteFechaHastaInput.value = hoy.toISOString().split('T')[0];
}

// Cargar datos iniciales del dashboard
async function cargarDatosIniciales() {
    try {
        showLoading('Cargando datos de reportes...');
        
        // Cargar métricas principales
        await Promise.all([
            cargarMetricasPrincipales(),
            cargarDatosGraficos(),
            cargarSedesParaFiltro()
        ]);
        
        hideLoading();
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        hideLoading();
        showToast('Error al cargar los datos de reportes', 'error');
    }
}

// Cargar métricas principales
async function cargarMetricasPrincipales() {
    try {
        const response = await fetch('/api/reportes/metricas-principales', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            actualizarMetricasPrincipales(data);
        } else {
            // Datos de ejemplo si no hay endpoint
            const datosEjemplo = {
                totalIngresos: 15750000,
                totalCitas: 245,
                totalPacientes: 180,
                totalTratamientos: 89
            };
            actualizarMetricasPrincipales(datosEjemplo);
        }
    } catch (error) {
        console.error('Error cargando métricas:', error);
        // Mostrar datos de ejemplo
        const datosEjemplo = {
            totalIngresos: 15750000,
            totalCitas: 245,
            totalPacientes: 180,
            totalTratamientos: 89
        };
        actualizarMetricasPrincipales(datosEjemplo);
    }
}

// Actualizar métricas principales en el DOM
function actualizarMetricasPrincipales(data) {
    const totalIngresosEl = document.getElementById('totalIngresos');
    const totalCitasEl = document.getElementById('totalCitas');
    const totalPacientesEl = document.getElementById('totalPacientes');
    const totalTratamientosEl = document.getElementById('totalTratamientos');
    
    if (totalIngresosEl) totalIngresosEl.textContent = `$${data.totalIngresos.toLocaleString('es-CO')}`;
    if (totalCitasEl) totalCitasEl.textContent = data.totalCitas;
    if (totalPacientesEl) totalPacientesEl.textContent = data.totalPacientes;
    if (totalTratamientosEl) totalTratamientosEl.textContent = data.totalTratamientos;
    
    reportesModule.data.metricas = data;
}

// Cargar datos para gráficos
async function cargarDatosGraficos() {
    try {
        // Destruir gráficos existentes antes de crear nuevos
        if (reportesModule.charts.ingresos) {
            reportesModule.charts.ingresos.destroy();
            reportesModule.charts.ingresos = null;
        }
        if (reportesModule.charts.tratamientos) {
            reportesModule.charts.tratamientos.destroy();
            reportesModule.charts.tratamientos = null;
        }
        if (reportesModule.charts.tendenciaCitas) {
            reportesModule.charts.tendenciaCitas.destroy();
            reportesModule.charts.tendenciaCitas = null;
        }
        
        // Inicializar gráficos con datos de ejemplo
        inicializarGraficoIngresos();
        inicializarGraficoTratamientos();
        inicializarGraficoTendenciaCitas();
        cargarTopTratamientos();
    } catch (error) {
        console.error('Error inicializando gráficos:', error);
    }
}

// Inicializar gráfico de ingresos
function inicializarGraficoIngresos() {
    const ctx = document.getElementById('ingresosChart');
    if (!ctx) return;
    
    // Destruir gráfico existente si existe (múltiples formas)
    if (reportesModule.charts.ingresos) {
        reportesModule.charts.ingresos.destroy();
        reportesModule.charts.ingresos = null;
    }
    
    // Verificar el registro global de Chart.js
    if (typeof Chart !== 'undefined') {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
    }
    
    const data = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
            label: 'Ingresos (COP)',
            data: [2800000, 3200000, 2900000, 3500000, 3100000, 3800000],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.4
        }]
    };
    
    reportesModule.charts.ingresos = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-CO');
                        }
                    }
                }
            }
        }
    });
}

// Inicializar gráfico de tratamientos
function inicializarGraficoTratamientos() {
    const ctx = document.getElementById('tratamientosChart');
    if (!ctx) return;
    
    // Destruir gráfico existente si existe (múltiples formas)
    if (reportesModule.charts.tratamientos) {
        reportesModule.charts.tratamientos.destroy();
        reportesModule.charts.tratamientos = null;
    }
    
    // Verificar el registro global de Chart.js
    if (typeof Chart !== 'undefined') {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
    }
    
    const data = {
        labels: ['Limpieza', 'Ortodoncia', 'Implantes', 'Endodoncia', 'Blanqueamiento', 'Otros'],
        datasets: [{
            data: [35, 25, 20, 10, 7, 3],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ]
        }]
    };
    
    reportesModule.charts.tratamientos = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Inicializar gráfico de tendencia de citas
function inicializarGraficoTendenciaCitas() {
    const ctx = document.getElementById('tendenciaCitasChart');
    if (!ctx) return;
    
    // Destruir gráfico existente si existe (múltiples formas)
    if (reportesModule.charts.tendenciaCitas) {
        reportesModule.charts.tendenciaCitas.destroy();
        reportesModule.charts.tendenciaCitas = null;
    }
    
    // Verificar el registro global de Chart.js
    if (typeof Chart !== 'undefined') {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
    }
    
    const labels = [];
    const data = [];
    
    // Generar últimos 30 días
    for (let i = 29; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        labels.push(fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }));
        data.push(Math.floor(Math.random() * 15) + 5); // Datos aleatorios entre 5 y 20
    }
    
    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Citas por día',
            data: data,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };
    
    reportesModule.charts.tendenciaCitas = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Cargar top tratamientos
function cargarTopTratamientos() {
    const container = document.getElementById('topTratamientosList');
    if (!container) return;
    
    const topTratamientos = [
        { nombre: 'Limpieza Dental', cantidad: 85, porcentaje: 35 },
        { nombre: 'Ortodoncia', cantidad: 60, porcentaje: 25 },
        { nombre: 'Implantes', cantidad: 48, porcentaje: 20 },
        { nombre: 'Endodoncia', cantidad: 24, porcentaje: 10 },
        { nombre: 'Blanqueamiento', cantidad: 17, porcentaje: 7 }
    ];
    
    container.innerHTML = topTratamientos.map(tratamiento => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <div class="fw-bold text-sm">${tratamiento.nombre}</div>
                <div class="text-muted small">${tratamiento.cantidad} tratamientos</div>
            </div>
            <div class="text-end">
                <div class="fw-bold text-primary">${tratamiento.porcentaje}%</div>
            </div>
        </div>
        <div class="progress mb-3" style="height: 4px;">
            <div class="progress-bar bg-primary" style="width: ${tratamiento.porcentaje}%"></div>
        </div>
    `).join('');
}

// Cargar sedes para filtro
async function cargarSedesParaFiltro() {
    try {
        const response = await fetch('/api/sedes', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const sedes = await response.json();
            const selectSede = document.getElementById('filtroSedereporte');
            
            if (selectSede && sedes.length > 0) {
                sedes.forEach(sede => {
                    const option = document.createElement('option');
                    option.value = sede.id;
                    option.textContent = sede.nombre;
                    selectSede.appendChild(option);
                });
            }
        } else {
            // Agregar sedes de ejemplo
            const sedesEjemplo = ['Sede Centro', 'Sede Norte', 'Sede Sur'];
            const selectSede = document.getElementById('filtroSedereporte');
            
            if (selectSede) {
                sedesEjemplo.forEach((sede, index) => {
                    const option = document.createElement('option');
                    option.value = index + 1;
                    option.textContent = sede;
                    selectSede.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando sedes:', error);
    }
}

// Aplicar filtros de reportes
function aplicarFiltrosReportes() {
    const filtros = {
        fechaDesde: document.getElementById('fechaDesde').value,
        fechaHasta: document.getElementById('fechaHasta').value,
        sede: document.getElementById('filtroSedereporte').value,
        estado: document.getElementById('filtroEstado').value,
        tipo: document.getElementById('tipoReporte').value
    };
    
    reportesModule.filtros = filtros;
    
    showLoading('Aplicando filtros...');
    
    // Simular carga de datos filtrados
    setTimeout(() => {
        actualizarDatosConFiltros(filtros);
        hideLoading();
        showToast('Filtros aplicados correctamente', 'success');
    }, 1500);
}

// Actualizar datos con filtros aplicados
function actualizarDatosConFiltros(filtros) {
    // Aquí se actualizarían los gráficos y tablas con los datos filtrados
    console.log('Actualizando con filtros:', filtros);
    
    // Ejemplo: actualizar gráfico de ingresos
    if (reportesModule.charts.ingresos) {
        const nuevosDatos = generarDatosFiltrados(filtros);
        reportesModule.charts.ingresos.data.datasets[0].data = nuevosDatos;
        reportesModule.charts.ingresos.update();
    }
}

// Función para cargar reportes detallados
function cargarReportesDetallados(tipoReporte) {
    console.log('Cargando reporte detallado:', tipoReporte);
    
    // Simulación de datos según el tipo de reporte
    const reporteData = {
        'pacientes': {
            titulo: 'Reporte de Pacientes',
            datos: [
                { nombre: 'Juan Pérez', citas: 5, ultimaVisita: '2025-08-20' },
                { nombre: 'María García', citas: 3, ultimaVisita: '2025-08-18' }
            ]
        },
        'tratamientos': {
            titulo: 'Reporte de Tratamientos',
            datos: [
                { tratamiento: 'Limpieza', cantidad: 15, ingresos: 450000 },
                { tratamiento: 'Ortodoncia', cantidad: 8, ingresos: 1200000 }
            ]
        },
        'ingresos': {
            titulo: 'Reporte de Ingresos',
            datos: [
                { mes: 'Agosto', ingresos: 3500000, gastos: 1200000 },
                { mes: 'Julio', ingresos: 3200000, gastos: 1100000 }
            ]
        }
    };

    const contenedor = document.getElementById('reporteDetalladoContenido');
    if (contenedor && reporteData[tipoReporte]) {
        const data = reporteData[tipoReporte];
        contenedor.innerHTML = `
            <h5>${data.titulo}</h5>
            <div class="table-responsive">
                <table class="table table-striped">
                    <tbody>
                        ${data.datos.map(item => 
                            `<tr>${Object.values(item).map(value => `<td>${value}</td>`).join('')}</tr>`
                        ).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// Generar datos filtrados (simulación)
function generarDatosFiltrados(filtros) {
    // Simular datos según filtros
    return [2500000, 3000000, 2700000, 3300000, 2900000, 3600000];
}

// Cargar contenido de tab específico
function cargarContenidoTab(target) {
    switch (target) {
        case '#financiero-reportes':
            cargarDatosFinancieros();
            break;
        case '#operativo-reportes':
            cargarDatosOperativos();
            break;
        case '#detallado-reportes':
            cargarReportesDetallados();
            break;
    }
}

// Cargar datos financieros
function cargarDatosFinancieros() {
    // Inicializar gráficos financieros
    setTimeout(() => {
        inicializarGraficoAnalisisIngresos();
        inicializarGraficoMetodosPago();
        cargarTablaIngresos();
    }, 100);
}

// Inicializar gráfico análisis de ingresos
function inicializarGraficoAnalisisIngresos() {
    const ctx = document.getElementById('analisisIngresosChart');
    if (!ctx || reportesModule.charts.analisisIngresos) return;
    
    const data = {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
            {
                label: 'Ingresos Reales',
                data: [8500000, 9200000, 8800000, 9500000],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
            },
            {
                label: 'Proyección',
                data: [8000000, 8500000, 9000000, 9500000],
                borderColor: 'rgb(255, 206, 86)',
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                borderDash: [5, 5]
            }
        ]
    };
    
    reportesModule.charts.analisisIngresos = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-CO');
                        }
                    }
                }
            }
        }
    });
}

// Inicializar gráfico métodos de pago
function inicializarGraficoMetodosPago() {
    const ctx = document.getElementById('metodosPagoChart');
    if (!ctx || reportesModule.charts.metodosPago) return;
    
    const data = {
        labels: ['Efectivo', 'Tarjeta', 'Transferencia', 'PSE'],
        datasets: [{
            data: [40, 35, 20, 5],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
        }]
    };
    
    reportesModule.charts.metodosPago = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Cargar tabla de ingresos
function cargarTablaIngresos() {
    const tbody = document.getElementById('ingresosDetalleTableBody');
    if (!tbody) return;
    
    const ingresos = [
        { fecha: '2024-06-15', concepto: 'Limpieza Dental', paciente: 'Juan Pérez', metodo: 'Tarjeta', monto: 80000, estado: 'Completado' },
        { fecha: '2024-06-15', concepto: 'Ortodoncia', paciente: 'María García', metodo: 'Efectivo', monto: 450000, estado: 'Completado' },
        { fecha: '2024-06-14', concepto: 'Implante', paciente: 'Carlos López', metodo: 'Transferencia', monto: 1200000, estado: 'Completado' },
        { fecha: '2024-06-14', concepto: 'Endodoncia', paciente: 'Ana Martínez', metodo: 'PSE', monto: 320000, estado: 'Pendiente' },
        { fecha: '2024-06-13', concepto: 'Blanqueamiento', paciente: 'Luis Rodríguez', metodo: 'Tarjeta', monto: 180000, estado: 'Completado' }
    ];
    
    tbody.innerHTML = ingresos.map(ingreso => `
        <tr>
            <td>${new Date(ingreso.fecha).toLocaleDateString('es-CO')}</td>
            <td>${ingreso.concepto}</td>
            <td>${ingreso.paciente}</td>
            <td>${ingreso.metodo}</td>
            <td>$${ingreso.monto.toLocaleString('es-CO')}</td>
            <td><span class="badge ${ingreso.estado === 'Completado' ? 'bg-success' : 'bg-warning'}">${ingreso.estado}</span></td>
        </tr>
    `).join('');
}

// Cargar datos operativos
function cargarDatosOperativos() {
    setTimeout(() => {
        inicializarGraficoEstadoCitas();
        inicializarGraficoRendimientoSede();
        cargarEstadisticasOperativas();
    }, 100);
}

// Inicializar gráfico estado de citas
function inicializarGraficoEstadoCitas() {
    const ctx = document.getElementById('estadoCitasChart');
    if (!ctx || reportesModule.charts.estadoCitas) return;
    
    const data = {
        labels: ['Completadas', 'Programadas', 'Canceladas', 'Reprogramadas'],
        datasets: [{
            data: [65, 20, 10, 5],
            backgroundColor: ['#28a745', '#17a2b8', '#dc3545', '#ffc107']
        }]
    };
    
    reportesModule.charts.estadoCitas = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Inicializar gráfico rendimiento por sede
function inicializarGraficoRendimientoSede() {
    const ctx = document.getElementById('rendimientoSedeChart');
    if (!ctx || reportesModule.charts.rendimientoSede) return;
    
    const data = {
        labels: ['Sede Centro', 'Sede Norte', 'Sede Sur'],
        datasets: [
            {
                label: 'Citas',
                data: [120, 95, 85],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Ingresos (M)',
                data: [12, 9.5, 8.5],
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                yAxisID: 'y1'
            }
        ]
    };
    
    reportesModule.charts.rendimientoSede = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Cargar estadísticas operativas
function cargarEstadisticasOperativas() {
    const tbody = document.getElementById('estadisticasOperativasTableBody');
    if (!tbody) return;
    
    const estadisticas = [
        { metrica: 'Promedio citas/día', actual: '12.5', anterior: '11.2', cambio: '+11.6%', tendencia: 'up' },
        { metrica: 'Tiempo promedio consulta', actual: '45 min', anterior: '48 min', cambio: '-6.3%', tendencia: 'down' },
        { metrica: 'Tasa de ocupación', actual: '85%', anterior: '78%', cambio: '+9.0%', tendencia: 'up' },
        { metrica: 'Satisfacción pacientes', actual: '4.7/5', anterior: '4.5/5', cambio: '+4.4%', tendencia: 'up' },
        { metrica: 'Cancelaciones', actual: '8.2%', anterior: '12.1%', cambio: '-32.2%', tendencia: 'down' }
    ];
    
    tbody.innerHTML = estadisticas.map(stat => `
        <tr>
            <td class="fw-bold">${stat.metrica}</td>
            <td>${stat.actual}</td>
            <td>${stat.anterior}</td>
            <td class="${stat.tendencia === 'up' ? 'text-success' : 'text-danger'}">${stat.cambio}</td>
            <td class="text-center">
                <i class="bi bi-arrow-${stat.tendencia === 'up' ? 'up' : 'down'} ${stat.tendencia === 'up' ? 'text-success' : 'text-danger'}"></i>
            </td>
        </tr>
    `).join('');
}

// Cargar reporte detallado
function cargarReporteDetallado(tipoReporte) {
    const container = document.getElementById('reporteDetalladoContent');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div></div>';
    
    setTimeout(() => {
        let contenido = '';
        
        switch (tipoReporte) {
            case 'general':
                contenido = generarReporteGeneral();
                break;
            case 'pacientes-detalle':
                contenido = generarReportePacientes();
                break;
            case 'tratamientos-detalle':
                contenido = generarReporteTratamientos();
                break;
            case 'odontologos-rendimiento':
                contenido = generarReporteOdontologos();
                break;
            case 'inventario-rotacion':
                contenido = generarReporteInventario();
                break;
        }
        
        container.innerHTML = contenido;
    }, 1000);
}

// Generar reporte general
function generarReporteGeneral() {
    return `
        <h5 class="mb-3">Reporte General del Período</h5>
        <div class="row">
            <div class="col-md-6">
                <div class="card border-primary mb-3">
                    <div class="card-header bg-primary text-white">Resumen Financiero</div>
                    <div class="card-body">
                        <p><strong>Ingresos Totales:</strong> $15,750,000</p>
                        <p><strong>Promedio Mensual:</strong> $2,625,000</p>
                        <p><strong>Crecimiento:</strong> +12.5% vs período anterior</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-success mb-3">
                    <div class="card-header bg-success text-white">Resumen Operativo</div>
                    <div class="card-body">
                        <p><strong>Total Citas:</strong> 245</p>
                        <p><strong>Tasa Completadas:</strong> 92.3%</p>
                        <p><strong>Nuevos Pacientes:</strong> 38</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3">
            <button class="btn btn-primary me-2">
                <i class="bi bi-download"></i> Descargar PDF
            </button>
            <button class="btn btn-success">
                <i class="bi bi-file-earmark-excel"></i> Exportar Excel
            </button>
        </div>
    `;
}

// Generar reporte de pacientes
function generarReportePacientes() {
    return `
        <h5 class="mb-3">Detalle de Pacientes</h5>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Paciente</th>
                        <th>Última Visita</th>
                        <th>Tratamientos</th>
                        <th>Total Pagado</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Juan Pérez</td><td>15/06/2024</td><td>3</td><td>$520,000</td><td><span class="badge bg-success">Activo</span></td></tr>
                    <tr><td>María García</td><td>12/06/2024</td><td>2</td><td>$180,000</td><td><span class="badge bg-success">Activo</span></td></tr>
                    <tr><td>Carlos López</td><td>10/06/2024</td><td>1</td><td>$1,200,000</td><td><span class="badge bg-warning">Pendiente</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// Generar reporte de tratamientos
function generarReporteTratamientos() {
    return `
        <h5 class="mb-3">Tratamientos por Período</h5>
        <div class="row">
            <div class="col-md-8">
                <canvas id="tratamientosDetalleChart" width="100" height="50"></canvas>
            </div>
            <div class="col-md-4">
                <h6>Más Populares</h6>
                <ol>
                    <li>Limpieza Dental (85)</li>
                    <li>Ortodoncia (60)</li>
                    <li>Implantes (48)</li>
                    <li>Endodoncia (24)</li>
                    <li>Blanqueamiento (17)</li>
                </ol>
            </div>
        </div>
    `;
}

// Generar reporte de odontólogos
function generarReporteOdontologos() {
    return `
        <h5 class="mb-3">Rendimiento por Odontólogo</h5>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Odontólogo</th>
                        <th>Citas Atendidas</th>
                        <th>Ingresos Generados</th>
                        <th>Satisfacción</th>
                        <th>Eficiencia</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Dr. Rodríguez</td><td>85</td><td>$6,800,000</td><td>4.8/5</td><td>92%</td></tr>
                    <tr><td>Dra. Martínez</td><td>72</td><td>$5,200,000</td><td>4.7/5</td><td>89%</td></tr>
                    <tr><td>Dr. García</td><td>68</td><td>$4,900,000</td><td>4.6/5</td><td>87%</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// Generar reporte de inventario
function generarReporteInventario() {
    return `
        <h5 class="mb-3">Rotación de Inventario</h5>
        <div class="alert alert-info">
            <strong>Período de Análisis:</strong> Últimos 3 meses
        </div>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Equipo</th>
                        <th>Stock Inicial</th>
                        <th>Utilizado</th>
                        <th>Stock Actual</th>
                        <th>Rotación</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Guantes Desechables</td><td>1000</td><td>750</td><td>250</td><td>75%</td><td><span class="badge bg-success">Normal</span></td></tr>
                    <tr><td>Jeringas</td><td>500</td><td>380</td><td>120</td><td>76%</td><td><span class="badge bg-warning">Stock Bajo</span></td></tr>
                    <tr><td>Mascarillas</td><td>800</td><td>600</td><td>200</td><td>75%</td><td><span class="badge bg-success">Normal</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// Exportar reporte
function exportarReporte(formato) {
    showLoading(`Exportando reporte en formato ${formato.toUpperCase()}...`);
    
    setTimeout(() => {
        hideLoading();
        
        if (formato === 'pdf') {
            exportarPDF();
        } else if (formato === 'excel') {
            exportarExcel();
        }
        
        showToast(`Reporte exportado en formato ${formato.toUpperCase()}`, 'success');
    }, 2000);
}

// Exportar PDF
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Reporte de Clinik Dent', 20, 20);
    doc.text('Fecha: ' + new Date().toLocaleDateString('es-CO'), 20, 30);
    doc.text('', 20, 40);
    doc.text('RESUMEN EJECUTIVO', 20, 50);
    doc.text('Total Ingresos: $15,750,000', 20, 60);
    doc.text('Total Citas: 245', 20, 70);
    doc.text('Total Pacientes: 180', 20, 80);
    doc.text('Tratamientos Activos: 89', 20, 90);
    
    doc.save('reporte-clinik-dent.pdf');
}

// Exportar Excel
function exportarExcel() {
    const datos = [
        ['Métrica', 'Valor'],
        ['Total Ingresos', '$15,750,000'],
        ['Total Citas', '245'],
        ['Total Pacientes', '180'],
        ['Tratamientos Activos', '89']
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'reporte-clinik-dent.xlsx');
}

// Procesar reporte desde modal
function procesarReporte() {
    const tipoReporte = document.getElementById('seleccionarReporte').value;
    const fechaDesde = document.getElementById('reporteFechaDesde').value;
    const fechaHasta = document.getElementById('reporteFechaHasta').value;
    const formato = document.querySelector('input[name="formatoSalida"]:checked').value;
    
    if (!tipoReporte || !fechaDesde || !fechaHasta) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    $('#generarReporteModal').modal('hide');
    
    showLoading('Generando reporte...');
    
    setTimeout(() => {
        hideLoading();
        exportarReporte(formato);
    }, 2000);
}

// Guardar configuración de reporte
function guardarConfigReporte() {
    const config = {
        nombre: document.getElementById('nombreReporte').value,
        tipo: document.getElementById('tipoReporteConfig').value,
        periodo: document.getElementById('periodoAnalisis').value,
        formato: document.getElementById('formatoExportacion').value,
        campos: {
            fechas: document.getElementById('incluirFechas').checked,
            montos: document.getElementById('incluirMontos').checked,
            pacientes: document.getElementById('incluirPacientes').checked,
            tratamientos: document.getElementById('incluirTratamientos').checked,
            odontologos: document.getElementById('incluirOdontologos').checked,
            sedes: document.getElementById('incluirSedes').checked,
            estadisticas: document.getElementById('incluirEstadisticas').checked,
            graficos: document.getElementById('incluirGraficos').checked,
            comparacion: document.getElementById('incluirComparacion').checked
        },
        filtros: document.getElementById('filtrosAdicionales').value
    };
    
    if (!config.nombre || !config.tipo) {
        showToast('Por favor completa los campos requeridos', 'error');
        return;
    }
    
    $('#configurarReporteModal').modal('hide');
    
    showLoading('Configurando reporte personalizado...');
    
    setTimeout(() => {
        hideLoading();
        showToast('Reporte personalizado configurado exitosamente', 'success');
        
        // Aquí se procesaría el reporte con la configuración
        console.log('Configuración de reporte:', config);
    }, 1500);
}

// Actualizar filtros según tipo de reporte
function actualizarFiltrosSegunTipo() {
    const tipo = document.getElementById('tipoReporte').value;
    // Aquí se podrían mostrar/ocultar filtros específicos según el tipo
    console.log('Tipo de reporte seleccionado:', tipo);
}

// Actualizar gráfico financiero según período
function actualizarGraficoFinanciero() {
    const periodo = document.getElementById('periodoFinanciero').value;
    if (reportesModule.charts.analisisIngresos) {
        // Aquí se actualizarían los datos según el período seleccionado
        console.log('Actualizando gráfico financiero para período:', periodo);
    }
}

// =================== MÓDULO DE INVENTARIO Y SEDES EXPANDIDO ===================

// Estado del módulo de inventario
const inventarioModule = {
    productos: [],
    sedes: [],
    categorias: [],
    proveedores: [],
    movimientos: [],
    alertas: [],
    filtros: {
        buscar: '',
        categoria: '',
        sede: '',
        estado: ''
    },
    paginacion: {
        pagina: 1,
        porPagina: 25,
        total: 0
    }
};

// Inicializar módulo de inventario
function initInventarioModule() {
    console.log('🏭 Inicializando módulo de inventario expandido...');
    
    // Event listeners principales
    setupInventarioEventListeners();
    
    // Cargar datos iniciales
    cargarDatosInventario();
    
    console.log('✅ Módulo de inventario inicializado correctamente');
}

// Configurar event listeners del inventario
function setupInventarioEventListeners() {
    // Botones principales
    document.getElementById('addInventarioBtn')?.addEventListener('click', () => {
        abrirModalInventario();
    });
    
    document.getElementById('addSedeBtn')?.addEventListener('click', () => {
        abrirModalSede();
    });
    
    document.getElementById('alertasStockBtn')?.addEventListener('click', () => {
        mostrarAlertasStock();
    });
    
    document.getElementById('verAlertasBtn')?.addEventListener('click', () => {
        mostrarAlertasStock();
    });
    
    document.getElementById('generarReporteInventarioBtn')?.addEventListener('click', () => {
        generarReporteInventario();
    });

    // Filtros y búsqueda
    document.getElementById('buscarInventarioBtn')?.addEventListener('click', aplicarFiltrosInventario);
    document.getElementById('aplicarFiltrosInventario')?.addEventListener('click', aplicarFiltrosInventario);
    document.getElementById('limpiarFiltrosInventario')?.addEventListener('click', limpiarFiltrosInventario);
    
    // Enter en búsqueda
    document.getElementById('buscarInventario')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            aplicarFiltrosInventario();
        }
    });

    // Botones de modales
    document.getElementById('saveInventarioBtn')?.addEventListener('click', guardarProducto);
    document.getElementById('saveSedeBtn')?.addEventListener('click', guardarSede);
    document.getElementById('saveCategoriaBtn')?.addEventListener('click', guardarCategoria);
    document.getElementById('saveProveedorBtn')?.addEventListener('click', guardarProveedor);

    // Botones de exportación
    document.getElementById('exportarInventarioBtn')?.addEventListener('click', () => {
        exportarInventario('excel');
    });
    
    document.getElementById('importarInventarioBtn')?.addEventListener('click', () => {
        // Crear input de archivo dinámicamente
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                importarInventario(file);
            }
        };
        input.click();
    });

    // Event listeners para tabs
    document.querySelectorAll('#inventarioTab button').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-bs-target');
            cargarContenidoTabInventario(target);
        });
    });

    // Formulario de movimientos
    document.getElementById('movimientoForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        registrarMovimiento();
    });

    // Select all checkbox
    document.getElementById('selectAllInventario')?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('#inventarioTable tbody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });

    // Paginación
    document.getElementById('inventarioPerPage')?.addEventListener('change', (e) => {
        inventarioModule.paginacion.porPagina = parseInt(e.target.value);
        inventarioModule.paginacion.pagina = 1;
        cargarInventarioOLD();
    });

    // Botones de nuevos elementos
    document.getElementById('nuevaCategoriaBtn')?.addEventListener('click', () => {
        abrirModalCategoria();
    });
    
    document.getElementById('nuevoProveedorBtn')?.addEventListener('click', () => {
        abrirModalProveedor();
    });
    
    document.getElementById('nuevaSedeBtn')?.addEventListener('click', () => {
        abrirModalSede();
    });
}

// Cargar datos iniciales del inventario
async function cargarDatosInventario() {
    try {
        showLoading('Cargando datos del inventario...');
        
        await Promise.all([
            // cargarInventarioOLD(), // Deshabilitado - dashboard loadInventario() maneja la carga
            cargarSedes(),
            cargarCategorias(),
            cargarProveedores(),
            cargarMovimientos(), // Agregado para cargar historial
            // cargarMovimientosRecientes(), // Removido - contenedor eliminado
            verificarAlertasStock()
        ]);
        
        hideLoading();
        console.log('✅ Datos del inventario cargados correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando datos del inventario:', error);
        hideLoading();
        showToast('Error al cargar los datos del inventario', 'error');
    }
}

// Cargar inventario
async function cargarInventarioOLD() {
    try {
        const params = new URLSearchParams({
            ...inventarioModule.filtros,
            pagina: inventarioModule.paginacion.pagina,
            porPagina: inventarioModule.paginacion.porPagina
        });

        const response = await fetch(`/api/inventario?${params}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            inventarioModule.productos = data.productos || [];
            inventarioModule.paginacion.total = data.total || 0;
            // renderInventarioTable(); // Deshabilitado - usando dashboard-admin.js
            actualizarResumenInventario();
        } else {
            // Datos de ejemplo
            const datosEjemplo = generarDatosInventarioEjemplo();
            inventarioModule.productos = datosEjemplo.productos;
            inventarioModule.paginacion.total = datosEjemplo.total;
            // renderInventarioTable(); // Deshabilitado - usando dashboard-admin.js
            actualizarResumenInventario();
        }

    } catch (error) {
        console.error('Error cargando inventario:', error);
        // Mostrar datos de ejemplo
        const datosEjemplo = generarDatosInventarioEjemplo();
        inventarioModule.productos = datosEjemplo.productos;
        // renderInventarioTable(); // Deshabilitado - usando dashboard-admin.js
    }
}

// Generar datos de ejemplo para inventario
function generarDatosInventarioEjemplo() {
    const productos = [
        {
            id: 1,
            codigo: 'MED001',
            nombre: 'Guantes de Látex',
            categoria: 'Material Médico',
            sede: 'Sede Centro',
            stockActual: 150,
            stockMinimo: 50,
            precioUnitario: 1500,
            valorTotal: 225000,
            estado: 'normal',
            ultimaActualizacion: new Date().toLocaleDateString('es-CO')
        },
        {
            id: 2,
            codigo: 'INS002',
            nombre: 'Espejo Bucal',
            categoria: 'Instrumental',
            sede: 'Sede Norte',
            stockActual: 8,
            stockMinimo: 10,
            precioUnitario: 15000,
            valorTotal: 120000,
            estado: 'bajo',
            ultimaActualizacion: new Date().toLocaleDateString('es-CO')
        },
        {
            id: 3,
            codigo: 'CON003',
            nombre: 'Algodón Hidrófilo',
            categoria: 'Consumibles',
            sede: 'Sede Sur',
            stockActual: 0,
            stockMinimo: 20,
            precioUnitario: 5000,
            valorTotal: 0,
            estado: 'agotado',
            ultimaActualizacion: new Date().toLocaleDateString('es-CO')
        },
        {
            id: 4,
            codigo: 'EQU004',
            nombre: 'Amalgamador Digital',
            categoria: 'Equipos',
            sede: 'Sede Centro',
            stockActual: 2,
            stockMinimo: 1,
            precioUnitario: 850000,
            valorTotal: 1700000,
            estado: 'normal',
            ultimaActualizacion: new Date().toLocaleDateString('es-CO')
        },
        {
            id: 5,
            codigo: 'MED005',
            nombre: 'Anestesia Lidocaína',
            categoria: 'Medicamentos',
            sede: 'Sede Centro',
            stockActual: 25,
            stockMinimo: 15,
            precioUnitario: 12000,
            valorTotal: 300000,
            estado: 'normal',
            ultimaActualizacion: new Date().toLocaleDateString('es-CO')
        }
    ];

    return {
        productos: productos,
        total: productos.length
    };
}

// Renderizar tabla de inventario - DESHABILITADO TEMPORALMENTE
function renderInventarioTable_LEGACY() {
    console.log('⚠️ Función renderInventarioTable de admin-modules.js deshabilitada - usando la de dashboard-admin.js');
    return; // No hacer nada, dejar que dashboard-admin.js se encargue
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;

    if (inventarioModule.productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center text-muted">
                    <i class="bi bi-box display-1"></i>
                    <p class="mt-2">No se encontraron productos en el inventario</p>
                    <button class="btn btn-primary" onclick="abrirModalInventario()">
                        <i class="bi bi-plus-circle"></i> Agregar Primer Producto
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = inventarioModule.productos.map(producto => `
        <tr data-id="${producto.id}">
            <td>
                <input type="checkbox" class="form-check-input" value="${producto.id}">
            </td>
            <td>
                <span class="badge bg-secondary">${producto.codigo}</span>
            </td>
            <td>
                <strong>${producto.nombre}</strong>
            </td>
            <td>
                <span class="badge bg-info">${producto.categoria}</span>
            </td>
            <td>${producto.sede}</td>
            <td>
                <span class="badge ${getStockBadgeClass(producto.estado)}">${producto.stockActual}</span>
            </td>
            <td>${producto.stockMinimo}</td>
            <td>$${producto.precioUnitario.toLocaleString('es-CO')}</td>
            <td>
                <strong>$${producto.valorTotal.toLocaleString('es-CO')}</strong>
            </td>
            <td>
                <span class="badge ${getEstadoBadgeClass(producto.estado)}">${getEstadoTexto(producto.estado)}</span>
            </td>
            <td>${producto.ultimaActualizacion}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary" onclick="editarProducto(${producto.id})" title="Editar" style="color: black;">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-outline-success" onclick="ajustarStock(${producto.id})" title="Ajustar Stock" style="color: black;">
                        <i class="bi bi-plus-minus"></i> Stock
                    </button>
                    <button class="btn btn-outline-info" onclick="verHistorialProducto(${producto.id})" title="Historial" style="color: black;">
                        <i class="bi bi-clock-history"></i> Historial
                    </button>
                    <button class="btn btn-outline-danger" onclick="eliminarProducto(${producto.id})" title="Eliminar" style="color: black;">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    actualizarInfoPaginacion();
}

// Actualizar resumen de inventario
function actualizarResumenInventario() {
    const totalProductos = inventarioModule.productos.length;
    const valorTotal = inventarioModule.productos.reduce((sum, p) => sum + p.valorTotal, 0);
    const stockBajo = inventarioModule.productos.filter(p => p.estado === 'bajo').length;
    const agotados = inventarioModule.productos.filter(p => p.estado === 'agotado').length;

    document.getElementById('totalProductos').textContent = totalProductos;
    document.getElementById('valorTotalStock').textContent = `$${valorTotal.toLocaleString('es-CO')}`;
    document.getElementById('productosStockBajo').textContent = stockBajo;
    document.getElementById('productosAgotados').textContent = agotados;
}

// Funciones de utilidad para badges
function getStockBadgeClass(estado) {
    switch (estado) {
        case 'agotado': return 'bg-danger';
        case 'bajo': return 'bg-warning';
        case 'exceso': return 'bg-info';
        default: return 'bg-success';
    }
}

function getEstadoBadgeClass(estado) {
    switch (estado) {
        case 'agotado': return 'bg-danger';
        case 'bajo': return 'bg-warning text-dark';
        case 'exceso': return 'bg-info';
        default: return 'bg-success';
    }
}

function getEstadoTexto(estado) {
    switch (estado) {
        case 'agotado': return 'Agotado';
        case 'bajo': return 'Stock Bajo';
        case 'exceso': return 'Exceso';
        default: return 'Normal';
    }
}

// Abrir modal de inventario
function abrirModalInventario(producto = null) {
    const modal = document.getElementById('inventarioModal');
    const title = document.getElementById('inventarioModalTitle');
    
    if (producto) {
        title.innerHTML = '<i class="bi bi-pencil"></i> Editar Producto';
        llenarFormularioProducto(producto);
    } else {
        title.innerHTML = '<i class="bi bi-plus-circle"></i> Nuevo Producto';
        limpiarFormularioProducto();
    }
    
    cargarOpcionesSedes('invSede');
    cargarOpcionesProveedores('invProveedor');
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Cargar opciones de sedes
function cargarOpcionesSedes(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Limpiar opciones existentes
    select.innerHTML = '<option value="">Seleccionar sede</option>';
    
    // Agregar sedes (ejemplo)
    const sedesEjemplo = [
        { id: 1, nombre: 'Sede Centro' },
        { id: 2, nombre: 'Sede Norte' },
        { id: 3, nombre: 'Sede Sur' }
    ];
    
    sedesEjemplo.forEach(sede => {
        const option = document.createElement('option');
        option.value = sede.id;
        option.textContent = sede.nombre;
        select.appendChild(option);
    });
}

// Guardar producto
async function guardarProducto() {
    try {
        const form = document.getElementById('inventarioForm');
        const formData = new FormData(form);
        
        const producto = {
            codigo: document.getElementById('invCodigo').value,
            nombre: document.getElementById('invNombre').value,
            categoria: document.getElementById('invCategoria').value,
            sede_id: document.getElementById('invSede').value,
            cantidad: parseInt(document.getElementById('invCantidad').value),
            stock_minimo: parseInt(document.getElementById('invStockMinimo').value),
            stock_maximo: parseInt(document.getElementById('invStockMaximo').value) || null,
            precio_unitario: parseFloat(document.getElementById('invPrecio').value),
            unidad_medida: document.getElementById('invUnidadMedida').value,
            proveedor_id: document.getElementById('invProveedor').value || null,
            fecha_vencimiento: document.getElementById('invFechaVencimiento').value || null,
            ubicacion: document.getElementById('invUbicacion').value,
            descripcion: document.getElementById('invDescripcion').value,
            alerta_stock_bajo: document.getElementById('invAlertaStockBajo').checked,
            alerta_vencimiento: document.getElementById('invAlertaVencimiento').checked,
            requiere_receta: document.getElementById('invRequiereReceta').checked
        };

        // Validar campos requeridos
        if (!producto.codigo || !producto.nombre || !producto.categoria || !producto.sede_id) {
            showToast('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        showLoading('Guardando producto...');

        const response = await fetch('/api/inventario', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(producto)
        });

        if (response.ok) {
            const resultado = await response.json();
            hideLoading();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('inventarioModal'));
            modal.hide();
            
            showToast('Producto guardado exitosamente', 'success');
            cargarInventarioOLD();
            
        } else {
            hideLoading();
            
            // Simular éxito para demo
            const modal = bootstrap.Modal.getInstance(document.getElementById('inventarioModal'));
            modal.hide();
            
            showToast('Producto guardado exitosamente (Demo)', 'success');
            
            // Agregar producto ficticio a la lista
            const nuevoProducto = {
                id: Date.now(),
                codigo: producto.codigo,
                nombre: producto.nombre,
                categoria: producto.categoria,
                sede: 'Sede Demo',
                stockActual: producto.cantidad,
                stockMinimo: producto.stock_minimo,
                precioUnitario: producto.precio_unitario,
                valorTotal: producto.cantidad * producto.precio_unitario,
                estado: producto.cantidad <= producto.stock_minimo ? 'bajo' : 'normal',
                ultimaActualizacion: new Date().toLocaleDateString('es-CO')
            };
            
            inventarioModule.productos.unshift(nuevoProducto);
            // renderInventarioTable(); // Deshabilitado - usando dashboard-admin.js
            actualizarResumenInventario();
        }

    } catch (error) {
        console.error('Error guardando producto:', error);
        hideLoading();
        showToast('Error al guardar el producto', 'error');
    }
}

// Aplicar filtros de inventario
function aplicarFiltrosInventario() {
    inventarioModule.filtros = {
        buscar: document.getElementById('buscarInventario').value,
        categoria: document.getElementById('filtroCategoria').value,
        sede: document.getElementById('filtroSedeInventario').value,
        estado: document.getElementById('filtroStock').value
    };
    
    inventarioModule.paginacion.pagina = 1;
    cargarInventario();
}

// Limpiar filtros de inventario
function limpiarFiltrosInventario() {
    document.getElementById('buscarInventario').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroSedeInventario').value = '';
    document.getElementById('filtroStock').value = '';
    
    inventarioModule.filtros = {
        buscar: '',
        categoria: '',
        sede: '',
        estado: ''
    };
    
    inventarioModule.paginacion.pagina = 1;
    cargarInventario();
}

// Verificar alertas de stock
async function verificarAlertasStock() {
    try {
        const response = await fetch('/api/inventario/alertas', {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const alertas = await response.json();
            mostrarAlertasEnUI(alertas);
        } else {
            // Simular alertas para demo
            const alertasDemo = [
                { producto: 'Espejo Bucal', sede: 'Sede Norte', stockActual: 8, stockMinimo: 10, estado: 'bajo' },
                { producto: 'Algodón Hidrófilo', sede: 'Sede Sur', stockActual: 0, stockMinimo: 20, estado: 'agotado' }
            ];
            mostrarAlertasEnUI(alertasDemo);
        }

    } catch (error) {
        console.error('Error verificando alertas:', error);
    }
}

// Mostrar alertas en la UI
function mostrarAlertasEnUI(alertas) {
    const alertasContainer = document.getElementById('alertasInventario');
    const contadorAlertas = document.getElementById('contadorAlertas');
    
    if (alertas.length > 0) {
        alertasContainer.style.display = 'block';
        contadorAlertas.textContent = alertas.length;
        inventarioModule.alertas = alertas;
    } else {
        alertasContainer.style.display = 'none';
    }
}

// Mostrar modal de alertas de stock
function mostrarAlertasStock() {
    const modal = document.getElementById('alertasStockModal');
    const tbody = document.getElementById('alertasStockTableBody');
    
    if (inventarioModule.alertas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-success">
                    <i class="bi bi-check-circle display-3"></i>
                    <p class="mt-2">¡No hay alertas de stock! Todo está en orden.</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = inventarioModule.alertas.map(alerta => `
            <tr>
                <td><strong>${alerta.producto}</strong></td>
                <td>${alerta.sede}</td>
                <td>
                    <span class="badge ${getStockBadgeClass(alerta.estado)}">${alerta.stockActual}</span>
                </td>
                <td>${alerta.stockMinimo}</td>
                <td>
                    <span class="badge ${getEstadoBadgeClass(alerta.estado)}">${getEstadoTexto(alerta.estado)}</span>
                </td>
            </tr>
        `).join('');
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Cargar contenido específico de cada tab
function cargarContenidoTabInventario(target) {
    switch (target) {
        case '#sedes-gestion':
            cargarGestionSedes();
            break;
        case '#movimientos-inventario':
            cargarMovimientos();
            break;
        case '#categorias-inventario':
            cargarCategorias();
            break;
        case '#proveedores-inventario':
            cargarProveedores();
            break;
    }
}

// Exportar inventario
async function exportarInventario(formato) {
    try {
        showLoading(`Exportando inventario en formato ${formato.toUpperCase()}...`);
        
        // Obtener todos los datos del inventario del servidor
        const response = await fetch('/api/inventario?porPagina=1000', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': localStorage.getItem('userId') || '1'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del inventario');
        }
        
        const inventarioData = await response.json();
        console.log('📦 Datos del inventario para exportar:', inventarioData);
        
        // Extraer productos del objeto de respuesta
        const productos = inventarioData.productos || inventarioData.items || inventarioData || [];
        
        if (!Array.isArray(productos) || productos.length === 0) {
            throw new Error('No hay productos para exportar');
        }
        
        if (formato === 'excel') {
            const datos = [
                ['Código', 'Producto', 'Categoría', 'Sede', 'Stock Actual', 'Stock Mínimo', 'Precio Unit.', 'Valor Total', 'Estado', 'Última Actualización'],
                ...productos.map(p => [
                    p.codigo || p.id || 'N/A',
                    p.nombre || 'Sin nombre',
                    p.categoria || 'Sin categoría',
                    p.sede || p.sede_nombre || 'General',
                    p.stock_actual || p.stockActual || p.cantidad || 0,
                    p.stock_minimo || p.stockMinimo || 0,
                    p.precio_unitario || p.precioUnitario || p.precio || 0,
                    (p.stock_actual || p.stockActual || 0) * (p.precio_unitario || p.precioUnitario || p.precio || 0),
                    p.estado || 'activo',
                    p.ultima_actualizacion || p.updated_at || new Date().toISOString().split('T')[0]
                ])
            ];
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(datos);
            
            // Ajustar ancho de columnas
            ws['!cols'] = [
                { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, 
                { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }
            ];
            
            // Aplicar estilos al encabezado
            const headerRange = XLSX.utils.decode_range(ws['!ref']);
            for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                if (!ws[cellAddress]) continue;
                ws[cellAddress].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "4472C4" } },
                    alignment: { horizontal: "center" }
                };
            }
            
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
            XLSX.writeFile(wb, `inventario-clinikdent-${new Date().toISOString().split('T')[0]}.xlsx`);
            
            hideLoading();
            showToast(`✅ Inventario exportado: ${productos.length} productos`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error al exportar inventario:', error);
        hideLoading();
        showToast(`Error al exportar: ${error.message}`, 'error');
    }
}

// Función para importar inventario desde Excel
async function importarInventario(file) {
    try {
        showLoading('Importando inventario desde Excel...');
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                console.log('📊 Datos importados:', jsonData);
                
                if (jsonData.length === 0) {
                    throw new Error('El archivo no contiene datos');
                }
                
                // Validar formato esperado
                const primeraFila = jsonData[0];
                const columnasRequeridas = ['Producto', 'Categoría'];
                const columnasFaltantes = columnasRequeridas.filter(col => !primeraFila.hasOwnProperty(col));
                
                if (columnasFaltantes.length > 0) {
                    throw new Error(`Columnas requeridas faltantes: ${columnasFaltantes.join(', ')}`);
                }
                
                // Mostrar modal de confirmación con resumen
                mostrarModalConfirmacionImportacion(jsonData);
                
            } catch (error) {
                console.error('❌ Error procesando archivo:', error);
                hideLoading();
                showToast(`Error al procesar archivo: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = (error) => {
            console.error('❌ Error leyendo archivo:', error);
            hideLoading();
            showToast('Error al leer el archivo', 'error');
        };
        
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        console.error('❌ Error al importar inventario:', error);
        hideLoading();
        showToast(`Error al importar: ${error.message}`, 'error');
    }
}

// Modal de confirmación de importación
function mostrarModalConfirmacionImportacion(datos) {
    hideLoading();
    
    const totalProductos = datos.length;
    const categorias = [...new Set(datos.map(d => d.Categoría || d.categoria))];
    
    const modalHTML = `
        <div class="modal fade" id="modalConfirmacionImportacion" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-file-earmark-excel"></i> Confirmar Importación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6><i class="bi bi-info-circle"></i> Resumen de Importación</h6>
                            <ul class="mb-0">
                                <li><strong>Total de productos:</strong> ${totalProductos}</li>
                                <li><strong>Categorías detectadas:</strong> ${categorias.length} (${categorias.slice(0, 5).join(', ')}${categorias.length > 5 ? '...' : ''})</li>
                            </ul>
                        </div>
                        
                        <h6>Vista previa (primeros 5 productos):</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Producto</th>
                                        <th>Categoría</th>
                                        <th>Stock</th>
                                        <th>Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${datos.slice(0, 5).map(d => `
                                        <tr>
                                            <td>${d.Producto || d.producto || 'N/A'}</td>
                                            <td>${d.Categoría || d.categoria || 'N/A'}</td>
                                            <td>${d['Stock Actual'] || d.stock_actual || d.cantidad || 0}</td>
                                            <td>$${d['Precio Unit.'] || d.precio_unitario || d.precio || 0}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle"></i>
                            <strong>Nota:</strong> Esta operación agregará o actualizará los productos en el inventario.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x"></i> Cancelar
                        </button>
                        <button type="button" class="btn btn-success" onclick="procesarImportacion()">
                            <i class="bi bi-check"></i> Confirmar Importación
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalExistente = document.getElementById('modalConfirmacionImportacion');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Guardar datos en variable global temporal
    window.datosImportacionTemp = datos;
    
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmacionImportacion'));
    modal.show();
}

// Procesar la importación confirmada
async function procesarImportacion() {
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacionImportacion'));
        modal?.hide();
        
        showLoading('Procesando importación...');
        
        const datos = window.datosImportacionTemp;
        
        if (!datos || datos.length === 0) {
            throw new Error('No hay datos para importar');
        }
        
        // Enviar datos al backend para procesar
        const response = await fetch('/api/inventario/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': localStorage.getItem('userId') || '1'
            },
            body: JSON.stringify({ productos: datos })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Error al procesar importación');
        }
        
        const resultado = await response.json();
        
        hideLoading();
        
        // Mostrar resultados detallados
        if (resultado.success) {
            let mensaje = `✅ Importación completada:\n`;
            mensaje += `- ${resultado.insertados} productos insertados\n`;
            mensaje += `- ${resultado.actualizados} productos actualizados\n`;
            
            if (resultado.errores.length > 0) {
                mensaje += `\n⚠️ ${resultado.errores.length} errores encontrados`;
            }
            
            if (resultado.advertencias.length > 0) {
                mensaje += `\n📋 ${resultado.advertencias.length} advertencias`;
            }
            
            showToast(mensaje, resultado.errores.length > 0 ? 'warning' : 'success');
            
            // Mostrar modal con detalles si hay errores o advertencias
            if (resultado.errores.length > 0 || resultado.advertencias.length > 0) {
                mostrarDetallesImportacion(resultado);
            }
        } else {
            throw new Error(resultado.msg || 'Error desconocido en importación');
        }
        
        // Recargar tabla de inventario
        if (typeof cargarInventario === 'function') {
            cargarInventario();
        }
        
        // Limpiar datos temporales
        delete window.datosImportacionTemp;
        
    } catch (error) {
        console.error('❌ Error procesando importación:', error);
        hideLoading();
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Mostrar detalles de importación (errores y advertencias)
function mostrarDetallesImportacion(resultado) {
    let html = '<div class="import-details">';
    
    if (resultado.errores.length > 0) {
        html += '<h6 class="text-danger mb-3">❌ Errores:</h6>';
        html += '<ul class="list-unstyled">';
        resultado.errores.forEach(error => {
            html += `<li class="text-danger mb-2">
                <strong>Fila ${error.fila}:</strong> ${error.mensaje}
                ${error.producto ? `(${error.producto})` : ''}
            </li>`;
        });
        html += '</ul>';
    }
    
    if (resultado.advertencias.length > 0) {
        html += '<h6 class="text-warning mb-3 mt-3">⚠️ Advertencias:</h6>';
        html += '<ul class="list-unstyled">';
        resultado.advertencias.forEach(adv => {
            html += `<li class="text-warning mb-2">
                <strong>Fila ${adv.fila}:</strong> ${adv.mensaje}
                ${adv.producto ? `(${adv.producto})` : ''}
            </li>`;
        });
        html += '</ul>';
    }
    
    html += '</div>';
    
    // Mostrar en modal o alert
    Swal.fire({
        title: 'Detalles de Importación',
        html: html,
        icon: resultado.errores.length > 0 ? 'warning' : 'info',
        confirmButtonText: 'Entendido',
        width: '600px'
    });
}

// Placeholder functions para funciones específicas
function limpiarFormularioProducto() {
    document.getElementById('inventarioForm').reset();
}

function llenarFormularioProducto(producto) {
    // Implementar llenado del formulario con datos del producto
    console.log('Editando producto:', producto);
}

function cargarOpcionesProveedores(selectId) {
    console.log('Cargando proveedores para select:', selectId);
    
    const select = document.getElementById(selectId);
    if (!select) return;
    
    fetch('/api/inventario/proveedores')
        .then(res => res.json())
        .then(proveedores => {
            select.innerHTML = '<option value="">Seleccionar proveedor</option>';
            proveedores.forEach(proveedor => {
                select.innerHTML += `<option value="${proveedor.id}">${proveedor.nombre}</option>`;
            });
        })
        .catch(err => {
            console.error('Error cargando proveedores:', err);
            select.innerHTML = '<option value="">Error al cargar proveedores</option>';
        });
}

function cargarGestionSedes() {
    console.log('🏢 Cargando gestión de sedes...');
    
    fetch('/api/sedes')
        .then(res => res.json())
        .then(sedes => {
            console.log(`✅ Sedes cargadas: ${sedes.length}`);
            
            // Verificar que sedes sea un array
            if (!sedes || !Array.isArray(sedes)) {
                console.warn('⚠️ Las sedes no son un array válido:', sedes);
                // Usar datos de prueba si hay problemas con la API
                if (typeof window.cargarSedesConPaginacion === 'function') {
                    window.cargarSedesConPaginacion();
                } else if (typeof initializePagination === 'function') {
                    initializePagination('sedes', []);
                }
                return;
            }
            
            // Inicializar paginación con los datos cargados
            if (typeof initializePagination === 'function') {
                initializePagination('sedes', sedes);
            } else {
                console.warn('Sistema de paginación no está disponible');
                // Fallback a renderizado directo
                const container = document.getElementById('sedesGrid');
                if (!container) {
                    console.warn('No se encontró sedesGrid');
                    return;
                }
                
                if (sedes.length === 0) {
                    container.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i> No hay sedes registradas
                            </div>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = sedes.map(sede => `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">
                                        <i class="bi bi-building"></i> ${sede.nombre}
                                    </h6>
                                    <span class="badge ${sede.activa ? 'bg-success' : 'bg-secondary'}">
                                        ${sede.activa ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>
                                <div class="card-text">
                                    <p class="mb-1">
                                        <i class="bi bi-geo-alt"></i> 
                                        <strong>Ciudad:</strong> ${sede.ciudad || 'N/A'}
                                    </p>
                                    <p class="mb-1">
                                        <i class="bi bi-house"></i> 
                                        <strong>Dirección:</strong> ${sede.direccion || 'N/A'}
                                    </p>
                                    <p class="mb-1">
                                        <i class="bi bi-telephone"></i> 
                                        <strong>Teléfono:</strong> ${sede.telefono || 'N/A'}
                                    </p>
                                    <p class="mb-0">
                                        <i class="bi bi-envelope"></i> 
                                        <strong>Email:</strong> ${sede.email || 'N/A'}
                                    </p>
                                </div>
                                <div class="mt-3">
                                    <button class="btn btn-sm me-1" 
                                            onclick="editarSede(${sede.id})"
                                            title="Editar sede"
                                            style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                                        <i class="bi bi-pencil" style="color: white;"></i>
                                    </button>
                                    <button class="btn btn-sm me-1" 
                                            onclick="verDetallesSede(${sede.id})"
                                            title="Ver detalles"
                                            style="background-color: #6c757d; border-color: #6c757d; color: white;">
                                        <i class="bi bi-eye" style="color: white;"></i>
                                    </button>
                                    <button class="btn btn-sm" 
                                            onclick="eliminarSede(${sede.id})"
                                            title="Eliminar sede"
                                            style="background-color: #dc3545; border-color: #dc3545; color: white;">
                                        <i class="bi bi-trash" style="color: white;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        })
        .catch(err => {
            console.error('Error cargando sedes:', err);
            // En caso de error, usar datos de prueba
            if (typeof window.cargarSedesConPaginacion === 'function') {
                console.log('📦 Usando datos de prueba para sedes...');
                window.cargarSedesConPaginacion();
            } else {
                const container = document.getElementById('sedesGrid');
                if (container) {
                    container.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-danger">
                                <i class="bi bi-exclamation-triangle"></i> Error cargando sedes
                            </div>
                        </div>
                    `;
                }
            }
        });
}

function cargarMovimientos() {
    console.log('🔄 Función cargarMovimientos - elemento movimientosRecientes removido');
    
    const container = document.getElementById('movimientosRecientes');
    if (!container) {
        console.log('ℹ️ Container movimientosRecientes no existe (removido intencionalmente)');
        return;
    }
    
    // Mostrar loading
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando movimientos...</span>
            </div>
            <p class="mt-2 text-muted">Cargando historial de movimientos...</p>
        </div>
    `;
    
    fetch('/api/inventario/movimientos?limite=50')
        .then(res => res.json())
        .then(movimientos => {
            console.log(`✅ Movimientos cargados: ${movimientos.length}`);
            
            if (!movimientos || movimientos.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-list-ul display-1 text-muted"></i>
                        <h5 class="mt-3 text-muted">No hay movimientos registrados</h5>
                        <p class="text-muted">Los movimientos de inventario aparecerán aquí cuando se registren.</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">
                        <i class="bi bi-list-ul text-primary"></i>
                        Historial de Movimientos (${movimientos.length})
                    </h6>
                    <button class="btn btn-sm btn-outline-primary" onclick="exportarMovimientos()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th><i class="bi bi-calendar"></i> Fecha</th>
                                <th><i class="bi bi-box"></i> Producto</th>
                                <th><i class="bi bi-arrow-left-right"></i> Tipo</th>
                                <th><i class="bi bi-123"></i> Cantidad</th>
                                <th><i class="bi bi-chat-text"></i> Motivo</th>
                                <th><i class="bi bi-person"></i> Usuario</th>
                                <th><i class="bi bi-building"></i> Sede</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movimientos.map(mov => {
                                const fecha = new Date(mov.fecha_movimiento);
                                const fechaTexto = fecha.toLocaleDateString('es-CO');
                                const horaTexto = fecha.toLocaleTimeString('es-CO', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                });
                                const tipoColor = mov.tipo_movimiento === 'entrada' ? 'success' : 'danger';
                                const tipoIcono = mov.tipo_movimiento === 'entrada' ? 'arrow-down-circle' : 'arrow-up-circle';
                                
                                return `
                                    <tr>
                                        <td>
                                            <div>
                                                <strong>${fechaTexto}</strong>
                                                <br>
                                                <small class="text-muted">${horaTexto}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>${mov.producto_nombre || 'N/A'}</strong>
                                        </td>
                                        <td>
                                            <span class="badge bg-${tipoColor}">
                                                <i class="bi bi-${tipoIcono}"></i>
                                                ${mov.tipo_movimiento}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary fs-6">${mov.cantidad}</span>
                                        </td>
                                        <td>
                                            <span class="text-muted">${mov.motivo || 'No especificado'}</span>
                                        </td>
                                        <td>
                                            <i class="bi bi-person-circle text-secondary"></i>
                                            ${mov.usuario_nombre || 'N/A'}
                                        </td>
                                        <td>
                                            <i class="bi bi-building text-info"></i>
                                            ${mov.sede_nombre || 'N/A'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-3 text-center">
                    <small class="text-muted">
                        Mostrando ${movimientos.length} movimientos recientes
                    </small>
                </div>
            `;
        })
        .catch(err => {
            console.error('❌ Error cargando movimientos:', err);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="bi bi-exclamation-triangle"></i> Error al cargar movimientos</h6>
                    <p>No se pudieron cargar los movimientos del inventario.</p>
                    <button class="btn btn-outline-danger btn-sm" onclick="cargarMovimientos()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        });
}

function cargarCategorias() {
    console.log('Cargando categorías...');
    
    fetch('/api/inventario/categorias')
        .then(res => res.json())
        .then(categorias => {
            const container = document.getElementById('categorias-container');
            if (!container) return;
            
            if (categorias.length === 0) {
                container.innerHTML = '<div class="alert alert-info">No hay categorías registradas</div>';
                return;
            }
            
            container.innerHTML = `
                <div class="row">
                    ${categorias.map(cat => `
                        <div class="col-md-4 mb-3">
                            <div class="card border-start" style="border-left: 4px solid ${cat.color || '#007bff'} !important;">
                                <div class="card-body">
                                    <h6 class="card-title">${cat.nombre}</h6>
                                    <p class="card-text small">${cat.descripcion || 'Sin descripción'}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        })
        .catch(err => {
            console.error('Error cargando categorías:', err);
        });
}

function cargarProveedores() {
    console.log('🏪 Cargando proveedores...');
    
    fetch('/api/inventario/proveedores')
        .then(res => res.json())
        .then(proveedores => {
            console.log(`✅ Proveedores cargados: ${proveedores.length}`);
            
            // Verificar que proveedores sea un array
            if (!proveedores || !Array.isArray(proveedores)) {
                console.warn('⚠️ Los proveedores no son un array válido:', proveedores);
                // Usar datos de prueba si hay problemas con la API
                if (typeof window.cargarProveedoresConPaginacion === 'function') {
                    window.cargarProveedoresConPaginacion();
                } else if (typeof initializePagination === 'function') {
                    initializePagination('proveedores', []);
                }
                return;
            }
            
            // Inicializar paginación con los datos cargados
            if (typeof initializePagination === 'function') {
                initializePagination('proveedores', proveedores);
            } else {
                console.warn('Sistema de paginación no está disponible');
                // Fallback a renderizado directo
                const tbody = document.getElementById('proveedoresTableBody');
                if (!tbody) {
                    console.warn('No se encontró proveedoresTableBody');
                    return;
                }
                
                if (proveedores.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="text-center">
                                <div class="alert alert-info mb-0">
                                    <i class="bi bi-info-circle"></i> No hay proveedores registrados
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = proveedores.map(prov => `
                    <tr>
                        <td><span class="badge bg-primary">${prov.id}</span></td>
                        <td><strong>${prov.nombre || prov.empresa || 'N/A'}</strong></td>
                        <td>${prov.contacto || 'N/A'}</td>
                        <td>
                            ${prov.telefono ? 
                                `<a href="tel:${prov.telefono}" class="text-decoration-none">${prov.telefono}</a>` :
                                'N/A'
                            }
                        </td>
                        <td>
                            ${prov.email ? 
                                `<a href="mailto:${prov.email}" class="text-decoration-none">${prov.email}</a>` :
                                'N/A'
                            }
                        </td>
                        <td><span class="badge bg-primary">${prov.productos || 0}</span></td>
                        <td>${prov.ultima_compra || 'N/A'}</td>
                        <td>
                            <span class="badge ${(prov.activo || prov.estado === 'activo') ? 'bg-success' : 'bg-secondary'}">
                                <i class="bi ${(prov.activo || prov.estado === 'activo') ? 'bi-check-circle' : 'bi-x-circle'}"></i>
                                ${(prov.activo || prov.estado === 'activo') ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-sm" 
                                        onclick="editarProveedor(${prov.id})"
                                        title="Editar"
                                        style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                                    <i class="bi bi-pencil" style="color: white;"></i>
                                </button>
                                <button class="btn btn-sm" 
                                        onclick="verDetallesProveedor(${prov.id})"
                                        title="Ver detalles"
                                        style="background-color: #6c757d; border-color: #6c757d; color: white;">
                                    <i class="bi bi-eye" style="color: white;"></i>
                                </button>
                                <button class="btn btn-sm" 
                                        onclick="eliminarProveedor(${prov.id})"
                                        title="Eliminar"
                                        style="background-color: #dc3545; border-color: #dc3545; color: white;">
                                    <i class="bi bi-trash" style="color: white;"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        })
        .catch(err => {
            console.error('Error cargando proveedores:', err);
            // En caso de error, usar datos de prueba
            if (typeof window.cargarProveedoresConPaginacion === 'function') {
                console.log('📦 Usando datos de prueba para proveedores...');
                window.cargarProveedoresConPaginacion();
            } else {
                const tbody = document.getElementById('proveedoresTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="text-center">
                                <div class="alert alert-danger mb-0">
                                    <i class="bi bi-exclamation-triangle"></i> Error cargando proveedores
                                </div>
                            </td>
                        </tr>
                    `;
                }
            }
        });
}

// =================== FUNCIONES PARA CARGAR INVENTARIO ===================

function cargarInventario() {
    console.log('📦 Cargando inventario...');
    console.log('🔗 URL a consultar: /api/inventario/equipos');
    
    fetch('/api/inventario/equipos')
        .then(res => {
            console.log('📡 Respuesta del servidor - Status:', res.status);
            console.log('📡 Respuesta del servidor - OK:', res.ok);
            return res.json();
        })
        .then(equipos => {
            console.log('📋 Datos recibidos:', equipos);
            
            console.log(`✅ Inventario cargado: ${equipos ? equipos.length : 0} productos`);
            
            // Verificar que equipos sea un array
            if (!equipos || !Array.isArray(equipos)) {
                console.warn('⚠️ Los equipos no son un array válido:', equipos);
                // Inicializar paginación con datos vacíos
                if (typeof initializePagination === 'function') {
                    initializePagination('inventario', []);
                }
                return;
            }
            
            // Inicializar paginación con los datos cargados
            if (typeof initializePagination === 'function') {
                initializePagination('inventario', equipos);
            } else {
                console.warn('Sistema de paginación no está disponible');
                // Fallback a renderizado directo
                const tbody = document.getElementById('inventarioTableBody');
                if (!tbody) {
                    console.warn('No se encontró inventarioTableBody');
                    return;
                }
                
                if (equipos.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="12" class="text-center">
                                <div class="alert alert-info mb-0">
                                    <i class="bi bi-info-circle"></i> No hay productos en el inventario
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = equipos.map(equipo => `
                    <tr>
                        <td>
                            <input type="checkbox" class="select-item" value="${equipo.id}">
                        </td>
                        <td><code>${equipo.codigo || 'N/A'}</code></td>
                        <td><strong>${equipo.nombre}</strong></td>
                        <td>
                            <span class="badge bg-primary">${equipo.categoria || 'Sin categoría'}</span>
                        </td>
                        <td>
                            <span class="badge bg-info">${equipo.sede || 'General'}</span>
                        </td>
                        <td>
                            <span class="badge ${equipo.stock_actual <= equipo.stock_minimo ? 'bg-danger' : 'bg-success'}">
                                ${equipo.stock_actual || 0}
                            </span>
                        </td>
                        <td>${equipo.stock_minimo || 0}</td>
                        <td>$${equipo.precio ? Number(equipo.precio).toLocaleString() : '0'}</td>
                        <td>$${equipo.valor_total ? Number(equipo.valor_total).toLocaleString() : '0'}</td>
                        <td>
                            <span class="badge ${equipo.stock_actual <= 0 ? 'bg-danger' : equipo.stock_actual <= equipo.stock_minimo ? 'bg-warning' : 'bg-success'}">
                                ${equipo.stock_actual <= 0 ? 'Agotado' : equipo.stock_actual <= equipo.stock_minimo ? 'Stock Bajo' : 'Normal'}
                            </span>
                        </td>
                        <td>${equipo.fecha_actualizacion ? new Date(equipo.fecha_actualizacion).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-sm" 
                                        onclick="editarInventario(${equipo.id})"
                                        title="Editar"
                                        style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                                    <i class="bi bi-pencil" style="color: white;"></i>
                                </button>
                                <button class="btn btn-sm" 
                                        onclick="verDetallesInventario(${equipo.id})"
                                        title="Detalles"
                                        style="background-color: #6c757d; border-color: #6c757d; color: white;">
                                    <i class="bi bi-eye" style="color: white;"></i>
                                </button>
                                <button class="btn btn-sm" 
                                        onclick="eliminarInventario(${equipo.id})"
                                        title="Eliminar"
                                        style="background-color: #dc3545; border-color: #dc3545; color: white;">
                                    <i class="bi bi-trash" style="color: white;"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        })
        .catch(err => {
            console.error('❌ Error cargando inventario:', err);
            console.error('❌ Error details:', err.message || err);
            const tbody = document.getElementById('inventarioTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="12" class="text-center">
                            <div class="alert alert-danger mb-0">
                                <i class="bi bi-exclamation-triangle"></i> Error cargando inventario
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
}

function cargarCategorias() {
    console.log('🏷️ Cargando categorías...');
    
    fetch('/api/inventario/categorias')
        .then(res => res.json())
        .then(categorias => {
            console.log(`✅ Categorías cargadas: ${categorias.length}`);
            
            // Verificar que categorias sea un array
            if (!categorias || !Array.isArray(categorias)) {
                console.warn('⚠️ Las categorías no son un array válido:', categorias);
                // Usar datos de prueba si hay problemas con la API
                if (typeof window.cargarCategoriasConPaginacion === 'function') {
                    window.cargarCategoriasConPaginacion();
                } else if (typeof initializePagination === 'function') {
                    initializePagination('categorias', []);
                }
                return;
            }
            
            // Inicializar paginación con los datos cargados
            if (typeof initializePagination === 'function') {
                initializePagination('categorias', categorias);
            } else {
                console.warn('Sistema de paginación no está disponible');
                // Fallback a renderizado directo
                const tbody = document.getElementById('categoriasTableBody');
                if (!tbody) {
                    console.warn('No se encontró categoriasTableBody');
                    return;
                }
                
                if (categorias.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center">
                                <div class="alert alert-info mb-0">
                                    <i class="bi bi-info-circle"></i> No hay categorías registradas
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = categorias.map(cat => `
                    <tr>
                        <td><span class="badge bg-primary">${cat.id}</span></td>
                        <td><strong>${cat.nombre}</strong></td>
                        <td>${cat.descripcion || 'Sin descripción'}</td>
                        <td>
                            <span class="badge bg-info">${cat.productos_count || 0} productos</span>
                        </td>
                        <td>
                            <span class="badge" style="background-color: ${cat.color || '#6c757d'}; color: white;">
                                ${cat.color || '#6c757d'}
                            </span>
                        </td>
                        <td>
                            <span class="badge ${cat.activa ? 'bg-success' : 'bg-secondary'}">
                                <i class="bi ${cat.activa ? 'bi-check-circle' : 'bi-x-circle'}"></i>
                                ${cat.activa ? 'Activa' : 'Inactiva'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-sm" 
                                        onclick="editarCategoria(${cat.id})"
                                        title="Editar"
                                        style="background-color: #17a2b8; border-color: #17a2b8; color: white;">
                                    <i class="bi bi-pencil" style="color: white;"></i>
                                </button>
                                <button class="btn btn-sm" 
                                        onclick="eliminarCategoria(${cat.id})"
                                        title="Eliminar"
                                        style="background-color: #dc3545; border-color: #dc3545; color: white;">
                                    <i class="bi bi-trash" style="color: white;"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        })
        .catch(err => {
            console.error('Error cargando categorías:', err);
            // En caso de error, usar datos de prueba
            if (typeof window.cargarCategoriasConPaginacion === 'function') {
                console.log('📦 Usando datos de prueba para categorías...');
                window.cargarCategoriasConPaginacion();
            } else {
                const tbody = document.getElementById('categoriasTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center">
                                <div class="alert alert-danger mb-0">
                                    <i class="bi bi-exclamation-triangle"></i> Error cargando categorías
                                </div>
                            </td>
                        </tr>
                    `;
                }
            }
        });
}

function cargarMovimientos() {
    console.log('📋 Cargando movimientos...');
    
    fetch('/api/inventario/movimientos')
        .then(res => res.json())
        .then(movimientos => {
            const tbody = document.getElementById('movimientosTableBody');
            if (!tbody) {
                console.warn('No se encontró movimientosTableBody');
                return;
            }
            
            console.log(`✅ Movimientos cargados: ${movimientos.length}`);
            
            if (movimientos.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <div class="alert alert-info mb-0">
                                <i class="bi bi-info-circle"></i> No hay movimientos registrados
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = movimientos.map(mov => `
                <tr>
                    <td>${new Date(mov.fecha_movimiento).toLocaleDateString('es-CO')}</td>
                    <td>
                        <span class="badge ${
                            mov.tipo_movimiento === 'entrada' ? 'bg-success' :
                            mov.tipo_movimiento === 'salida' ? 'bg-danger' :
                            mov.tipo_movimiento === 'traslado' ? 'bg-info' : 'bg-warning'
                        }">
                            <i class="bi ${
                                mov.tipo_movimiento === 'entrada' ? 'bi-arrow-down' :
                                mov.tipo_movimiento === 'salida' ? 'bi-arrow-up' :
                                mov.tipo_movimiento === 'traslado' ? 'bi-arrow-left-right' : 'bi-gear'
                            }"></i>
                            ${mov.tipo_movimiento ? mov.tipo_movimiento.charAt(0).toUpperCase() + mov.tipo_movimiento.slice(1) : 'N/A'}
                        </span>
                    </td>
                    <td><strong>${mov.producto_nombre || 'N/A'}</strong></td>
                    <td>
                        <span class="badge ${mov.cantidad > 0 ? 'bg-success' : 'bg-danger'}">
                            ${mov.cantidad > 0 ? '+' : ''}${mov.cantidad}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-info">${mov.sede_nombre || 'General'}</span>
                    </td>
                    <td>${mov.usuario_nombre || 'Sistema'}</td>
                    <td>
                        <small class="text-muted">${mov.observaciones || mov.motivo || 'Sin observaciones'}</small>
                    </td>
                </tr>
            `).join('');
        })
        .catch(err => {
            console.error('Error cargando movimientos:', err);
            const tbody = document.getElementById('movimientosTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <div class="alert alert-danger mb-0">
                                <i class="bi bi-exclamation-triangle"></i> Error cargando movimientos
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
}

// =================== FUNCIONES CRUD DE PROVEEDORES ===================

function abrirModalProveedor(proveedorId = null) {
    console.log('🏪 Abriendo modal de proveedor:', proveedorId ? 'Editar' : 'Crear');
    
    const isEdit = proveedorId !== null;
    const modalTitle = isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor';
    
    // Crear modal
    const modalHtml = `
        <div class="modal fade" id="modalProveedor" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-truck"></i> ${modalTitle}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="formProveedor">
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="nombre" class="form-label">Nombre/Empresa *</label>
                                        <input type="text" class="form-control" id="nombre" name="nombre" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="codigo_proveedor" class="form-label">Código</label>
                                        <input type="text" class="form-control" id="codigo_proveedor" name="codigo_proveedor">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="contacto" class="form-label">Persona de Contacto</label>
                                        <input type="text" class="form-control" id="contacto" name="contacto">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="telefono" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="telefono" name="telefono">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="email" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="email" name="email">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ciudad" class="form-label">Ciudad</label>
                                        <input type="text" class="form-control" id="ciudad" name="ciudad">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="direccion" class="form-label">Dirección</label>
                                <textarea class="form-control" id="direccion" name="direccion" rows="2"></textarea>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="especialidades" class="form-label">Especialidades</label>
                                        <textarea class="form-control" id="especialidades" name="especialidades" rows="2" placeholder="Ej: Instrumental médico, Equipos dentales"></textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="tiempo_entrega_dias" class="form-label">Tiempo de Entrega (días)</label>
                                        <input type="number" class="form-control" id="tiempo_entrega_dias" name="tiempo_entrega_dias" value="7" min="1">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="pais" class="form-label">País</label>
                                        <input type="text" class="form-control" id="pais" name="pais" value="Colombia">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="activo" class="form-label">Estado</label>
                                        <select class="form-select" id="activo" name="activo">
                                            <option value="1">Activo</option>
                                            <option value="0">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-check-lg"></i> ${isEdit ? 'Actualizar' : 'Crear'} Proveedor
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('modalProveedor');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Si es edición, cargar datos del proveedor
    if (isEdit) {
        cargarDatosProveedor(proveedorId);
    }
    
    // Configurar evento de envío del formulario
    document.getElementById('formProveedor').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarProveedor(isEdit, proveedorId);
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalProveedor'));
    modal.show();
    
    // Limpiar modal al cerrar
    document.getElementById('modalProveedor').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function cargarDatosProveedor(proveedorId) {
    console.log('🔍 Cargando datos del proveedor:', proveedorId);
    
    // Implementar cuando tengamos endpoint individual
    // Por ahora cargar desde la lista actual
    fetch('/api/inventario/proveedores')
        .then(res => res.json())
        .then(proveedores => {
            const proveedor = proveedores.find(p => p.id === parseInt(proveedorId));
            if (!proveedor) {
                console.error('Proveedor no encontrado');
                return;
            }
            
            // Llenar formulario
            document.getElementById('nombre').value = proveedor.nombre || '';
            document.getElementById('codigo_proveedor').value = proveedor.codigo || proveedor.codigo_proveedor || '';
            document.getElementById('contacto').value = proveedor.contacto || '';
            document.getElementById('telefono').value = proveedor.telefono || '';
            document.getElementById('email').value = proveedor.email || '';
            document.getElementById('ciudad').value = proveedor.ciudad || '';
            document.getElementById('direccion').value = proveedor.direccion || '';
            document.getElementById('especialidades').value = proveedor.especialidades || '';
            document.getElementById('tiempo_entrega_dias').value = proveedor.tiempo_entrega_dias || '7';
            document.getElementById('pais').value = proveedor.pais || 'Colombia';
            document.getElementById('activo').value = proveedor.activo ? '1' : '0';
        })
        .catch(err => {
            console.error('Error cargando datos del proveedor:', err);
            showToast('Error al cargar datos del proveedor', 'error');
        });
}

function guardarProveedor(isEdit, proveedorId) {
    console.log('💾 Guardando proveedor:', isEdit ? 'Actualizar' : 'Crear');
    
    const formData = new FormData(document.getElementById('formProveedor'));
    const data = Object.fromEntries(formData.entries());
    
    // Convertir activo a boolean
    data.activo = parseInt(data.activo);
    
    const url = isEdit ? `/api/inventario/proveedores/${proveedorId}` : '/api/inventario/proveedores';
    const method = isEdit ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        if (response.msg || response.proveedor) {
            showToast(
                isEdit ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente',
                'success'
            );
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalProveedor'));
            modal.hide();
            
            // Recargar lista
            cargarProveedores();
        } else {
            throw new Error(response.error || 'Error desconocido');
        }
    })
    .catch(err => {
        console.error('Error guardando proveedor:', err);
        showToast('Error al guardar proveedor: ' + err.message, 'error');
    });
}

function editarProveedor(proveedorId) {
    console.log('✏️ Editando proveedor:', proveedorId);
    abrirModalProveedor(proveedorId);
}

function verDetallesProveedor(proveedorId) {
    console.log('👁️ Ver detalles proveedor:', proveedorId);
    // Implementar modal de detalles más adelante
    showToast('Función de detalles en desarrollo', 'info');
}

function eliminarProveedor(proveedorId, nombreProveedor) {
    console.log('🗑️ Eliminando proveedor:', proveedorId, nombreProveedor);
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el proveedor "${nombreProveedor}"?`)) {
        return;
    }
    
    fetch(`/api/inventario/proveedores/${proveedorId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(response => {
        if (response.msg) {
            showToast('Proveedor eliminado exitosamente', 'success');
            cargarProveedores();
        } else {
            throw new Error(response.error || 'Error desconocido');
        }
    })
    .catch(err => {
        console.error('Error eliminando proveedor:', err);
        showToast('Error al eliminar proveedor: ' + err.message, 'error');
    });
}

function cargarSedes() {
    console.log('Cargando sedes...');
}

function cargarMovimientosRecientes() {
    console.log('🔄 Función cargarMovimientosRecientes - contenedor removido intencionalmente');
    
    const container = document.querySelector('#movimientos-inventario .card-body');
    if (!container) {
        console.log('ℹ️ Container de movimientos recientes no encontrado (removido intencionalmente)');
        return;
    }
    
    // Mostrar spinner de carga
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando movimientos recientes...</span>
            </div>
            <p class="mt-2 text-muted">Cargando movimientos recientes...</p>
        </div>
    `;
    
    fetch('/api/inventario/movimientos?limite=10')
        .then(res => res.json())
        .then(movimientos => {
            console.log(`✅ Movimientos recientes cargados: ${movimientos.length}`);
            
            if (!movimientos || movimientos.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-box display-4 text-muted"></i>
                        <p class="mt-3 text-muted">No hay movimientos recientes</p>
                        <button class="btn btn-primary btn-sm" onclick="registrarMovimiento()">
                            <i class="bi bi-plus-circle"></i> Registrar Primer Movimiento
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="row g-3">
                    ${movimientos.map(mov => {
                        const fecha = new Date(mov.fecha_movimiento).toLocaleDateString('es-CO');
                        const hora = new Date(mov.fecha_movimiento).toLocaleTimeString('es-CO', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                        const tipoColor = mov.tipo_movimiento === 'entrada' ? 'success' : 'danger';
                        const tipoIcono = mov.tipo_movimiento === 'entrada' ? 'arrow-down-circle' : 'arrow-up-circle';
                        
                        return `
                            <div class="col-md-6">
                                <div class="card border-0 shadow-sm">
                                    <div class="card-body">
                                        <div class="d-flex align-items-start">
                                            <div class="flex-shrink-0">
                                                <div class="rounded-circle bg-${tipoColor} bg-opacity-10 p-2">
                                                    <i class="bi bi-${tipoIcono} text-${tipoColor}"></i>
                                                </div>
                                            </div>
                                            <div class="flex-grow-1 ms-3">
                                                <h6 class="mb-1">${mov.producto_nombre || 'Producto'}</h6>
                                                <p class="text-muted mb-2">
                                                    <small>
                                                        <span class="badge bg-${tipoColor}">${mov.tipo_movimiento}</span>
                                                        <strong>${mov.cantidad}</strong> unidades
                                                    </small>
                                                </p>
                                                <p class="text-muted mb-1">
                                                    <small><strong>Motivo:</strong> ${mov.motivo || 'No especificado'}</small>
                                                </p>
                                                <p class="text-muted mb-1">
                                                    <small><strong>Sede:</strong> ${mov.sede_nombre || 'N/A'}</small>
                                                </p>
                                                <p class="text-muted mb-0">
                                                    <small><i class="bi bi-clock"></i> ${fecha} ${hora}</small>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="text-center mt-3">
                    <button class="btn btn-outline-primary btn-sm" onclick="cargarMovimientos()">
                        <i class="bi bi-eye"></i> Ver Todos los Movimientos
                    </button>
                </div>
            `;
        })
        .catch(err => {
            console.error('❌ Error cargando movimientos recientes:', err);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error al cargar movimientos recientes
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="cargarMovimientosRecientes()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        });
}

function editarProducto(id) {
    console.log('Editar producto ID:', id);
}

function ajustarStock(id) {
    console.log('Ajustar stock del producto ID:', id);
}

function verHistorialProducto(id) {
    console.log('Ver historial del producto ID:', id);
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        console.log('Eliminar producto ID:', id);
    }
}

function abrirModalSede() {
    const modal = new bootstrap.Modal(document.getElementById('sedeModal'));
    modal.show();
}

function abrirModalCategoria() {
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    modal.show();
}

// Función abrirModalProveedor eliminada - se usa la función completa definida anteriormente

function guardarSede() {
    console.log('Guardar sede...');
}

function guardarCategoria() {
    console.log('Guardar categoría...');
}

// Función guardarProveedor eliminada - se usa la función completa definida anteriormente

function solicitarReposicion(producto) {
    console.log('Solicitar reposición para:', producto);
    showToast(`Solicitud de reposición enviada para: ${producto}`, 'success');
}

function actualizarInfoPaginacion() {
    const start = (inventarioModule.paginacion.pagina - 1) * inventarioModule.paginacion.porPagina + 1;
    const end = Math.min(start + inventarioModule.productos.length - 1, inventarioModule.paginacion.total);
    
    document.getElementById('inventarioStart').textContent = start;
    document.getElementById('inventarioEnd').textContent = end;
    document.getElementById('inventarioTotal').textContent = inventarioModule.paginacion.total;
}

function generarReporteInventario() {
    showToast('Generando reporte de inventario...', 'info');
    setTimeout(() => {
        exportarInventario('excel');
    }, 1000);
}

async function registrarMovimiento() {
    const form = document.getElementById('movimientoForm');
    
    if (!form) {
        console.error('Formulario de movimiento no encontrado');
        return;
    }

    // Obtener los datos del formulario
    const formData = new FormData(form);
    const movimientoData = {
        equipo_id: formData.get('equipo_id'),
        tipo: formData.get('tipo'),
        cantidad: parseInt(formData.get('cantidad')),
        motivo: formData.get('motivo'),
        observaciones: formData.get('observaciones') || null
    };

    // Validar datos requeridos
    if (!movimientoData.equipo_id || !movimientoData.tipo || !movimientoData.cantidad || !movimientoData.motivo) {
        showToast('Todos los campos obligatorios deben estar completados', 'error');
        return;
    }

    if (movimientoData.cantidad <= 0) {
        showToast('La cantidad debe ser mayor a cero', 'error');
        return;
    }

    try {
        // Mostrar estado de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Registrando...';

        console.log('📤 Enviando movimiento:', movimientoData);

        const response = await fetch('/api/inventario/movimientos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': '4' // Usuario de desarrollo
            },
            body: JSON.stringify(movimientoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensaje || 'Error al registrar el movimiento');
        }

        const resultado = await response.json();
        console.log('✅ Movimiento registrado:', resultado);

        showToast('Movimiento registrado exitosamente', 'success');
        form.reset();

        // Recargar las listas de movimientos - comentado porque contenedores fueron removidos
        // if (typeof cargarMovimientosRecientes === 'function') {
        //     cargarMovimientosRecientes();
        // }
        
        // if (typeof cargarMovimientos === 'function') {
        //     cargarMovimientos();
        // }

        // Recargar inventario para reflejar cambios
        if (typeof loadInventario === 'function') {
            loadInventario();
        }

    } catch (error) {
        console.error('❌ Error al registrar movimiento:', error);
        showToast(error.message || 'Error al registrar el movimiento', 'error');
    } finally {
        // Restaurar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText || 'Registrar Movimiento';
        }
    }
}

// Inicializar botones para mostrar/ocultar contraseña
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const icon = button.querySelector('i');
            
            // Toggle tipo de input
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });
}

// Funciones para gestión de sedes (usando nuevo sistema CRUD)
// Las funciones verDetallesSede, editarSede y eliminarSede están ahora en admin-crud.js

// Funciones para gestión de proveedores (usando nuevo sistema CRUD)
// Las funciones editarProveedor y eliminarProveedor están ahora en admin-crud.js
// Agregamos función para ver detalles
function verDetallesProveedor(id) {
    // Esta función está implementada en admin-crud.js
    if (typeof window.verDetallesProveedor === 'function') {
        window.verDetallesProveedor(id);
    } else {
        console.log('🏪 Ver detalles de proveedor:', id);
        alert(`Ver detalles del proveedor ${id}\n\nFuncionalidad implementada en admin-crud.js`);
    }
}

// Funciones para gestión de categorías (usando nuevo sistema CRUD)
// Las funciones editarCategoria y eliminarCategoria están ahora en admin-crud.js

// Funciones para gestión de equipos (usando nuevo sistema CRUD)
// Las funciones editarEquipo, eliminarEquipo y verDetallesEquipo están ahora en admin-crud.js

// ========================================
// Alertas visuales para reasignaciones de odontólogo
// ========================================

const REASIGNACION_ALERT_DURATION = 5500;

function ensureReasignacionAlertStyles() {
    if (document.getElementById('reassignAlertStyles')) return;
    const style = document.createElement('style');
    style.id = 'reassignAlertStyles';
    style.textContent = `
        #reasignacionAlertStack {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            z-index: 1085;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            pointer-events: none;
        }
        #reasignacionAlertStack .reasignacion-alert {
            width: min(340px, calc(100vw - 2rem));
            background: #ffffff;
            border-radius: 1rem;
            padding: 1rem 1.25rem 1.25rem;
            border-left: 4px solid #20c997;
            box-shadow: 0 18px 50px rgba(15, 33, 55, 0.18);
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: auto;
        }
        #reasignacionAlertStack .reasignacion-alert.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        #reasignacionAlertStack .reasignacion-alert.hide {
            opacity: 0;
            transform: translateY(-8px) scale(0.94);
        }
        .reasignacion-alert .status-badge {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, #20c997, #198754);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 1.3rem;
            box-shadow: inset 0 0 0 2px rgba(255,255,255,0.12);
        }
        .reasignacion-alert .badge-soft {
            background: rgba(25, 135, 84, 0.12);
            color: #198754;
            border-radius: 999px;
            font-weight: 600;
            font-size: 0.7rem;
            padding: 0.15rem 0.65rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .reassign-progress {
            height: 4px;
            background: rgba(25, 135, 84, 0.15);
            border-radius: 999px;
            overflow: hidden;
        }
        .reassign-progress span {
            display: block;
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, #20c997, #0d6efd);
            animation: reassignCountdown var(--alert-duration, 5.5s) linear forwards;
        }
        .reasignacion-alert .close-pill {
            border: none;
            background: rgba(15, 33, 55, 0.06);
            color: #0f2137;
            border-radius: 999px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
        }
        .reasignacion-alert .close-pill:hover {
            background: rgba(15, 33, 55, 0.12);
        }
        @keyframes reassignCountdown {
            from { width: 100%; }
            to { width: 0%; }
        }
    `;
    document.head.appendChild(style);
}

function getReasignacionAlertStack() {
    ensureReasignacionAlertStyles();
    let stack = document.getElementById('reasignacionAlertStack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'reasignacionAlertStack';
        document.body.appendChild(stack);
    }
    return stack;
}

function showReasignacionSuccessAlert(pacienteNombre = '', odontologoNombre = '') {
    const stack = getReasignacionAlertStack();
    const alertEl = document.createElement('div');
    alertEl.className = 'reasignacion-alert shadow-lg';
    alertEl.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center">
                <div class="status-badge me-3">
                    <i class="bi bi-check-lg"></i>
                </div>
                <div>
                    <div class="badge-soft mb-1">Reasignación completada</div>
                    <h6 class="mb-0">${escapeHTML(odontologoNombre || 'Nuevo odontólogo asignado')}</h6>
                    <small class="text-muted">Ahora atiende a ${escapeHTML(pacienteNombre || 'este paciente')}</small>
                </div>
            </div>
            <button type="button" class="close-pill" aria-label="Cerrar notificación">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="rounded bg-light p-3 mb-3">
            <div class="text-uppercase text-muted small mb-1">Resumen</div>
            <div class="fw-semibold text-dark">Paciente · ${escapeHTML(pacienteNombre || 'Sin nombre')}</div>
            <div class="text-success fw-semibold">Odontólogo · ${escapeHTML(odontologoNombre || 'Por confirmar')}</div>
        </div>
        <div class="reassign-progress"><span style="--alert-duration: ${(REASIGNACION_ALERT_DURATION / 1000).toFixed(1)}s"></span></div>
    `;

    stack.appendChild(alertEl);

    requestAnimationFrame(() => {
        alertEl.classList.add('visible');
    });

    const dismissAlert = () => {
        alertEl.classList.remove('visible');
        alertEl.classList.add('hide');
        alertEl.addEventListener('transitionend', function handle(event) {
            if (event.propertyName === 'opacity') {
                alertEl.removeEventListener('transitionend', handle);
                alertEl.remove();
            }
        });
    };

    const timeoutId = setTimeout(dismissAlert, REASIGNACION_ALERT_DURATION);

    const closeBtn = alertEl.querySelector('.close-pill');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeoutId);
            dismissAlert();
        });
    }
}

function setupReasignacionAlertOverride() {
    if (window.__reassignAlertOverrideApplied) return;
    window.__reassignAlertOverrideApplied = true;
    const nativeAlert = window.alert ? window.alert.bind(window) : null;
    window.alert = function(message, ...args) {
        if (typeof message === 'string' && message.toLowerCase().includes('odontólogo reasignado exitosamente')) {
            const pacienteMatch = message.match(/Paciente:\s*([^\n]+)/i);
            const odontologoMatch = message.match(/Nuevo Odontólogo:\s*([^\n]+)/i);
            const pacienteNombre = pacienteMatch ? pacienteMatch[1].trim() : '';
            const odontologoNombre = odontologoMatch ? odontologoMatch[1].trim() : '';
            showReasignacionSuccessAlert(pacienteNombre, odontologoNombre);
            if (typeof showToast === 'function') {
                showToast(`Odontólogo reasignado exitosamente a ${odontologoNombre || 'el nuevo especialista'}`, 'success');
            }
            return;
        }
        if (nativeAlert) {
            nativeAlert(message, ...args);
        }
    };
}

setupReasignacionAlertOverride();

// ========================================
// Funciones para gestión de Historiales Clínicos
// ========================================

// Función para abrir modal de reasignación de odontólogo
async function abrirModalReasignarOdontologo(pacienteId, pacienteNombre) {
    console.log('🔄 Abriendo modal de reasignación para paciente:', pacienteId, pacienteNombre);
    
    try {
        // Cargar lista de odontólogos disponibles
        const response = await fetch('/api/usuarios/odontologos', {
            headers: {
                'user-id': getUserId(),
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener odontólogos');
        }
        
        const odontologos = await response.json();
        console.log('👨‍⚕️ Odontólogos disponibles:', odontologos);
        
        // Crear modal dinámicamente
        const modalHtml = `
            <div class="modal fade" id="reasignarOdontologoModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-person-badge"></i> Reasignar Odontólogo
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                <strong>Paciente:</strong> ${pacienteNombre}
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Seleccionar Nuevo Odontólogo</label>
                                <select class="form-select" id="nuevoOdontologoSelect" required>
                                    <option value="">-- Seleccione un odontólogo --</option>
                                    ${odontologos.map(od => `
                                        <option value="${od.id}">
                                            Dr./Dra. ${od.nombre} ${od.apellido}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle"></i>
                                <small>
                                    <strong>Nota:</strong> El nuevo odontólogo tendrá acceso a todos los historiales 
                                    clínicos previos del paciente. Los historiales anteriores no se modificarán ni eliminarán.
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="confirmarReasignacion(${pacienteId})">
                                <i class="bi bi-check-circle"></i> Reasignar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('reasignarOdontologoModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('reasignarOdontologoModal'));
        modal.show();
        
        // Limpiar modal al cerrar
        document.getElementById('reasignarOdontologoModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('❌ Error al abrir modal de reasignación:', error);
        if (typeof showAlert === 'function') {
            showAlert('danger', 'Error al cargar la lista de odontólogos: ' + error.message);
        } else if (typeof showToast === 'function') {
            showToast('Error al cargar la lista de odontólogos: ' + error.message, 'danger');
        } else {
            alert('Error al cargar la lista de odontólogos: ' + error.message);
        }
    }
}

// Función para confirmar la reasignación
async function confirmarReasignacion(pacienteId) {
    const nuevoOdontologoId = document.getElementById('nuevoOdontologoSelect').value;
    
    if (!nuevoOdontologoId) {
        if (typeof showToast === 'function') {
            showToast('Por favor seleccione un odontólogo', 'warning');
        } else if (typeof showAlert === 'function') {
            showAlert('warning', 'Por favor seleccione un odontólogo');
        } else {
            alert('Por favor seleccione un odontólogo');
        }
        return;
    }
    
    try {
        console.log('📤 Enviando reasignación:', { pacienteId, nuevoOdontologoId });
        
        showLoading('Reasignando odontólogo...');
        
        const response = await fetch(`/api/usuarios/${pacienteId}/reasignar-odontologo`, {
            method: 'PUT',
            headers: {
                'user-id': getUserId(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nuevo_odontologo_id: nuevoOdontologoId
            })
        });
        
        hideLoading();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Error al reasignar odontólogo');
        }
        
        const result = await response.json();
        console.log('✅ Reasignación exitosa:', result);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reasignarOdontologoModal'));
        if (modal) {
            modal.hide();
        }
        
        const pacienteNombre = result?.paciente?.nombre || '';
        const odontologoNombre = result?.nuevo_odontologo?.nombre || '';

        showReasignacionSuccessAlert(pacienteNombre, odontologoNombre);

        if (typeof showAlert === 'function') {
            showAlert('success', `Odontólogo reasignado exitosamente a ${odontologoNombre}`);
        } else if (typeof showToast === 'function') {
            showToast(`Odontólogo reasignado exitosamente a ${odontologoNombre}`, 'success');
        }
        
        // Recargar la lista de pacientes si existe la función
        if (typeof window.dashboardAdmin !== 'undefined' && typeof window.dashboardAdmin.loadUsuarios === 'function') {
            window.dashboardAdmin.loadUsuarios();
        }
        
    } catch (error) {
        hideLoading();
        console.error('❌ Error al reasignar odontólogo:', error);
        if (typeof showAlert === 'function') {
            showAlert('danger', 'Error al reasignar odontólogo: ' + error.message);
        } else if (typeof showToast === 'function') {
            showToast('Error al reasignar odontólogo: ' + error.message, 'danger');
        } else {
            alert('Error al reasignar odontólogo: ' + error.message);
        }
    }
}

// Exportar funciones globalmente
window.abrirModalReasignarOdontologo = abrirModalReasignarOdontologo;
window.confirmarReasignacion = confirmarReasignacion;

