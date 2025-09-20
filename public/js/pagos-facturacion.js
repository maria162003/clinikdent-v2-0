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
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = localStorage.getItem('userId') || user.id;
    
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
        console.log('🔄 Cargando pacientes desde API...');
        console.log('🔑 Token disponible:', localStorage.getItem('authToken'));
        console.log('👤 Usuario logueado:', JSON.parse(localStorage.getItem('user') || '{}'));
        
        const response = await authFetch('/api/usuarios');
        console.log('📡 Respuesta status:', response.status);
        console.log('📡 Respuesta ok:', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Datos recibidos completos:', data);
            
            // La API devuelve directamente un array de usuarios
            const usuarios = Array.isArray(data) ? data : (data.usuarios || data.value || []);
            console.log(`👥 Total usuarios recibidos: ${usuarios.length}`);
            
            // Filtrar pacientes - solo por rol === 'paciente'
            pacientes = usuarios.filter(u => u.rol === 'paciente');
            
            console.log(`✅ ${pacientes.length} pacientes filtrados desde API`);
            console.log('📄 Pacientes encontrados:', pacientes);
            
            if (pacientes.length > 0) {
                console.log('📄 Primer paciente:', pacientes[0]);
                llenarSelectPacientes();
            } else {
                console.warn('⚠️ No se encontraron pacientes con rol "paciente"');
                // Mostrar todos los usuarios para debug
                console.log('� Todos los usuarios para debug:', usuarios.map(u => ({
                    id: u.id,
                    nombre: u.nombre,
                    apellido: u.apellido,
                    rol: u.rol
                })));
            }
        } else {
            const errorText = await response.text();
            console.error('❌ Error en API:', response.status, errorText);
            console.warn('⚠️ No se pudieron cargar pacientes desde la API, usando datos de ejemplo');
            // Datos de ejemplo si falla la API
            pacientes = [
                { id: 3, nombre: 'María', apellido: 'González', correo: 'maria@gmail.com' },
                { id: 4, nombre: 'Juan', apellido: 'Pérez', correo: 'juan@gmail.com' }
            ];
        }
        
        // Llenar selects de pacientes
        llenarSelectPacientes();
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        // Datos de fallback
        pacientes = [
            { id: 3, nombre: 'María', apellido: 'González', correo: 'maria@gmail.com' },
            { id: 4, nombre: 'Juan', apellido: 'Pérez', correo: 'juan@gmail.com' }
        ];
        llenarSelectPacientes();
    }
}

