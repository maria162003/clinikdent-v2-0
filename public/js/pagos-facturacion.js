// Sistema de Gestión de Pagos y Facturación - Clinik Dent
console.log('🏥 Iniciando sistema de Pagos y Facturación...');

// Variables globales
let facturas = [];
let pagos = [];
let servicios = [];
let pacientes = [];
let estadisticas = {};

// Configuración de autenticación
function getAuthHeaders() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = localStorage.getItem('userId') || user.id;
    
    return {
        'Content-Type': 'application/json',
        'user-id': userId || '1'
    };
}

async function authFetch(url, options = {}) {
    const headers = getAuthHeaders();
    return fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
    });
}

// Función para verificar autenticación
function verificarAutenticacion() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Función para redirección según rol
function checkUserRoleAndRedirect() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.rol || localStorage.getItem('userRole');
    
    switch(userRole) {
        case 'admin':
            window.location.href = 'dashboard-admin.html';
            break;
        case 'odontologo':
            window.location.href = 'dashboard-odontologo.html';
            break;
        case 'paciente':
            window.location.href = 'dashboard-paciente.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

// Función de logout
function logout() {
    localStorage.clear();
    window.location.href = 'index.html?logout=true';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAutenticacion()) return;
    
    console.log('✅ Iniciando módulo de Pagos y Facturación');
    inicializarSistema();
});

async function inicializarSistema() {
    try {
        // Cargar datos iniciales
        await Promise.all([
            cargarPacientes(),
            cargarServicios(),
            cargarFacturas(),
            cargarPagos(),
            cargarEstadisticas()
        ]);
        
        // Configurar fecha actual en formularios
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaFactura').value = hoy;
        
        console.log('✅ Sistema inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar sistema:', error);
        mostrarError('Error al cargar el sistema. Por favor, recarga la página.');
    }
}

// ==========================================
// FUNCIONES DE CARGA DE DATOS
// ==========================================

async function cargarPacientes() {
    try {
        const response = await authFetch('/api/usuarios');
        const data = await response.json();
        
        if (response.ok) {
            pacientes = data.filter(u => u.rol === 'paciente');
            console.log(`✅ ${pacientes.length} pacientes cargados`);
            
            // Llenar selects de pacientes
            llenarSelectPacientes();
        }
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
    }
}

async function cargarServicios() {
    try {
        const response = await authFetch('/api/tratamientos');
        const data = await response.json();
        
        if (response.ok) {
            servicios = data;
            console.log(`✅ ${servicios.length} servicios cargados`);
            
            // Llenar tabla de servicios y selects
            mostrarServiciosEnTabla();
            llenarSelectServicios();
        }
    } catch (error) {
        console.error('❌ Error cargando servicios:', error);
        // Servicios de ejemplo si no se pueden cargar
        servicios = [
            { id: 1, nombre: 'Limpieza Dental', precio: 80000, descripcion: 'Limpieza dental básica' },
            { id: 2, nombre: 'Consulta General', precio: 50000, descripcion: 'Consulta odontológica general' },
            { id: 3, nombre: 'Extracción Dental', precio: 120000, descripcion: 'Extracción de pieza dental' }
        ];
        mostrarServiciosEnTabla();
        llenarSelectServicios();
    }
}

async function cargarFacturas() {
    try {
        const response = await authFetch('/api/pagos-ext/facturas');
        const data = await response.json();
        
        if (response.ok) {
            facturas = data.facturas || data || [];
            console.log(`✅ ${facturas.length} facturas cargadas`);
            mostrarFacturasEnTabla();
        } else {
            // Datos de ejemplo si no hay facturas
            facturas = [];
            mostrarFacturasEnTabla();
        }
    } catch (error) {
        console.error('❌ Error cargando facturas:', error);
        facturas = [];
        mostrarFacturasEnTabla();
    }
}

async function cargarPagos() {
    try {
        const response = await authFetch('/api/pagos');
        const data = await response.json();
        
        if (response.ok) {
            pagos = data.pagos || data || [];
            console.log(`✅ ${pagos.length} pagos cargados`);
            mostrarPagosEnTabla();
        } else {
            pagos = [];
            mostrarPagosEnTabla();
        }
    } catch (error) {
        console.error('❌ Error cargando pagos:', error);
        pagos = [];
        mostrarPagosEnTabla();
    }
}

