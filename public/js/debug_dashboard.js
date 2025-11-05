// debug_dashboard.js - Script de depuración para el dashboard
console.log('🔍 DEPURANDO DASHBOARD ADMIN');

// 1. Verificar LocalStorage
console.log('📱 Estado de localStorage:');
console.log('  user:', localStorage.getItem('user'));
console.log('  userId:', localStorage.getItem('userId'));

// 2. Configurar usuario por defecto si no existe
if (!localStorage.getItem('user')) {
    console.log('⚙️ Configurando usuario por defecto...');
    const defaultUser = {
        id: 4,
        nombre: 'Admin',
        apellido: 'Test',
        rol: 'administrador'
    };
    localStorage.setItem('user', JSON.stringify(defaultUser));
    localStorage.setItem('userId', '4');
    console.log('✅ Usuario por defecto configurado');
}

// 3. Probar APIs manualmente
async function testAPI(url, name) {
    try {
        console.log(`🔄 Probando ${name}...`);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id || '4';
        
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ ${name} OK:`, Array.isArray(data) ? `${data.length} elementos` : typeof data);
        
        if (Array.isArray(data) && data.length > 0) {
            console.log(`   📋 Muestra:`, data[0]);
        }
        
        return data;
    } catch (error) {
        console.error(`❌ Error en ${name}:`, error.message);
        return null;
    }
}

// Función para verificar el estado del dashboard
function checkDashboard() {
    console.log('🔍 Verificando estado del dashboard...');
    
    // Verificar elementos del DOM
    const sections = [
        'usuarios-section',
        'citas-section', 
        'pagos-section',
        'faqs-section',
        'evaluaciones-section',
        'inventario-section',
        'reportes-section'
    ];
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        console.log(`📋 ${sectionId}:`, element ? 'Encontrado' : 'NO ENCONTRADO');
        
        if (element) {
            const table = element.querySelector('table tbody');
            if (table) {
                console.log(`  📊 Tabla ${sectionId}:`, table.children.length, 'filas');
            }
        }
    });
}

// 4. Función principal de depuración
async function debugDashboard() {
    console.log('\n🚀 INICIANDO PRUEBAS DE APIs...\n');
    
    const apis = [
        ['/api/usuarios', 'Usuarios'],
        ['/api/citas/admin/todas', 'Citas'],
        ['/api/faqs', 'FAQs'],
        ['/api/evaluaciones/admin/todas', 'Evaluaciones'],
        ['/api/inventario', 'Inventario']
    ];
    
    for (const [url, name] of apis) {
        const result = await testAPI(url, name);
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre requests
    }
    
    console.log('\n🎯 PRUEBAS COMPLETADAS');
    
    // 5. Verificar si DashboardAdmin está disponible
    if (typeof window.dashboardAdmin !== 'undefined') {
        console.log('✅ DashboardAdmin disponible');
        console.log('📊 Sección actual:', window.dashboardAdmin.currentSection);
    } else {
        console.log('⚠️ DashboardAdmin no disponible aún');
    }
}

// Auto-ejecutar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Dashboard cargado - Iniciando diagnóstico...');
    
    setTimeout(() => {
        checkDashboard();
        debugDashboard();
    }, 3000);
});

// Exponer funciones para uso manual en consola
window.debugFunctions = {
    testAPI,
    debugDashboard,
    checkDashboard
};

// 6. Ejecutar cuando la página esté lista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugDashboard);
} else {
    debugDashboard();
}

console.log('🔧 Script de depuración cargado. Resultados aparecerán abajo...');