async function cargarServicios() {
    try {
        console.log('🔄 Cargando servicios desde API...');
        
        // Mostrar indicador de carga en la tabla
        const tbody = document.querySelector('#tablaServicios tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-spinner fa-spin fa-2x mb-2 text-primary"></i>
                        <p class="text-muted">Conectando con el servidor...</p>
                    </td>
                </tr>
            `;
        }
        
        const response = await authFetch('/api/tratamientos');
        console.log('📡 Respuesta servicios status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Datos servicios recibidos:', data);
            
            // La API puede devolver {success: true, tratamientos: [...]} o directamente [...]
            servicios = data.tratamientos || data || [];
            console.log(`✅ ${servicios.length} servicios cargados desde API`);
            
            if (servicios.length > 0) {
                console.log('📄 Primer servicio:', servicios[0]);
            }
            
            // Llenar tabla de servicios y selects
            mostrarServiciosEnTabla();
            llenarSelectServicios();
            
            // Mostrar notificación de éxito
            if (typeof mostrarSuccess === 'function' && servicios.length > 0) {
                mostrarSuccess(`${servicios.length} servicios cargados correctamente`);
            }
        } else {
            const errorText = await response.text();
            console.error('❌ Error en API servicios:', response.status, errorText);
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error cargando servicios:', error);
        
        // Mostrar mensaje de error en la tabla
        const tbody = document.querySelector('#tablaServicios tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2 text-warning"></i>
                        <p class="text-muted mb-2">Error al conectar con el servidor</p>
                        <button class="btn btn-sm btn-outline-primary" onclick="cargarServicios()">
                            <i class="fas fa-retry"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
        
        // Servicios de ejemplo si no se pueden cargar
        console.log('🔄 Usando servicios de ejemplo...');
        servicios = [
            { 
                id: 1, 
                nombre: 'Limpieza Dental', 
                precio: 80000, 
                costo_estimado: 80000,
                descripcion: 'Limpieza dental básica con fluorización',
                duracion: 60,
                activo: true
            },
            { 
                id: 2, 
                nombre: 'Consulta General', 
                precio: 50000, 
                costo_estimado: 50000,
                descripcion: 'Consulta odontológica general y revisión',
                duracion: 30,
                activo: true
            },
            { 
                id: 3, 
                nombre: 'Extracción Dental', 
                precio: 120000, 
                costo_estimado: 120000,
                descripcion: 'Extracción de pieza dental simple',
                duracion: 45,
                activo: true
            }
        ];
        
        mostrarServiciosEnTabla();
        llenarSelectServicios();
        
        // Mostrar notificación de advertencia
        if (typeof mostrarWarning === 'function') {
            mostrarWarning('Usando servicios de ejemplo. Verifique la conexión al servidor.');
        }
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
    console.log('🔄 Llenando selects de pacientes...', pacientes.length, 'pacientes disponibles');
    console.log('📄 Pacientes a agregar:', pacientes);
    
    const selects = ['pacienteFactura', 'pacientePago'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        console.log(`🔍 Buscando elemento con ID: ${selectId}`, select ? '✅ Encontrado' : '❌ No encontrado');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccionar paciente...</option>';
            
            if (pacientes.length === 0) {
                select.innerHTML += '<option value="" disabled>No hay pacientes disponibles</option>';
                console.log(`⚠️ No hay pacientes para llenar ${selectId}`);
                return;
            }
            
            pacientes.forEach(paciente => {
                const nombre = `${paciente.nombre || 'N/A'} ${paciente.apellido || ''}`.trim();
                const documento = paciente.numero_documento || paciente.telefono || paciente.correo || 'N/A';
                
                const optionHTML = `<option value="${paciente.id}">${nombre} - ${documento}</option>`;
                select.innerHTML += optionHTML;
                
                console.log(`➕ Paciente agregado a ${selectId}: ${nombre} (ID: ${paciente.id})`);
            });
            
            console.log(`✅ Select ${selectId} llenado con ${pacientes.length} pacientes`);
        } else {
            console.error(`❌ No se encontró el elemento select con ID: ${selectId}`);
        }
    });
}

function llenarSelectServicios() {
    // Llenar el select de servicios en el modal de nueva factura
    const container = document.querySelector('#serviciosFactura .servicio-select');
    if (container) {
        container.innerHTML = '<option value="">Seleccionar servicio...</option>';
        servicios.forEach(servicio => {
            const precio = servicio.costo_base || servicio.precio || servicio.costo_estimado || 0;
            container.innerHTML += `
                <option value="${servicio.id}" data-precio="${precio}">
                    ${servicio.nombre} - ${formatearMoneda(precio)}
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
    console.log('🔧 [NUEVA VERSION] Configurar Servicios clickeado - v20250915');
    
    // Mostrar feedback visual inmediato
    const btn = event.target.closest('button');
    if (btn) {
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 1000);
    }
    
    // Cambiar a la tab de servicios
    const serviciosTab = document.getElementById('servicios-tab');
    if (serviciosTab) {
        serviciosTab.click();
        console.log('✅ Pestaña de servicios activada');
        
        // Recargar servicios si es necesario
        setTimeout(() => {
            if (servicios.length === 0) {
                console.log('🔄 Recargando servicios...');
                cargarServicios();
            }
        }, 300);
        
        // Mostrar notificación de éxito
        if (typeof mostrarSuccess === 'function') {
            mostrarSuccess('Configuración de servicios cargada');
        }
    } else {
        console.error('❌ No se encontró servicios-tab');
        if (typeof mostrarError === 'function') {
            mostrarError('Error al cargar configuración de servicios');
        }
    }
}

function nuevoServicio() {
    console.log('➕ [NUEVA VERSION] Nuevo Servicio clickeado - v20250915');
    
    // Mostrar feedback visual inmediato
    const btn = event.target.closest('button');
    if (btn) {
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abriendo...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 500);
    }
    
    // Abrir modal y limpiar formulario
    const modal = new bootstrap.Modal(document.getElementById('modalConfigServicios'));
    limpiarFormulario('formConfigServicio');
    
    // Valores por defecto
    document.getElementById('duracionServicio').value = '60';
    document.getElementById('activoServicio').checked = true;
    
    modal.show();
    
    console.log('✅ Modal de nuevo servicio abierto');
    
    // Mostrar notificación
    if (typeof mostrarInfo === 'function') {
        mostrarInfo('Complete los datos del nuevo servicio');
    }
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

// =====================================================
// FUNCIONES PARA PAGOS A ODONTÓLOGOS
// =====================================================

// Variables globales para pagos a odontólogos
let odontologos = [];
let resumenOdontologos = [];
let odontologoSeleccionado = null;

// Función para cargar la pestaña de pagos a odontólogos
async function cargarPagosOdontologos() {
    console.log('🦷 Cargando sistema de pagos a odontólogos...');
    
    try {
        await cargarListaOdontologos();
        await cargarResumenGeneralOdontologos();
        configurarEventosOdontologos();
        
        console.log('✅ Sistema de pagos a odontólogos cargado exitosamente');
    } catch (error) {
        console.error('❌ Error cargando pagos a odontólogos:', error);
        mostrarError('Error cargando el sistema de pagos a odontólogos');
    }
}

// Cargar lista de odontólogos para el select
async function cargarListaOdontologos() {
    try {
        const response = await authFetch('/api/usuarios/odontologos');
        
        if (response.ok) {
            odontologos = await response.json();
            console.log('✅ Odontólogos cargados:', odontologos.length);
            
            // Llenar el select del modal
            const selectOdontologo = document.getElementById('selectOdontologo');
            if (selectOdontologo) {
                selectOdontologo.innerHTML = '<option value="">Seleccione un odontólogo...</option>';
                odontologos.forEach(odontologo => {
                    const option = document.createElement('option');
                    option.value = odontologo.id;
                    option.textContent = `${odontologo.nombre} ${odontologo.apellido}`;
                    selectOdontologo.appendChild(option);
                });
            }
        } else {
            throw new Error('Error obteniendo lista de odontólogos');
        }
    } catch (error) {
        console.error('❌ Error cargando odontólogos:', error);
        // Cargar datos de prueba si hay error con la API
        cargarOdontologosPrueba();
    }
}

// Datos de prueba para odontólogos
function cargarOdontologosPrueba() {
    odontologos = [
        { id: 1, nombre: 'Dr. Carlos', apellido: 'Mendoza', especialidad: 'Endodoncia' },
        { id: 2, nombre: 'Dra. Ana', apellido: 'García', especialidad: 'Ortodoncia' },
        { id: 3, nombre: 'Dr. Luis', apellido: 'Rodríguez', especialidad: 'Cirugía Oral' }
    ];
    
    // Llenar el select
    const selectOdontologo = document.getElementById('selectOdontologo');
    if (selectOdontologo) {
        selectOdontologo.innerHTML = '<option value="">Seleccione un odontólogo...</option>';
        odontologos.forEach(odontologo => {
            const option = document.createElement('option');
            option.value = odontologo.id;
            option.textContent = `${odontologo.nombre} ${odontologo.apellido}`;
            selectOdontologo.appendChild(option);
        });
    }
}

// Cargar resumen general de todos los odontólogos
async function cargarResumenGeneralOdontologos() {
    try {
        const response = await authFetch('/api/pagos-odontologo/admin/resumen-general');
        
        if (response.ok) {
            const resumen = await response.json();
            resumenOdontologos = resumen.odontologos || [];
            
            // Actualizar estadísticas
            actualizarEstadisticasOdontologos(resumen);
            
            // Actualizar tabla
            actualizarTablaOdontologos();
            
        } else {
            throw new Error('Error obteniendo resumen general');
        }
    } catch (error) {
        console.error('❌ Error cargando resumen:', error);
        cargarDatosPruebaOdontologos();
    }
}

// Actualizar estadísticas en las cards
function actualizarEstadisticasOdontologos(resumen) {
    const stats = resumen.estadisticas || {};
    
    // Total odontólogos
    const totalOdontologosCard = document.querySelector('#totalOdontologos');
    if (totalOdontologosCard) {
        totalOdontologosCard.textContent = stats.total_odontologos || resumenOdontologos.length;
    }
    
    // Pagos pendientes
    const pagosPendientesCard = document.querySelector('#pagosPendientesOdontologos');
    if (pagosPendientesCard) {
        pagosPendientesCard.textContent = `$${formatearNumero(stats.total_pendiente || 0)}`;
    }
    
    // Pagos del mes
    const pagosMesCard = document.querySelector('#pagosMesOdontologos');
    if (pagosMesCard) {
        pagosMesCard.textContent = `$${formatearNumero(stats.pagos_mes_actual || 0)}`;
    }
    
    // Total comisiones
    const totalComisionesCard = document.querySelector('#totalComisionesOdontologos');
    if (totalComisionesCard) {
        totalComisionesCard.textContent = `$${formatearNumero(stats.total_comisiones || 0)}`;
    }
}

// Actualizar tabla de odontólogos
function actualizarTablaOdontologos() {
    const tbody = document.querySelector('#tablaOdontologos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!resumenOdontologos || resumenOdontologos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    No hay datos de odontólogos disponibles
                </td>
            </tr>
        `;
        return;
    }
    
    resumenOdontologos.forEach(odontologo => {
        const fila = document.createElement('tr');
        
        const saldoPendiente = odontologo.saldo_pendiente || 0;
        const classeSaldo = saldoPendiente > 0 ? 'text-warning' : 'text-muted';
        
        fila.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm bg-light rounded-circle me-2 d-flex align-items-center justify-content-center">
                        <i class="fas fa-user-md text-primary"></i>
                    </div>
                    <div>
                        <div class="fw-medium">${odontologo.nombre || 'Sin nombre'} ${odontologo.apellido || ''}</div>
                        <small class="text-muted">${odontologo.especialidad || 'General'}</small>
                    </div>
                </div>
            </td>
            <td>$${formatearNumero(odontologo.total_comisiones || 0)}</td>
            <td>$${formatearNumero(odontologo.total_pagado || 0)}</td>
            <td class="${classeSaldo}">
                <strong>$${formatearNumero(saldoPendiente)}</strong>
            </td>
            <td>
                <span class="badge ${saldoPendiente > 0 ? 'bg-warning' : 'bg-success'}">
                    ${saldoPendiente > 0 ? 'Pendiente' : 'Al día'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="verDetallesOdontologo(${odontologo.id})" 
                            title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="abrirModalPago(${odontologo.id})" 
                            title="Registrar pago" ${saldoPendiente <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(fila);
    });
}

// Cargar datos de prueba para odontólogos
function cargarDatosPruebaOdontologos() {
    resumenOdontologos = [
        {
            id: 1,
            nombre: 'Dr. Carlos',
            apellido: 'Mendoza',
            especialidad: 'Endodoncia',
            total_comisiones: 2500000,
            total_pagado: 2000000,
            saldo_pendiente: 500000
        },
        {
            id: 2,
            nombre: 'Dra. Ana',
            apellido: 'García',
            especialidad: 'Ortodoncia',
            total_comisiones: 3200000,
            total_pagado: 3200000,
            saldo_pendiente: 0
        },
        {
            id: 3,
            nombre: 'Dr. Luis',
            apellido: 'Rodríguez',
            especialidad: 'Cirugía Oral',
            total_comisiones: 1800000,
            total_pagado: 1500000,
            saldo_pendiente: 300000
        }
    ];
    
    // Actualizar estadísticas de prueba
    actualizarEstadisticasOdontologos({
        estadisticas: {
            total_odontologos: 3,
            total_pendiente: 800000,
            pagos_mes_actual: 1200000,
            total_comisiones: 7500000
        }
    });
    
    actualizarTablaOdontologos();
}

// Configurar eventos para la sección de odontólogos
function configurarEventosOdontologos() {
    // Evento para cambio de odontólogo en el modal
    const selectOdontologo = document.getElementById('selectOdontologo');
    if (selectOdontologo) {
        selectOdontologo.addEventListener('change', function() {
            const odontologoId = this.value;
            if (odontologoId) {
                cargarServiciosPendientesOdontologo(odontologoId);
            } else {
                limpiarServiciosPendientes();
            }
        });
    }
    
    // Evento para el formulario de registro de pago
    const formPago = document.getElementById('formPagoOdontologo');
    if (formPago) {
        formPago.addEventListener('submit', function(e) {
            e.preventDefault();
            registrarPagoOdontologo();
        });
    }
    
    // Establecer fecha actual por defecto
    const fechaPago = document.getElementById('fechaPagoOdontologo');
    if (fechaPago) {
        fechaPago.value = new Date().toISOString().split('T')[0];
    }
}

// Abrir modal para registrar pago a un odontólogo específico
function abrirModalPago(odontologoId = null) {
    const modal = new bootstrap.Modal(document.getElementById('modalRegistrarPagoOdontologo'));
    
    // Limpiar formulario
    document.getElementById('formPagoOdontologo').reset();
    document.getElementById('fechaPagoOdontologo').value = new Date().toISOString().split('T')[0];
    
    // Si viene con un odontólogo específico, seleccionarlo
    if (odontologoId) {
        const selectOdontologo = document.getElementById('selectOdontologo');
        if (selectOdontologo) {
            selectOdontologo.value = odontologoId;
            cargarServiciosPendientesOdontologo(odontologoId);
        }
    } else {
        limpiarServiciosPendientes();
    }
    
    modal.show();
}

// Cargar servicios pendientes de un odontólogo
async function cargarServiciosPendientesOdontologo(odontologoId) {
    const container = document.getElementById('serviciosPendientesContainer');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando servicios...</div>';
        
        const response = await authFetch(`/api/pagos-odontologo/${odontologoId}/pendientes`);
        
        if (response.ok) {
            const data = await response.json();
            mostrarServiciosPendientes(data.servicios || []);
        } else {
            throw new Error('Error obteniendo servicios pendientes');
        }
        
    } catch (error) {
        console.error('❌ Error cargando servicios pendientes:', error);
        mostrarServiciosPendientesPrueba();
    }
}

// Mostrar servicios pendientes en el modal
function mostrarServiciosPendientes(servicios) {
    const container = document.getElementById('serviciosPendientesContainer');
    if (!container) return;
    
    if (!servicios || servicios.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Este odontólogo no tiene servicios pendientes de pago</p>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead class="table-light">
                    <tr>
                        <th><input type="checkbox" id="selectAllServicios" onchange="toggleAllServicios()"></th>
                        <th>Fecha</th>
                        <th>Paciente</th>
                        <th>Servicio</th>
                        <th>Comisión</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let totalComision = 0;
    
    servicios.forEach(servicio => {
        const comision = servicio.comision || 0;
        totalComision += comision;
        
        html += `
            <tr>
                <td>
                    <input type="checkbox" name="serviciosSeleccionados" value="${servicio.id}" 
                           data-comision="${comision}" onchange="calcularTotalSeleccionado()">
                </td>
                <td>${formatearFecha(servicio.fecha_servicio || servicio.fecha)}</td>
                <td>${servicio.paciente_nombre || 'Sin nombre'}</td>
                <td>${servicio.servicio_nombre || servicio.descripcion || 'Sin descripción'}</td>
                <td>$${formatearNumero(comision)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-2 p-2 bg-light rounded">
            <div class="row">
                <div class="col-md-6">
                    <strong>Total servicios pendientes: </strong>
                    <span class="text-primary">$${formatearNumero(totalComision)}</span>
                </div>
                <div class="col-md-6">
                    <strong>Total seleccionado: </strong>
                    <span class="text-success" id="totalSeleccionado">$0</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Mostrar servicios de prueba
function mostrarServiciosPendientesPrueba() {
    const serviciosPrueba = [
        {
            id: 1,
            fecha_servicio: '2024-09-15',
            paciente_nombre: 'María García',
            servicio_nombre: 'Endodoncia molar',
            comision: 150000
        },
        {
            id: 2,
            fecha_servicio: '2024-09-18',
            paciente_nombre: 'Carlos López',
            servicio_nombre: 'Limpieza dental',
            comision: 75000
        }
    ];
    
    mostrarServiciosPendientes(serviciosPrueba);
}

// Limpiar servicios pendientes
function limpiarServiciosPendientes() {
    const container = document.getElementById('serviciosPendientesContainer');
    if (container) {
        container.innerHTML = '<p class="text-muted text-center">Seleccione un odontólogo para ver sus servicios pendientes</p>';
    }
}

// Toggle para seleccionar todos los servicios
function toggleAllServicios() {
    const selectAll = document.getElementById('selectAllServicios');
    const checkboxes = document.querySelectorAll('input[name="serviciosSeleccionados"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
    
    calcularTotalSeleccionado();
}

// Calcular total de servicios seleccionados
function calcularTotalSeleccionado() {
    const checkboxes = document.querySelectorAll('input[name="serviciosSeleccionados"]:checked');
    let total = 0;
    
    checkboxes.forEach(checkbox => {
        total += parseFloat(checkbox.dataset.comision || 0);
    });
    
    const totalElement = document.getElementById('totalSeleccionado');
    if (totalElement) {
        totalElement.textContent = `$${formatearNumero(total)}`;
    }
    
    // Actualizar el monto total del pago
    const montoInput = document.getElementById('montoTotalPago');
    if (montoInput) {
        montoInput.value = total;
    }
}

// Registrar pago a odontólogo
async function registrarPagoOdontologo() {
    try {
        const formData = {
            odontologo_id: document.getElementById('selectOdontologo').value,
            monto_total: parseFloat(document.getElementById('montoTotalPago').value),
            metodo_pago: document.getElementById('metodoPagoOdontologo').value,
            fecha_pago: document.getElementById('fechaPagoOdontologo').value,
            concepto: document.getElementById('conceptoPago').value,
            numero_comprobante: document.getElementById('numeroComprobante').value,
            observaciones: document.getElementById('observacionesPago').value
        };
        
        // Obtener servicios seleccionados
        const serviciosSeleccionados = [];
        const checkboxes = document.querySelectorAll('input[name="serviciosSeleccionados"]:checked');
        checkboxes.forEach(checkbox => {
            serviciosSeleccionados.push({
                servicio_id: parseInt(checkbox.value),
                comision: parseFloat(checkbox.dataset.comision)
            });
        });
        
        formData.servicios = serviciosSeleccionados;
        
        // Validaciones
        if (!formData.odontologo_id) {
            mostrarError('Por favor seleccione un odontólogo');
            return;
        }
        
        if (!formData.monto_total || formData.monto_total <= 0) {
            mostrarError('Por favor ingrese un monto válido');
            return;
        }
        
        if (!formData.metodo_pago) {
            mostrarError('Por favor seleccione un método de pago');
            return;
        }
        
        if (!formData.concepto) {
            mostrarError('Por favor ingrese un concepto para el pago');
            return;
        }
        
        console.log('📤 Registrando pago:', formData);
        
        const response = await authFetch('/api/pagos-odontologo/registrar', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const resultado = await response.json();
            console.log('✅ Pago registrado exitosamente:', resultado);
            
            mostrarExito('Pago registrado exitosamente');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistrarPagoOdontologo'));
            modal.hide();
            
            // Recargar datos
            await cargarResumenGeneralOdontologos();
            
        } else {
            const error = await response.json();
            throw new Error(error.mensaje || 'Error registrando el pago');
        }
        
    } catch (error) {
        console.error('❌ Error registrando pago:', error);
        mostrarError(`Error registrando el pago: ${error.message}`);
    }
}

// Ver detalles de un odontólogo
async function verDetallesOdontologo(odontologoId) {
    try {
        const odontologo = odontologos.find(o => o.id == odontologoId) || 
                          resumenOdontologos.find(o => o.id == odontologoId);
        
        if (!odontologo) {
            mostrarError('Odontólogo no encontrado');
            return;
        }
        
        // Establecer nombre en el modal
        const nombreElement = document.getElementById('nombreOdontologoDetalle');
        if (nombreElement) {
            nombreElement.textContent = `${odontologo.nombre} ${odontologo.apellido}`;
        }
        
        // Cargar resumen financiero
        await cargarResumenFinancieroOdontologo(odontologoId);
        
        // Cargar servicios pendientes
        await cargarServiciosPendientesDetalle(odontologoId);
        
        // Cargar historial de pagos
        await cargarHistorialPagosOdontologo(odontologoId);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetallesOdontologo'));
        modal.show();
        
        // Guardar referencia del odontólogo seleccionado
        odontologoSeleccionado = odontologo;
        
    } catch (error) {
        console.error('❌ Error cargando detalles:', error);
        mostrarError('Error cargando los detalles del odontólogo');
    }
}

// Cargar resumen financiero para el modal de detalles
async function cargarResumenFinancieroOdontologo(odontologoId) {
    try {
        const response = await authFetch(`/api/pagos-odontologo/${odontologoId}/resumen`);
        
        if (response.ok) {
            const resumen = await response.json();
            
            document.getElementById('totalComisionesDetalle').textContent = `$${formatearNumero(resumen.total_comisiones || 0)}`;
            document.getElementById('totalPagadoDetalle').textContent = `$${formatearNumero(resumen.total_pagado || 0)}`;
            document.getElementById('saldoPendienteDetalle').textContent = `$${formatearNumero(resumen.saldo_pendiente || 0)}`;
            
        } else {
            throw new Error('Error obteniendo resumen financiero');
        }
    } catch (error) {
        console.error('❌ Error cargando resumen financiero:', error);
        // Usar datos de prueba si hay error
        cargarResumenPrueba();
    }
}

// Cargar servicios pendientes para el modal de detalles
async function cargarServiciosPendientesDetalle(odontologoId) {
    try {
        const response = await authFetch(`/api/pagos-odontologo/${odontologoId}/pendientes`);
        
        if (response.ok) {
            const data = await response.json();
            mostrarServiciosPendientesDetalle(data.servicios || []);
        } else {
            throw new Error('Error obteniendo servicios pendientes');
        }
    } catch (error) {
        console.error('❌ Error cargando servicios pendientes:', error);
        mostrarServiciosPendientesDetallePrueba();
    }
}

// Mostrar servicios pendientes en el modal de detalles
function mostrarServiciosPendientesDetalle(servicios) {
    const tbody = document.getElementById('tablaServiciosPendientes');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!servicios || servicios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay servicios pendientes de pago
                </td>
            </tr>
        `;
        return;
    }
    
    servicios.forEach(servicio => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${formatearFecha(servicio.fecha_servicio || servicio.fecha)}</td>
            <td>${servicio.paciente_nombre || 'Sin nombre'}</td>
            <td>${servicio.servicio_nombre || servicio.descripcion || 'Sin descripción'}</td>
            <td>$${formatearNumero(servicio.comision || 0)}</td>
            <td>
                <span class="badge bg-warning">Pendiente</span>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// Cargar historial de pagos del odontólogo
async function cargarHistorialPagosOdontologo(odontologoId) {
    try {
        const response = await authFetch(`/api/pagos-odontologo/${odontologoId}/historial`);
        
        if (response.ok) {
            const data = await response.json();
            mostrarHistorialPagosDetalle(data.pagos || []);
        } else {
            throw new Error('Error obteniendo historial de pagos');
        }
    } catch (error) {
        console.error('❌ Error cargando historial:', error);
        mostrarHistorialPagosPrueba();
    }
}

// Mostrar historial de pagos en el modal de detalles
function mostrarHistorialPagosDetalle(pagos) {
    const tbody = document.getElementById('tablaHistorialPagos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!pagos || pagos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay historial de pagos
                </td>
            </tr>
        `;
        return;
    }
    
    pagos.forEach(pago => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${formatearFecha(pago.fecha_pago)}</td>
            <td>$${formatearNumero(pago.monto_total || 0)}</td>
            <td>
                <span class="badge bg-secondary">${pago.metodo_pago || 'Sin especificar'}</span>
            </td>
            <td>${pago.concepto || 'Sin concepto'}</td>
            <td>${pago.numero_comprobante || '-'}</td>
        `;
        tbody.appendChild(fila);
    });
}

// Función para abrir modal de pago directo desde el modal de detalles
function modalRegistrarPagoDirecto() {
    if (odontologoSeleccionado) {
        // Cerrar modal de detalles
        const modalDetalles = bootstrap.Modal.getInstance(document.getElementById('modalDetallesOdontologo'));
        modalDetalles.hide();
        
        // Abrir modal de pago con el odontólogo seleccionado
        setTimeout(() => {
            abrirModalPago(odontologoSeleccionado.id);
        }, 300);
    }
}

// Funciones de prueba para el modal de detalles
function cargarResumenPrueba() {
    document.getElementById('totalComisionesDetalle').textContent = '$1,500,000';
    document.getElementById('totalPagadoDetalle').textContent = '$1,200,000';
    document.getElementById('saldoPendienteDetalle').textContent = '$300,000';
}

function mostrarServiciosPendientesDetallePrueba() {
    const serviciosPrueba = [
        {
            fecha: '2024-09-15',
            paciente_nombre: 'María García',
            descripcion: 'Endodoncia molar',
            comision: 150000
        },
        {
            fecha: '2024-09-18',
            paciente_nombre: 'Carlos López',
            descripcion: 'Limpieza dental',
            comision: 75000
        }
    ];
    
    mostrarServiciosPendientesDetalle(serviciosPrueba);
}

function mostrarHistorialPagosPrueba() {
    const pagosPrueba = [
        {
            fecha_pago: '2024-09-01',
            monto_total: 800000,
            metodo_pago: 'transferencia',
            concepto: 'Pago quincenal agosto 16-31',
            numero_comprobante: 'TRF-2024-0001'
        },
        {
            fecha_pago: '2024-08-15',
            monto_total: 650000,
            metodo_pago: 'efectivo',
            concepto: 'Pago quincenal agosto 1-15',
            numero_comprobante: 'EFE-2024-0025'
        }
    ];
    
    mostrarHistorialPagosDetalle(pagosPrueba);
}

// Función auxiliar para formatear fechas
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Función auxiliar para formatear números
function formatearNumero(numero) {
    if (!numero) return '0';
    return new Intl.NumberFormat('es-CO').format(numero);
}

// Event listener para cargar los pagos a odontólogos cuando se selecciona la pestaña
document.addEventListener('DOMContentLoaded', function() {
    // Detectar cambio de pestaña
    const tabLinks = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabLinks.forEach(tabLink => {
        tabLink.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');
            if (targetId === '#pagos-odontologos') {
                cargarPagosOdontologos();
            }
        });
    });
    
    // También cargar inmediatamente si ya estamos en la pestaña de odontólogos
    const currentTab = document.querySelector('#pagos-odontologos-tab');
    if (currentTab && currentTab.classList.contains('active')) {
        cargarPagosOdontologos();
    }
    
    // Cargar datos de prueba inmediatamente para testing
    console.log('🦷 Preparando sistema de pagos a odontólogos...');
    cargarOdontologosPrueba();
    cargarDatosPruebaOdontologos();
});

// ==========================================
// FUNCIONES PARA MODAL DE PAGOS A ODONTÓLOGOS
// ==========================================

// Función para abrir el modal de pago a odontólogo
function abrirModalPago() {
    console.log('🔓 Abriendo modal de pago a odontólogo...');
    
    // Cargar odontólogos en el select
    cargarOdontologosEnSelect();
    
    // Establecer fecha actual
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaPagoOdontologo').value = fechaHoy;
    
    // Limpiar formulario
    document.getElementById('formPagoOdontologo').reset();
    document.getElementById('fechaPagoOdontologo').value = fechaHoy;
    
    // Ocultar resumen
    document.getElementById('resumenPago').style.display = 'none';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalPagoOdontologo'));
    modal.show();
}

// Cargar odontólogos en el select del modal
async function cargarOdontologosEnSelect() {
    try {
        console.log('🔄 Cargando odontólogos para el select...');
        
        const response = await authFetch('/api/usuarios');
        if (response.ok) {
            const data = await response.json();
            const usuarios = Array.isArray(data) ? data : (data.usuarios || data.value || []);
            
            // Filtrar solo odontólogos
            const odontologosData = usuarios.filter(u => u.rol === 'odontologo');
            
            const select = document.getElementById('odontologoPago');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar odontólogo...</option>';
                
                odontologosData.forEach(odontologo => {
                    const nombre = `Dr. ${odontologo.nombre} ${odontologo.apellido}`;
                    select.innerHTML += `<option value="${odontologo.id}">${nombre}</option>`;
                });
                
                console.log(`✅ ${odontologosData.length} odontólogos cargados en select`);
            }
        } else {
            console.warn('⚠️ No se pudieron cargar odontólogos, usando datos de ejemplo');
            const select = document.getElementById('odontologoPago');
            if (select) {
                select.innerHTML = `
                    <option value="">Seleccionar odontólogo...</option>
                    <option value="2">Dr. Carlos Rodriguez</option>
                `;
            }
        }
    } catch (error) {
        console.error('❌ Error cargando odontólogos:', error);
    }
}

// Función para calcular la comisión automáticamente
function calcularComision() {
    const servicios = parseInt(document.getElementById('serviciosPeriodo').value) || 0;
    const porcentaje = parseFloat(document.getElementById('comisionPorcentaje').value) || 40;
    
    // Valor promedio por servicio (esto podría venir de configuración)
    const valorPromedioPorServicio = 100000;
    const totalServicios = servicios * valorPromedioPorServicio;
    const comisionCalculada = (totalServicios * porcentaje) / 100;
    
    // Actualizar campo de monto
    document.getElementById('montoPagoOdontologo').value = comisionCalculada.toFixed(0);
    
    // Mostrar resumen
    mostrarResumenPago(servicios, porcentaje, comisionCalculada);
    
    console.log(`💰 Comisión calculada: ${servicios} servicios × ${porcentaje}% = $${comisionCalculada.toFixed(0)}`);
}

// Mostrar resumen del pago
function mostrarResumenPago(servicios, porcentaje, total) {
    const resumen = document.getElementById('resumenPago');
    
    document.getElementById('resumenServicios').textContent = servicios;
    document.getElementById('resumenComision').textContent = `${porcentaje}%`;
    document.getElementById('resumenTotal').textContent = formatearMoneda(total);
    
    resumen.style.display = 'block';
}

// Función para registrar el pago al odontólogo
async function registrarPagoOdontologo() {
    try {
        console.log('💾 Registrando pago a odontólogo...');
        
        // Obtener datos del formulario
        const odontologoId = document.getElementById('odontologoPago').value;
        const fecha = document.getElementById('fechaPagoOdontologo').value;
        const tipo = document.getElementById('tipoPago').value;
        const metodo = document.getElementById('metodoPagoOdontologo').value;
        const monto = parseFloat(document.getElementById('montoPagoOdontologo').value);
        const concepto = document.getElementById('conceptoPagoOdontologo').value;
        const referencia = document.getElementById('referenciaPago').value;
        
        // Validaciones
        if (!odontologoId || !fecha || !tipo || !metodo || !monto) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }
        
        if (monto <= 0) {
            alert('El monto debe ser mayor a cero');
            return;
        }
        
        // Datos del pago
        const datosPago = {
            odontologo_id: parseInt(odontologoId),
            fecha_pago: fecha,
            tipo_pago: tipo,
            metodo_pago: metodo,
            monto: monto,
            concepto: concepto || `Pago de ${tipo}`,
            referencia: referencia,
            servicios_periodo: parseInt(document.getElementById('serviciosPeriodo').value) || 0,
            comision_porcentaje: parseFloat(document.getElementById('comisionPorcentaje').value) || null
        };
        
        console.log('📤 Enviando datos del pago:', datosPago);
        
        // Enviar al backend
        const response = await authFetch('/api/pagos-odontologo/registrar', {
            method: 'POST',
            body: JSON.stringify(datosPago)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Pago registrado exitosamente:', result);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalPagoOdontologo'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            alert('✅ Pago registrado exitosamente');
            
            // Recargar datos
            if (typeof cargarPagosOdontologos === 'function') {
                cargarPagosOdontologos();
            }
            
        } else {
            const error = await response.json();
            console.error('❌ Error del servidor:', error);
            alert(`Error: ${error.message || 'No se pudo registrar el pago'}`);
        }
        
    } catch (error) {
        console.error('❌ Error registrando pago:', error);
        alert('Error: No se pudo conectar con el servidor');
    }
}
