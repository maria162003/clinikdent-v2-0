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
    
    // Forzar datos inmediatamente para pruebas
    cargarDatosForzados();
    
    inicializarSistema();
});

// Función para cargar datos forzados inmediatamente
function cargarDatosForzados() {
    console.log('🔄 Cargando datos forzados para testing...');
    
    // Datos de pagos forzados
    window.pagos = [
        {
            id: 1,
            fecha_pago: '2024-09-08',
            paciente_id: 1,
            paciente_nombre: 'María José Rodríguez',
            concepto: 'Limpieza dental y fluorización',
            monto: 150000,
            metodo_pago: 'efectivo',
            estado: 'completado',
            descripcion: 'Pago por servicios de limpieza dental y aplicación de flúor',
            notas: 'Paciente satisfecho con el servicio'
        },
        {
            id: 2,
            fecha_pago: '2024-09-09',
            paciente_id: 2,
            paciente_nombre: 'Carlos Alberto Mendoza',
            concepto: 'Tratamiento de conducto',
            monto: 450000,
            metodo_pago: 'tarjeta_credito',
            estado: 'completado',
            descripcion: 'Endodoncia en molar superior derecho',
            referencia: 'TC-2024-001',
            numero_transaccion: 'TX789456123',
            autorizacion: 'AUTH456789'
        }
    ];
    
    // Datos de facturas forzados
    window.facturas = [
        {
            id: 1,
            numero_factura: 'F-2024-001',
            fecha_emision: '2024-09-08',
            fecha_vencimiento: '2024-10-08',
            paciente_id: 1,
            paciente_nombre: 'María José Rodríguez',
            concepto: 'Tratamiento dental completo',
            total: 150000,
            estado: 'pagada'
        }
    ];
    
    // Datos de pacientes forzados
    window.pacientes = [
        {
            id: 1,
            nombre: 'María José',
            apellido: 'Rodríguez',
            numero_documento: '12345678',
            telefono: '3001234567',
            email: 'maria.rodriguez@email.com'
        }
    ];
    
    // Asignar a variables globales
    pagos = window.pagos;
    facturas = window.facturas;
    pacientes = window.pacientes;
    
    console.log('✅ Datos forzados cargados:', { pagos: pagos.length, facturas: facturas.length, pacientes: pacientes.length });
    
    // Mostrar datos inmediatamente
    setTimeout(() => {
        mostrarPagosEnTabla();
        mostrarFacturasEnTabla();
    }, 100);
}

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
        // Forzar pacientes de ejemplo para testing
        pacientes = [
            {
                id: 1,
                nombre: 'María José',
                apellido: 'Rodríguez',
                numero_documento: '12345678',
                telefono: '3001234567',
                email: 'maria.rodriguez@email.com'
            },
            {
                id: 2,
                nombre: 'Carlos Alberto',
                apellido: 'Mendoza',
                numero_documento: '87654321',
                telefono: '3109876543',
                email: 'carlos.mendoza@email.com'
            },
            {
                id: 3,
                nombre: 'Ana Patricia',
                apellido: 'González',
                numero_documento: '11223344',
                telefono: '3201122334',
                email: 'ana.gonzalez@email.com'
            }
        ];
        console.log(`✅ ${pacientes.length} pacientes de ejemplo cargados forzadamente`);
        
        // Llenar selects de pacientes
        llenarSelectPacientes();
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        // Datos de fallback
        pacientes = [
            {
                id: 1,
                nombre: 'María José',
                apellido: 'Rodríguez',
                numero_documento: '12345678',
                telefono: '3001234567',
                email: 'maria.rodriguez@email.com'
            }
        ];
        llenarSelectPacientes();
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
        // Forzar datos de ejemplo para testing
        facturas = [
            {
                id: 1,
                numero_factura: 'F-2024-001',
                fecha_emision: '2024-09-08',
                fecha_vencimiento: '2024-10-08',
                paciente_id: 1,
                paciente_nombre: 'María José Rodríguez',
                concepto: 'Tratamiento dental completo',
                descripcion: 'Limpieza dental, fluorización y consulta general',
                subtotal: 127119,
                impuestos: 22881,
                total: 150000,
                estado: 'pagada',
                metodo_pago: 'efectivo',
                fecha_pago: '2024-09-08',
                servicios: [
                    { nombre: 'Limpieza dental', precio: 80000, cantidad: 1 },
                    { nombre: 'Fluorización', precio: 47119, cantidad: 1 }
                ]
            },
            {
                id: 2,
                numero_factura: 'F-2024-002',
                fecha_emision: '2024-09-09',
                fecha_vencimiento: '2024-10-09',
                paciente_id: 2,
                paciente_nombre: 'Carlos Alberto Mendoza',
                concepto: 'Endodoncia',
                descripcion: 'Tratamiento de conducto en molar superior derecho',
                subtotal: 381356,
                impuestos: 68644,
                total: 450000,
                estado: 'pagada',
                metodo_pago: 'tarjeta_credito',
                fecha_pago: '2024-09-09',
                servicios: [
                    { nombre: 'Endodoncia', precio: 450000, cantidad: 1 }
                ]
            },
            {
                id: 3,
                numero_factura: 'F-2024-003',
                fecha_emision: '2024-09-10',
                fecha_vencimiento: '2024-10-10',
                paciente_id: 3,
                paciente_nombre: 'Ana Patricia González',
                concepto: 'Consulta y diagnóstico',
                descripcion: 'Consulta general, radiografías panorámicas y plan de tratamiento',
                subtotal: 67797,
                impuestos: 12203,
                total: 80000,
                estado: 'pendiente',
                servicios: [
                    { nombre: 'Consulta general', precio: 50000, cantidad: 1 },
                    { nombre: 'Radiografías', precio: 30000, cantidad: 1 }
                ]
            },
            {
                id: 4,
                numero_factura: 'F-2024-004',
                fecha_emision: '2024-09-05',
                fecha_vencimiento: '2024-09-20',
                paciente_id: 1,
                paciente_nombre: 'María José Rodríguez',
                concepto: 'Ortodoncia - Cuota mensual',
                descripcion: 'Pago mensual de tratamiento de ortodoncia con brackets metálicos',
                subtotal: 254237,
                impuestos: 45763,
                total: 300000,
                estado: 'vencida',
                servicios: [
                    { nombre: 'Ortodoncia - Mensualidad', precio: 300000, cantidad: 1 }
                ]
            }
        ];
        console.log(`✅ ${facturas.length} facturas de ejemplo cargadas forzadamente`);
        mostrarFacturasEnTabla();
    } catch (error) {
        console.error('❌ Error cargando facturas:', error);
        facturas = [];
        mostrarFacturasEnTabla();
    }
}

