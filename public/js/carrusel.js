// Carrusel principal
let currentSlide = 0;
const slides = document.querySelectorAll('.hero .slide');

function showSlide(n) {
  slides.forEach(slide => slide.classList.remove('active'));
  currentSlide = (n + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
}

function moverCarrusel(n) {
  showSlide(currentSlide + n);
}

// Auto-avance del carrusel
setInterval(() => {
  moverCarrusel(1);
}, 5000);

// Carrusel de noticias
let currentNewsSlide = 0;
const newsSlides = document.querySelectorAll('.noticias-carrusel .slide');

function showNewsSlide(n) {
  newsSlides.forEach(slide => slide.classList.remove('active'));
  currentNewsSlide = (n + newsSlides.length) % newsSlides.length;
  newsSlides[currentNewsSlide].classList.add('active');
}

function moverNoticias(n) {
  showNewsSlide(currentNewsSlide + n);
}

// Carrusel de testimonios
let currentTestimonialSlide = 0;
const testimonialSlides = document.querySelectorAll('.comentarios-carrusel .slide');

function showTestimonialSlide(n) {
  testimonialSlides.forEach(slide => slide.classList.remove('active'));
  currentTestimonialSlide = (n + testimonialSlides.length) % testimonialSlides.length;
  testimonialSlides[currentTestimonialSlide].classList.add('active');
}

function moverTestimonios(n) {
  showTestimonialSlide(currentTestimonialSlide + n);
}

// Inicializar todos los carruseles
document.addEventListener('DOMContentLoaded', function() {
  showSlide(0);
  showNewsSlide(0);
  showTestimonialSlide(0);
  
  // Inicializar Bootstrap carousel para testimonios
  const testimonialsCarousel = document.getElementById('testimonialsCarousel');
  if (testimonialsCarousel && typeof bootstrap !== 'undefined') {
    new bootstrap.Carousel(testimonialsCarousel, {
      interval: 5000,
      ride: 'carousel',
      pause: 'hover'
    });
  }
});