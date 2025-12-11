// =============================================// Función para formatear dinero
function formatMoney(amount) {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Función helper para realizar peticiones API (sin autenticación para testing)
async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.msg || result.message || 'Error en la petición');
        }
        
        return result;
    } catch (error) {
        console.error('Error en API request:', error);
        throw error;
    }
}
// FUNCIONALIDADES CRUD COMPLETAS PARA DASHBOARD ADMIN
// ============================================================================

// Variables globales para gestión de modales
let currentEditId = null;
let currentEditType = null;
let currentDeleteCallback = null;

// ============================================================================
// UTILIDADES GENERALES
// ============================================================================

// Función para mostrar notificaciones mejoradas
function showNotification(message, type = 'success', duration = 5000) {
    // Mapear tipos de iconos
    const iconMap = {
        'success': 'bi-check-circle-fill',
        'error': 'bi-exclamation-triangle-fill',
        'danger': 'bi-exclamation-triangle-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'info': 'bi-info-circle-fill'
    };

    const alertType = type === 'error' ? 'danger' : type;
    const icon = iconMap[alertType] || iconMap['info'];

    // Crear contenedor de alertas si no existe
    let alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) {
        alertsContainer = document.createElement('div');
        alertsContainer.id = 'alerts-container';
        alertsContainer.className = 'alerts-container';
        alertsContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(alertsContainer);
    }

    const notification = document.createElement('div');
    const alertId = 'alert-' + Date.now();
    notification.id = alertId;
    notification.className = `alert alert-${alertType} alert-dismissible fade show`;
    notification.style.cssText = `
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
        'info': 'linear-gradient(135deg, #d1ecf1, #bee5eb)'
    };
    
    notification.style.background = gradients[alertType] || gradients['info'];

    notification.innerHTML = `
        <div class="d-flex align-items-start">
            <i class="bi ${icon}" style="color: var(--bs-${alertType}); font-size: 1.2em; margin-right: 0.75rem; flex-shrink: 0;"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" style="background: none; border: none; font-size: 1.2em; opacity: 0.6; transition: all 0.2s ease; padding: 0.25rem; margin: -0.25rem -0.25rem -0.25rem 0;"></button>
        </div>
        <div class="alert-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; background: var(--bs-${alertType}); animation: progressBar ${duration}ms linear;"></div>
    `;
    
    alertsContainer.appendChild(notification);

    // Agregar estilos de animación si no existen
    if (!document.getElementById('alert-animations')) {
        const style = document.createElement('style');
        style.id = 'alert-animations';
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
        `;
        document.head.appendChild(style);
    }
    
    // Auto-remove after specified duration
    const timer = setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'alertSlideInRight 0.3s ease-in-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);

    // Event listener para el botón de cerrar
    const closeBtn = notification.querySelector('.btn-close');
    closeBtn.onclick = () => {
        clearTimeout(timer);
        notification.style.animation = 'alertSlideInRight 0.3s ease-in-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    };
}

