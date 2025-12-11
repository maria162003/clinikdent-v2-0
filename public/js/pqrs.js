// Modal PQRS
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('pqrModal');
  const btn = document.getElementById('pqrBtn');
  const span = document.getElementsByClassName('close')[0];
  
  btn.onclick = function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  span.onclick = function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
  
  // Formulario PQRS
  const pqrForm = document.getElementById('pqrForm');
  if (pqrForm) {
    pqrForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simulación de envío
      setTimeout(function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Mostrar mensaje de éxito (podrías implementar un toast notification)
        alert('Gracias por tu mensaje. Nos pondremos en contacto contigo pronto.');
        pqrForm.reset();
      }, 1000);
    });
  }
});