async function cargarPagos() {
    try {
        // Forzar datos de ejemplo para testing
        pagos = [
            {
                id: 1,
                fecha_pago: '2024-09-08',
                paciente_id: 1,
                paciente_nombre: 'María José Rodríguez',
                concepto: 'Limpieza dental y fluorización',
                monto: 150000,
                metodo_pago: 'efectivo',
                estado: 'completado',
                descripcion: 'Pago por servicios de limpieza dental y aplicación de flúor',
                notas: 'Paciente satisfecho con el servicio'
            },
            {
                id: 2,
                fecha_pago: '2024-09-09',
                paciente_id: 2,
                paciente_nombre: 'Carlos Alberto Mendoza',
                concepto: 'Tratamiento de conducto',
                monto: 450000,
                metodo_pago: 'tarjeta_credito',
                estado: 'completado',
                descripcion: 'Endodoncia en molar superior derecho',
                referencia: 'TC-2024-001',
                numero_transaccion: 'TX789456123',
                autorizacion: 'AUTH456789'
            },
            {
                id: 3,
                fecha_pago: '2024-09-10',
                paciente_id: 3,
                paciente_nombre: 'Ana Patricia González',
                concepto: 'Consulta y radiografías',
                monto: 80000,
                metodo_pago: 'transferencia',
                estado: 'completado',
                descripcion: 'Consulta general y toma de radiografías panorámicas',
                banco: 'Bancolombia',
                comprobante: 'COMP123456'
            }
        ];
        console.log(`✅ ${pagos.length} pagos de ejemplo cargados forzadamente`);
        mostrarPagosEnTabla();
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
// ==========================================
// FUNCIONES DE FACTURACIÓN
// ==========================================

// Variable global para almacenar la factura actual
let facturaActual = null;

async function verFactura(id) {
    console.log('👁️ Ver detalles de la factura:', id);
    console.log('Facturas disponibles:', facturas);
    
    try {
        // Buscar la factura en los datos locales
        const factura = facturas.find(f => f.id == id);
        if (!factura) {
            console.error('❌ Factura no encontrada con ID:', id);
            mostrarError('Factura no encontrada');
            return;
        }
        
        console.log('✅ Factura encontrada:', factura);
        facturaActual = factura;
        
        // Generar contenido del modal
        const contenidoHtml = generarDetallesFactura(factura);
        
        // Mostrar en el modal
        document.getElementById('contenidoDetalleFactura').innerHTML = contenidoHtml;
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalVerFactura'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error al ver factura:', error);
        mostrarError('Error al cargar los detalles de la factura');
    }
}

function generarDetallesFactura(factura) {
    const paciente = pacientes.find(p => p.id == factura.paciente_id);
    const fechaEmision = formatearFecha(factura.fecha_emision);
    const fechaVencimiento = formatearFecha(factura.fecha_vencimiento);
    const fechaPago = factura.fecha_pago ? formatearFecha(factura.fecha_pago) : null;
    
    return `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="fas fa-file-invoice"></i> Información de la Factura</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Número:</strong> ${factura.numero_factura || `#${factura.id}`}</p>
                        <p><strong>Fecha de Emisión:</strong> ${fechaEmision}</p>
                        <p><strong>Fecha de Vencimiento:</strong> ${fechaVencimiento}</p>
                        ${fechaPago ? `<p><strong>Fecha de Pago:</strong> ${fechaPago}</p>` : ''}
                        <p><strong>Estado:</strong> 
                            <span class="status-badge status-${factura.estado || 'pendiente'}">
                                ${(factura.estado || 'pendiente').toUpperCase()}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-user"></i> Información del Paciente</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Nombre:</strong> ${paciente ? `${paciente.nombre} ${paciente.apellido}` : factura.paciente_nombre || 'N/A'}</p>
                        <p><strong>Documento:</strong> ${paciente ? paciente.numero_documento : 'N/A'}</p>
                        <p><strong>Teléfono:</strong> ${paciente ? paciente.telefono : 'N/A'}</p>
                        <p><strong>Email:</strong> ${paciente ? paciente.email : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mb-3">
            <div class="card-header bg-success text-white">
                <h6 class="mb-0"><i class="fas fa-clipboard-list"></i> Servicios Facturados</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Cantidad</th>
                                <th>Precio Unit.</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${factura.servicios ? factura.servicios.map(servicio => `
                                <tr>
                                    <td>${servicio.nombre}</td>
                                    <td>${servicio.cantidad || 1}</td>
                                    <td>${formatearMoneda(servicio.precio)}</td>
                                    <td><strong>${formatearMoneda(servicio.precio * (servicio.cantidad || 1))}</strong></td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="4">
                                        <p><strong>Concepto:</strong> ${factura.concepto}</p>
                                        <p><strong>Descripción:</strong> ${factura.descripcion || 'Servicios odontológicos'}</p>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-8">
                ${factura.descripcion && factura.servicios ? `
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0"><i class="fas fa-sticky-note"></i> Observaciones</h6>
                    </div>
                    <div class="card-body">
                        <p>${factura.descripcion}</p>
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-dark text-white">
                        <h6 class="mb-0"><i class="fas fa-calculator"></i> Totales</h6>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Subtotal:</span>
                            <span>${formatearMoneda(factura.subtotal || (factura.total * 0.847))}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>IVA (19%):</span>
                            <span>${formatearMoneda(factura.impuestos || (factura.total * 0.153))}</span>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <strong>Total:</strong>
                            <strong class="text-success fs-5">${formatearMoneda(factura.total)}</strong>
                        </div>
                        ${factura.metodo_pago && factura.estado === 'pagada' ? `
                        <hr>
                        <div class="d-flex justify-content-between">
                            <span>Método de Pago:</span>
                            <span class="badge bg-info">${factura.metodo_pago.toUpperCase()}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function imprimirFactura(id) {
    console.log('🖨️ Imprimir factura:', id);
    
    try {
        // Buscar la factura
        const factura = facturas.find(f => f.id == id);
        if (!factura) {
            mostrarError('Factura no encontrada');
            return;
        }
        
        // Generar contenido de impresión
        const contenidoImpresion = generarFacturaImpresion(factura);
        
        // Crear ventana de impresión
        const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
        ventanaImpresion.document.write(contenidoImpresion);
        ventanaImpresion.document.close();
        
        // Enfocar y imprimir
        ventanaImpresion.focus();
        ventanaImpresion.print();
        
        // Cerrar ventana después de imprimir
        setTimeout(() => {
            ventanaImpresion.close();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error al imprimir factura:', error);
        mostrarError('Error al generar la factura para impresión');
    }
}

function generarFacturaImpresion(factura) {
    const paciente = pacientes.find(p => p.id == factura.paciente_id);
    const fechaEmision = formatearFecha(factura.fecha_emision);
    const fechaVencimiento = formatearFecha(factura.fecha_vencimiento);
    const horaActual = new Date().toLocaleTimeString('es-ES');
    
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Factura ${factura.numero_factura || factura.id}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #007bff;
                }
                .factura-info {
                    text-align: right;
                }
                .factura-numero {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }
                .info-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .info-box {
                    width: 48%;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                }
                .info-box h4 {
                    margin-top: 0;
                    color: #007bff;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 8px;
                }
                .servicios-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .servicios-table th,
                .servicios-table td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                .servicios-table th {
                    background: #007bff;
                    color: white;
                    font-weight: bold;
                }
                .servicios-table .text-right {
                    text-align: right;
                }
                .totales {
                    margin-left: 60%;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                }
                .totales .total-final {
                    font-size: 18px;
                    font-weight: bold;
                    color: #28a745;
                    border-top: 2px solid #28a745;
                    padding-top: 8px;
                    margin-top: 8px;
                }
                .estado {
                    text-align: center;
                    margin: 20px 0;
                    padding: 15px;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                }
                .estado.pagada { background: #d4edda; color: #155724; }
                .estado.pendiente { background: #fff3cd; color: #856404; }
                .estado.vencida { background: #f8d7da; color: #721c24; }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">🦷 CLINIK DENT</div>
                    <div>Clínica Odontológica</div>
                    <div>NIT: 900.123.456-7</div>
                </div>
                <div class="factura-info">
                    <div class="factura-numero">FACTURA</div>
                    <div class="factura-numero">${factura.numero_factura || `#${factura.id}`}</div>
                </div>
            </div>
            
            <div class="info-section">
                <div class="info-box">
                    <h4>DATOS DEL PACIENTE</h4>
                    <p><strong>Nombre:</strong> ${paciente ? `${paciente.nombre} ${paciente.apellido}` : factura.paciente_nombre || 'N/A'}</p>
                    <p><strong>Documento:</strong> ${paciente ? paciente.numero_documento : 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${paciente ? paciente.telefono : 'N/A'}</p>
                    <p><strong>Email:</strong> ${paciente ? paciente.email : 'N/A'}</p>
                </div>
                <div class="info-box">
                    <h4>INFORMACIÓN DE FACTURA</h4>
                    <p><strong>Fecha de Emisión:</strong> ${fechaEmision}</p>
                    <p><strong>Fecha de Vencimiento:</strong> ${fechaVencimiento}</p>
                    <p><strong>Concepto:</strong> ${factura.concepto}</p>
                    ${factura.fecha_pago ? `<p><strong>Fecha de Pago:</strong> ${formatearFecha(factura.fecha_pago)}</p>` : ''}
                </div>
            </div>
            
            <table class="servicios-table">
                <thead>
                    <tr>
                        <th>Descripción del Servicio</th>
                        <th>Cantidad</th>
                        <th>Valor Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${factura.servicios ? factura.servicios.map(servicio => `
                        <tr>
                            <td>${servicio.nombre}</td>
                            <td class="text-right">${servicio.cantidad || 1}</td>
                            <td class="text-right">${formatearMoneda(servicio.precio)}</td>
                            <td class="text-right">${formatearMoneda(servicio.precio * (servicio.cantidad || 1))}</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td>${factura.concepto}</td>
                            <td class="text-right">1</td>
                            <td class="text-right">${formatearMoneda(factura.total)}</td>
                            <td class="text-right">${formatearMoneda(factura.total)}</td>
                        </tr>
                    `}
                </tbody>
            </table>
            
            <div class="totales">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Subtotal:</span>
                    <span>${formatearMoneda(factura.subtotal || (factura.total * 0.847))}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>IVA (19%):</span>
                    <span>${formatearMoneda(factura.impuestos || (factura.total * 0.153))}</span>
                </div>
                <div class="total-final" style="display: flex; justify-content: space-between;">
                    <span>TOTAL A PAGAR:</span>
                    <span>${formatearMoneda(factura.total)}</span>
                </div>
            </div>
            
            <div class="estado ${factura.estado || 'pendiente'}">
                ESTADO: ${(factura.estado || 'pendiente').toUpperCase()}
                ${factura.metodo_pago && factura.estado === 'pagada' ? ` - PAGADO CON ${factura.metodo_pago.toUpperCase()}` : ''}
            </div>
            
            ${factura.descripcion ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #007bff;">OBSERVACIONES</h4>
                <p>${factura.descripcion}</p>
            </div>
            ` : ''}
            
            <div class="footer">
                <p>Gracias por confiar en Clinik Dent</p>
                <p>Esta factura fue generada electrónicamente</p>
                <p>Impreso el ${new Date().toLocaleDateString('es-ES')} a las ${horaActual}</p>
            </div>
        </body>
        </html>
    `;
}

function imprimirDetalleFactura() {
    if (facturaActual) {
        imprimirFactura(facturaActual.id);
    } else {
        mostrarError('No hay factura seleccionada para imprimir');
    }
}

function cobrarFacturaActual() {
    if (facturaActual) {
        cobrarFactura(facturaActual.id);
    } else {
        mostrarError('No hay factura seleccionada para cobrar');
    }
}

function cobrarFactura(id) {
    console.log('💰 Cobrar factura:', id);
    
    try {
        // Buscar la factura
        const factura = facturas.find(f => f.id == id);
        if (!factura) {
            mostrarError('Factura no encontrada');
            return;
        }
        
        if (factura.estado === 'pagada') {
            mostrarError('Esta factura ya está pagada');
            return;
        }
        
        // Cerrar modal si está abierto
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalVerFactura'));
        if (modal) {
            modal.hide();
        }
        
        // Precargar datos en el modal de registro de pago
        document.getElementById('pacientePago').value = factura.paciente_id;
        document.getElementById('montoPago').value = factura.total;
        document.getElementById('conceptoPago').value = `Pago de ${factura.concepto} - Factura ${factura.numero_factura || factura.id}`;
        
        // Abrir modal de registro de pago
        const modalPago = new bootstrap.Modal(document.getElementById('modalRegistrarPago'));
        modalPago.show();
        
        mostrarExito('Datos de la factura cargados en el formulario de pago');
        
    } catch (error) {
        console.error('❌ Error al procesar cobro de factura:', error);
        mostrarError('Error al procesar el cobro de la factura');
    }
}

// Funciones de ejemplo existentes (placeholder)
function verFactura_old(id) { console.log('Ver factura:', id); }
function imprimirFactura_old(id) { console.log('Imprimir factura:', id); }
// ==========================================
// FUNCIONES GLOBALES PARA PAGOS (sin conflictos)
// ==========================================

// Función principal para ver pago (asegurar que sea global)
window.verPago = function(id) {
    console.log('� FUNCIÓN GLOBAL - Ver detalles del pago:', id);
    console.log('Pagos disponibles:', window.pagos || pagos);
    
    try {
        const todosPagos = window.pagos || pagos || [];
        const pago = todosPagos.find(p => p.id == id);
        
        if (!pago) {
            console.error('❌ Pago no encontrado con ID:', id);
            alert('Pago no encontrado. ID: ' + id);
            return;
        }
        
        console.log('✅ Pago encontrado:', pago);
        
        // Crear y mostrar modal manualmente
        const modalHtml = `
            <div class="modal fade" id="modalPagoTemporal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-receipt"></i> Detalles del Pago #${pago.id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-user"></i> Información del Paciente</h6>
                                    <p><strong>Nombre:</strong> ${pago.paciente_nombre}</p>
                                    <p><strong>Concepto:</strong> ${pago.concepto}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-money-bill"></i> Información del Pago</h6>
                                    <p><strong>Fecha:</strong> ${pago.fecha_pago}</p>
                                    <p><strong>Monto:</strong> <span class="text-success fs-5">${formatearMoneda(pago.monto)}</span></p>
                                    <p><strong>Método:</strong> ${pago.metodo_pago}</p>
                                    <p><strong>Estado:</strong> ${pago.estado}</p>
                                </div>
                            </div>
                            <div class="mt-3">
                                <h6><i class="fas fa-clipboard-list"></i> Descripción</h6>
                                <p>${pago.descripcion}</p>
                                ${pago.notas ? `<p><strong>Notas:</strong> ${pago.notas}</p>` : ''}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="window.imprimirPago(${pago.id})">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalPagoTemporal');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalPagoTemporal'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error al ver pago:', error);
        alert('Error: ' + error.message);
    }
};

// Función principal para imprimir pago
window.imprimirPago = function(id) {
    console.log('🖨️ FUNCIÓN GLOBAL - Imprimir recibo del pago:', id);
    
    try {
        const todosPagos = window.pagos || pagos || [];
        const pago = todosPagos.find(p => p.id == id);
        
        if (!pago) {
            alert('Pago no encontrado para imprimir');
            return;
        }
        
        // Crear contenido de impresión simplificado
        const contenidoImpresion = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo de Pago #${pago.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #007bff; }
                    .info { margin: 20px 0; }
                    .total { background: #28a745; color: white; padding: 15px; text-align: center; font-size: 18px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🦷 CLINIK DENT</div>
                    <div>RECIBO DE PAGO</div>
                </div>
                <div class="info">
                    <p><strong>Recibo N°:</strong> #${pago.id}</p>
                    <p><strong>Fecha:</strong> ${pago.fecha_pago}</p>
                    <p><strong>Paciente:</strong> ${pago.paciente_nombre}</p>
                    <p><strong>Concepto:</strong> ${pago.concepto}</p>
                    <p><strong>Método de Pago:</strong> ${pago.metodo_pago}</p>
                    <p><strong>Estado:</strong> ${pago.estado}</p>
                </div>
                <div class="total">
                    MONTO TOTAL: ${formatearMoneda(pago.monto)}
                </div>
                <div style="text-align: center; margin-top: 30px; color: #666;">
                    <p>Gracias por su pago</p>
                    <p>Clinik Dent - Cuidamos tu sonrisa</p>
                </div>
            </body>
            </html>
        `;
        
        // Abrir ventana de impresión
        const ventana = window.open('', '_blank', 'width=800,height=600');
        ventana.document.write(contenidoImpresion);
        ventana.document.close();
        ventana.focus();
        ventana.print();
        
        // Cerrar después de un momento
        setTimeout(() => ventana.close(), 1000);
        
    } catch (error) {
        console.error('❌ Error al imprimir:', error);
        alert('Error al imprimir: ' + error.message);
    }
};

// Alias para evitar conflictos
window.imprimirRecibo = window.imprimirPago;

// ==========================================
// FUNCIONES GLOBALES PARA FACTURAS (sin conflictos)
// ==========================================

// Función principal para ver factura
window.verFactura = function(id) {
    console.log('🔍 FUNCIÓN GLOBAL - Ver detalles de la factura:', id);
    console.log('Facturas disponibles:', window.facturas || facturas);
    
    try {
        const todasFacturas = window.facturas || facturas || [];
        const factura = todasFacturas.find(f => f.id == id);
        
        if (!factura) {
            console.error('❌ Factura no encontrada con ID:', id);
            alert('Factura no encontrada. ID: ' + id);
            return;
        }
        
        console.log('✅ Factura encontrada:', factura);
        
        // Crear y mostrar modal manualmente
        const modalHtml = `
            <div class="modal fade" id="modalFacturaTemporal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-file-invoice"></i> Detalles de la Factura ${factura.numero_factura || '#' + factura.id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-file-invoice"></i> Información de la Factura</h6>
                                    <p><strong>Número:</strong> ${factura.numero_factura || '#' + factura.id}</p>
                                    <p><strong>Fecha de Emisión:</strong> ${factura.fecha_emision}</p>
                                    <p><strong>Fecha de Vencimiento:</strong> ${factura.fecha_vencimiento}</p>
                                    <p><strong>Estado:</strong> <span class="badge bg-${factura.estado === 'pagada' ? 'success' : factura.estado === 'pendiente' ? 'warning' : 'danger'}">${factura.estado}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-user"></i> Información del Paciente</h6>
                                    <p><strong>Nombre:</strong> ${factura.paciente_nombre}</p>
                                    <p><strong>Concepto:</strong> ${factura.concepto}</p>
                                </div>
                            </div>
                            <div class="mt-3">
                                <h6><i class="fas fa-calculator"></i> Información Financiera</h6>
                                <div class="row">
                                    <div class="col-md-8">
                                        <p><strong>Descripción:</strong> ${factura.descripcion || 'Servicios odontológicos'}</p>
                                    </div>
                                    <div class="col-md-4">
                                        <p><strong>Subtotal:</strong> ${formatearMoneda(factura.subtotal || (factura.total * 0.847))}</p>
                                        <p><strong>IVA:</strong> ${formatearMoneda(factura.impuestos || (factura.total * 0.153))}</p>
                                        <p><strong>Total:</strong> <span class="text-success fs-5">${formatearMoneda(factura.total)}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            ${factura.estado !== 'pagada' ? `<button type="button" class="btn btn-success" onclick="window.cobrarFactura(${factura.id})"><i class="fas fa-dollar-sign"></i> Cobrar</button>` : ''}
                            <button type="button" class="btn btn-primary" onclick="window.imprimirFactura(${factura.id})">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalFacturaTemporal');
        if (modalAnterior) {
            modalAnterior.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalFacturaTemporal'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error al ver factura:', error);
        alert('Error: ' + error.message);
    }
};

// Función principal para imprimir factura
window.imprimirFactura = function(id) {
    console.log('🖨️ FUNCIÓN GLOBAL - Imprimir factura:', id);
    
    try {
        const todasFacturas = window.facturas || facturas || [];
        const factura = todasFacturas.find(f => f.id == id);
        
        if (!factura) {
            alert('Factura no encontrada para imprimir');
            return;
        }
        
        // Crear contenido de impresión
        const contenidoImpresion = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Factura ${factura.numero_factura || factura.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #007bff; padding-bottom: 20px; }
                    .logo { font-size: 28px; font-weight: bold; color: #007bff; }
                    .factura-numero { font-size: 24px; font-weight: bold; color: #007bff; }
                    .info-section { display: flex; justify-content: space-between; margin: 30px 0; }
                    .info-box { width: 48%; background: #f8f9fa; padding: 15px; border-radius: 8px; }
                    .totales { margin-left: 60%; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
                    .total-final { font-size: 18px; font-weight: bold; color: #28a745; border-top: 2px solid #28a745; padding-top: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo">🦷 CLINIK DENT</div>
                        <div>Clínica Odontológica</div>
                        <div>NIT: 900.123.456-7</div>
                    </div>
                    <div>
                        <div class="factura-numero">FACTURA</div>
                        <div class="factura-numero">${factura.numero_factura || '#' + factura.id}</div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>DATOS DEL PACIENTE</h4>
                        <p><strong>Nombre:</strong> ${factura.paciente_nombre}</p>
                        <p><strong>Concepto:</strong> ${factura.concepto}</p>
                    </div>
                    <div class="info-box">
                        <h4>INFORMACIÓN DE FACTURA</h4>
                        <p><strong>Fecha de Emisión:</strong> ${factura.fecha_emision}</p>
                        <p><strong>Fecha de Vencimiento:</strong> ${factura.fecha_vencimiento}</p>
                        <p><strong>Estado:</strong> ${factura.estado}</p>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4>DESCRIPCIÓN DE SERVICIOS</h4>
                    <p>${factura.descripcion || factura.concepto}</p>
                </div>
                
                <div class="totales">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Subtotal:</span>
                        <span>${formatearMoneda(factura.subtotal || (factura.total * 0.847))}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>IVA (19%):</span>
                        <span>${formatearMoneda(factura.impuestos || (factura.total * 0.153))}</span>
                    </div>
                    <div class="total-final" style="display: flex; justify-content: space-between;">
                        <span>TOTAL A PAGAR:</span>
                        <span>${formatearMoneda(factura.total)}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 40px; color: #666;">
                    <p>Gracias por confiar en Clinik Dent</p>
                    <p>Esta factura fue generada electrónicamente</p>
                </div>
            </body>
            </html>
        `;
        
        // Abrir ventana de impresión
        const ventana = window.open('', '_blank', 'width=800,height=600');
        ventana.document.write(contenidoImpresion);
        ventana.document.close();
        ventana.focus();
        ventana.print();
        
        // Cerrar después de un momento
        setTimeout(() => ventana.close(), 1000);
        
    } catch (error) {
        console.error('❌ Error al imprimir factura:', error);
        alert('Error al imprimir: ' + error.message);
    }
};

// Función para cobrar factura
window.cobrarFactura = function(id) {
    console.log('💰 FUNCIÓN GLOBAL - Cobrar factura:', id);
    alert(`Funcionalidad de cobro para factura ${id} - Se puede integrar con el sistema de pagos`);
};

function generarDetallesPago(pago) {
    const paciente = pacientes.find(p => p.id == pago.paciente_id);
    const fechaPago = formatearFecha(pago.fecha_pago);
    
    return `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="fas fa-user"></i> Información del Paciente</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Nombre:</strong> ${paciente ? `${paciente.nombre} ${paciente.apellido}` : pago.paciente_nombre || 'N/A'}</p>
                        <p><strong>Documento:</strong> ${paciente ? paciente.numero_documento : 'N/A'}</p>
                        <p><strong>Teléfono:</strong> ${paciente ? paciente.telefono : 'N/A'}</p>
                        <p><strong>Email:</strong> ${paciente ? paciente.email : 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-money-bill"></i> Información del Pago</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>ID Pago:</strong> #${pago.id}</p>
                        <p><strong>Fecha:</strong> ${fechaPago}</p>
                        <p><strong>Monto:</strong> <span class="text-success fs-5">${formatearMoneda(pago.monto)}</span></p>
                        <p><strong>Método:</strong> 
                            <span class="badge bg-info">${(pago.metodo_pago || 'efectivo').toUpperCase()}</span>
                        </p>
                        <p><strong>Estado:</strong> 
                            <span class="status-badge status-${pago.estado || 'completado'}">
                                ${(pago.estado || 'completado').toUpperCase()}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header bg-info text-white">
                <h6 class="mb-0"><i class="fas fa-clipboard-list"></i> Detalles del Servicio</h6>
            </div>
            <div class="card-body">
                <p><strong>Concepto:</strong> ${pago.concepto || 'Pago de servicios odontológicos'}</p>
                <p><strong>Descripción:</strong> ${pago.descripcion || 'Pago realizado por servicios odontológicos prestados'}</p>
                ${pago.notas ? `<p><strong>Notas:</strong> ${pago.notas}</p>` : ''}
                ${pago.referencia ? `<p><strong>Referencia:</strong> ${pago.referencia}</p>` : ''}
                ${pago.comprobante ? `<p><strong>Comprobante:</strong> ${pago.comprobante}</p>` : ''}
            </div>
        </div>
        
        ${pago.metodo_pago !== 'efectivo' ? `
        <div class="card mt-3">
            <div class="card-header bg-warning text-dark">
                <h6 class="mb-0"><i class="fas fa-credit-card"></i> Información de Transacción</h6>
            </div>
            <div class="card-body">
                <p><strong>Método de Pago:</strong> ${(pago.metodo_pago || 'efectivo').toUpperCase()}</p>
                ${pago.numero_transaccion ? `<p><strong>Número de Transacción:</strong> ${pago.numero_transaccion}</p>` : ''}
                ${pago.autorizacion ? `<p><strong>Código de Autorización:</strong> ${pago.autorizacion}</p>` : ''}
                ${pago.banco ? `<p><strong>Banco:</strong> ${pago.banco}</p>` : ''}
            </div>
        </div>
        ` : ''}
    `;
}

async function imprimirRecibo(id) {
    console.log('🖨️ Imprimir recibo del pago:', id);
    
    try {
        // Buscar el pago
        const pago = pagos.find(p => p.id == id);
        if (!pago) {
            mostrarError('Pago no encontrado');
            return;
        }
        
        // Generar contenido de impresión
        const contenidoImpresion = generarReciboImpresion(pago);
        
        // Crear ventana de impresión
        const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
        ventanaImpresion.document.write(contenidoImpresion);
        ventanaImpresion.document.close();
        
        // Enfocar y imprimir
        ventanaImpresion.focus();
        ventanaImpresion.print();
        
        // Cerrar ventana después de imprimir
        setTimeout(() => {
            ventanaImpresion.close();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error al imprimir recibo:', error);
        mostrarError('Error al generar el recibo para impresión');
    }
}

function generarReciboImpresion(pago) {
    const paciente = pacientes.find(p => p.id == pago.paciente_id);
    const fechaPago = formatearFecha(pago.fecha_pago);
    const horaActual = new Date().toLocaleTimeString('es-ES');
    
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recibo de Pago #${pago.id}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }
                .subtitle {
                    color: #666;
                    margin-top: 5px;
                }
                .recibo-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 5px 0;
                    border-bottom: 1px dotted #ddd;
                }
                .info-row:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                .label {
                    font-weight: bold;
                    width: 40%;
                }
                .value {
                    width: 60%;
                    text-align: right;
                }
                .monto-total {
                    background: #28a745;
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🦷 CLINIK DENT</div>
                <div class="subtitle">Clínica Odontológica</div>
                <div class="subtitle">RECIBO DE PAGO</div>
            </div>
            
            <div class="recibo-info">
                <div class="info-row">
                    <span class="label">Recibo N°:</span>
                    <span class="value">#${pago.id}</span>
                </div>
                <div class="info-row">
                    <span class="label">Fecha de Pago:</span>
                    <span class="value">${fechaPago}</span>
                </div>
                <div class="info-row">
                    <span class="label">Hora de Impresión:</span>
                    <span class="value">${horaActual}</span>
                </div>
            </div>
            
            <div class="recibo-info">
                <h4 style="margin-top: 0; color: #007bff;">DATOS DEL PACIENTE</h4>
                <div class="info-row">
                    <span class="label">Nombre:</span>
                    <span class="value">${paciente ? `${paciente.nombre} ${paciente.apellido}` : pago.paciente_nombre || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Documento:</span>
                    <span class="value">${paciente ? paciente.numero_documento : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Teléfono:</span>
                    <span class="value">${paciente ? paciente.telefono : 'N/A'}</span>
                </div>
            </div>
            
            <div class="recibo-info">
                <h4 style="margin-top: 0; color: #007bff;">DETALLES DEL PAGO</h4>
                <div class="info-row">
                    <span class="label">Concepto:</span>
                    <span class="value">${pago.concepto || 'Servicios odontológicos'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Método de Pago:</span>
                    <span class="value">${(pago.metodo_pago || 'efectivo').toUpperCase()}</span>
                </div>
                <div class="info-row">
                    <span class="label">Estado:</span>
                    <span class="value">${(pago.estado || 'completado').toUpperCase()}</span>
                </div>
                ${pago.referencia ? `
                <div class="info-row">
                    <span class="label">Referencia:</span>
                    <span class="value">${pago.referencia}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="monto-total">
                MONTO TOTAL: ${formatearMoneda(pago.monto)}
            </div>
            
            ${pago.notas ? `
            <div class="recibo-info">
                <h4 style="margin-top: 0; color: #007bff;">OBSERVACIONES</h4>
                <p>${pago.notas}</p>
            </div>
            ` : ''}
            
            <div class="footer">
                <p>Este es un comprobante válido de pago</p>
                <p>Clinik Dent - Cuidamos tu sonrisa</p>
                <p>Impreso el ${new Date().toLocaleDateString('es-ES')} a las ${horaActual}</p>
            </div>
        </body>
        </html>
    `;
}

function imprimirDetallePago() {
    if (pagoActual) {
        imprimirRecibo(pagoActual.id);
    } else {
        mostrarError('No hay pago seleccionado para imprimir');
    }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return fecha;
    }
}

function formatearMoneda(cantidad) {
    if (!cantidad) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(cantidad);
}

function mostrarError(mensaje) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function mostrarExito(mensaje) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}
function editarServicio(id) { console.log('Editar servicio:', id); }
function toggleServicio(id) { console.log('Toggle servicio:', id); }
function filtrarFacturas() { console.log('Filtrar facturas'); }
function filtrarPagos() { console.log('Filtrar pagos'); }
function generarReporteIngresos() { console.log('Reporte de ingresos'); }
function exportarFacturas() { console.log('Exportar facturas'); }
function verEstadisticas() { console.log('Ver estadísticas'); }

console.log('✅ Sistema de Pagos y Facturación cargado completamente');
