/**
 * ============================================================================
 * INICIALIZADOR DE ALERTAS MEJORADAS - CLINIKDENT
 * Auto-carga los estilos y funcionalidades de alertas mejoradas
 * ============================================================================
 */

(function() {
    'use strict';

    // Verificar si ya está inicializado
    if (window.alertasMejoradasLoaded) {
        return;
    }

    // Marcar como cargado
    window.alertasMejoradasLoaded = true;

    // Función para cargar CSS
    function loadCSS(href, id) {
        if (document.getElementById(id)) {
            return; // Ya está cargado
        }
        
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    // Función para cargar JavaScript
    function loadJS(src, id, callback) {
        if (document.getElementById(id)) {
            if (callback) callback();
            return; // Ya está cargado
        }
        
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }

    // Cargar Bootstrap Icons si no están disponibles
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
        loadCSS('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css', 'bootstrap-icons');
    }

    // Cargar estilos de alertas mejoradas
    loadCSS('/css/alerts-mejoradas.css?v=' + Date.now(), 'alerts-mejoradas-css');

    // Funciones mejoradas de alertas integradas
    window.showNotificationMejorada = function(message, type = 'success', duration = 5000, options = {}) {
        const iconMap = {
            'success': 'bi-check-circle-fill',
            'error': 'bi-exclamation-triangle-fill',
            'danger': 'bi-exclamation-triangle-fill',
            'warning': 'bi-exclamation-triangle-fill',
            'info': 'bi-info-circle-fill',
            'primary': 'bi-info-circle-fill'
        };

        const alertType = type === 'error' ? 'danger' : type;
        const icon = iconMap[alertType] || iconMap['info'];

        // Crear contenedor de alertas si no existe
        let alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) {
            alertsContainer = document.createElement('div');
            alertsContainer.id = 'alerts-container';
            alertsContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(alertsContainer);
        }

        const alertId = 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const alertElement = document.createElement('div');
        alertElement.id = alertId;
        alertElement.className = `alert alert-${alertType} alert-dismissible fade show`;
        
        // Estilos inline para garantizar compatibilidad
        alertElement.style.cssText = `
            min-width: 350px;
            max-width: 500px;
            margin-bottom: 0.75rem;
            pointer-events: all;
            border: none;
            border-radius: 12px;
            padding: 1rem 1.25rem;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            animation: alertSlideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            border-left: 4px solid var(--bs-${alertType});
        `;

        // Aplicar gradientes según el tipo
        const gradients = {
            'success': 'linear-gradient(135deg, #d4edda, #c3e6cb)',
            'danger': 'linear-gradient(135deg, #f8d7da, #f1b6bb)',
            'warning': 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
            'info': 'linear-gradient(135deg, #d1ecf1, #bee5eb)',
            'primary': 'linear-gradient(135deg, #d6e9ff, #cce7ff)'
        };
        
        alertElement.style.background = gradients[alertType] || gradients['info'];

        // Contenido del alert con icono
        const alertContent = `
            <div class="d-flex align-items-start">
                <i class="bi ${icon}" style="color: var(--bs-${alertType}); font-size: 1.2em; margin-right: 0.75rem; flex-shrink: 0;"></i>
                <div class="flex-grow-1">
                    ${options.title ? `<strong>${options.title}</strong><br>` : ''}
                    ${message}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" style="background: none; border: none; font-size: 1.2em; opacity: 0.6; transition: all 0.2s ease; padding: 0.25rem; margin: -0.25rem -0.25rem -0.25rem 0;"></button>
            </div>
            ${options.showProgress !== false ? `<div class="alert-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; background: var(--bs-${alertType}); animation: progressBar ${duration}ms linear;"></div>` : ''}
        `;

        alertElement.innerHTML = alertContent;
        alertsContainer.appendChild(alertElement);

        // Agregar estilos de animación si no existen
        if (!document.getElementById('alert-animations-inline')) {
            const style = document.createElement('style');
            style.id = 'alert-animations-inline';
            style.textContent = `
                @keyframes alertSlideInRight {
                    0% { opacity: 0; transform: translateX(100%) scale(0.9); }
                    100% { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes progressBar {
                    0% { width: 100%; }
                    100% { width: 0%; }
                }
                .btn-close:hover {
                    opacity: 1 !important;
                    transform: scale(1.1) !important;
                }
                @media (max-width: 768px) {
                    #alerts-container {
                        left: 10px !important;
                        right: 10px !important;
                    }
                    #alerts-container .alert {
                        min-width: auto !important;
                        max-width: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Auto-remover después del tiempo especificado
        const autoRemoveTimer = setTimeout(() => {
            removeAlert(alertElement);
        }, duration);

        // Función para remover el alert con animación
        function removeAlert(element) {
            if (element && element.parentNode) {
                element.style.animation = 'alertSlideInRight 0.3s ease-in-out reverse';
                setTimeout(() => {
                    if (element.parentNode) {
                        element.remove();
                    }
                }, 300);
            }
        }

        // Event listener para el botón de cerrar
        const closeBtn = alertElement.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                clearTimeout(autoRemoveTimer);
                removeAlert(alertElement);
            };
        }

        return alertElement;
    };

    // Funciones de conveniencia
    window.showSuccess = function(message, options = {}) {
        return window.showNotificationMejorada(message, 'success', 4000, {
            title: '¡Éxito!',
            ...options
        });
    };

    window.showError = function(message, options = {}) {
        return window.showNotificationMejorada(message, 'error', 6000, {
            title: 'Error',
            ...options
        });
    };

    window.showWarning = function(message, options = {}) {
        return window.showNotificationMejorada(message, 'warning', 5000, {
            title: 'Advertencia',
            ...options
        });
    };

    window.showInfo = function(message, options = {}) {
        return window.showNotificationMejorada(message, 'info', 4000, {
            title: 'Información',
            ...options
        });
    };

    // Sobrescribir showNotification existente si existe
    if (typeof window.showNotification === 'function') {
        window.showNotificationOriginal = window.showNotification;
    }
    
    window.showNotification = function(message, type = 'success', duration = 5000) {
        return window.showNotificationMejorada(message, type, duration);
    };

    // Mejorar alertas existentes en la página
    function enhanceExistingAlerts() {
        const existingAlerts = document.querySelectorAll('.alert:not(.enhanced)');
        existingAlerts.forEach(alert => {
            if (!alert.querySelector('.alert-icon')) {
                const icon = document.createElement('i');
                icon.className = 'alert-icon';
                icon.style.marginRight = '0.75rem';
                
                if (alert.classList.contains('alert-success')) {
                    icon.classList.add('bi', 'bi-check-circle-fill');
                    icon.style.color = '#28a745';
                } else if (alert.classList.contains('alert-danger')) {
                    icon.classList.add('bi', 'bi-exclamation-triangle-fill');
                    icon.style.color = '#dc3545';
                } else if (alert.classList.contains('alert-warning')) {
                    icon.classList.add('bi', 'bi-exclamation-triangle-fill');
                    icon.style.color = '#ffc107';
                } else if (alert.classList.contains('alert-info')) {
                    icon.classList.add('bi', 'bi-info-circle-fill');
                    icon.style.color = '#17a2b8';
                }
                
                if (icon.classList.contains('bi')) {
                    alert.insertBefore(icon, alert.firstChild);
                }
            }
            alert.classList.add('enhanced');
        });
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(enhanceExistingAlerts, 100);
        });
    } else {
        setTimeout(enhanceExistingAlerts, 100);
    }

    // Observer para detectar nuevas alertas
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && (node.classList.contains('alert') || node.querySelector('.alert'))) {
                    setTimeout(enhanceExistingAlerts, 50);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Sistema de alertas mejoradas inicializado correctamente');

})();