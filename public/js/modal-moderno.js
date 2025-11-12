/**
 * Sistema de Modales Modernos
 * Reemplazo visual mejorado para confirm() y alert()
 */

class ModalModerno {
    constructor() {
        this.modalActivo = null;
    }

    /**
     * Muestra un modal de confirmación con opciones
     * @param {Object} options - Configuración del modal
     * @returns {Promise<string>} - Retorna 'ok', 'cancel', o valor personalizado
     */
    async mostrarConfirmacion(options) {
        const {
            titulo = '¿Está seguro?',
            mensaje = '',
            detalles = null,
            opciones = null,
            nota = null,
            tipo = 'info', // 'info', 'warning', 'danger'
            textoOk = 'Aceptar',
            textoCancelar = 'Cancelar',
            colorBotonOk = 'primary', // 'primary', 'danger', 'warning'
            mostrarCancelar = true
        } = options;

        return new Promise((resolve) => {
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay-custom';

            // Crear contenido del modal
            const modal = document.createElement('div');
            modal.className = 'modal-content-custom';

            // Header con icono
            const iconos = {
                info: '❓',
                warning: '⚠️',
                danger: '🗑️'
            };

            let html = `
                <div class="modal-header-custom">
                    <div class="modal-icon-custom ${tipo}">
                        ${iconos[tipo] || iconos.info}
                    </div>
                    <h3 class="modal-title-custom">${titulo}</h3>
                </div>
                <div class="modal-body-custom">
                    ${mensaje ? `<p class="modal-message-custom">${mensaje}</p>` : ''}
                    ${detalles ? `
                        <div class="modal-detail-custom">
                            ${detalles}
                        </div>
                    ` : ''}
                    ${opciones ? `
                        <div class="modal-options-custom">
                            ${opciones}
                        </div>
                    ` : ''}
                    ${nota ? `
                        <div class="modal-note-custom">
                            ${nota}
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer-custom">
                    ${mostrarCancelar ? `
                        <button class="modal-btn-custom btn-cancel" data-action="cancel">
                            ${textoCancelar}
                        </button>
                    ` : ''}
                    <button class="modal-btn-custom btn-${colorBotonOk}" data-action="ok">
                        ${textoOk}
                    </button>
                </div>
            `;

            modal.innerHTML = html;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            this.modalActivo = overlay;

            // Animación de entrada
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });

            // Event listeners para botones
            const botones = modal.querySelectorAll('[data-action]');
            botones.forEach(boton => {
                boton.addEventListener('click', () => {
                    const accion = boton.dataset.action;
                    this.cerrarModal(overlay);
                    resolve(accion);
                });
            });

            // Cerrar con ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    this.cerrarModal(overlay);
                    resolve('cancel');
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // Cerrar al hacer click fuera
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.cerrarModal(overlay);
                    resolve('cancel');
                }
            });
        });
    }

    /**
     * Modal con opciones personalizadas (eliminar o cancelar)
     */
    async mostrarOpcionesCita(fecha, hora, horasRestantes) {
        const resultado = await this.mostrarConfirmacion({
            titulo: '¿Qué desea hacer con esta cita?',
            mensaje: '',
            detalles: `
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Hora:</strong> ${hora}</p>
            `,
            opciones: `
                <div class="option-item">
                    <div class="option-icon primary">✓</div>
                    <div class="option-text">
                        <strong>Aceptar:</strong> Eliminar completamente la cita del sistema
                    </div>
                </div>
                <div class="option-item">
                    <div class="option-icon secondary">✕</div>
                    <div class="option-text">
                        <strong>Cancelar:</strong> Solo cambiar el estado a "cancelada"
                    </div>
                </div>
            `,
            nota: `<p><strong>Tiempo restante:</strong> ${horasRestantes} horas</p>`,
            tipo: 'warning',
            textoOk: 'Eliminar Cita',
            textoCancelar: 'Cambiar a Cancelada',
            colorBotonOk: 'danger'
        });

        return resultado;
    }

    /**
     * Modal simple de confirmación
     */
    async confirmarCancelacion(fecha, hora, mensaje = null) {
        const resultado = await this.mostrarConfirmacion({
            titulo: '¿Cancelar esta cita?',
            mensaje: 'Esta acción cambiará el estado de la cita a "cancelada".',
            detalles: `
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Hora:</strong> ${hora}</p>
            `,
            nota: mensaje ? `<p>${mensaje}</p>` : null,
            tipo: 'warning',
            textoOk: 'Sí, Cancelar',
            textoCancelar: 'No, Volver',
            colorBotonOk: 'warning'
        });

        return resultado === 'ok';
    }

    /**
     * Modal de advertencia (cuando no se puede cancelar)
     */
    async mostrarAdvertencia(mensaje, horasRestantes) {
        await this.mostrarConfirmacion({
            titulo: 'No se puede cancelar',
            mensaje: mensaje,
            nota: `<p><strong>Tiempo restante:</strong> ${horasRestantes} horas</p>`,
            tipo: 'warning',
            textoOk: 'Entendido',
            mostrarCancelar: false,
            colorBotonOk: 'warning'
        });
    }

    /**
     * Cierra el modal con animación
     */
    cerrarModal(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            if (this.modalActivo === overlay) {
                this.modalActivo = null;
            }
        }, 200);
    }
}

// Crear instancia global
window.modalModerno = new ModalModerno();
