// ============================================================================
// FUNCIONALIDADES CRUD COMPLETAS PARA DASHBOARD ADMIN
// ============================================================================

// Variables globales para gestión de modales
let currentEditId = null;
let currentEditType = null;
let currentDeleteCallback = null;

// ============================================================================
// UTILIDADES GENERALES
// ============================================================================

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 
                      type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
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

// ============================================================================
// FUNCIONES CRUD PARA SEDES
// ============================================================================

async function verDetallesSede(id) {
    console.log('🔍 Ver detalles de sede:', id);
    
    try {
        const sede = await apiRequest(`/api/sedes/${id}`);
        
        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>ID:</strong> ${sede.id}</p>
                    <p><strong>Nombre:</strong> ${sede.nombre}</p>
                    <p><strong>Ciudad:</strong> ${sede.ciudad}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Dirección:</strong> ${sede.direccion}</p>
                    <p><strong>Teléfono:</strong> ${sede.telefono || 'N/A'}</p>
                    <p><strong>Estado:</strong> 
                        <span class="badge ${sede.activa ? 'bg-success' : 'bg-danger'}">
                            ${sede.activa ? 'Activa' : 'Inactiva'}
                        </span>
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('modalVerDetallesBody').innerHTML = modalContent;
        document.getElementById('modalVerDetallesLabel').textContent = `Detalles de Sede: ${sede.nombre}`;
        
        const modal = new bootstrap.Modal(document.getElementById('modalVerDetalles'));
        modal.show();
        
    } catch (error) {
        console.error('Error al obtener detalles de sede:', error);
        showNotification('Error al cargar los detalles de la sede', 'error');
    }
}

async function editarSede(id) {
    console.log('✏️ Editar sede:', id);
    
    try {
        const sede = await apiRequest(`/api/sedes/${id}`);
        
        currentEditId = id;
        currentEditType = 'sede';
        
        const modalContent = `
            <form id="formEditarSede">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editNombreSede" class="form-label">Nombre</label>
                            <input type="text" class="form-control" id="editNombreSede" value="${sede.nombre}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCiudadSede" class="form-label">Ciudad</label>
                            <input type="text" class="form-control" id="editCiudadSede" value="${sede.ciudad}" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editDireccionSede" class="form-label">Dirección</label>
                            <input type="text" class="form-control" id="editDireccionSede" value="${sede.direccion}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editTelefonoSede" class="form-label">Teléfono</label>
                            <input type="text" class="form-control" id="editTelefonoSede" value="${sede.telefono || ''}">
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="editActivaSede" ${sede.activa ? 'checked' : ''}>
                        <label class="form-check-label" for="editActivaSede">
                            Sede activa
                        </label>
                    </div>
                </div>
            </form>
        `;
        
        document.getElementById('modalEditarBody').innerHTML = modalContent;
        document.getElementById('modalEditarLabel').textContent = `Editar Sede: ${sede.nombre}`;
        
        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar sede para editar:', error);
        showNotification('Error al cargar los datos de la sede', 'error');
    }
}

