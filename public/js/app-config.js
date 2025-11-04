/**
 * Configuración global de la aplicación
 */
const appConfig = {
    // Determina si estamos en modo desarrollo
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Si es true, permite el modo demo cuando no hay autenticación en desarrollo
    allowDemoMode: false,
    
    // API URLs base
    apiUrl: '/api',
    
    // Timeout para solicitudes API (en ms)
    apiTimeout: 10000,
};

// Exportar la configuración
window.appConfig = appConfig;