// Función para formatear fechas
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para formatear dinero
function formatMoney(amount) {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// ============================================================================
// FUNCIONES PARA GESTIÓN DE SEDES
// ============================================================================

async function verDetallesSede(id) {
    try {
        const response = await fetch(`/api/sedes/${id}`);
        if (!response.ok) throw new Error('Error al obtener sede');
        
        const sede = await response.json();
        
        const modalBody = document.getElementById('modalVerDetallesBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-building"></i> Información Básica</h6>
                    <p><strong>Nombre:</strong> ${sede.nombre}</p>
                    <p><strong>Ciudad:</strong> ${sede.ciudad || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${sede.direccion || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <h6><i class="bi bi-person-lines-fill"></i> Contacto</h6>
                    <p><strong>Teléfono:</strong> ${sede.telefono || 'N/A'}</p>
                    <p><strong>Email:</strong> ${sede.email || 'N/A'}</p>
                    <p><strong>Estado:</strong> 
                        <span class="badge ${sede.activo ? 'bg-success' : 'bg-secondary'}">
                            ${sede.activo ? 'Activa' : 'Inactiva'}
                        </span>
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('modalVerDetallesLabel').innerHTML = 
            `<i class="bi bi-building"></i> Detalles de Sede`;
        
        // Configurar botón de editar
        const btnEditar = document.getElementById('btnEditarDesdeDetalles');
        btnEditar.onclick = () => {
            document.getElementById('modalVerDetalles').querySelector('[data-bs-dismiss="modal"]').click();
            setTimeout(() => editarSede(id), 300);
        };
        
        new bootstrap.Modal(document.getElementById('modalVerDetalles')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar detalles de la sede', 'error');
    }
}

async function editarSede(id) {
    try {
        const response = await fetch(`/api/sedes/${id}`);
        if (!response.ok) throw new Error('Error al obtener sede');
        
        const sede = await response.json();
        
        currentEditId = id;
        currentEditType = 'sede';
        
        const modalBody = document.getElementById('modalEditarBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="editNombreSede" class="form-label">Nombre de la Sede</label>
                        <input type="text" class="form-control" id="editNombreSede" value="${sede.nombre}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editCiudadSede" class="form-label">Ciudad</label>
                        <input type="text" class="form-control" id="editCiudadSede" value="${sede.ciudad || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editDireccionSede" class="form-label">Dirección</label>
                        <textarea class="form-control" id="editDireccionSede" rows="2">${sede.direccion || ''}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="editTelefonoSede" class="form-label">Teléfono</label>
                        <input type="tel" class="form-control" id="editTelefonoSede" value="${sede.telefono || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editEmailSede" class="form-label">Email</label>
                        <input type="email" class="form-control" id="editEmailSede" value="${sede.email || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editActivoSede" class="form-label">Estado</label>
                        <select class="form-select" id="editActivoSede">
                            <option value="true" ${sede.activo ? 'selected' : ''}>Activa</option>
                            <option value="false" ${!sede.activo ? 'selected' : ''}>Inactiva</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalEditarLabel').innerHTML = 
            `<i class="bi bi-building"></i> Editar Sede`;
        
        new bootstrap.Modal(document.getElementById('modalEditar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar datos de la sede', 'error');
    }
}

async function eliminarSede(id) {
    try {
        // Obtener datos de la sede para mostrar en confirmación
        const response = await fetch(`/api/sedes/${id}`);
        if (!response.ok) throw new Error('Error al obtener sede');
        
        const sede = await response.json();
        
        document.getElementById('modalEliminarMensaje').innerHTML = 
            `¿Está seguro de que desea eliminar la sede <strong>"${sede.nombre}"</strong>?<br>
             <small class="text-muted">Esta acción no se puede deshacer.</small>`;
        
        currentDeleteCallback = async () => {
            try {
                const deleteResponse = await fetch(`/api/sedes/${id}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) throw new Error('Error al eliminar sede');
                
                showNotification('Sede eliminada correctamente', 'success');
                cargarGestionSedes(); // Recargar lista
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al eliminar la sede', 'error');
            }
        };
        
        new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al preparar eliminación', 'error');
    }
}

// ============================================================================
// FUNCIONES PARA GESTIÓN DE PROVEEDORES
// ============================================================================

async function verDetallesProveedor(id) {
    try {
        const response = await fetch(`/api/inventario/proveedores/${id}`);
        if (!response.ok) throw new Error('Error al obtener proveedor');
        
        const proveedor = await response.json();
        
        const modalBody = document.getElementById('modalVerDetallesBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-shop"></i> Información Básica</h6>
                    <p><strong>Nombre:</strong> ${proveedor.nombre}</p>
                    <p><strong>Contacto:</strong> ${proveedor.contacto || 'N/A'}</p>
                    <p><strong>Productos:</strong> ${proveedor.productos || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <h6><i class="bi bi-person-lines-fill"></i> Contacto</h6>
                    <p><strong>Teléfono:</strong> ${proveedor.telefono || 'N/A'}</p>
                    <p><strong>Email:</strong> ${proveedor.email || 'N/A'}</p>
                    <p><strong>Última Compra:</strong> ${formatDate(proveedor.ultima_compra)}</p>
                    <p><strong>Estado:</strong> 
                        <span class="badge ${proveedor.estado === 'activo' ? 'bg-success' : 'bg-secondary'}">
                            ${proveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('modalVerDetallesLabel').innerHTML = 
            `<i class="bi bi-shop"></i> Detalles de Proveedor`;
        
        const btnEditar = document.getElementById('btnEditarDesdeDetalles');
        btnEditar.onclick = () => {
            document.getElementById('modalVerDetalles').querySelector('[data-bs-dismiss="modal"]').click();
            setTimeout(() => editarProveedor(id), 300);
        };
        
        new bootstrap.Modal(document.getElementById('modalVerDetalles')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar detalles del proveedor', 'error');
    }
}

async function editarProveedor(id) {
    try {
        const response = await fetch(`/api/inventario/proveedores/${id}`);
        if (!response.ok) throw new Error('Error al obtener proveedor');
        
        const proveedor = await response.json();
        
        currentEditId = id;
        currentEditType = 'proveedor';
        
        const modalBody = document.getElementById('modalEditarBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="editNombreProveedor" class="form-label">Nombre del Proveedor</label>
                        <input type="text" class="form-control" id="editNombreProveedor" value="${proveedor.nombre}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editContactoProveedor" class="form-label">Persona de Contacto</label>
                        <input type="text" class="form-control" id="editContactoProveedor" value="${proveedor.contacto || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editProductosProveedor" class="form-label">Productos/Servicios</label>
                        <textarea class="form-control" id="editProductosProveedor" rows="2">${proveedor.productos || ''}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="editTelefonoProveedor" class="form-label">Teléfono</label>
                        <input type="tel" class="form-control" id="editTelefonoProveedor" value="${proveedor.telefono || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editEmailProveedor" class="form-label">Email</label>
                        <input type="email" class="form-control" id="editEmailProveedor" value="${proveedor.email || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editUltimaCompraProveedor" class="form-label">Última Compra</label>
                        <input type="date" class="form-control" id="editUltimaCompraProveedor" 
                               value="${proveedor.ultima_compra ? proveedor.ultima_compra.split('T')[0] : ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editEstadoProveedor" class="form-label">Estado</label>
                        <select class="form-select" id="editEstadoProveedor">
                            <option value="activo" ${proveedor.estado === 'activo' ? 'selected' : ''}>Activo</option>
                            <option value="inactivo" ${proveedor.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalEditarLabel').innerHTML = 
            `<i class="bi bi-shop"></i> Editar Proveedor`;
        
        new bootstrap.Modal(document.getElementById('modalEditar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar datos del proveedor', 'error');
    }
}

async function eliminarProveedor(id) {
    try {
        const response = await fetch(`/api/inventario/proveedores/${id}`);
        if (!response.ok) throw new Error('Error al obtener proveedor');
        
        const proveedor = await response.json();
        
        document.getElementById('modalEliminarMensaje').innerHTML = 
            `¿Está seguro de que desea eliminar el proveedor <strong>"${proveedor.nombre}"</strong>?<br>
             <small class="text-muted">Esta acción no se puede deshacer.</small>`;
        
        currentDeleteCallback = async () => {
            try {
                const deleteResponse = await fetch(`/api/inventario/proveedores/${id}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) throw new Error('Error al eliminar proveedor');
                
                showNotification('Proveedor eliminado correctamente', 'success');
                cargarProveedores(); // Recargar lista
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al eliminar el proveedor', 'error');
            }
        };
        
        new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al preparar eliminación', 'error');
    }
}

// ============================================================================
// FUNCIONES PARA GESTIÓN DE EQUIPOS
// ============================================================================

async function verDetallesEquipo(id) {
    try {
        const response = await fetch(`/api/inventario/equipos/${id}`);
        if (!response.ok) throw new Error('Error al obtener equipo');
        
        const equipo = await response.json();
        
        const modalBody = document.getElementById('modalVerDetallesBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-tools"></i> Información Básica</h6>
                    <p><strong>Nombre:</strong> ${equipo.nombre}</p>
                    <p><strong>Descripción:</strong> ${equipo.descripcion || 'N/A'}</p>
                    <p><strong>Categoría:</strong> ${equipo.categoria || 'N/A'}</p>
                    <p><strong>Precio:</strong> ${formatMoney(equipo.precio)}</p>
                </div>
                <div class="col-md-6">
                    <h6><i class="bi bi-calendar-check"></i> Fechas</h6>
                    <p><strong>Fecha de Alta:</strong> ${formatDate(equipo.fecha_alta)}</p>
                    <p><strong>Estado:</strong> 
                        <span class="badge bg-info">Activo</span>
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('modalVerDetallesLabel').innerHTML = 
            `<i class="bi bi-tools"></i> Detalles de Equipo`;
        
        const btnEditar = document.getElementById('btnEditarDesdeDetalles');
        btnEditar.onclick = () => {
            document.getElementById('modalVerDetalles').querySelector('[data-bs-dismiss="modal"]').click();
            setTimeout(() => editarEquipo(id), 300);
        };
        
        new bootstrap.Modal(document.getElementById('modalVerDetalles')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar detalles del equipo', 'error');
    }
}

async function editarEquipo(id) {
    try {
        const response = await fetch(`/api/inventario/equipos/${id}`);
        if (!response.ok) throw new Error('Error al obtener equipo');
        
        const equipo = await response.json();
        
        currentEditId = id;
        currentEditType = 'equipo';
        
        const modalBody = document.getElementById('modalEditarBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="editNombreEquipo" class="form-label">Nombre del Equipo</label>
                        <input type="text" class="form-control" id="editNombreEquipo" value="${equipo.nombre}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editDescripcionEquipo" class="form-label">Descripción</label>
                        <textarea class="form-control" id="editDescripcionEquipo" rows="3">${equipo.descripcion || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label for="editCategoriaEquipo" class="form-label">Categoría</label>
                        <input type="text" class="form-control" id="editCategoriaEquipo" value="${equipo.categoria || ''}">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="editPrecioEquipo" class="form-label">Precio</label>
                        <input type="number" class="form-control" id="editPrecioEquipo" value="${equipo.precio || ''}" step="0.01">
                    </div>
                    <div class="mb-3">
                        <label for="editFechaAltaEquipo" class="form-label">Fecha de Alta</label>
                        <input type="date" class="form-control" id="editFechaAltaEquipo" 
                               value="${equipo.fecha_alta ? equipo.fecha_alta.split('T')[0] : ''}">
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalEditarLabel').innerHTML = 
            `<i class="bi bi-tools"></i> Editar Equipo`;
        
        new bootstrap.Modal(document.getElementById('modalEditar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar datos del equipo', 'error');
    }
}

async function eliminarEquipo(id) {
    try {
        const response = await fetch(`/api/inventario/equipos/${id}`);
        if (!response.ok) throw new Error('Error al obtener equipo');
        
        const equipo = await response.json();
        
        document.getElementById('modalEliminarMensaje').innerHTML = 
            `¿Está seguro de que desea eliminar el equipo <strong>"${equipo.nombre}"</strong>?<br>
             <small class="text-muted">Esta acción no se puede deshacer.</small>`;
        
        currentDeleteCallback = async () => {
            try {
                const deleteResponse = await fetch(`/api/inventario/equipos/${id}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) throw new Error('Error al eliminar equipo');
                
                showNotification('Equipo eliminado correctamente', 'success');
                cargarInventario(); // Recargar lista
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al eliminar el equipo', 'error');
            }
        };
        
        new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al preparar eliminación', 'error');
    }
}

// ============================================================================
// FUNCIONES PARA GESTIÓN DE CATEGORÍAS
// ============================================================================

async function editarCategoria(id) {
    try {
        const response = await fetch(`/api/inventario/categorias/${id}`);
        if (!response.ok) throw new Error('Error al obtener categoría');
        
        const categoria = await response.json();
        
        currentEditId = id;
        currentEditType = 'categoria';
        
        const modalBody = document.getElementById('modalEditarBody');
        modalBody.innerHTML = `
            <div class="mb-3">
                <label for="editNombreCategoria" class="form-label">Nombre de la Categoría</label>
                <input type="text" class="form-control" id="editNombreCategoria" value="${categoria.nombre}" required>
            </div>
            <div class="mb-3">
                <label for="editDescripcionCategoria" class="form-label">Descripción</label>
                <textarea class="form-control" id="editDescripcionCategoria" rows="3">${categoria.descripcion || ''}</textarea>
            </div>
            <div class="mb-3">
                <label for="editActivoCategoria" class="form-label">Estado</label>
                <select class="form-select" id="editActivoCategoria">
                    <option value="true" ${categoria.activo ? 'selected' : ''}>Activa</option>
                    <option value="false" ${!categoria.activo ? 'selected' : ''}>Inactiva</option>
                </select>
            </div>
        `;
        
        document.getElementById('modalEditarLabel').innerHTML = 
            `<i class="bi bi-tags"></i> Editar Categoría`;
        
        new bootstrap.Modal(document.getElementById('modalEditar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar datos de la categoría', 'error');
    }
}

async function eliminarCategoria(id) {
    try {
        const response = await fetch(`/api/inventario/categorias/${id}`);
        if (!response.ok) throw new Error('Error al obtener categoría');
        
        const categoria = await response.json();
        
        document.getElementById('modalEliminarMensaje').innerHTML = 
            `¿Está seguro de que desea eliminar la categoría <strong>"${categoria.nombre}"</strong>?<br>
             <small class="text-muted">Esta acción no se puede deshacer y podría afectar productos asociados.</small>`;
        
        currentDeleteCallback = async () => {
            try {
                const deleteResponse = await fetch(`/api/inventario/categorias/${id}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) throw new Error('Error al eliminar categoría');
                
                showNotification('Categoría eliminada correctamente', 'success');
                cargarCategorias(); // Recargar lista
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al eliminar la categoría', 'error');
            }
        };
        
        new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al preparar eliminación', 'error');
    }
}

// ============================================================================
// EVENTOS PARA BOTONES DE MODALES
// ============================================================================

// Event listener para guardar cambios en edición
document.addEventListener('DOMContentLoaded', function() {
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    if (btnGuardarCambios) {
        btnGuardarCambios.addEventListener('click', async function() {
            if (!currentEditId || !currentEditType) return;
            
            try {
                let data = {};
                let endpoint = '';
                
                switch (currentEditType) {
                    case 'sede':
                        data = {
                            nombre: document.getElementById('editNombreSede').value,
                            ciudad: document.getElementById('editCiudadSede').value,
                            direccion: document.getElementById('editDireccionSede').value,
                            telefono: document.getElementById('editTelefonoSede').value,
                            email: document.getElementById('editEmailSede').value,
                            activo: document.getElementById('editActivoSede').value === 'true'
                        };
                        endpoint = `/api/sedes/${currentEditId}`;
                        break;
                        
                    case 'proveedor':
                        data = {
                            nombre: document.getElementById('editNombreProveedor').value,
                            contacto: document.getElementById('editContactoProveedor').value,
                            productos: document.getElementById('editProductosProveedor').value,
                            telefono: document.getElementById('editTelefonoProveedor').value,
                            email: document.getElementById('editEmailProveedor').value,
                            ultima_compra: document.getElementById('editUltimaCompraProveedor').value,
                            estado: document.getElementById('editEstadoProveedor').value
                        };
                        endpoint = `/api/inventario/proveedores/${currentEditId}`;
                        break;
                        
                    case 'equipo':
                        data = {
                            nombre: document.getElementById('editNombreEquipo').value,
                            descripcion: document.getElementById('editDescripcionEquipo').value,
                            categoria: document.getElementById('editCategoriaEquipo').value,
                            precio: parseFloat(document.getElementById('editPrecioEquipo').value),
                            fecha_alta: document.getElementById('editFechaAltaEquipo').value
                        };
                        endpoint = `/api/inventario/equipos/${currentEditId}`;
                        break;
                        
                    case 'categoria':
                        data = {
                            nombre: document.getElementById('editNombreCategoria').value,
                            descripcion: document.getElementById('editDescripcionCategoria').value,
                            activo: document.getElementById('editActivoCategoria').value === 'true'
                        };
                        endpoint = `/api/inventario/categorias/${currentEditId}`;
                        break;
                }
                
                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) throw new Error('Error al actualizar');
                
                showNotification('Datos actualizados correctamente', 'success');
                
                // Cerrar modal
                document.getElementById('modalEditar').querySelector('[data-bs-dismiss="modal"]').click();
                
                // Recargar datos según el tipo
                switch (currentEditType) {
                    case 'sede':
                        cargarGestionSedes();
                        break;
                    case 'proveedor':
                        cargarProveedores();
                        break;
                    case 'equipo':
                        cargarInventario();
                        break;
                    case 'categoria':
                        cargarCategorias();
                        break;
                }
                
                // Reset variables
                currentEditId = null;
                currentEditType = null;
                
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al guardar los cambios', 'error');
            }
        });
    }
    
    // Event listener para confirmar eliminación
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async function() {
            if (currentDeleteCallback) {
                await currentDeleteCallback();
                
                // Cerrar modal
                document.getElementById('modalConfirmarEliminar').querySelector('[data-bs-dismiss="modal"]').click();
                
                // Reset callback
                currentDeleteCallback = null;
            }
        });
    }
});

console.log('✅ Módulo CRUD completo cargado exitosamente');
