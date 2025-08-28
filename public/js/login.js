// Validación y envío del formulario de login
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm));
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      console.log('✅ Login exitoso:', result);
      console.log('🔍 Verificando tokenLogin en respuesta:', result.tokenLogin);
      
      // Store user session - guardar información completa
      const userSession = { 
        id: result.id, 
        rol: result.rol, 
        nombre: result.nombre,
        apellido: result.apellido || '',
        correo: result.correo || '',
        tokenLogin: result.tokenLogin || false  // Guardar si fue login con token
      };
      console.log('💾 Guardando userSession:', userSession);
      localStorage.setItem('user', JSON.stringify(userSession));
      
      // También guardar userId por separado para compatibilidad con dashboard
      localStorage.setItem('userId', result.id);
      localStorage.setItem('userRole', result.rol);
      
      console.log('🗂️ Datos guardados en localStorage:', userSession);
      
      // Si es token login, mostrar modal de cambio de contraseña directo
      if (result.tokenLogin) {
        console.log('🔑 Token login detectado - mostrando modal de nueva contraseña');
        mostrarModalCambioPasswordToken();
        return; // No redirigir al dashboard todavía
      }
      
      // Redirigir según el rol y nombres de archivos correctos
      if (result.rol === 'paciente') {
        console.log('📱 Redirigiendo a dashboard de paciente');
        window.location.href = '/dashboard-paciente.html';
      } else if (result.rol === 'odontologo') {
        console.log('👨‍⚕️ Redirigiendo a dashboard de odontólogo');
        window.location.href = '/dashboard-odontologo.html';
      } else if (result.rol === 'administrador') {
        console.log('👨‍💼 Redirigiendo a dashboard de administrador');
        window.location.href = '/dashboard-admin.html';
      } else {
        console.warn('⚠️ Rol no reconocido:', result.rol);
        alert('Rol de usuario no reconocido.');
      }
    } else {
      alert(result.msg || 'Credenciales incorrectas.');
    }
  } catch (err) {
    console.error('❌ Error en login:', err);
    alert('Error de conexión.');
  }
});

// Funciones para manejar token login
function mostrarModalCambioPasswordToken() {
  // Crear modal dinámicamente
  const modalHTML = `
    <div class="modal fade" id="tokenPasswordModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-shield-check"></i> Establecer Nueva Contraseña
            </h5>
          </div>
          <div class="modal-body">
            <div class="alert alert-success">
              <i class="bi bi-check-circle"></i> 
              ¡Login exitoso con token de recuperación! Ahora establece tu nueva contraseña.
            </div>
            <div id="tokenPasswordAlert"></div>
            <form id="tokenPasswordForm">
              <div class="mb-3">
                <label for="tokenNewPassword" class="form-label">
                  <i class="bi bi-key"></i> Nueva Contraseña
                </label>
                <input type="password" class="form-control" id="tokenNewPassword" 
                       placeholder="Mínimo 6 caracteres" required>
              </div>
              <div class="mb-3">
                <label for="tokenConfirmPassword" class="form-label">
                  <i class="bi bi-key-fill"></i> Confirmar Nueva Contraseña
                </label>
                <input type="password" class="form-control" id="tokenConfirmPassword" 
                       placeholder="Repite la nueva contraseña" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success" id="tokenPasswordSubmit">
              <i class="bi bi-check-lg"></i> Establecer Contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Agregar modal al DOM si no existe
  if (!document.getElementById('tokenPasswordModal')) {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  // Configurar event listeners
  document.getElementById('tokenPasswordSubmit').addEventListener('click', () => {
    cambiarPasswordToken();
  });
  
  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('tokenPasswordModal'), {
    backdrop: 'static',
    keyboard: false
  });
  modal.show();
}

// Cambiar contraseña después de token login
async function cambiarPasswordToken() {
  const newPassword = document.getElementById('tokenNewPassword').value;
  const confirmPassword = document.getElementById('tokenConfirmPassword').value;
  const alertContainer = document.getElementById('tokenPasswordAlert');
  const submitBtn = document.getElementById('tokenPasswordSubmit');
  
  // Limpiar alertas previas
  alertContainer.innerHTML = '';
  
  // Validaciones
  if (!newPassword || !confirmPassword) {
    showTokenPasswordAlert('error', 'Ambos campos son obligatorios.');
    return;
  }
  
  if (newPassword.length < 6) {
    showTokenPasswordAlert('error', 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showTokenPasswordAlert('error', 'Las contraseñas no coinciden.');
    return;
  }
  
  // Loading state
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Estableciendo...';
  submitBtn.disabled = true;
  
  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    const response = await fetch('/cambiar-password-directo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        new_password: newPassword,
        userId: userData.id,
        isTokenLogin: true // Forzar como token login
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showTokenPasswordAlert('success', '¡Contraseña establecida exitosamente!');
      
      // Limpiar flag de token login
      userData.tokenLogin = false;
      localStorage.setItem('user', JSON.stringify(userData));
      
      setTimeout(() => {
        // Cerrar modal y redirigir al dashboard
        bootstrap.Modal.getInstance(document.getElementById('tokenPasswordModal')).hide();
        redirigirAlDashboard(userData.rol);
      }, 1500);
    } else {
      showTokenPasswordAlert('error', result.msg || 'Error al establecer la contraseña.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    showTokenPasswordAlert('error', 'Error de conexión. Intenta nuevamente.');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Mostrar alertas en el modal de token password
function showTokenPasswordAlert(type, message) {
  const alertContainer = document.getElementById('tokenPasswordAlert');
  const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
  const iconClass = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle';
  
  alertContainer.innerHTML = `
    <div class="alert ${alertClass}" role="alert">
      <i class="bi ${iconClass}"></i> ${message}
    </div>
  `;
}

// Función para redirigir al dashboard según el rol
function redirigirAlDashboard(rol) {
  if (rol === 'paciente') {
    console.log('📱 Redirigiendo a dashboard de paciente');
    window.location.href = '/dashboard-paciente.html';
  } else if (rol === 'odontologo') {
    console.log('👨‍⚕️ Redirigiendo a dashboard de odontólogo');
    window.location.href = '/dashboard-odontologo.html';
  } else if (rol === 'administrador') {
    console.log('👨‍💼 Redirigiendo a dashboard de administrador');
    window.location.href = '/dashboard-admin.html';
  }
}