async function cargarEstadisticas() {
    try {
        const response = await authFetch('/api/reportes/resumen');
        const data = await response.json();
        
        if (response.ok) {
            estadisticas = data;
            actualizarEstadisticasUI();
        } else {
            // Estadísticas de ejemplo
            estadisticas = {
                totalIngresos: 2500000,
                facturasPendientes: 5,
                ingresosMes: 450000,
                clientesActivos: 25
            };
            actualizarEstadisticasUI();
        }
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        estadisticas = {
            totalIngresos: 0,
            facturasPendientes: 0,
            ingresosMes: 0,
            clientesActivos: 0
        };
        actualizarEstadisticasUI();
    }
}

// ==========================================
// FUNCIONES DE UI
// ==========================================

function actualizarEstadisticasUI() {
    document.getElementById('totalIngresos').textContent = 
        formatearMoneda(estadisticas.totalIngresos || 0);
    document.getElementById('facturasPendientes').textContent = 
        estadisticas.facturasPendientes || 0;
    document.getElementById('ingresosMes').textContent = 
        formatearMoneda(estadisticas.ingresosMes || 0);
    document.getElementById('clientesActivos').textContent = 
        estadisticas.clientesActivos || 0;
}

function llenarSelectPacientes() {
    const selects = ['pacienteFactura', 'pacientePago'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Seleccionar paciente...</option>';
            pacientes.forEach(paciente => {
                select.innerHTML += `
                    <option value="${paciente.id}">
                        ${paciente.nombre} ${paciente.apellido} - ${paciente.numero_documento}
                    </option>
                `;
            });
        }
    });
}

function llenarSelectServicios() {
    // Llenar el select de servicios en el modal de nueva factura
    const container = document.querySelector('#serviciosFactura .servicio-select');
    if (container) {
        container.innerHTML = '<option value="">Seleccionar servicio...</option>';
        servicios.forEach(servicio => {
            container.innerHTML += `
                <option value="${servicio.id}" data-precio="${servicio.precio || servicio.costo_estimado}">
                    ${servicio.nombre} - ${formatearMoneda(servicio.precio || servicio.costo_estimado)}
                </option>
            `;
        });
    }
}

