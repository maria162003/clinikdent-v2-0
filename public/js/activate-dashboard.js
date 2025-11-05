// Script para activar secciones del dashboard (no interfiere con funciones existentes)
console.log('🔄 Activando secciones del dashboard...');

// Esperar a que el dashboard se cargue completamente
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM cargado, verificando dashboard...');
    
    // Configurar usuario por defecto
    if (!localStorage.getItem('user')) {
        const defaultUser = { id: 4, nombre: 'Admin', rol: 'administrador' };
        localStorage.setItem('user', JSON.stringify(defaultUser));
        localStorage.setItem('userId', '4');
        console.log('👤 Usuario por defecto configurado');
    }
    
    // Esperar 3 segundos antes de activar
    setTimeout(activarSecciones, 3000);
});

function activarSecciones() {
    console.log('🚀 Activando secciones del dashboard...');
    
    try {
        // 1. Verificar que existe el objeto principal del dashboard
        if (typeof window.dashboardAdmin !== 'undefined') {
            console.log('✅ DashboardAdmin encontrado');
            
            // Activar cada sección una por una
            activarSeccionUsuarios();
            activarSeccionCitas();
            activarSeccionFAQs();
            activarSeccionEvaluaciones();
            activarSeccionPagos();
            activarSeccionInventario();
            
        } else {
            console.log('⚠️ DashboardAdmin no encontrado, intentando de nuevo...');
            setTimeout(activarSecciones, 2000);
        }
        
    } catch (error) {
        console.error('❌ Error activando secciones:', error);
    }
}

function activarSeccionUsuarios() {
    try {
        if (window.dashboardAdmin && typeof window.dashboardAdmin.loadUsuarios === 'function') {
            console.log('👥 Activando sección usuarios...');
            window.dashboardAdmin.loadUsuarios();
        }
    } catch (error) {
        console.log('⚠️ Error en sección usuarios:', error.message);
    }
}

function activarSeccionCitas() {
    try {
        if (window.dashboardAdmin && typeof window.dashboardAdmin.loadCitas === 'function') {
            console.log('📅 Activando sección citas...');
            window.dashboardAdmin.loadCitas();
        }
    } catch (error) {
        console.log('⚠️ Error en sección citas:', error.message);
    }
}

function activarSeccionFAQs() {
    try {
        if (window.dashboardAdmin && typeof window.dashboardAdmin.loadFAQs === 'function') {
            console.log('❓ Activando sección FAQs...');
            window.dashboardAdmin.loadFAQs();
        }
    } catch (error) {
        console.log('⚠️ Error en sección FAQs:', error.message);
    }
}

function activarSeccionEvaluaciones() {
    try {
        if (window.dashboardAdmin && typeof window.dashboardAdmin.loadEvaluaciones === 'function') {
            console.log('⭐ Activando sección evaluaciones...');
            window.dashboardAdmin.loadEvaluaciones();
        }
    } catch (error) {
        console.log('⚠️ Error en sección evaluaciones:', error.message);
    }
}

function activarSeccionPagos() {
    try {
        if (window.adminPagosModule && typeof window.adminPagosModule.cargarHistorialPagos === 'function') {
            console.log('💰 Activando sección pagos...');
            window.adminPagosModule.cargarHistorialPagos();
        }
    } catch (error) {
        console.log('⚠️ Error en sección pagos:', error.message);
    }
}

function activarSeccionInventario() {
    try {
        // Intentar con función global primero
        if (typeof loadInventario === 'function') {
            console.log('📦 Activando inventario (función global)...');
            loadInventario();
        }
        
        // Intentar con función de sedes
        if (typeof loadSedes === 'function') {
            console.log('🏢 Activando sedes (función global)...');
            loadSedes();
        }
        
        // Intentar con función del dashboard
        if (window.dashboardAdmin && typeof window.dashboardAdmin.loadInventario === 'function') {
            console.log('📦 Activando inventario (dashboard)...');
            window.dashboardAdmin.loadInventario();
        }
        
    } catch (error) {
        console.log('⚠️ Error en sección inventario:', error.message);
    }
}

// Función para reactivar manualmente desde consola
window.reactivarDashboard = function() {
    console.log('🔄 Reactivando dashboard manualmente...');
    activarSecciones();
};

// Función para verificar estado
window.verificarEstadoDashboard = function() {
    console.log('🔍 Verificando estado del dashboard...');
    
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
    
    secciones.forEach(seccionId => {
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            const esVisible = !seccion.classList.contains('d-none') && seccion.style.display !== 'none';
            console.log(`📋 ${seccionId}: ${seccion ? '✅ Existe' : '❌ No existe'} - ${esVisible ? 'Visible' : 'Oculta'}`);
        } else {
            console.log(`📋 ${seccionId}: ❌ No encontrada`);
        }
    });
    
    // Verificar navegación
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    console.log(`🧭 Enlaces de navegación: ${navLinks.length} encontrados`);
};

console.log('✅ Script de activación cargado');
