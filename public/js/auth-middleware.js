// Middleware de autenticación y seguridad
class AuthMiddleware {
    constructor() {
        this.init();
    }

    init() {
        // Verificar autenticación al cargar cualquier página protegida
        this.checkAuthentication();
        
        // Configurar listeners de seguridad
        this.setupSecurityListeners();
        
        // Configurar timeouts de sesión
        this.setupSessionTimeout();
    }

    checkAuthentication() {
        const currentPage = window.location.pathname;
        const protectedPages = [
            '/dashboard-odontologo.html',
            '/dashboard-paciente.html',
            '/dashboard-admin.html'
        ];

        // Si estamos en una página protegida
        if (protectedPages.some(page => currentPage.includes(page))) {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole');
            
            console.log('🔍 DEBUG AUTH - currentPage:', currentPage);
            console.log('🔍 DEBUG AUTH - userId:', userId);
            console.log('🔍 DEBUG AUTH - userRole:', userRole);
            console.log('🔍 DEBUG AUTH - localStorage full:', Object.entries(localStorage));
            
            if (!userId || !userRole) {
                console.log('❌ Acceso denegado: No hay sesión activa');
                this.forceLogout();
                return false;
            }

            // Verificar que el rol coincida con la página
            if (currentPage.includes('odontologo') && userRole !== 'odontologo') {
                console.log('❌ Acceso denegado: Rol incorrecto para odontólogo');
                console.log('❌ Esperado: odontologo, Recibido:', userRole);
                this.forceLogout();
                return false;
            }

            if (currentPage.includes('paciente') && userRole !== 'paciente') {
                console.log('❌ Acceso denegado: Rol incorrecto para paciente');
                this.forceLogout();
                return false;
            }

            if (currentPage.includes('admin') && userRole !== 'admin') {
                console.log('❌ Acceso denegado: Rol incorrecto para admin');
                this.forceLogout();
                return false;
            }

            console.log('✅ Autenticación válida');
            return true;
        }

        return true; // Páginas públicas no requieren autenticación
    }

    setupSecurityListeners() {
        // Prevenir navegación hacia atrás después del logout
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                // Página cargada desde cache del navegador
                if (!this.checkAuthentication()) {
                    return;
                }
            }
        });

        // Manejar cambios en el historial del navegador
        window.addEventListener('popstate', (event) => {
            if (!this.checkAuthentication()) {
                return;
            }
        });

        // Detectar cambios en localStorage (cierre de sesión en otra pestaña)
        window.addEventListener('storage', (event) => {
            if (event.key === 'userId' && event.newValue === null) {
                console.log('🔒 Sesión cerrada en otra pestaña');
                this.forceLogout();
            }
        });

        // Limpiar sesión al cerrar la ventana/pestaña
        window.addEventListener('beforeunload', () => {
            // Solo limpiar si estamos en proceso de logout
            if (window.loggingOut) {
                this.clearSession();
            }
        });
    }

    setupSessionTimeout() {
        // Configurar timeout de sesión (30 minutos de inactividad)
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
        let sessionTimer;

        const resetSessionTimer = () => {
            clearTimeout(sessionTimer);
            sessionTimer = setTimeout(() => {
                console.log('⏰ Sesión expirada por inactividad');
                this.forceLogout('timeout');
            }, SESSION_TIMEOUT);
        };

        // Eventos que indican actividad del usuario
        const userActivityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        userActivityEvents.forEach(event => {
            document.addEventListener(event, resetSessionTimer, true);
        });

        // Iniciar el timer
        resetSessionTimer();
    }

    forceLogout(reason = 'security') {
        console.log(`🚨 Forzando cierre de sesión. Razón: ${reason}`);
        
        // Marcar que estamos en proceso de logout
        window.loggingOut = true;
        
        // Limpiar toda la información de sesión
        this.clearSession();
        
        // Prevenir navegación hacia atrás
        this.clearBrowserHistory();
        
        // Redirigir al index con la razón del logout
        const indexUrl = reason === 'timeout' 
            ? '/index.html?session=timeout'
            : '/index.html?session=expired';
            
        window.location.replace(indexUrl);
    }

    clearSession() {
        // Limpiar localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        
        // Limpiar sessionStorage
        sessionStorage.clear();
        
        // Limpiar cookies si las hay
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
    }

    clearBrowserHistory() {
        // Reemplazar el estado actual del historial
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, '/index.html');
        }
    }

    // Método para logout seguro desde cualquier dashboard
    secureLogout() {
        console.log('🔐 Iniciando logout seguro...');
        
        // Marcar que estamos cerrando sesión
        window.loggingOut = true;
        
        // Limpiar sesión
        this.clearSession();
        
        // Limpiar historial del navegador
        this.clearBrowserHistory();
        
        // Redirigir al index
        window.location.replace('/index.html?logout=success');
    }
}

// Inicializar el middleware automáticamente
document.addEventListener('DOMContentLoaded', function() {
    window.authMiddleware = new AuthMiddleware();
});

// Función global para logout seguro
window.secureLogout = function() {
    if (window.authMiddleware) {
        window.authMiddleware.secureLogout();
    } else {
        // Fallback si el middleware no está disponible
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/index.html');
    }
};
