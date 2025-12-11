/**
 * ============================================================================
 * SISTEMA DE ALERTAS MEJORADAS - CLINIKDENT
 * Mejora las alertas existentes con estilos modernos y animaciones
 * ============================================================================
 */

// Función mejorada para mostrar notificaciones
function showNotificationMejorada(message, type = 'success', duration = 5000, options = {}) {
    // Tipos de iconos para cada alerta
    const iconMap = {
        'success': 'bi-check-circle-fill',
        'error': 'bi-exclamation-triangle-fill',
        'danger': 'bi-exclamation-triangle-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'info': 'bi-info-circle-fill',
        'primary': 'bi-info-circle-fill'
    };

    // Mapear tipo 'error' a 'danger' para Bootstrap
    const alertType = type === 'error' ? 'danger' : type;
    const icon = iconMap[alertType] || iconMap['info'];

    // Crear contenedor de alertas si no existe
    let alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) {
        alertsContainer = document.createElement('div');
        alertsContainer.id = 'alerts-container';
        alertsContainer.className = 'alerts-container';
        document.body.appendChild(alertsContainer);
    }

    // Crear elemento de alerta
    const alertId = 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = `alert alert-${alertType} alert-dismissible fade show position-fixed`;
    
    // Agregar clases adicionales si se especifican
    if (options.compact) alertElement.classList.add('alert-compact');
    if (options.pulse) alertElement.classList.add('pulse');
    if (options.rounded) alertElement.classList.add('rounded-pill');
    if (options.interactive) alertElement.classList.add('alert-interactive');

    // Contenido del alert con icono
    const alertContent = `
        <div class="d-flex align-items-start">
            <i class="bi ${icon} alert-icon flex-shrink-0"></i>
            <div class="flex-grow-1">
                ${options.title ? `<strong>${options.title}</strong><br>` : ''}
                ${message}
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        ${options.showProgress !== false ? `<div class="alert-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
    `;

    alertElement.innerHTML = alertContent;

    // Agregar al contenedor
    alertsContainer.appendChild(alertElement);

    // Auto-remover después del tiempo especificado
    const autoRemoveTimer = setTimeout(() => {
        removeAlert(alertElement);
    }, duration);

    // Función para remover el alert con animación
    function removeAlert(element) {
        if (element && element.parentNode) {
            element.classList.add('fade-out');
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

    // Event listener para alertas interactivas
    if (options.interactive && options.onClick) {
        alertElement.style.cursor = 'pointer';
        alertElement.onclick = (e) => {
            if (!e.target.classList.contains('btn-close')) {
                options.onClick();
            }
        };
    }

    return alertElement;
}

// Función para mostrar alerta de éxito
function showSuccess(message, options = {}) {
    return showNotificationMejorada(message, 'success', 4000, {
        title: '¡Éxito!',
        ...options
    });
}

// Función para mostrar alerta de error
function showError(message, options = {}) {
    return showNotificationMejorada(message, 'error', 6000, {
        title: 'Error',
        ...options
    });
}

// Función para mostrar alerta de advertencia
function showWarning(message, options = {}) {
    return showNotificationMejorada(message, 'warning', 5000, {
        title: 'Advertencia',
        ...options
    });
}

// Función para mostrar alerta informativa
function showInfo(message, options = {}) {
    return showNotificationMejorada(message, 'info', 4000, {
        title: 'Información',
        ...options
    });
}

// Sobrescribir la función showNotification existente para mantener compatibilidad
function showNotification(message, type = 'success', duration = 5000) {
    return showNotificationMejorada(message, type, duration);
}

// Función para limpiar todas las alertas
function clearAllAlerts() {
    const alertsContainer = document.getElementById('alerts-container');
    if (alertsContainer) {
        const alerts = alertsContainer.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.classList.add('fade-out');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 300);
        });
    }
}

// Función para mostrar alertas con confirmación
function showConfirmAlert(message, onConfirm, onCancel = null, options = {}) {
    const alertElement = showNotificationMejorada(
        `${message}
        <div class="mt-2">
            <button class="btn btn-sm btn-success me-2 confirm-btn">
                <i class="bi bi-check"></i> Sí
            </button>
            <button class="btn btn-sm btn-secondary cancel-btn">
                <i class="bi bi-x"></i> No
            </button>
        </div>`,
        options.type || 'warning',
        0, // No auto-remover
        {
            title: options.title || '¿Confirmar?',
            showProgress: false,
            ...options
        }
    );

    // Event listeners para los botones
    const confirmBtn = alertElement.querySelector('.confirm-btn');
    const cancelBtn = alertElement.querySelector('.cancel-btn');

    confirmBtn.onclick = () => {
        alertElement.remove();
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
        alertElement.remove();
        if (onCancel) onCancel();
    };

    return alertElement;
}

// Función para mostrar alertas con acciones personalizadas
function showActionAlert(message, actions = [], options = {}) {
    let actionsHtml = '';
    if (actions.length > 0) {
        actionsHtml = '<div class="mt-2">';
        actions.forEach((action, index) => {
            const btnClass = action.class || 'btn-secondary';
            const icon = action.icon ? `<i class="bi ${action.icon}"></i> ` : '';
            actionsHtml += `<button class="btn btn-sm ${btnClass} me-2 action-btn" data-action="${index}">
                ${icon}${action.text}
            </button>`;
        });
        actionsHtml += '</div>';
    }

    const alertElement = showNotificationMejorada(
        message + actionsHtml,
        options.type || 'info',
        options.duration || 0,
        {
            showProgress: false,
            ...options
        }
    );

    // Event listeners para los botones de acción
    const actionBtns = alertElement.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.onclick = () => {
            const actionIndex = parseInt(btn.dataset.action);
            const action = actions[actionIndex];
            if (action && action.callback) {
                action.callback();
            }
            if (action && action.closeOnClick !== false) {
                alertElement.remove();
            }
        };
    });

    return alertElement;
}

// Función para mostrar notificaciones en stack (apiladas)
function showStackedAlert(message, type = 'info', options = {}) {
    return showNotificationMejorada(message, type, options.duration || 4000, {
        compact: true,
        ...options
    });
}

// Función para inicializar el sistema de alertas mejoradas
function initAlertsSystem() {
    // Agregar estilos si no están cargados
    if (!document.getElementById('alerts-styles')) {
        const link = document.createElement('link');
        link.id = 'alerts-styles';
        link.rel = 'stylesheet';
        link.href = '/css/alerts-mejoradas.css';
        document.head.appendChild(link);
    }

    // Mejorar alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => {
        if (!alert.querySelector('.alert-icon')) {
            const icon = document.createElement('i');
            if (alert.classList.contains('alert-success')) {
                icon.className = 'bi bi-check-circle-fill alert-icon';
            } else if (alert.classList.contains('alert-danger')) {
                icon.className = 'bi bi-exclamation-triangle-fill alert-icon';
            } else if (alert.classList.contains('alert-warning')) {
                icon.className = 'bi bi-exclamation-triangle-fill alert-icon';
            } else if (alert.classList.contains('alert-info')) {
                icon.className = 'bi bi-info-circle-fill alert-icon';
            }
            
            if (icon.className) {
                alert.insertBefore(icon, alert.firstChild);
            }
        }
    });

    console.log('✅ Sistema de alertas mejoradas inicializado');
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlertsSystem);
} else {
    initAlertsSystem();
}

// Exportar funciones para uso global
window.showNotificationMejorada = showNotificationMejorada;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.clearAllAlerts = clearAllAlerts;
window.showConfirmAlert = showConfirmAlert;
window.showActionAlert = showActionAlert;
window.showStackedAlert = showStackedAlert;