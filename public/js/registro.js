// Validación y envío del formulario de registro
const form = document.getElementById('registroForm');
const mensaje = document.getElementById('mensaje');

form.addEventListener('submit', async function(e) {
  e.preventDefault();
  mensaje.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  // Forzar acepta_politica a booleano
  data.acepta_politica = form.acepta_politica.checked;
  // Eliminar campos extra si existen
  delete data.direccion;
  delete data.rol;
  // Si whatsapp no existe, ponerlo como string vacío
  if (!data.whatsapp) data.whatsapp = '';
  if (!data.acepta_politica) {
    mensaje.textContent = 'Debe aceptar la política de privacidad.';
    return;
  }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      mensaje.textContent = 'Registro exitoso. Revise su correo.';
      form.reset();
    } else {
      mensaje.textContent = result.msg || 'Error en el registro.';
    }
  } catch (err) {
    mensaje.textContent = 'Error de conexión.';
  }
});