async function eliminarSede(id) {
    console.log('🗑️ Eliminar sede:', id);
    
    try {
        const sede = await apiRequest(`/api/sedes/${id}`);
        
        currentDeleteCallback = async () => {
            try {
                await apiRequest(`/api/sedes/${id}`, 'DELETE');
                showNotification('Sede eliminada correctamente', 'success');
                // Recargar la lista de sedes
                if (typeof cargarGestionSedes === 'function') {
                    cargarGestionSedes();
                }
            } catch (error) {
                console.error('Error al eliminar sede:', error);
                showNotification('Error al eliminar la sede: ' + error.message, 'error');
            }
        };
        
        document.getElementById('modalConfirmarEliminarContent').innerHTML = `
            <p>¿Está seguro de que desea eliminar la sede <strong>"${sede.nombre}"</strong>?</p>
            <p class="text-warning"><i class="fas fa-exclamation-triangle"></i> Esta acción no se puede deshacer.</p>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar sede para eliminar:', error);
        showNotification('Error al cargar los datos de la sede', 'error');
    }
}

// ============================================================================
// FUNCIONES CRUD PARA PROVEEDORES
// ============================================================================

async function verDetallesProveedor(id) {
    console.log('🔍 Ver detalles de proveedor:', id);
    
    try {
        const proveedor = await apiRequest(`/api/inventario/proveedores/${id}`);
        
        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>ID:</strong> ${proveedor.id}</p>
                    <p><strong>Nombre:</strong> ${proveedor.nombre}</p>
                    <p><strong>Contacto:</strong> ${proveedor.contacto || 'N/A'}</p>
                    <p><strong>Ciudad:</strong> ${proveedor.ciudad || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Teléfono:</strong> ${proveedor.telefono || 'N/A'}</p>
                    <p><strong>Email:</strong> ${proveedor.email || 'N/A'}</p>
                    <p><strong>NIT:</strong> ${proveedor.nit || 'N/A'}</p>
                    <p><strong>Tipo:</strong> ${proveedor.tipo_proveedor || 'N/A'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <p><strong>Dirección:</strong> ${proveedor.direccion || 'N/A'}</p>
                    <p><strong>Estado:</strong> 
                        <span class="badge ${proveedor.estado === 'activo' ? 'bg-success' : 'bg-danger'}">
                            ${proveedor.estado || 'N/A'}
                        </span>
                    </p>
                    ${proveedor.notas ? `<p><strong>Notas:</strong> ${proveedor.notas}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('modalVerDetallesBody').innerHTML = modalContent;
        document.getElementById('modalVerDetallesLabel').textContent = `Detalles de Proveedor: ${proveedor.nombre}`;
        
        const modal = new bootstrap.Modal(document.getElementById('modalVerDetalles'));
        modal.show();
        
    } catch (error) {
        console.error('Error al obtener detalles de proveedor:', error);
        showNotification('Error al cargar los detalles del proveedor', 'error');
    }
}

async function editarProveedor(id) {
    console.log('✏️ Editar proveedor:', id);
    
    try {
        const proveedor = await apiRequest(`/api/inventario/proveedores/${id}`);
        
        currentEditId = id;
        currentEditType = 'proveedor';
        
        const modalContent = `
            <form id="formEditarProveedor">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editNombreProveedor" class="form-label">Nombre</label>
                            <input type="text" class="form-control" id="editNombreProveedor" value="${proveedor.nombre}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editContactoProveedor" class="form-label">Contacto</label>
                            <input type="text" class="form-control" id="editContactoProveedor" value="${proveedor.contacto || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editTelefonoProveedor" class="form-label">Teléfono</label>
                            <input type="text" class="form-control" id="editTelefonoProveedor" value="${proveedor.telefono || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editEmailProveedor" class="form-label">Email</label>
                            <input type="email" class="form-control" id="editEmailProveedor" value="${proveedor.email || ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editDireccionProveedor" class="form-label">Dirección</label>
                            <input type="text" class="form-control" id="editDireccionProveedor" value="${proveedor.direccion || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editCiudadProveedor" class="form-label">Ciudad</label>
                            <input type="text" class="form-control" id="editCiudadProveedor" value="${proveedor.ciudad || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editNitProveedor" class="form-label">NIT</label>
                            <input type="text" class="form-control" id="editNitProveedor" value="${proveedor.nit || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editTipoProveedor" class="form-label">Tipo</label>
                            <select class="form-control" id="editTipoProveedor">
                                <option value="equipos" ${proveedor.tipo_proveedor === 'equipos' ? 'selected' : ''}>Equipos</option>
                                <option value="materiales" ${proveedor.tipo_proveedor === 'materiales' ? 'selected' : ''}>Materiales</option>
                                <option value="servicios" ${proveedor.tipo_proveedor === 'servicios' ? 'selected' : ''}>Servicios</option>
                                <option value="mixto" ${proveedor.tipo_proveedor === 'mixto' ? 'selected' : ''}>Mixto</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="editNotasProveedor" class="form-label">Notas</label>
                    <textarea class="form-control" id="editNotasProveedor" rows="3">${proveedor.notas || ''}</textarea>
                </div>
            </form>
        `;
        
        document.getElementById('modalEditarBody').innerHTML = modalContent;
        document.getElementById('modalEditarLabel').textContent = `Editar Proveedor: ${proveedor.nombre}`;
        
        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar proveedor para editar:', error);
        showNotification('Error al cargar los datos del proveedor', 'error');
    }
}

