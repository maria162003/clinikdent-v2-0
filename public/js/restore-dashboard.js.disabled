// Script de restauración básica del dashboard (sin modificar nada existente)
console.log('🔄 Iniciando restauración básica del dashboard...');

// Solo ejecutar si estamos en la página correcta
if (window.location.pathname.includes('dashboard-admin') || window.location.pathname === '/dashboard-admin.html') {
    
    // Esperar a que se cargue completamente
    window.addEventListener('load', function() {
        console.log('✅ Página cargada, iniciando restauración...');
        
        setTimeout(function() {
            restaurarNavegacion();
            verificarSecciones();
        }, 2000);
    });
}

function restaurarNavegacion() {
    console.log('🧭 Restaurando navegación...');
    
    // Obtener todos los links de navegación
    const navLinks = document.querySelectorAll('.sidebar .nav-link[data-section]');
    console.log('🔗 Enlaces encontrados:', navLinks.length);
    
    navLinks.forEach(link => {
        // Verificar si ya tiene event listener
        const section = link.getAttribute('data-section');
        
        // Agregar event listener solo si no existe
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🖱️ Click en sección: ${section}`);
            
            // Activar sección
            activarSeccion(section, link);
        });
        
        console.log(`✅ Navegación restaurada para: ${section}`);
    });
}

function activarSeccion(sectionName, activeLink) {
    console.log(`📋 Activando sección: ${sectionName}`);
    
    try {
        // 1. Ocultar todas las secciones
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // 2. Mostrar sección objetivo
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`✅ Sección ${sectionName} activada`);
        } else {
            console.log(`❌ Sección ${sectionName}-section no encontrada`);
        }
        
        // 3. Actualizar navegación activa
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
        
        // 4. Actualizar título de página
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = obtenerTituloSeccion(sectionName);
        }
        
        // 5. Cargar datos de la sección si existe función
        cargarDatosSeccion(sectionName);
        
    } catch (error) {
        console.error(`❌ Error activando sección ${sectionName}:`, error);
    }
}

function obtenerTituloSeccion(section) {
    const titles = {
        dashboard: 'Dashboard',
        usuarios: 'Gestión de Usuarios',
        citas: 'Gestión de Citas',
        pagos: 'Pagos y Facturación',
        faqs: 'Preguntas Frecuentes',
        evaluaciones: 'Evaluaciones de Servicio',
        reportes: 'Reportes y Estadísticas',
        inventario: 'Inventario y Sedes'
    };
    return titles[section] || 'Dashboard';
}

function cargarDatosSeccion(sectionName) {
    console.log(`📊 Intentando cargar datos para: ${sectionName}`);
    
    try {
        // Verificar si existe DashboardAdmin
        if (typeof window.dashboardAdmin !== 'undefined' && window.dashboardAdmin) {
            switch(sectionName) {
                case 'usuarios':
                    if (typeof window.dashboardAdmin.loadUsuarios === 'function') {
                        window.dashboardAdmin.loadUsuarios();
                    }
                    break;
                case 'citas':
                    if (typeof window.dashboardAdmin.loadCitas === 'function') {
                        window.dashboardAdmin.loadCitas();
                    }
                    break;
                case 'faqs':
                    if (typeof window.dashboardAdmin.loadFAQs === 'function') {
                        window.dashboardAdmin.loadFAQs();
                    }
                    break;
                case 'evaluaciones':
                    if (typeof window.dashboardAdmin.loadEvaluaciones === 'function') {
                        window.dashboardAdmin.loadEvaluaciones();
                    }
                    break;
                case 'pagos':
                    if (typeof window.adminPagosModule !== 'undefined' && window.adminPagosModule.cargarHistorialPagos) {
                        window.adminPagosModule.cargarHistorialPagos();
                    }
                    break;
                case 'inventario':
                    if (typeof loadInventario === 'function') {
                        loadInventario();
                    }
                    if (typeof loadSedes === 'function') {
                        loadSedes();
                    }
                    break;
            }
        }
    } catch (error) {
        console.log(`⚠️ No se pudieron cargar datos para ${sectionName}:`, error.message);
    }
}

function verificarSecciones() {
    console.log('🔍 Verificando secciones disponibles...');
    
    const secciones = [
        'dashboard-section',
        'usuarios-section',
        'citas-section',
        'pagos-section',
        'faqs-section',
        'evaluaciones-section',
        'inventario-section',
        'reportes-section'
    ];
    
    let seccionesEncontradas = 0;
    
    secciones.forEach(seccionId => {
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            seccionesEncontradas++;
            console.log(`✅ ${seccionId}: Encontrada`);
        } else {
            console.log(`❌ ${seccionId}: No encontrada`);
        }
    });
    
    console.log(`📊 Total secciones encontradas: ${seccionesEncontradas}/${secciones.length}`);
    
    // Activar dashboard por defecto si no hay sección activa
    const seccionActiva = document.querySelector('.content-section.active');
    if (!seccionActiva) {
        console.log('🎯 No hay sección activa, activando dashboard...');
        const dashboardLink = document.querySelector('.nav-link[data-section="dashboard"]');
        if (dashboardLink) {
            activarSeccion('dashboard', dashboardLink);
        }
    }
}

// Restaurar logout
function restaurarLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                localStorage.clear();
                window.location.href = '/index.html';
            }
        });
        console.log('✅ Función de logout restaurada');
    }
}

// Auto-ejecutar
setTimeout(function() {
    restaurarLogout();
    console.log('✅ Restauración básica completada');
}, 3000);

console.log('✅ Script de restauración cargado');
