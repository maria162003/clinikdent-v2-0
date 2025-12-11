// Base de datos de noticias
const noticiasData = [
    {
        id: 1,
        categoria: 'promocion',
        titulo: 'Promoción Especial: Blanqueamiento Dental 20% OFF',
        fecha: '15 Jun 2024',
        imagen: 'images/news1.jpg',
        descripcionCorta: 'Durante todo el mes de junio, disfruta de un 20% de descuento en nuestro tratamiento de blanqueamiento dental profesional.',
        descripcionCompleta: `
            <p>Durante todo el mes de junio, disfruta de un 20% de descuento en nuestro tratamiento de blanqueamiento dental profesional. Recupera la blancura natural de tus dientes con la tecnología más avanzada.</p>
            
            <h5>¿Qué incluye el tratamiento?</h5>
            <ul>
                <li>Consulta inicial y evaluación</li>
                <li>Limpieza dental profesional</li>
                <li>Aplicación de gel blanqueador</li>
                <li>Lámpara de activación LED</li>
                <li>Kit de mantenimiento para casa</li>
            </ul>
            
            <h5>Beneficios:</h5>
            <ul>
                <li>Resultados visibles desde la primera sesión</li>
                <li>Hasta 8 tonos más blanco</li>
                <li>Procedimiento seguro y sin dolor</li>
                <li>Duración de 60-90 minutos</li>
            </ul>
            
            <div class="alert alert-warning">
                <strong>¡Atención!</strong> Esta promoción es válida hasta el 30 de junio de 2024. No se combina con otras ofertas.
            </div>
        `,
        badge: 'Promoción',
        badgeClass: 'bg-success',
        acciones: true
    },
    {
        id: 2,
        categoria: 'tecnologia',
        titulo: 'Nuevo Equipo de Radiología Digital',
        fecha: '1 Jul 2024',
        imagen: 'images/news2.jpg',
        descripcionCorta: 'Hemos incorporado la última tecnología en radiología digital para ofrecer diagnósticos más precisos y rápidos.',
        descripcionCompleta: `
            <p>Estamos orgullosos de anunciar la incorporación de nuestro nuevo equipo de radiología digital de última generación. Esta tecnología revolucionaria nos permite ofrecer diagnósticos más precisos, rápidos y seguros para todos nuestros pacientes.</p>
            
            <h5>Ventajas del nuevo equipo:</h5>
            <ul>
                <li><strong>Imágenes de alta resolución:</strong> Detectamos problemas que antes pasaban desapercibidos</li>
                <li><strong>90% menos radiación:</strong> Mayor seguridad para tu salud</li>
                <li><strong>Resultados inmediatos:</strong> No más esperas para conocer tu diagnóstico</li>
                <li><strong>Almacenamiento digital:</strong> Tu historial siempre disponible</li>
                <li><strong>Precisión excepcional:</strong> Tratamientos más efectivos</li>
            </ul>
            
            <h5>Tipos de radiografías disponibles:</h5>
            <ul>
                <li>Radiografías periapicales</li>
                <li>Radiografías panorámicas</li>
                <li>Radiografías de aleta mordida</li>
                <li>Tomografías 3D (próximamente)</li>
            </ul>
        `,
        badge: 'Tecnología',
        badgeClass: 'bg-info',
        acciones: false
    },
    {
        id: 3,
        categoria: 'evento',
        titulo: 'Jornada de Salud Oral Infantil',
        fecha: '20 May 2024',
        imagen: 'images/news3.jpg',
        descripcionCorta: 'Valoración gratuita para niños de 3 a 12 años. Incluye revisión completa, limpieza básica y consejos de higiene oral.',
        descripcionCompleta: `
            <p>¡Cuida la sonrisa de tus pequeños desde temprana edad! Durante todos los sábados de julio, ofrecemos jornadas especiales de salud oral infantil completamente gratuitas.</p>
            
            <h5>¿Qué incluye la valoración gratuita?</h5>
            <ul>
                <li>Examen oral completo</li>
                <li>Limpieza dental básica</li>
                <li>Aplicación de flúor</li>
                <li>Enseñanza de técnicas de cepillado</li>
                <li>Consejos de alimentación saludable</li>
                <li>Kit de higiene oral para llevar a casa</li>
            </ul>
            
            <h5>Información importante:</h5>
            <ul>
                <li><strong>Edad:</strong> Niños de 3 a 12 años</li>
                <li><strong>Fecha:</strong> Todos los sábados de julio</li>
                <li><strong>Horario:</strong> 8:00 AM - 2:00 PM</li>
                <li><strong>Requisitos:</strong> Documento de identidad del menor</li>
                <li><strong>Cupos limitados:</strong> Máximo 20 niños por jornada</li>
            </ul>
            
            <div class="alert alert-info">
                <strong>Reserva tu cupo:</strong> Llama al +57 300 123 4567 o agenda en línea. ¡Los cupos se agotan rápidamente!
            </div>
        `,
        badge: 'Evento',
        badgeClass: 'bg-warning',
        acciones: true
    },
    {
        id: 4,
        categoria: 'expansion',
        titulo: 'Inauguración Nuevo Consultorio',
        fecha: '10 Jul 2024',
        imagen: 'images/service1.jpg',
        descripcionCorta: 'Estamos emocionados de anunciar la apertura de nuestro segundo consultorio en el norte de la ciudad.',
        descripcionCompleta: `
            <p>¡Estamos creciendo! Es un honor anunciar la inauguración de nuestro segundo consultorio, ubicado estratégicamente en el norte de la ciudad para estar más cerca de ti y tu familia.</p>
            
            <h5>Detalles del nuevo consultorio:</h5>
            <ul>
                <li><strong>Dirección:</strong> Calle 123 #45-67, Sector Norte</li>
                <li><strong>Horarios:</strong> Lunes a Sábado de 8:00 AM a 6:00 PM</li>
                <li><strong>Servicios:</strong> Todos los tratamientos disponibles</li>
                <li><strong>Equipo:</strong> Los mismos profesionales de confianza</li>
                <li><strong>Tecnología:</strong> Equipos de última generación</li>
            </ul>
            
            <h5>Servicios disponibles:</h5>
            <ul>
                <li>Odontología general</li>
                <li>Ortodoncia</li>
                <li>Endodoncia</li>
                <li>Cirugía oral</li>
                <li>Estética dental</li>
                <li>Implantología</li>
                <li>Odontopediatría</li>
            </ul>
            
            <h5>Promoción de inauguración:</h5>
            <p>Durante el primer mes, todos los tratamientos tienen un <strong>15% de descuento</strong> en nuestra nueva sede.</p>
        `,
        badge: 'Expansión',
        badgeClass: 'bg-primary',
        acciones: true
    },
    {
        id: 5,
        categoria: 'servicio',
        titulo: 'Ortodoncia Invisible: Sonríe sin Complejos',
        fecha: '5 Jun 2024',
        imagen: 'images/service2.jpg',
        descripcionCorta: 'Ahora disponible en Clinik Dent: tratamiento de ortodoncia invisible con alineadores transparentes.',
        descripcionCompleta: `
            <p>¡La revolución en ortodoncia ha llegado a Clinik Dent! Te presentamos nuestro nuevo servicio de ortodoncia invisible con alineadores transparentes, la solución perfecta para corregir la posición de tus dientes de manera discreta y cómoda.</p>
            
            <h5>Ventajas de la ortodoncia invisible:</h5>
            <ul>
                <li><strong>100% transparente:</strong> Nadie notará que los usas</li>
                <li><strong>Removible:</strong> Puedes quitártelos para comer y cepillarte</li>
                <li><strong>Sin brackets metálicos:</strong> Mayor comodidad y estética</li>
                <li><strong>Menos citas:</strong> Controles cada 6-8 semanas</li>
                <li><strong>Predecible:</strong> Simulación 3D del resultado final</li>
                <li><strong>Higiénico:</strong> Fácil limpieza y mantenimiento</li>
            </ul>
            
            <h5>¿Cómo funciona?</h5>
            <ol>
                <li>Consulta inicial y toma de impresiones</li>
                <li>Diseño 3D personalizado de tu tratamiento</li>
                <li>Fabricación de tus alineadores personalizados</li>
                <li>Uso progresivo de cada juego de alineadores</li>
                <li>Controles periódicos para monitorear el progreso</li>
            </ol>
            
            <div class="alert alert-success">
                <strong>¡Consulta gratuita!</strong> Agenda tu cita para conocer si eres candidato para ortodoncia invisible.
            </div>
        `,
        badge: 'Nuevo Servicio',
        badgeClass: 'bg-secondary',
        acciones: true
    },
    {
        id: 6,
        categoria: 'financiacion',
        titulo: 'Nuevos Planes de Financiación',
        fecha: '25 May 2024',
        imagen: 'images/service3.jpg',
        descripcionCorta: 'Hacemos más accesible tu tratamiento dental con nuestros nuevos planes de financiación.',
        descripcionCompleta: `
            <p>En Clinik Dent creemos que todos merecen una sonrisa saludable. Por eso, hemos desarrollado nuevos planes de financiación para hacer más accesibles nuestros tratamientos dentales.</p>
            
            <h5>Opciones de financiación disponibles:</h5>
            <ul>
                <li><strong>Plan 6 meses:</strong> Sin intereses, cuotas fijas</li>
                <li><strong>Plan 12 meses:</strong> Sin intereses para tratamientos mayores a $500.000</li>
                <li><strong>Plan 24 meses:</strong> Intereses preferenciales para implantes y ortodoncia</li>
                <li><strong>Plan estudiantil:</strong> Descuentos especiales con carnet vigente</li>
            </ul>
            
            <h5>Requisitos:</h5>
            <ul>
                <li>Cédula de ciudadanía</li>
                <li>Comprobante de ingresos</li>
                <li>Autorización centrales de riesgo</li>
                <li>Cuota inicial desde el 20%</li>
            </ul>
            
            <h5>Ventajas:</h5>
            <ul>
                <li>Aprobación inmediata en la mayoría de casos</li>
                <li>Sin costos adicionales de estudio</li>
                <li>Flexibilidad en fechas de pago</li>
                <li>Posibilidad de abonos extras sin penalización</li>
            </ul>
            
            <div class="alert alert-info">
                <strong>¡Pregunta por nuestros planes!</strong> Nuestro equipo te ayudará a encontrar la mejor opción para tu presupuesto.
            </div>
        `,
        badge: 'Financiación',
        badgeClass: 'bg-info',
        acciones: false
    }
];

