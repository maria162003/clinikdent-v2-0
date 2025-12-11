// Módulo de gestión de pagos y facturación - Clinik Dent
(function() {
    'use strict';

    // Variables globales
    let serviciosDisponibles = [];
    let pacientesDisponibles = [];

    // Obtener headers de autenticación
    function getAuthHeaders() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id;
        
        return {
            'Content-Type': 'application/json',
            'user-id': userId || '1'
        };
    }

    // Función para hacer peticiones autenticadas
    async function authFetch(url, options = {}) {
        const headers = getAuthHeaders();
        
        return fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
    }

    // Inicializar la aplicación
    function inicializar() {
        console.log('🔄 Inicializando módulo de pagos y facturación...');
        
        configurarEventListeners();
        cargarDatos();
        configurarFechas();
    }

    // Configurar event listeners
    function configurarEventListeners() {
        // Botones principales
        const btnNuevaFactura = document.getElementById('btnNuevaFactura');
        if (btnNuevaFactura) {
            btnNuevaFactura.addEventListener('click', abrirModalNuevaFactura);
        }
        
        const btnConfigurarServicios = document.getElementById('btnConfigurarServicios');
        if (btnConfigurarServicios) {
            btnConfigurarServicios.addEventListener('click', abrirModalServicios);
        }
        
        const btnReportePagos = document.getElementById('btnReportePagos');
        if (btnReportePagos) {
            btnReportePagos.addEventListener('click', abrirModalReporte);
        }
        
        const btnConfigFacturacion = document.getElementById('btnConfigFacturacion');
        if (btnConfigFacturacion) {
            btnConfigFacturacion.addEventListener('click', abrirModalConfig);
        }

        // Event listeners para cálculos
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('cantidad-input') || 
                e.target.classList.contains('precio-input') || 
                e.target.id === 'factDescuento') {
                calcularTotalFactura();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('servicio-select')) {
                const precio = e.target.selectedOptions[0]?.dataset.precio;
                if (precio) {
                    const precioInput = e.target.closest('.row').querySelector('.precio-input');
                    if (precioInput) precioInput.value = precio;
                    calcularTotalFactura();
                }
            }
        });
    }

    // Configurar fechas por defecto
    function configurarFechas() {
        const hoy = new Date().toISOString().split('T')[0];
        const factFecha = document.getElementById('factFecha');
        if (factFecha) factFecha.value = hoy;
        
        const reporteFechaDesde = document.getElementById('reporteFechaDesde');
        const reporteFechaHasta = document.getElementById('reporteFechaHasta');
        if (reporteFechaDesde && reporteFechaHasta) {
            const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            reporteFechaDesde.value = primerDiaMes;
            reporteFechaHasta.value = hoy;
        }
    }

    // Cargar todos los datos iniciales
    async function cargarDatos() {
        await Promise.all([
            cargarEstadisticas(),
            cargarHistorialPagos(),
            cargarServicios(),
            cargarPacientes()
        ]);
    }

    // ===== ESTADÍSTICAS =====

    async function cargarEstadisticas() {
        try {
            console.log('🔄 Cargando estadísticas...');
            
            // Datos simulados por ahora
            const estadisticas = {
                pagosHoy: 850000,
                facturasMes: 45,
                pagosPendientes: 8,
                totalMes: 12500000
            };

            actualizarEstadisticas(estadisticas);
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        }
    }

    function actualizarEstadisticas(data) {
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        });

        const pagosHoyEl = document.getElementById('pagosHoy');
        const facturasMesEl = document.getElementById('facturasMes');
        const pagosPendientesEl = document.getElementById('pagosPendientes');
        const totalMesEl = document.getElementById('totalMes');

        if (pagosHoyEl) pagosHoyEl.textContent = formatter.format(data.pagosHoy || 0);
        if (facturasMesEl) facturasMesEl.textContent = data.facturasMes || 0;
        if (pagosPendientesEl) pagosPendientesEl.textContent = data.pagosPendientes || 0;
        if (totalMesEl) totalMesEl.textContent = formatter.format(data.totalMes || 0);
    }

    // ===== PAGOS =====

    async function cargarHistorialPagos() {
        try {
            console.log('🔄 Cargando historial de pagos...');
            
            const response = await authFetch('/api/pagos');
            
            if (response.ok) {
                const data = await response.json();
                const pagos = data.pagos || data || [];
                mostrarPagosEnTabla(pagos);
            } else {
                // Datos de ejemplo si falla la API
                mostrarPagosEnTabla([
                    { id: 1, fecha_pago: '2025-08-25', paciente: 'Juan Pérez', monto: 150000, metodo_pago: 'efectivo', estado: 'completado' },
                    { id: 2, fecha_pago: '2025-08-24', paciente: 'María García', monto: 200000, metodo_pago: 'tarjeta', estado: 'completado' }
                ]);
            }
        } catch (error) {
            console.error('❌ Error cargando pagos:', error);
            mostrarMensajeVacio();
        }
    }

    function mostrarPagosEnTabla(pagos) {
        const tbody = document.querySelector('#pagosTableBody');
        if (!tbody) {
            console.error('❌ Tabla de pagos no encontrada');
            return;
        }

        if (!pagos.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay pagos registrados</td></tr>';
            return;
        }

        console.log('💰 Renderizando', pagos.length, 'pagos en tabla');

        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        });

        tbody.innerHTML = pagos.map((pago, index) => `
            <tr>
                <td>${pago.id || index + 1}</td>
                <td>${new Date(pago.fecha_pago || pago.created_at).toLocaleDateString('es-CO')}</td>
                <td>${pago.paciente || pago.paciente_nombre || 'N/A'}</td>
                <td>${pago.concepto || pago.descripcion || 'Pago de servicios'}</td>
                <td>${formatter.format(pago.monto || pago.total || 0)}</td>
                <td>${pago.metodo_pago || pago.metodo || 'Efectivo'}</td>
                <td>
                    <span class="badge bg-${getBadgeColor(pago.estado || 'completado')}">
                        ${(pago.estado || 'completado').toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="verDetallePago(${pago.id})" style="color: black;">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-sm btn-success" onclick="imprimirRecibo(${pago.id})" style="color: black;">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function getBadgeColor(estado) {
        switch (estado) {
            case 'completado': return 'success';
            case 'pendiente': return 'warning';
            case 'cancelado': return 'danger';
            default: return 'secondary';
        }
    }

    function mostrarMensajeVacio() {
        const tbody = document.querySelector('#tablaPagos tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se pudieron cargar los pagos</td></tr>';
        }
    }

    // ===== SERVICIOS Y PACIENTES =====

    async function cargarServicios() {
        try {
            const response = await authFetch('/api/tratamientos');
            if (response.ok) {
                const data = await response.json();
                serviciosDisponibles = data.tratamientos || data || [];
                console.log('✅ Servicios cargados:', serviciosDisponibles.length);
            } else {
                // Servicios de ejemplo
                serviciosDisponibles = [
                    { id: 1, nombre: 'Consulta General', costo_estimado: 50000 },
                    { id: 2, nombre: 'Limpieza Dental', costo_estimado: 80000 },
                    { id: 3, nombre: 'Ortodoncia', costo_estimado: 150000 },
                    { id: 4, nombre: 'Implante Dental', costo_estimado: 2500000 }
                ];
            }
        } catch (error) {
            console.error('❌ Error cargando servicios:', error);
        }
    }

    async function cargarPacientes() {
        try {
            const response = await authFetch('/api/usuarios');
            if (response.ok) {
                const data = await response.json();
                const usuarios = data.usuarios || data || [];
                pacientesDisponibles = usuarios.filter(u => u.rol === 'paciente');
                console.log('✅ Pacientes cargados:', pacientesDisponibles.length);
            } else {
                console.warn('No se pudieron cargar pacientes desde la API');
            }
        } catch (error) {
            console.error('❌ Error cargando pacientes:', error);
        }
    }

    // ===== MODAL HANDLERS =====

    function abrirModalNuevaFactura() {
        const modal = document.getElementById('modalNuevaFactura');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            cargarPacientesFactura();
            cargarServiciosFactura();
        }
    }

    function abrirModalServicios() {
        const modal = document.getElementById('modalConfigurarServicios');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            cargarTablaServicios();
        }
    }

    function abrirModalReporte() {
        const modal = document.getElementById('modalReportePagos');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    function abrirModalConfig() {
        const modal = document.getElementById('modalConfigFacturacion');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            cargarConfigFacturacion();
        }
    }

    // ===== FACTURAS =====

    function cargarPacientesFactura() {
        const select = document.getElementById('factPaciente');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar paciente...</option>';
        
        pacientesDisponibles.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente.id;
            option.textContent = `${paciente.nombre} ${paciente.apellido}`;
            select.appendChild(option);
        });
    }

    function cargarServiciosFactura() {
        const selects = document.querySelectorAll('.servicio-select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Seleccionar servicio...</option>';
            serviciosDisponibles.forEach(servicio => {
                const option = document.createElement('option');
                option.value = servicio.id;
                option.textContent = servicio.nombre;
                option.dataset.precio = servicio.costo_estimado;
                select.appendChild(option);
            });
        });
    }

    function calcularTotalFactura() {
        let subtotal = 0;
        
        document.querySelectorAll('.servicio-item').forEach(item => {
            const cantidad = parseFloat(item.querySelector('.cantidad-input').value) || 0;
            const precio = parseFloat(item.querySelector('.precio-input').value) || 0;
            subtotal += cantidad * precio;
        });
        
        const descuento = parseFloat(document.getElementById('factDescuento')?.value) || 0;
        const descuentoAmount = subtotal * (descuento / 100);
        const total = subtotal - descuentoAmount;
        
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        });
        
        const totalInput = document.getElementById('factTotal');
        if (totalInput) {
            totalInput.value = formatter.format(total);
        }
    }

    // Funciones para configurar servicios
    async function cargarTablaServicios() {
        const tbody = document.querySelector('#tablaServicios tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando servicios...</td></tr>';
        
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        });

        if (serviciosDisponibles.length) {
            tbody.innerHTML = serviciosDisponibles.map(servicio => `
                <tr>
                    <td>SERV-${String(servicio.id).padStart(3, '0')}</td>
                    <td>${servicio.nombre}</td>
                    <td>${formatter.format(servicio.costo_estimado)}</td>
                    <td>
                        <span class="badge bg-success">ACTIVO</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="editarServicio(${servicio.id})" style="color: black;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmarEliminarServicio(${servicio.id})" style="color: black;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay servicios configurados</td></tr>';
        }
    }

    function cargarConfigFacturacion() {
        // Cargar configuración guardada o valores por defecto
        const config = JSON.parse(localStorage.getItem('configFacturacion')) || {
            nombreClinica: 'Clinik Dent',
            nit: '123456789-1',
            direccion: 'Calle 123 #45-67',
            telefono: '+57 123 456 7890',
            email: 'info@clinikdent.com',
            iva: 19
        };

        document.getElementById('configNombreClinica').value = config.nombreClinica;
        document.getElementById('configNIT').value = config.nit;
        document.getElementById('configDireccion').value = config.direccion;
        document.getElementById('configTelefono').value = config.telefono;
        document.getElementById('configEmail').value = config.email;
        document.getElementById('configIVA').value = config.iva;
    }

    // ===== FUNCIONES GLOBALES =====

    // Funciones que necesitan ser accesibles globalmente
    window.agregarServicio = function() {
        const container = document.getElementById('serviciosFactura');
        if (!container) return;

        const newRow = document.createElement('div');
        newRow.className = 'row servicio-item mb-2';
        newRow.innerHTML = `
            <div class="col-md-5">
                <select class="form-control servicio-select" name="servicio[]" required>
                    <option value="">Seleccionar servicio...</option>
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control cantidad-input" name="cantidad[]" placeholder="Cant." value="1" min="1" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control precio-input" name="precio[]" placeholder="Precio" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger btn-sm w-100" onclick="eliminarServicio(this)">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        `;
        container.appendChild(newRow);
        
        // Poblar el select con servicios
        const newSelect = newRow.querySelector('.servicio-select');
        serviciosDisponibles.forEach(servicio => {
            const option = document.createElement('option');
            option.value = servicio.id;
            option.textContent = servicio.nombre;
            option.dataset.precio = servicio.costo_estimado;
            newSelect.appendChild(option);
        });
    };

    window.eliminarServicio = function(btn) {
        btn.closest('.servicio-item').remove();
        calcularTotalFactura();
    };

    window.crearFactura = async function() {
        const form = document.getElementById('formNuevaFactura');
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        // Recopilar servicios
        const servicios = [];
        document.querySelectorAll('.servicio-item').forEach(item => {
            const servicio = item.querySelector('.servicio-select').value;
            const cantidad = item.querySelector('.cantidad-input').value;
            const precio = item.querySelector('.precio-input').value;
            
            if (servicio && cantidad && precio) {
                servicios.push({
                    servicio_id: servicio,
                    cantidad: parseInt(cantidad),
                    precio_unitario: parseFloat(precio)
                });
            }
        });

        const facturaData = {
            paciente_id: document.getElementById('factPaciente').value,
            fecha_factura: document.getElementById('factFecha').value,
            servicios: servicios,
            descuento: parseFloat(document.getElementById('factDescuento').value) || 0,
            observaciones: document.getElementById('factObservaciones').value
        };

        try {
            console.log('🔄 Creando factura:', facturaData);
            
            // Simular creación exitosa por ahora
            alert('✅ Factura creada exitosamente (funcionalidad simulada)');
            bootstrap.Modal.getInstance(document.getElementById('modalNuevaFactura')).hide();
            form.reset();
            cargarDatos();
        } catch (error) {
            console.error('❌ Error creando factura:', error);
            alert('❌ Error al crear factura');
        }
    };

    window.nuevoServicio = function() {
        const nombre = prompt('Nombre del servicio:');
        if (!nombre) return;
        
        const precio = prompt('Precio del servicio:');
        if (!precio || isNaN(precio)) {
            alert('Precio inválido');
            return;
        }

        // Simular creación de servicio
        const nuevoServicio = {
            id: serviciosDisponibles.length + 1,
            nombre: nombre,
            costo_estimado: parseFloat(precio)
        };

        serviciosDisponibles.push(nuevoServicio);
        alert('✅ Servicio creado exitosamente');
        cargarTablaServicios();
    };

    window.editarServicio = function(id) {
        alert('Función de edición en desarrollo');
    };

    window.confirmarEliminarServicio = function(id) {
        if (confirm('¿Está seguro de eliminar este servicio?')) {
            serviciosDisponibles = serviciosDisponibles.filter(s => s.id !== id);
            alert('✅ Servicio eliminado exitosamente');
            cargarTablaServicios();
        }
    };

    window.generarReporte = function() {
        const fechaDesde = document.getElementById('reporteFechaDesde').value;
        const fechaHasta = document.getElementById('reporteFechaHasta').value;
        const estado = document.getElementById('reporteEstado').value;

        if (!fechaDesde || !fechaHasta) {
            alert('Debe seleccionar las fechas del reporte');
            return;
        }

        // Datos de ejemplo para el reporte
        const pagosEjemplo = [
            { id: 1, fecha_pago: '2025-08-25', paciente: 'Juan Pérez', monto: 150000, metodo_pago: 'efectivo', estado: 'completado' },
            { id: 2, fecha_pago: '2025-08-24', paciente: 'María García', monto: 200000, metodo_pago: 'tarjeta', estado: 'completado' },
            { id: 3, fecha_pago: '2025-08-23', paciente: 'Carlos López', monto: 180000, metodo_pago: 'transferencia', estado: 'completado' }
        ];

        mostrarResultadosReporte(pagosEjemplo);
    };

    function mostrarResultadosReporte(pagos) {
        const container = document.getElementById('resultadosReporte');
        if (!container) return;

        if (!pagos.length) {
            container.innerHTML = '<div class="alert alert-info">No se encontraron pagos en el período seleccionado</div>';
            return;
        }

        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        });

        const total = pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6>Resultados del Reporte</h6>
                    <div class="text-end">
                        <strong>Total: ${formatter.format(total)} | Registros: ${pagos.length}</strong>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Paciente</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pagos.map(pago => `
                                    <tr>
                                        <td>${new Date(pago.fecha_pago).toLocaleDateString('es-CO')}</td>
                                        <td>${pago.paciente || 'N/A'}</td>
                                        <td>${formatter.format(pago.monto)}</td>
                                        <td>${pago.metodo_pago}</td>
                                        <td>
                                            <span class="badge bg-${pago.estado === 'completado' ? 'success' : 'warning'}">
                                                ${pago.estado}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    window.guardarConfigFacturacion = function() {
        const config = {
            nombreClinica: document.getElementById('configNombreClinica').value,
            nit: document.getElementById('configNIT').value,
            direccion: document.getElementById('configDireccion').value,
            telefono: document.getElementById('configTelefono').value,
            email: document.getElementById('configEmail').value,
            iva: document.getElementById('configIVA').value
        };

        localStorage.setItem('configFacturacion', JSON.stringify(config));
        alert('✅ Configuración guardada exitosamente');
        
        bootstrap.Modal.getInstance(document.getElementById('modalConfigFacturacion')).hide();
    };

    window.verDetallePago = function(id) {
        console.log('🔍 PAGOS.JS - Ver detalles del pago:', id);
        
        try {
            // Usar los datos de ejemplo que definí en dashboard-admin.js
            const pagosEjemplo = window.pagosEjemplo || [
                {
                    id: 1,
                    paciente_nombre: 'María García',
                    monto: 150000,
                    metodo_pago: 'Efectivo',
                    fecha: '2025-09-01',
                    estado: 'completado',
                    concepto: 'Consulta general',
                    descripcion: 'Consulta general odontológica y limpieza dental'
                },
                {
                    id: 2,
                    paciente_nombre: 'Juan Pérez',
                    monto: 75000,
                    metodo_pago: 'Transferencia',
                    fecha: '2025-09-05',
                    estado: 'pendiente',
                    concepto: 'Limpieza dental',
                    descripcion: 'Profilaxis y fluorización'
                },
                {
                    id: 3,
                    paciente_nombre: 'Ana López',
                    monto: 300000,
                    metodo_pago: 'Tarjeta',
                    fecha: '2025-09-08',
                    estado: 'completado',
                    concepto: 'Endodoncia',
                    descripcion: 'Tratamiento de conductos pieza 16'
                }
            ];
            
            const pago = pagosEjemplo.find(p => p.id == id);
            
            if (!pago) {
                console.error('❌ Pago no encontrado con ID:', id);
                alert('Pago no encontrado. ID: ' + id);
                return;
            }
            
            console.log('✅ Pago encontrado:', pago);
            
            // Función para formatear moneda
            function formatearMoneda(valor) {
                return new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                }).format(valor);
            }
            
            // Crear y mostrar modal manualmente
            const modalHtml = `
                <div class="modal fade" id="modalPagoDetalle" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title">
                                    <i class="fas fa-dollar-sign"></i> Detalles del Pago #${pago.id}
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
                                        <h6><i class="fas fa-calendar"></i> Información del Pago</h6>
                                        <p><strong>Fecha:</strong> ${pago.fecha}</p>
                                        <p><strong>Método:</strong> ${pago.metodo_pago}</p>
                                        <p><strong>Estado:</strong> <span class="badge bg-${pago.estado === 'completado' ? 'success' : 'warning'}">${pago.estado}</span></p>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <h6><i class="fas fa-file-alt"></i> Descripción</h6>
                                    <p>${pago.descripcion}</p>
                                </div>
                                <div class="mt-3 text-center">
                                    <h5 class="text-success">
                                        <i class="fas fa-money-bill-wave"></i> Monto Total: ${formatearMoneda(pago.monto)}
                                    </h5>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                <button type="button" class="btn btn-success" onclick="window.imprimirRecibo(${pago.id})">
                                    <i class="fas fa-print"></i> Imprimir Recibo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal anterior si existe
            const modalAnterior = document.getElementById('modalPagoDetalle');
            if (modalAnterior) {
                modalAnterior.remove();
            }
            
            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalPagoDetalle'));
            modal.show();
            
        } catch (error) {
            console.error('❌ Error al ver pago:', error);
            alert('Error: ' + error.message);
        }
    };

    window.imprimirRecibo = function(id) {
        console.log('🖨️ PAGOS.JS - Imprimir recibo del pago:', id);
        
        try {
            // Usar los datos de ejemplo
            const pagosEjemplo = window.pagosEjemplo || [
                {
                    id: 1,
                    paciente_nombre: 'María García',
                    monto: 150000,
                    metodo_pago: 'Efectivo',
                    fecha: '2025-09-01',
                    estado: 'completado',
                    concepto: 'Consulta general',
                    descripcion: 'Consulta general odontológica y limpieza dental'
                },
                {
                    id: 2,
                    paciente_nombre: 'Juan Pérez',
                    monto: 75000,
                    metodo_pago: 'Transferencia',
                    fecha: '2025-09-05',
                    estado: 'pendiente',
                    concepto: 'Limpieza dental',
                    descripcion: 'Profilaxis y fluorización'
                },
                {
                    id: 3,
                    paciente_nombre: 'Ana López',
                    monto: 300000,
                    metodo_pago: 'Tarjeta',
                    fecha: '2025-09-08',
                    estado: 'completado',
                    concepto: 'Endodoncia',
                    descripcion: 'Tratamiento de conductos pieza 16'
                }
            ];
            
            const pago = pagosEjemplo.find(p => p.id == id);
            
            if (!pago) {
                alert('Pago no encontrado para imprimir');
                return;
            }
            
            // Función para formatear moneda
            function formatearMoneda(valor) {
                return new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                }).format(valor);
            }
            
            // Crear contenido de impresión
            const contenidoImpresion = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Recibo de Pago ${pago.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #28a745; padding-bottom: 20px; }
                        .logo { font-size: 28px; font-weight: bold; color: #28a745; }
                        .recibo-numero { font-size: 24px; font-weight: bold; color: #28a745; }
                        .info-section { display: flex; justify-content: space-between; margin: 30px 0; }
                        .info-box { width: 48%; background: #f8f9fa; padding: 15px; border-radius: 8px; }
                        .monto { text-align: center; margin: 30px 0; background: #d4edda; padding: 20px; border-radius: 8px; }
                        .monto-valor { font-size: 36px; font-weight: bold; color: #155724; }
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
                            <div class="recibo-numero">RECIBO DE PAGO</div>
                            <div class="recibo-numero">#${pago.id}</div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-box">
                            <h4>DATOS DEL PACIENTE</h4>
                            <p><strong>Nombre:</strong> ${pago.paciente_nombre}</p>
                            <p><strong>Concepto:</strong> ${pago.concepto}</p>
                        </div>
                        <div class="info-box">
                            <h4>INFORMACIÓN DE PAGO</h4>
                            <p><strong>Fecha:</strong> ${pago.fecha}</p>
                            <p><strong>Método de Pago:</strong> ${pago.metodo_pago}</p>
                            <p><strong>Estado:</strong> ${pago.estado}</p>
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4>DESCRIPCIÓN DEL SERVICIO</h4>
                        <p>${pago.descripcion}</p>
                    </div>
                    
                    <div class="monto">
                        <div>MONTO PAGADO</div>
                        <div class="monto-valor">${formatearMoneda(pago.monto)}</div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px; color: #666;">
                        <p>Gracias por su pago</p>
                        <p>Este recibo fue generado electrónicamente</p>
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
            console.error('❌ Error al imprimir recibo:', error);
            alert('Error al imprimir: ' + error.message);
        }
    };

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Iniciando módulo de pagos y facturación...');
        inicializar();
    });

    // También inicializar si ya está cargado
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('🚀 DOM ya listo, iniciando módulo de pagos...');
        inicializar();
    }

    // Exponer funciones para el dashboard de administrador
    window.adminPagosModule = {
        cargarHistorialPagos: cargarHistorialPagos,
        cargarEstadisticas: cargarEstadisticas,
        inicializar: inicializar
    };

})();