async function eliminarProveedor(id) {
    console.log('🗑️ Eliminar proveedor:', id);
    
    try {
        const proveedor = await apiRequest(`/api/inventario/proveedores/${id}`);
        
        currentDeleteCallback = async () => {
            try {
                await apiRequest(`/api/inventario/proveedores/${id}`, 'DELETE');
                showNotification('Proveedor eliminado correctamente', 'success');
                // Recargar la lista de proveedores
                if (typeof cargarProveedores === 'function') {
                    cargarProveedores();
                }
            } catch (error) {
                console.error('Error al eliminar proveedor:', error);
                showNotification('Error al eliminar el proveedor: ' + error.message, 'error');
            }
        };
        
        document.getElementById('modalConfirmarEliminarContent').innerHTML = `
            <p>¿Está seguro de que desea eliminar el proveedor <strong>"${proveedor.nombre}"</strong>?</p>
            <p class="text-warning"><i class="fas fa-exclamation-triangle"></i> Esta acción no se puede deshacer.</p>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar proveedor para eliminar:', error);
        showNotification('Error al cargar los datos del proveedor', 'error');
    }
}

// ============================================================================
// FUNCIONES CRUD PARA EQUIPOS
// ============================================================================

async function verDetallesEquipo(id) {
    console.log('🔍 Ver detalles de equipo:', id);
    
    try {
        const equipo = await apiRequest(`/api/inventario/equipos/${id}`);
        
        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>ID:</strong> ${equipo.id}</p>
                    <p><strong>Nombre:</strong> ${equipo.nombre}</p>
                    <p><strong>Categoría:</strong> ${equipo.categoria}</p>
                    <p><strong>Precio:</strong> ${formatMoney(equipo.precio)}</p>
                    <p><strong>Marca:</strong> ${equipo.marca || 'N/A'}</p>
                    <p><strong>Modelo:</strong> ${equipo.modelo || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Código:</strong> ${equipo.codigo_producto || 'N/A'}</p>
                    <p><strong>Garantía:</strong> ${equipo.garantia_meses ? equipo.garantia_meses + ' meses' : 'N/A'}</p>
                    <p><strong>Estado:</strong> 
                        <span class="badge ${equipo.estado === 'activo' ? 'bg-success' : 'bg-danger'}">
                            ${equipo.estado || 'N/A'}
                        </span>
                    </p>
                    <p><strong>Fecha Registro:</strong> ${formatDate(equipo.fecha_registro)}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    ${equipo.descripcion ? `<p><strong>Descripción:</strong> ${equipo.descripcion}</p>` : ''}
                    ${equipo.especificaciones ? `<p><strong>Especificaciones:</strong> ${equipo.especificaciones}</p>` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('modalVerDetallesBody').innerHTML = modalContent;
        document.getElementById('modalVerDetallesLabel').textContent = `Detalles de Equipo: ${equipo.nombre}`;
        
        const modal = new bootstrap.Modal(document.getElementById('modalVerDetalles'));
        modal.show();
        
    } catch (error) {
        console.error('Error al obtener detalles de equipo:', error);
        showNotification('Error al cargar los detalles del equipo', 'error');
    }
}

async function editarEquipo(id) {
    console.log('✏️ Editar equipo:', id);
    
    try {
        const equipo = await apiRequest(`/api/inventario/equipos/${id}`);
        
        currentEditId = id;
        currentEditType = 'equipo';
        
        const modalContent = `
            <form id="formEditarEquipo">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editNombreEquipo" class="form-label">Nombre</label>
                            <input type="text" class="form-control" id="editNombreEquipo" value="${equipo.nombre}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCategoriaEquipo" class="form-label">Categoría</label>
                            <input type="text" class="form-control" id="editCategoriaEquipo" value="${equipo.categoria}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editPrecioEquipo" class="form-label">Precio</label>
                            <input type="number" class="form-control" id="editPrecioEquipo" value="${equipo.precio}" step="0.01" required>
                        </div>
                        <div class="mb-3">
                            <label for="editMarcaEquipo" class="form-label">Marca</label>
                            <input type="text" class="form-control" id="editMarcaEquipo" value="${equipo.marca || ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="editModeloEquipo" class="form-label">Modelo</label>
                            <input type="text" class="form-control" id="editModeloEquipo" value="${equipo.modelo || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editCodigoEquipo" class="form-label">Código</label>
                            <input type="text" class="form-control" id="editCodigoEquipo" value="${equipo.codigo_producto || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editGarantiaEquipo" class="form-label">Garantía (meses)</label>
                            <input type="number" class="form-control" id="editGarantiaEquipo" value="${equipo.garantia_meses || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="editEstadoEquipo" class="form-label">Estado</label>
                            <select class="form-control" id="editEstadoEquipo">
                                <option value="activo" ${equipo.estado === 'activo' ? 'selected' : ''}>Activo</option>
                                <option value="inactivo" ${equipo.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                                <option value="descontinuado" ${equipo.estado === 'descontinuado' ? 'selected' : ''}>Descontinuado</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="editDescripcionEquipo" class="form-label">Descripción</label>
                    <textarea class="form-control" id="editDescripcionEquipo" rows="2">${equipo.descripcion || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label for="editEspecificacionesEquipo" class="form-label">Especificaciones</label>
                    <textarea class="form-control" id="editEspecificacionesEquipo" rows="3">${equipo.especificaciones || ''}</textarea>
                </div>
            </form>
        `;
        
        document.getElementById('modalEditarBody').innerHTML = modalContent;
        document.getElementById('modalEditarLabel').textContent = `Editar Equipo: ${equipo.nombre}`;
        
        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar equipo para editar:', error);
        showNotification('Error al cargar los datos del equipo', 'error');
    }
}

async function eliminarEquipo(id) {
    console.log('🗑️ Eliminar equipo:', id);
    
    try {
        const equipo = await apiRequest(`/api/inventario/equipos/${id}`);
        
        currentDeleteCallback = async () => {
            try {
                await apiRequest(`/api/inventario/equipos/${id}`, 'DELETE');
                showNotification('Equipo eliminado correctamente', 'success');
                // Recargar la lista de equipos
                if (typeof cargarInventario === 'function') {
                    cargarInventario();
                }
            } catch (error) {
                console.error('Error al eliminar equipo:', error);
                showNotification('Error al eliminar el equipo: ' + error.message, 'error');
            }
        };
        
        document.getElementById('modalConfirmarEliminarContent').innerHTML = `
            <p>¿Está seguro de que desea eliminar el equipo <strong>"${equipo.nombre}"</strong>?</p>
            <p class="text-warning"><i class="fas fa-exclamation-triangle"></i> Esta acción eliminará el equipo y podría afectar el inventario asociado.</p>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
        modal.show();
        
    } catch (error) {
        console.error('Error al cargar equipo para eliminar:', error);
        showNotification('Error al cargar los datos del equipo', 'error');
    }
}

// ============================================================================
// FUNCIONES CRUD PARA CATEGORÍAS
// ============================================================================

async function editarCategoria(categoria) {
    console.log('✏️ Editar categoría:', categoria);
    
    currentEditId = categoria;
    currentEditType = 'categoria';
    
    const modalContent = `
        <form id="formEditarCategoria">
            <div class="mb-3">
                <label for="editNombreCategoria" class="form-label">Nombre de la Categoría</label>
                <input type="text" class="form-control" id="editNombreCategoria" value="${categoria}" required>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Al cambiar el nombre de la categoría, se actualizarán todos los equipos que pertenecen a esta categoría.
            </div>
        </form>
    `;
    
    document.getElementById('modalEditarBody').innerHTML = modalContent;
    document.getElementById('modalEditarLabel').textContent = `Editar Categoría: ${categoria}`;
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

async function eliminarCategoria(categoria) {
    console.log('🗑️ Eliminar categoría:', categoria);
    
    currentDeleteCallback = async () => {
        try {
            await apiRequest(`/api/inventario/categorias/${encodeURIComponent(categoria)}`, 'DELETE');
            showNotification('Categoría eliminada correctamente', 'success');
            // Recargar la lista de categorías
            if (typeof cargarCategorias === 'function') {
                cargarCategorias();
            }
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            showNotification('Error al eliminar la categoría: ' + error.message, 'error');
        }
    };
    
    document.getElementById('modalConfirmarEliminarContent').innerHTML = `
        <p>¿Está seguro de que desea eliminar la categoría <strong>"${categoria}"</strong>?</p>
        <p class="text-danger"><i class="fas fa-exclamation-triangle"></i> Esta acción eliminará TODOS los equipos de esta categoría y no se puede deshacer.</p>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
    modal.show();
}

// ============================================================================
// FUNCIONES DE MANEJO DE MODALES
// ============================================================================

// Función para confirmar eliminación
async function confirmarEliminacion() {
    if (currentDeleteCallback && typeof currentDeleteCallback === 'function') {
        await currentDeleteCallback();
        currentDeleteCallback = null;
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar'));
        if (modal) modal.hide();
    }
}

// Función para guardar cambios en edición
async function guardarCambios() {
    if (!currentEditId || !currentEditType) {
        showNotification('Error: No hay datos para guardar', 'error');
        return;
    }
    
    try {
        let data = {};
        let url = '';
        
        switch(currentEditType) {
            case 'sede':
                data = {
                    nombre: document.getElementById('editNombreSede').value,
                    direccion: document.getElementById('editDireccionSede').value,
                    telefono: document.getElementById('editTelefonoSede').value,
                    ciudad: document.getElementById('editCiudadSede').value,
                    estado: document.getElementById('editActivaSede').checked ? 'activa' : 'inactiva'
                };
                url = `/api/sedes/${currentEditId}`;
                break;
                
            case 'proveedor':
                data = {
                    nombre: document.getElementById('editNombreProveedor').value,
                    contacto: document.getElementById('editContactoProveedor').value,
                    telefono: document.getElementById('editTelefonoProveedor').value,
                    email: document.getElementById('editEmailProveedor').value,
                    direccion: document.getElementById('editDireccionProveedor').value,
                    ciudad: document.getElementById('editCiudadProveedor').value,
                    nit: document.getElementById('editNitProveedor').value,
                    tipo_proveedor: document.getElementById('editTipoProveedor').value,
                    notas: document.getElementById('editNotasProveedor').value
                };
                url = `/api/inventario/proveedores/${currentEditId}`;
                break;
                
            case 'equipo':
                data = {
                    nombre: document.getElementById('editNombreEquipo').value,
                    categoria: document.getElementById('editCategoriaEquipo').value,
                    precio: parseFloat(document.getElementById('editPrecioEquipo').value),
                    marca: document.getElementById('editMarcaEquipo').value,
                    modelo: document.getElementById('editModeloEquipo').value,
                    codigo_producto: document.getElementById('editCodigoEquipo').value,
                    garantia_meses: parseInt(document.getElementById('editGarantiaEquipo').value) || null,
                    estado: document.getElementById('editEstadoEquipo').value,
                    descripcion: document.getElementById('editDescripcionEquipo').value,
                    especificaciones: document.getElementById('editEspecificacionesEquipo').value
                };
                url = `/api/inventario/equipos/${currentEditId}`;
                break;
                
            case 'categoria':
                data = {
                    nombre: document.getElementById('editNombreCategoria').value
                };
                url = `/api/inventario/categorias/${encodeURIComponent(currentEditId)}`;
                break;
                
            default:
                throw new Error('Tipo de edición no válido');
        }
        
        await apiRequest(url, 'PUT', data);
        showNotification('Cambios guardados correctamente', 'success');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
        if (modal) modal.hide();
        
        // Recargar datos según el tipo
        switch(currentEditType) {
            case 'sede':
                if (typeof cargarGestionSedes === 'function') cargarGestionSedes();
                break;
            case 'proveedor':
                if (typeof cargarProveedores === 'function') cargarProveedores();
                break;
            case 'equipo':
                if (typeof cargarInventario === 'function') cargarInventario();
                break;
            case 'categoria':
                if (typeof cargarCategorias === 'function') cargarCategorias();
                break;
        }
        
        // Reset variables
        currentEditId = null;
        currentEditType = null;
        
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        showNotification('Error al guardar los cambios: ' + error.message, 'error');
    }
}

// ============================================================================
// EVENT LISTENERS PARA MODALES
// ============================================================================

// Agregar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Botón de confirmar eliminación
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', confirmarEliminacion);
    }
    
    // Botón de guardar cambios
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    if (btnGuardarCambios) {
        btnGuardarCambios.addEventListener('click', guardarCambios);
    }
    
    console.log('✅ Admin CRUD functionality loaded');
});
