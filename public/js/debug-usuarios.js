// Forzar recarga de usuarios en dashboard admin
console.log('🔄 Script de recarga de usuarios ejecutándose...');

// Función para forzar la recarga de usuarios
function forceReloadUsuarios() {
    console.log('🔄 Forzando recarga de usuarios...');
    
    if (window.dashboardAdmin && window.dashboardAdmin.loadUsuarios) {
        console.log('✅ Dashboard admin encontrado, cargando usuarios...');
        window.dashboardAdmin.loadUsuarios();
    } else {
        console.log('⚠️ Dashboard admin no encontrado, intentando cargar desde DashboardAdmin...');
        if (window.DashboardAdmin) {
            const dashboard = new window.DashboardAdmin();
            dashboard.loadUsuarios();
        }
    }
}

// Función para verificar el estado de los usuarios
function checkUsuariosStatus() {
    console.log('🔍 Verificando estado de usuarios...');
    
    if (window.dashboardAdmin && window.dashboardAdmin.users) {
        console.log(`📊 Usuarios cargados: ${window.dashboardAdmin.users.length}`);
        console.log('👥 Lista de usuarios:', window.dashboardAdmin.users);
        return window.dashboardAdmin.users;
    } else {
        console.log('❌ No se encontraron usuarios cargados');
        return [];
    }
}

// Función para probar la API directamente
async function testUsuariosAPI() {
    console.log('🧪 Probando API de usuarios...');
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        const response = await fetch('/api/usuarios', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId || '1'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const usuarios = await response.json();
        console.log('✅ API respuesta exitosa:', usuarios.length + ' usuarios');
        console.log('📋 Usuarios obtenidos:', usuarios);
        
        return usuarios;
    } catch (error) {
        console.error('❌ Error en API:', error);
        return null;
    }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, ejecutando verificaciones...');
    
    // Esperar un poco para que se cargue el dashboard
    setTimeout(() => {
        forceReloadUsuarios();
        checkUsuariosStatus();
    }, 2000);
    
    // Probar API después de un momento
    setTimeout(() => {
        testUsuariosAPI();
    }, 3000);
});

// Exponer funciones globalmente para uso en consola
window.forceReloadUsuarios = forceReloadUsuarios;
window.checkUsuariosStatus = checkUsuariosStatus;
window.testUsuariosAPI = testUsuariosAPI;

console.log('✅ Script de debug cargado. Funciones disponibles:');
console.log('  - forceReloadUsuarios()');
console.log('  - checkUsuariosStatus()'); 
console.log('  - testUsuariosAPI()');