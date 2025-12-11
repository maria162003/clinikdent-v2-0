const form = document.getElementById('recuperarForm');
const mensaje = document.getElementById('mensaje');

// 🔗 Auto-completar email desde la URL si viene del modal
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  
  if (emailFromUrl) {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.value = decodeURIComponent(emailFromUrl);
      emailInput.focus();
    }
  }
});

form.addEventListener('submit', async function(e) {
  e.preventDefault();
  mensaje.textContent = '';
  mensaje.className = 'alert d-none';
  
  const data = Object.fromEntries(new FormData(form));
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  // Estado de carga
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  submitBtn.disabled = true;
  
  try {
    const res = await fetch('/api/auth/recuperar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    
    if (res.ok) {
      mensaje.textContent = '✅ Se enviaron las instrucciones de recuperación a su correo electrónico.';
      mensaje.className = 'alert alert-success';
      form.reset();
    } else {
      mensaje.textContent = result.msg || 'Error en la recuperación de contraseña.';
      mensaje.className = 'alert alert-danger';
    }
  } catch (err) {
    mensaje.textContent = 'Error de conexión. Verifique su internet e intente nuevamente.';
    mensaje.className = 'alert alert-danger';
  } finally {
    // Restaurar botón
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});