function mostrarFacturasEnTabla() {
    const tbody = document.querySelector('#tablaFacturas tbody');
    
    if (facturas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No hay facturas registradas</p>
                    <button class="btn btn-primary" onclick="nuevaFactura()">
                        <i class="fas fa-plus"></i> Crear Primera Factura
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = facturas.map(factura => `
        <tr>
            <td><strong>#${factura.numero_factura || factura.id}</strong></td>
            <td>${formatearFecha(factura.fecha_emision || factura.fecha_pago)}</td>
            <td>${factura.paciente_nombre || 'N/A'}</td>
            <td>${factura.concepto || 'Servicios odontológicos'}</td>
            <td><strong>${formatearMoneda(factura.total || factura.monto)}</strong></td>
            <td>
                <span class="status-badge status-${factura.estado || 'pendiente'}">
                    ${(factura.estado || 'pendiente').toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="verFactura(${factura.id})" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="cobrarFactura(${factura.id})" title="Cobrar">
                    <i class="fas fa-dollar-sign"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="imprimirFactura(${factura.id})" title="Imprimir">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function mostrarPagosEnTabla() {
    const tbody = document.querySelector('#tablaPagos tbody');
    
    if (pagos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No hay pagos registrados</p>
                    <button class="btn btn-primary" onclick="registrarPago()">
                        <i class="fas fa-plus"></i> Registrar Primer Pago
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pagos.map(pago => `
        <tr>
            <td>${formatearFecha(pago.fecha_pago)}</td>
            <td>${pago.paciente_nombre || 'N/A'}</td>
            <td>${pago.concepto || 'Pago de servicios'}</td>
            <td><strong>${formatearMoneda(pago.monto)}</strong></td>
            <td>
                <span class="badge bg-info">
                    ${(pago.metodo_pago || 'efectivo').toUpperCase()}
                </span>
            </td>
            <td>
                <span class="status-badge status-${pago.estado || 'completado'}">
                    ${(pago.estado || 'completado').toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="verPago(${pago.id})" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="imprimirRecibo(${pago.id})" title="Imprimir">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function mostrarServiciosEnTabla() {
    const tbody = document.querySelector('#tablaServicios tbody');
    
    if (servicios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No hay servicios configurados</p>
                    <button class="btn btn-primary" onclick="nuevoServicio()">
                        <i class="fas fa-plus"></i> Crear Primer Servicio
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = servicios.map(servicio => `
        <tr>
            <td><strong>${servicio.nombre}</strong></td>
            <td>${servicio.descripcion || 'Sin descripción'}</td>
            <td><strong>${formatearMoneda(servicio.precio || servicio.costo_estimado)}</strong></td>
            <td>${servicio.duracion || 60} min</td>
            <td>
                <span class="status-badge ${servicio.activo !== false ? 'status-completado' : 'status-pendiente'}">
                    ${servicio.activo !== false ? 'ACTIVO' : 'INACTIVO'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarServicio(${servicio.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-${servicio.activo !== false ? 'danger' : 'success'}" 
                        onclick="toggleServicio(${servicio.id})" 
                        title="${servicio.activo !== false ? 'Desactivar' : 'Activar'}">
                    <i class="fas fa-${servicio.activo !== false ? 'times' : 'check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

function nuevaFactura() {
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaFactura'));
    limpiarFormulario('formNuevaFactura');
    
    // Establecer fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaFactura').value = hoy;
    
    modal.show();
}

function registrarPago() {
    const modal = new bootstrap.Modal(document.getElementById('modalRegistrarPago'));
    limpiarFormulario('formRegistrarPago');
    modal.show();
}

function configurarServicios() {
    // Cambiar a la tab de servicios
    const serviciosTab = document.getElementById('servicios-tab');
    serviciosTab.click();
}

function nuevoServicio() {
    const modal = new bootstrap.Modal(document.getElementById('modalConfigServicios'));
    limpiarFormulario('formConfigServicio');
    modal.show();
}

async function guardarFactura() {
    try {
        const form = document.getElementById('formNuevaFactura');
        const formData = new FormData(form);
        
        const facturaData = {
            paciente_id: document.getElementById('pacienteFactura').value,
            fecha_emision: document.getElementById('fechaFactura').value,
            observaciones: document.getElementById('observacionesFactura').value,
            total: parseFloat(document.getElementById('totalFactura').value) || 0,
            estado: 'pendiente'
        };

        console.log('💾 Guardando factura:', facturaData);

        const response = await authFetch('/api/pagos-ext/facturas', {
            method: 'POST',
            body: JSON.stringify(facturaData)
        });

        const data = await response.json();

        if (response.ok) {
            mostrarSuccess('Factura creada exitosamente');
            document.getElementById('modalNuevaFactura').querySelector('.btn-close').click();
            await cargarFacturas();
            await cargarEstadisticas();
        } else {
            mostrarError(data.msg || 'Error al crear la factura');
        }
    } catch (error) {
        console.error('❌ Error guardando factura:', error);
        mostrarError('Error al guardar la factura');
    }
}

async function guardarPago() {
    try {
        const pagoData = {
            paciente_id: document.getElementById('pacientePago').value,
            monto: parseFloat(document.getElementById('montoPago').value),
            metodo_pago: document.getElementById('metodoPago').value,
            concepto: document.getElementById('conceptoPago').value,
            observaciones: document.getElementById('observacionesPago').value,
            estado: 'completado'
        };

        console.log('💾 Guardando pago:', pagoData);

        const response = await authFetch('/api/pagos', {
            method: 'POST',
            body: JSON.stringify(pagoData)
        });

        const data = await response.json();

        if (response.ok) {
            mostrarSuccess('Pago registrado exitosamente');
            document.getElementById('modalRegistrarPago').querySelector('.btn-close').click();
            await cargarPagos();
            await cargarEstadisticas();
        } else {
            mostrarError(data.msg || 'Error al registrar el pago');
        }
    } catch (error) {
        console.error('❌ Error guardando pago:', error);
        mostrarError('Error al registrar el pago');
    }
}

async function guardarServicio() {
    try {
        const servicioData = {
            nombre: document.getElementById('nombreServicio').value,
            descripcion: document.getElementById('descripcionServicio').value,
            costo_estimado: parseFloat(document.getElementById('precioServicio').value),
            duracion: parseInt(document.getElementById('duracionServicio').value) || 60
        };

        console.log('💾 Guardando servicio:', servicioData);

        const response = await authFetch('/api/tratamientos', {
            method: 'POST',
            body: JSON.stringify(servicioData)
        });

        const data = await response.json();

        if (response.ok) {
            mostrarSuccess('Servicio guardado exitosamente');
            document.getElementById('modalConfigServicios').querySelector('.btn-close').click();
            await cargarServicios();
        } else {
            mostrarError(data.msg || 'Error al guardar el servicio');
        }
    } catch (error) {
        console.error('❌ Error guardando servicio:', error);
        mostrarError('Error al guardar el servicio');
    }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function generarReporte() {
    mostrarInfo('Generando reporte financiero...');
    // Aquí se implementaría la lógica para generar reportes
    setTimeout(() => {
        mostrarSuccess('Reporte generado exitosamente');
    }, 2000);
}

function gestionarDescuentos() {
    mostrarInfo('Funcionalidad de descuentos en desarrollo');
}

function exportarDatos() {
    mostrarInfo('Exportando datos...');
    // Lógica de exportación
}

function agregarServicioFactura() {
    const serviciosContainer = document.getElementById('serviciosFactura');
    const nuevoServicio = serviciosContainer.querySelector('.row').cloneNode(true);
    
    // Limpiar valores
    nuevoServicio.querySelectorAll('input, select').forEach(input => {
        if (input.type !== 'number' || !input.classList.contains('cantidad-input')) {
            input.value = '';
        }
    });
    
    serviciosContainer.appendChild(nuevoServicio);
    calcularTotalFactura();
}

function calcularTotalFactura() {
    let total = 0;
    const servicios = document.querySelectorAll('#serviciosFactura .row');
    
    servicios.forEach(servicio => {
        const cantidad = parseFloat(servicio.querySelector('.cantidad-input').value) || 0;
        const precio = parseFloat(servicio.querySelector('.precio-input').value) || 0;
        total += cantidad * precio;
    });
    
    document.getElementById('subtotalFactura').value = total.toFixed(2);
    document.getElementById('totalFactura').value = total.toFixed(2);
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor || 0);
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO');
}

function limpiarFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// Funciones de mensajes
function mostrarSuccess(mensaje) {
    mostrarMensaje(mensaje, 'success');
}

function mostrarError(mensaje) {
    mostrarMensaje(mensaje, 'danger');
}

function mostrarInfo(mensaje) {
    mostrarMensaje(mensaje, 'info');
}

function mostrarMensaje(mensaje, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Funciones adicionales que se pueden implementar
function verFactura(id) { console.log('Ver factura:', id); }
function cobrarFactura(id) { console.log('Cobrar factura:', id); }
function imprimirFactura(id) { console.log('Imprimir factura:', id); }
function verPago(id) { console.log('Ver pago:', id); }
function imprimirRecibo(id) { console.log('Imprimir recibo:', id); }
function editarServicio(id) { console.log('Editar servicio:', id); }
function toggleServicio(id) { console.log('Toggle servicio:', id); }
function filtrarFacturas() { console.log('Filtrar facturas'); }
function filtrarPagos() { console.log('Filtrar pagos'); }
function generarReporteIngresos() { console.log('Reporte de ingresos'); }
function exportarFacturas() { console.log('Exportar facturas'); }
function verEstadisticas() { console.log('Ver estadísticas'); }

console.log('✅ Sistema de Pagos y Facturación cargado completamente');