// Variables globales
let noticiasFiltradas = [...noticiasData];
let categoriaActual = 'todas';

// Función para cargar las noticias
function cargarNoticias() {
    mostrarNoticias(noticiasFiltradas);
}

// Función para mostrar las noticias en el DOM
function mostrarNoticias(noticias) {
    const container = document.getElementById('noticias-container');
    container.innerHTML = '';
    
    noticias.forEach(noticia => {
        const noticiaHtml = `
            <div class="col-md-6 noticia-item" data-categoria="${noticia.categoria}">
                <article class="card h-100 shadow-sm">
                    <img src="${noticia.imagen}" class="card-img-top" alt="${noticia.titulo}" style="height: 250px; object-fit: cover;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge ${noticia.badgeClass}">${noticia.badge}</span>
                            <small class="text-muted">${noticia.fecha}</small>
                        </div>
                        <h5 class="card-title">${noticia.titulo}</h5>
                        <p class="card-text">${noticia.descripcionCorta}</p>
                        <button class="btn btn-outline-primary btn-sm" onclick="mostrarNoticiaCompleta(${noticia.id})">
                            Leer más <i class="fas fa-arrow-right ms-1"></i>
                        </button>
                    </div>
                    ${noticia.acciones ? `
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-primary btn-sm" onclick="agendarCita()">
                            <i class="fas fa-calendar-plus me-1"></i> Agendar Cita
                        </button>
                        <a href="tel:+573001234567" class="btn btn-outline-primary btn-sm">
                            <i class="fas fa-phone me-1"></i> Llamar
                        </a>
                    </div>
                    ` : ''}
                </article>
            </div>
        `;
        
        container.innerHTML += noticiaHtml;
    });
}

