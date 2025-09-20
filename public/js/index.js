// Variables globales para animaciones y efectos
let isScrolled = false;
let countersAnimated = false;

// Funciones de utilidad
function animateValue(element, start, end, duration) {
  const range = end - start;
  const current = start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  
  const timer = setInterval(() => {
    element.innerHTML = current;
    if (current === end) {
      clearInterval(timer);
    } else {
      current += increment;
    }
  }, stepTime);
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Efectos de scroll y animaciones
function initScrollEffects() {
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('backToTopBtn');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset > 100;
    
    // Efecto navbar
    if (scrolled && !isScrolled) {
      navbar.classList.add('scrolled');
      if (backToTopBtn) backToTopBtn.style.display = 'block';
      isScrolled = true;
    } else if (!scrolled && isScrolled) {
      navbar.classList.remove('scrolled');
      if (backToTopBtn) backToTopBtn.style.display = 'none';
      isScrolled = false;
    }
    
    // Animación de contadores
    const counters = document.querySelectorAll('.counter');
    if (!countersAnimated && counters.length > 0) {
      counters.forEach(counter => {
        if (isElementInViewport(counter)) {
          const target = parseInt(counter.getAttribute('data-target'));
          animateValue(counter, 0, target, 2000);
          countersAnimated = true;
        }
      });
    }
    
    // Animaciones de aparición para las secciones
    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => {
      if (isElementInViewport(section)) {
        section.classList.add('animate__animated', 'animate__fadeInUp');
      }
    });
  });
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  
  // Inicializar efectos de scroll
  initScrollEffects();
  
  // Noticias destacadas (se mantiene la funcionalidad existente)
  const noticias = [
    { titulo: 'Nueva tecnología en ortodoncia', texto: 'Incorporamos alineadores invisibles para tu comodidad.' },
    { titulo: 'Jornada de salud oral', texto: 'Participa en nuestra jornada gratuita de valoración.' },
    { titulo: 'Premio a la excelencia', texto: 'Nuestro equipo recibió reconocimiento nacional.' }
  ];
  
  const noticiasLista = document.getElementById('noticias-lista');
  if (noticiasLista) {
    noticias.forEach(n => {
      const div = document.createElement('div');
      div.className = 'noticia';
      div.innerHTML = `<h3>${n.titulo}</h3><p>${n.texto}</p>`;
      noticiasLista.appendChild(div);
    });
  }

  // Profesionales (se mantiene la funcionalidad existente)
  const profesionales = [
    { nombre: 'Dra. Ana Pérez', especialidad: 'Ortodoncia', img: 'images/doctor1.jpg' },
    { nombre: 'Dr. Juan Gómez', especialidad: 'Estética Dental', img: 'images/doctor2.jpg' },
    { nombre: 'Dra. Laura Ruiz', especialidad: 'Odontología General', img: 'images/doctor3.jpg' }
  ];
  
  const profesionalesLista = document.getElementById('profesionales-lista');
  if (profesionalesLista) {
    profesionales.forEach(p => {
      const div = document.createElement('div');
      div.className = 'profesional';
      div.innerHTML = `<img src="${p.img}" alt="${p.nombre}"/><h4>${p.nombre}</h4><p>${p.especialidad}</p>`;
      profesionalesLista.appendChild(div);
    });
  }

  // Inicializar contadores en la sección de estadísticas
  const statsSection = document.querySelector('#estadisticas');
  if (!statsSection) {
    // Crear sección de estadísticas si no existe
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      const statsHTML = `
        <section id="estadisticas" class="py-5 bg-primary text-white animate-on-scroll">
          <div class="container">
            <div class="row text-center">
              <div class="col-md-3 mb-4">
                <i class="fas fa-users fa-3x mb-3"></i>
                <div class="counter" data-target="2500">0</div>
                <p>Pacientes Satisfechos</p>
              </div>
              <div class="col-md-3 mb-4">
                <i class="fas fa-tooth fa-3x mb-3"></i>
                <div class="counter" data-target="5000">0</div>
                <p>Tratamientos Realizados</p>
              </div>
              <div class="col-md-3 mb-4">
                <i class="fas fa-award fa-3x mb-3"></i>
                <div class="counter" data-target="15">0</div>
                <p>Años de Experiencia</p>
              </div>
              <div class="col-md-3 mb-4">
                <i class="fas fa-user-md fa-3x mb-3"></i>
                <div class="counter" data-target="8">0</div>
                <p>Especialistas</p>
              </div>
            </div>
          </div>
        </section>
      `;
      heroSection.insertAdjacentHTML('afterend', statsHTML);
    }
  }

  // Formulario PQRS (se mantiene la funcionalidad existente)
  const pqrForm = document.getElementById('pqrsForm');
  const pqrMensaje = document.getElementById('pqrsMensaje');
  
  if (pqrForm) {
    pqrForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (pqrMensaje) pqrMensaje.textContent = '';
      
      const formData = new FormData(pqrForm);
      const data = Object.fromEntries(formData);
      
      try {
        const res = await fetch('/api/pqrs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (res.ok) {
          if (pqrMensaje) {
            pqrMensaje.textContent = 'Mensaje enviado correctamente.';
            pqrMensaje.className = 'text-success mt-2';
          }
          pqrForm.reset();
          
          // Cerrar modal después de 2 segundos
          setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('pqrsModal'));
            if (modal) modal.hide();
          }, 2000);
          
        } else {
          if (pqrMensaje) {
            pqrMensaje.textContent = result.msg || 'Error al enviar el mensaje.';
            pqrMensaje.className = 'text-danger mt-2';
          }
        }
      } catch (err) {
        console.error('Error:', err);
        if (pqrMensaje) {
          pqrMensaje.textContent = 'Error de conexión. Inténtalo de nuevo.';
          pqrMensaje.className = 'text-danger mt-2';
        }
      }
    });
  }

  // Formulario de contacto
  const contactForm = document.getElementById('contactForm');
  const contactMensaje = document.getElementById('contactMensaje');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (contactMensaje) contactMensaje.textContent = '';
      
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);
      
      try {
        const res = await fetch('/api/contacto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (res.ok) {
          if (contactMensaje) {
            contactMensaje.textContent = 'Mensaje enviado correctamente. Te contactaremos pronto.';
            contactMensaje.className = 'text-success mt-2';
          }
          contactForm.reset();
          
          // Cerrar modal después de 2 segundos
          setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
            if (modal) modal.hide();
          }, 2000);
          
        } else {
          if (contactMensaje) {
            contactMensaje.textContent = result.msg || 'Error al enviar el mensaje.';
            contactMensaje.className = 'text-danger mt-2';
          }
        }
      } catch (err) {
        console.error('Error:', err);
        if (contactMensaje) {
          contactMensaje.textContent = 'Error de conexión. Inténtalo de nuevo.';
          contactMensaje.className = 'text-danger mt-2';
        }
      }
    });
  }

  // Botón de volver arriba
  const backToTopBtn = document.createElement('button');
  backToTopBtn.id = 'backToTopBtn';
  backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  backToTopBtn.className = 'btn btn-primary position-fixed';
  backToTopBtn.style.cssText = `
    bottom: 30px;
    right: 30px;
    z-index: 1000;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: none;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  `;
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  document.body.appendChild(backToTopBtn);

  // Efectos de typewriter para el título principal
  const heroTitle = document.querySelector('.hero-section h1');
  if (heroTitle) {
    const originalText = heroTitle.textContent;
    heroTitle.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
      if (i < originalText.length) {
        heroTitle.textContent += originalText.charAt(i);
        i++;
        setTimeout(typeWriter, 100);
      }
    };
    
    setTimeout(typeWriter, 1000);
  }

  // Efecto parallax suave en el hero
  window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-section');
    if (hero) {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      hero.style.transform = `translateY(${rate}px)`;
    }
  });

  // Animación de las tarjetas al hacer hover
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Tooltip dinámico para los botones
  const buttons = document.querySelectorAll('[data-tooltip]');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', function(e) {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip-dynamic';
      tooltip.textContent = this.getAttribute('data-tooltip');
      tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1001;
        top: ${e.pageY - 30}px;
        left: ${e.pageX - 50}px;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      
      document.body.appendChild(tooltip);
      setTimeout(() => tooltip.style.opacity = '1', 100);
      
      this.addEventListener('mouseleave', () => {
        tooltip.remove();
      });
    });
  });

});
