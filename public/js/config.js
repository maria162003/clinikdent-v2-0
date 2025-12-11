/**
 * Configuración global de la aplicación
 */
const CONFIG = {
    // Entorno de la aplicación: 'production', 'development', 'demo'
    // En producción, cambiar a 'production'
    ENV: 'development',
    
    // URL base de la API
    API_URL: '/api',
    
    // Habilitar modo de demostración en desarrollo
    ALLOW_DEMO_MODE: true,
    
    // Tiempo de expiración del token en minutos
    TOKEN_EXPIRY: 60,
    
    // Versión de la aplicación
    VERSION: '1.0.0'
};

/**
 * Determina si la aplicación puede usar el modo de demostración
 * cuando no hay autenticación o hay errores
 */
function isDemoModeAllowed() {
    // En producción, nunca permitir modo demo
    if (CONFIG.ENV === 'production') return false;
    
    // En demo, siempre permitirlo
    if (CONFIG.ENV === 'demo') return true;
    
    // En desarrollo, depende de la configuración
    return CONFIG.ALLOW_DEMO_MODE && 
           (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1');
}