// Función para mostrar noticia completa en modal
function mostrarNoticiaCompleta(id) {
    const noticia = noticiasData.find(n => n.id === id);
    if (!noticia) return;
    
    const modal = document.getElementById('noticiaModal');
    const modalTitle = document.getElementById('noticiaModalLabel');
    const modalBody = document.getElementById('noticiaModalBody');
    
    modalTitle.textContent = noticia.titulo;
    modalBody.innerHTML = `
        <div class="mb-3">
            <img src="${noticia.imagen}" class="img-fluid rounded" alt="${noticia.titulo}">
        </div>
        <div class="mb-2">
            <span class="badge ${noticia.badgeClass} me-2">${noticia.badge}</span>
            <small class="text-muted">${noticia.fecha}</small>
        </div>
        ${noticia.descripcionCompleta}
    `;
    
    // Mostrar el modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Función para filtrar noticias por categoría
function filtrarPorCategoria(categoria) {
    categoriaActual = categoria;
    
    if (categoria === 'todas') {
        noticiasFiltradas = [...noticiasData];
    } else {
        noticiasFiltradas = noticiasData.filter(noticia => noticia.categoria === categoria);
    }
    
    mostrarNoticias(noticiasFiltradas);
    
    // Actualizar estado activo de filtros
    document.querySelectorAll('.filter-category').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (categoria !== 'todas') {
        document.querySelector(`[data-category="${categoria}"]`).classList.add('active');
    }
}

// Función para agendar cita
function agendarCita() {
    // Verificar si el usuario está logueado
    const token = localStorage.getItem('token');
    
    if (token) {
        // Si está logueado, redirigir al dashboard correspondiente
        const userRole = localStorage.getItem('userRole');
        switch(userRole) {
            case 'paciente':
                window.location.href = 'dashboard-paciente.html';
                break;
            case 'odontologo':
                window.location.href = 'dashboard-odontologo.html';
                break;
            case 'admin':
                window.location.href = 'dashboard-admin.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    } else {
        // Si no está logueado, mostrar modal de login
        alert('Para agendar una cita, primero debes iniciar sesión. Serás redirigido a la página de login.');
        window.location.href = 'index.html#login';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar noticias
    cargarNoticias();
    
    // Agregar event listeners a filtros de categoría
    document.querySelectorAll('.filter-category').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const categoria = this.getAttribute('data-category');
            filtrarPorCategoria(categoria);
        });
    });
});

// Función para buscar noticias
function buscarNoticias(termino) {
    const terminoLower = termino.toLowerCase();
    noticiasFiltradas = noticiasData.filter(noticia => 
        noticia.titulo.toLowerCase().includes(terminoLower) ||
        noticia.descripcionCorta.toLowerCase().includes(terminoLower) ||
        noticia.categoria.toLowerCase().includes(terminoLower)
    );
    
    mostrarNoticias(noticiasFiltradas);
}
