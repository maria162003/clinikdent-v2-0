/**
 * ============================================================================
 * REEMPLAZO GLOBAL DE ALERTS Y CONFIRMS FEOS - CLINIKDENT
 * Sobrescribe las funciones nativas con versiones mejoradas
 * ============================================================================
 */

(function() {
    'use strict';

    // Guardar referencias originales
    window.originalAlert = window.alert;
    window.originalConfirm = window.confirm;

    // Función para mostrar alert mejorado
    window.alert = function(message) {
        return showCustomAlert({
            type: 'info',
            title: 'Información',
            message: message,
            confirmText: 'Aceptar'
        });
    };

    // Función para mostrar confirm mejorado
    window.confirm = function(message) {
        return showCustomConfirm({
            type: 'warning',
            title: '¿Confirmar?',
            message: message,
            confirmText: 'Aceptar',
            cancelText: 'Cancelar'
        });
    };

    // Función para mostrar alert personalizado
    function showCustomAlert(options) {
        return new Promise((resolve) => {
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.className = 'custom-alert-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            `;

            // Crear modal
            const modal = document.createElement('div');
            modal.className = 'custom-alert-modal';
            modal.style.cssText = `
                background: white;
                border-radius: 16px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                animation: slideInAlert 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                overflow: hidden;
                position: relative;
            `;

            const iconColors = {
                info: '#17a2b8',
                warning: '#ffc107',
                danger: '#dc3545',
                success: '#28a745'
            };

            const iconIcons = {
                info: 'bi-info-circle-fill',
                warning: 'bi-exclamation-triangle-fill',
                danger: 'bi-exclamation-triangle-fill',
                success: 'bi-check-circle-fill'
            };

            const iconColor = iconColors[options.type] || iconColors.info;
            const iconClass = iconIcons[options.type] || iconIcons.info;

            modal.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, ${iconColor}20, ${iconColor}08);
                    padding: 2.5rem 2rem 1.5rem 2rem;
                    text-align: center;
                    border-bottom: 1px solid #eee;
                    position: relative;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: ${iconColor};
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 1.5rem;
                        color: white;
                        font-size: 36px;
                        box-shadow: 0 8px 25px ${iconColor}40;
                    ">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <h4 style="
                        margin: 0; 
                        color: #333; 
                        font-weight: 600;
                        font-size: 1.5em;
                    ">
                        ${options.title || 'Información'}
                    </h4>
                </div>
                <div style="padding: 2rem;">
                    <p style="
                        margin: 0 0 2rem 0; 
                        color: #555; 
                        line-height: 1.6; 
                        text-align: left;
                        font-size: 1.1em;
                    ">
                        ${options.message || ''}
                    </p>
                    <div style="
                        display: flex;
                        justify-content: center;
                        gap: 1rem;
                    ">
                        <button type="button" class="custom-alert-accept" style="
                            padding: 1rem 2rem;
                            border: none;
                            background: ${iconColor};
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 1.1em;
                            transition: all 0.2s;
                            min-width: 120px;
                            box-shadow: 0 4px 15px ${iconColor}40;
                        ">
                            ${options.confirmText || 'Aceptar'}
                        </button>
                    </div>
                </div>
            `;

            // Agregar estilos de animación
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInAlert {
                    from { 
                        opacity: 0;
                        transform: scale(0.8) translateY(-30px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .custom-alert-accept:hover {
                    opacity: 0.9 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px ${iconColor}50 !important;
                }
            `;
            document.head.appendChild(style);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listeners
            const acceptBtn = modal.querySelector('.custom-alert-accept');

            const cleanup = () => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            };

            acceptBtn.onclick = () => {
                cleanup();
                resolve(true);
            };

            // Cerrar con overlay
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(true);
                }
            };

            // Cerrar con ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(true);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    // Función para mostrar confirm personalizado
    function showCustomConfirm(options) {
        return new Promise((resolve) => {
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.className = 'custom-confirm-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            `;

            // Crear modal
            const modal = document.createElement('div');
            modal.className = 'custom-confirm-modal';
            modal.style.cssText = `
                background: white;
                border-radius: 16px;
                padding: 0;
                max-width: 520px;
                width: 90%;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                animation: slideInAlert 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                overflow: hidden;
            `;

            const iconColors = {
                warning: '#ffc107',
                danger: '#dc3545',
                info: '#17a2b8',
                success: '#28a745'
            };

            const iconIcons = {
                warning: 'bi-exclamation-triangle-fill',
                danger: 'bi-exclamation-triangle-fill',
                info: 'bi-info-circle-fill',
                success: 'bi-check-circle-fill'
            };

            const iconColor = iconColors[options.type] || iconColors.warning;
            const iconClass = iconIcons[options.type] || iconIcons.warning;

            modal.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, ${iconColor}20, ${iconColor}08);
                    padding: 2.5rem 2rem 1.5rem 2rem;
                    text-align: center;
                    border-bottom: 1px solid #eee;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: ${iconColor};
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 1.5rem;
                        color: white;
                        font-size: 36px;
                        box-shadow: 0 8px 25px ${iconColor}40;
                    ">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <h4 style="
                        margin: 0; 
                        color: #333; 
                        font-weight: 600;
                        font-size: 1.5em;
                    ">
                        ${options.title || '¿Confirmar?'}
                    </h4>
                </div>
                <div style="padding: 2rem;">
                    <p style="
                        margin: 0 0 2rem 0; 
                        color: #555; 
                        line-height: 1.6; 
                        text-align: left;
                        font-size: 1.1em;
                    ">
                        ${options.message || '¿Está seguro de que desea continuar?'}
                    </p>
                    <div style="
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                    ">
                        <button type="button" class="custom-confirm-cancel" style="
                            padding: 1rem 1.5rem;
                            border: 2px solid #ddd;
                            background: white;
                            color: #666;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 1rem;
                            transition: all 0.2s;
                            min-width: 110px;
                        ">
                            ${options.cancelText || 'Cancelar'}
                        </button>
                        <button type="button" class="custom-confirm-accept" style="
                            padding: 1rem 1.5rem;
                            border: none;
                            background: ${iconColor};
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 1rem;
                            transition: all 0.2s;
                            min-width: 110px;
                            box-shadow: 0 4px 15px ${iconColor}40;
                        ">
                            ${options.confirmText || 'Aceptar'}
                        </button>
                    </div>
                </div>
            `;

            // Agregar estilos de animación
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInAlert {
                    from { 
                        opacity: 0;
                        transform: scale(0.8) translateY(-30px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .custom-confirm-cancel:hover {
                    background: #f8f9fa !important;
                    border-color: #adb5bd !important;
                    transform: translateY(-2px) !important;
                }
                .custom-confirm-accept:hover {
                    opacity: 0.9 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px ${iconColor}50 !important;
                }
            `;
            document.head.appendChild(style);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listeners
            const cancelBtn = modal.querySelector('.custom-confirm-cancel');
            const acceptBtn = modal.querySelector('.custom-confirm-accept');

            const cleanup = () => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            acceptBtn.onclick = () => {
                cleanup();
                resolve(true);
            };

            // Cerrar con overlay (cancelar)
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            };

            // Cerrar con ESC (cancelar)
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    // Exportar funciones para uso manual
    window.showCustomAlert = showCustomAlert;
    window.showCustomConfirm = showCustomConfirm;

    console.log('✅ Reemplazo global de alerts y confirms activado');

})();