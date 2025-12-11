// SCRIPT DE EMERGENCIA - Restaurar funcionalidad básica del dashboard
// Este script se ejecuta inmediatamente y restaura la navegación básica

console.log('🚨 SCRIPT DE EMERGENCIA - Restaurando dashboard...');

// Función de restauración inmediata
(function() {
    'use strict';
    
    // Configurar usuario si no existe
    if (!localStorage.getItem('user')) {
        const adminUser = {
            id: 4,
            nombre: 'Admin Sistema',
            rol: 'administrador',
            email: 'admin@clinikdent.com'
        };
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('userId', '4');
        console.log('👤 Usuario admin configurado');
    }
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarRestauracion);
    } else {
        iniciarRestauracion();
    }
    
    function iniciarRestauracion() {
        console.log('🔄 Iniciando restauración de emergencia...');
        
        setTimeout(function() {
            // 1. Restaurar navegación
            restaurarNavegacionBasica();
            
            // 2. Verificar secciones
            verificarSeccionesDisponibles();
            
            // 3. Activar dashboard por defecto
            activarDashboardPorDefecto();
            
            console.log('✅ Restauración de emergencia completada');
        }, 1000);
    }
    
    function restaurarNavegacionBasica() {
        const navLinks = document.querySelectorAll('.sidebar .nav-link[data-section]');
        
        navLinks.forEach(function(link) {
            const section = link.getAttribute('data-section');
            
            // Remover listeners existentes clonando el elemento
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Agregar nuevo listener
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Click en:', section);
                cambiarSeccion(section, newLink);
            });
        });
        
        console.log('🧭 Navegación básica restaurada');
    }
    
    function cambiarSeccion(seccionNombre, linkActivo) {
        try {
            // Ocultar todas las secciones
            const todasLasSecciones = document.querySelectorAll('.content-section');
            todasLasSecciones.forEach(function(seccion) {
                seccion.classList.remove('active');
                seccion.style.display = 'none';
            });
            
            // Mostrar sección objetivo
            const seccionObjetivo = document.getElementById(seccionNombre + '-section');
            if (seccionObjetivo) {
                seccionObjetivo.classList.add('active');
                seccionObjetivo.style.display = 'block';
                console.log('✅ Sección activada:', seccionNombre);
            } else {
                console.log('❌ Sección no encontrada:', seccionNombre + '-section');
            }
            
            // Actualizar navegación activa
            document.querySelectorAll('.sidebar .nav-link').forEach(function(link) {
                link.classList.remove('active');
            });
            linkActivo.classList.add('active');
            
            // Actualizar título
            actualizarTitulo(seccionNombre);
            
            // Intentar cargar datos
            setTimeout(function() {
                intentarCargarDatos(seccionNombre);
            }, 500);
            
        } catch (error) {
            console.error('❌ Error cambiando sección:', error);
        }
    }
    
    function actualizarTitulo(seccion) {
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titulos = {
                'dashboard': 'Dashboard',
                'usuarios': 'Gestión de Usuarios',
                'citas': 'Gestión de Citas',
                'pagos': 'Pagos y Facturación',
                'faqs': 'Preguntas Frecuentes',
                'evaluaciones': 'Evaluaciones de Servicio',
                'reportes': 'Reportes y Estadísticas',
                'inventario': 'Inventario y Sedes'
            };
            pageTitle.textContent = titulos[seccion] || 'Dashboard';
        }
    }
    
    function intentarCargarDatos(seccion) {
        console.log('📊 Intentando cargar datos para:', seccion);
        
        try {
            // Intentar con window.dashboardAdmin
            if (window.dashboardAdmin) {
                switch(seccion) {
                    case 'usuarios':
                        if (window.dashboardAdmin.loadUsuarios) {
                            window.dashboardAdmin.loadUsuarios();
                        }
                        break;
                    case 'citas':
                        if (window.dashboardAdmin.loadCitas) {
                            window.dashboardAdmin.loadCitas();
                        }
                        break;
                    case 'faqs':
                        if (window.dashboardAdmin.loadFAQs) {
                            window.dashboardAdmin.loadFAQs();
                        }
                        break;
                    case 'evaluaciones':
                        if (window.dashboardAdmin.loadEvaluaciones) {
                            window.dashboardAdmin.loadEvaluaciones();
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
                    case 'pagos':
                        if (window.adminPagosModule && window.adminPagosModule.cargarHistorialPagos) {
                            window.adminPagosModule.cargarHistorialPagos();
                        }
                        break;
                }
            }
        } catch (error) {
            console.log('⚠️ No se pudieron cargar datos automáticamente para:', seccion);
        }
    }
    
    function verificarSeccionesDisponibles() {
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
        
        let disponibles = 0;
        secciones.forEach(function(seccionId) {
            const seccion = document.getElementById(seccionId);
            if (seccion) {
                disponibles++;
                console.log('✅', seccionId, 'disponible');
            } else {
                console.log('❌', seccionId, 'no encontrada');
            }
        });
        
        console.log('📊 Secciones disponibles:', disponibles + '/' + secciones.length);
    }
    
    function activarDashboardPorDefecto() {
        const seccionActiva = document.querySelector('.content-section.active');
        if (!seccionActiva) {
            const dashboardLink = document.querySelector('.nav-link[data-section="dashboard"]');
            if (dashboardLink) {
                console.log('🎯 Activando dashboard por defecto...');
                setTimeout(function() {
                    dashboardLink.click();
                }, 500);
            }
        }
    }
    
    // Restaurar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                localStorage.clear();
                window.location.href = '/index.html';
            }
        });
    }
    
})();

// Exponer función de emergencia globalmente
window.restaurarDashboardEmergencia = function() {
    console.log('🚨 Ejecutando restauración manual de emergencia...');
    location.reload();
};

console.log('✅ Script de emergencia cargado y ejecutándose...');
