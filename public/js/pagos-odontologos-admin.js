// ==========================================
// FUNCIONES PARA PAGOS A ODONTÓLOGOS EN ADMIN
// ==========================================

// Función para abrir el modal de pago desde el dashboard admin
function abrirModalPagoAdmin() {
    console.log('🔓 Abriendo modal de pago a odontólogo desde admin...');
    
    // Cargar odontólogos en el select
    cargarOdontologosEnSelectAdmin();
    
    // Establecer fecha actual
    const fechaHoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fechaPagoAdmin');
    if (fechaInput) {
        fechaInput.value = fechaHoy;
    }
    
    // Limpiar formulario
    const form = document.getElementById('formPagoOdontologoAdmin');
    if (form) {
        form.reset();
        if (fechaInput) {
            fechaInput.value = fechaHoy;
        }
    }
    
    // Mostrar modal
    const modalElement = document.getElementById('modalPagoOdontologoAdmin');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('❌ No se encontró el modal modalPagoOdontologoAdmin');
        alert('Error: No se pudo abrir el modal de pagos');
    }
}

// Cargar odontólogos en el select del modal admin
async function cargarOdontologosEnSelectAdmin() {
    try {
        console.log('🔄 Cargando odontólogos para el select admin...');
        
        const response = await fetch('/api/usuarios');
        if (response.ok) {
            const data = await response.json();
            const usuarios = Array.isArray(data) ? data : (data.usuarios || data.value || []);
            
            // Filtrar solo odontólogos
            const odontologosData = usuarios.filter(u => u.rol === 'odontologo');
            
            const select = document.getElementById('odontologoPagoAdmin');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar odontólogo...</option>';
                
                odontologosData.forEach(odontologo => {
                    const nombre = `Dr. ${odontologo.nombre} ${odontologo.apellido}`;
                    select.innerHTML += `<option value="${odontologo.id}">${nombre}</option>`;
                });
                
                console.log(`✅ ${odontologosData.length} odontólogos cargados en select admin`);
            } else {
                console.error('❌ No se encontró el select odontologoPagoAdmin');
            }
        } else {
            console.warn('⚠️ No se pudieron cargar odontólogos, usando datos de ejemplo');
            const select = document.getElementById('odontologoPagoAdmin');
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

// Función para registrar el pago al odontólogo desde admin
async function registrarPagoOdontologoAdmin() {
    try {
        console.log('💾 Registrando pago a odontólogo desde admin...');
        
        // Obtener datos del formulario
        const odontologoId = document.getElementById('odontologoPagoAdmin')?.value;
        const fecha = document.getElementById('fechaPagoAdmin')?.value;
        const tipo = document.getElementById('tipoPagoAdmin')?.value;
        const metodo = document.getElementById('metodoPagoAdmin')?.value;
        const monto = parseFloat(document.getElementById('montoPagoAdmin')?.value || '0');
        const concepto = document.getElementById('conceptoPagoAdmin')?.value;
        const referencia = document.getElementById('referenciaPagoAdmin')?.value;
        
        console.log('📋 Datos del formulario:', {
            odontologoId, fecha, tipo, metodo, monto, concepto, referencia
        });
        
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
            comision_porcentaje: parseFloat(document.getElementById('comisionPorcentajeAdmin')?.value || '0') || null
        };
        
        console.log('📤 Enviando datos del pago desde admin:', datosPago);
        
        // Enviar al backend
        const response = await fetch('/api/pagos-odontologo/registrar-simple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': localStorage.getItem('userId') || '1'
            },
            body: JSON.stringify(datosPago)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Pago registrado exitosamente desde admin:', result);
            
            // Cerrar modal
            const modalElement = document.getElementById('modalPagoOdontologoAdmin');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
            
            // Mostrar mensaje de éxito
            alert('✅ Pago registrado exitosamente');
            
            // Recargar datos si estamos en la pestaña de pagos a odontólogos
            const activeTab = document.querySelector('#pagos-odontologos-tab');
            if (activeTab && activeTab.classList.contains('active')) {
                cargarDatosPagosOdontologos();
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

// Función para cargar datos de la pestaña de pagos a odontólogos
async function cargarDatosPagosOdontologos() {
    try {
        console.log('🔄 Cargando datos de pagos a odontólogos...');
        
        // Cargar estadísticas
        await cargarEstadisticasPagosOdontologos();
        
        // Cargar tabla de odontólogos
        await cargarTablaOdontologos();
        
    } catch (error) {
        console.error('❌ Error cargando datos de pagos a odontólogos:', error);
    }
}

// Cargar estadísticas de pagos a odontólogos
async function cargarEstadisticasPagosOdontologos() {
    try {
        console.log('📊 Cargando estadísticas de pagos a odontólogos...');
        
        const response = await fetch('/api/pagos-odontologo/resumen');
        if (response.ok) {
            const stats = await response.json();
            console.log('📈 Estadísticas recibidas:', stats);
            
            // Actualizar tarjetas de estadísticas
            const elementos = {
                'totalOdontologosAdmin': stats.total_odontologos || 1,
                'pagosPendientesAdmin': `$${(stats.total_pendiente || 0).toLocaleString()}`,
                'pagosMesAdmin': `$${(stats.pagos_mes_actual || 0).toLocaleString()}`,
                'totalComisionesAdmin': `$${(stats.total_comisiones || 0).toLocaleString()}`
            };
            
            Object.entries(elementos).forEach(([id, valor]) => {
                const elemento = document.getElementById(id);
                if (elemento) {
                    elemento.textContent = valor;
                    console.log(`✅ Actualizado ${id}: ${valor}`);
                } else {
                    console.warn(`⚠️ No se encontró elemento: ${id}`);
                }
            });
            
        } else {
            console.warn('⚠️ No se pudieron cargar estadísticas, usando valores por defecto');
            // Valores por defecto
            const valoresPorDefecto = {
                'totalOdontologosAdmin': '1',
                'pagosPendientesAdmin': '$0',
                'pagosMesAdmin': '$0',
                'totalComisionesAdmin': '$0'
            };
            
            Object.entries(valoresPorDefecto).forEach(([id, valor]) => {
                const elemento = document.getElementById(id);
                if (elemento) {
                    elemento.textContent = valor;
                } else {
                    console.warn(`⚠️ No se encontró elemento: ${id}`);
                }
            });
        }
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

// Cargar tabla de odontólogos
async function cargarTablaOdontologos() {
    try {
        console.log('📋 Cargando tabla de odontólogos...');
        
        const tbody = document.getElementById('tablaOdontologosAdminBody');
        if (!tbody) {
            console.error('❌ No se encontró elemento tablaOdontologosAdminBody');
            return;
        }
        
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
        
        const response = await fetch('/api/pagos-odontologo/lista');
        if (response.ok) {
            const odontologos = await response.json();
            console.log('👥 Odontólogos recibidos:', odontologos);
            
            if (odontologos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay odontólogos registrados</td></tr>';
                return;
            }
            
            let html = '';
            odontologos.forEach(odontologo => {
                const saldoPendiente = (odontologo.total_comisiones || 0) - (odontologo.total_pagado || 0);
                const estado = saldoPendiente > 0 ? 'Pendiente' : 'Al día';
                const badgeClass = saldoPendiente > 0 ? 'bg-warning' : 'bg-success';
                
                html += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="avatar me-3">
                                    <i class="fas fa-user-md"></i>
                                </div>
                                <div>
                                    <div class="fw-bold">Dr. ${odontologo.nombre} ${odontologo.apellido}</div>
                                    <div class="text-muted small">${odontologo.correo}</div>
                                </div>
                            </div>
                        </td>
                        <td>$${(odontologo.total_comisiones || 0).toLocaleString()}</td>
                        <td>$${(odontologo.total_pagado || 0).toLocaleString()}</td>
                        <td>$${saldoPendiente.toLocaleString()}</td>
                        <td><span class="badge ${badgeClass}">${estado}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary me-1" onclick="verDetalleOdontologo(${odontologo.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="pagarOdontologo(${odontologo.id})">
                                <i class="fas fa-money-bill-wave"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
            console.log('✅ Tabla de odontólogos cargada exitosamente');
            
        } else {
            console.warn('⚠️ API falló, usando datos de ejemplo');
            // Datos de ejemplo si falla la API
            tbody.innerHTML = `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar me-3">
                                <i class="fas fa-user-md"></i>
                            </div>
                            <div>
                                <div class="fw-bold">Dr. Carlos Rodriguez</div>
                                <div class="text-muted small">carlos@gmail.com</div>
                            </div>
                        </div>
                    </td>
                    <td>$450,000</td>
                    <td>$300,000</td>
                    <td>$150,000</td>
                    <td><span class="badge bg-warning">Pendiente</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="verDetalleOdontologo(2)">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="pagarOdontologo(2)">
                            <i class="fas fa-money-bill-wave"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('❌ Error cargando tabla de odontólogos:', error);
        const tbody = document.getElementById('tablaOdontologosAdminBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error cargando datos</td></tr>';
        }
    }
}

// Funciones auxiliares
async function verDetalleOdontologo(id) {
    console.log('👁️ Viendo detalle del odontólogo:', id);
    
    try {
        // Mostrar loading
        const loadingContent = `
            <div class="text-center p-4">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando detalles del odontólogo...</p>
            </div>
        `;
        
        mostrarModalDetalle('Detalle del Odontólogo', loadingContent);
        
        // Obtener detalles del backend
        const response = await fetch(`/api/pagos-odontologo/detalle/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const detalle = data;
            const odontologo = detalle.odontologo;
            const resumen = detalle.resumen_financiero;
            const actividad = detalle.actividad_mes;
            const explicacion = detalle.explicacion;
            
            const contenido = `
                <div class="row">
                    <!-- Información Personal -->
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0"><i class="fas fa-user-md"></i> Información Personal</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Nombre:</strong> ${odontologo.nombre} ${odontologo.apellido}</p>
                                <p><strong>Email:</strong> ${odontologo.email}</p>
                                <p><strong>Teléfono:</strong> ${odontologo.telefono || 'No registrado'}</p>
                                <p><strong>Registrado:</strong> ${new Date(odontologo.fecha_registro).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Resumen Financiero -->
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="fas fa-chart-line"></i> Resumen Financiero</h6>
                            </div>
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-6">
                                        <div class="border-end">
                                            <h5 class="text-success mb-0">$${resumen.total_comisiones_servicios.toLocaleString()}</h5>
                                            <small class="text-muted">Total Ganado</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <h5 class="text-primary mb-0">$${resumen.total_pagos_recibidos.toLocaleString()}</h5>
                                        <small class="text-muted">Total Pagado</small>
                                    </div>
                                </div>
                                <hr>
                                <div class="text-center">
                                    <h4 class="mb-0 ${resumen.saldo_real >= 0 ? 'text-warning' : 'text-success'}">
                                        $${Math.abs(resumen.saldo_real).toLocaleString()}
                                    </h4>
                                    <small class="text-muted">
                                        ${resumen.saldo_real >= 0 ? 'Saldo Pendiente' : 'Sobrepago'}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Explicación de Conceptos -->
                <div class="alert alert-info">
                    <h6><i class="fas fa-info-circle"></i> ¿Qué significan estos números?</h6>
                    <ul class="mb-0">
                        <li><strong>Total Ganado:</strong> ${explicacion.total_comisiones_servicios}</li>
                        <li><strong>Total Pagado:</strong> ${explicacion.total_pagos_recibidos}</li>
                        <li><strong>Saldo Pendiente:</strong> ${explicacion.saldo_real}</li>
                        <li><strong>Servicios Pendientes:</strong> ${explicacion.saldo_pendiente_servicios}</li>
                    </ul>
                </div>
                
                <!-- Actividad del Mes -->
                <div class="row">
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="text-primary">${actividad.servicios_mes}</h5>
                                <small class="text-muted">Servicios Este Mes</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="text-success">$${actividad.comisiones_mes.toLocaleString()}</h5>
                                <small class="text-muted">Comisiones Este Mes</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="text-info">$${actividad.pagos_mes.toLocaleString()}</h5>
                                <small class="text-muted">Pagos Este Mes</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Últimos Pagos -->
                ${detalle.ultimos_pagos.length > 0 ? `
                <div class="mt-4">
                    <h6><i class="fas fa-history"></i> Últimos Pagos Recibidos</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                    <th>Tipo</th>
                                    <th>Método</th>
                                    <th>Referencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detalle.ultimos_pagos.map(pago => `
                                    <tr>
                                        <td>${new Date(pago.fecha_pago).toLocaleDateString()}</td>
                                        <td>$${parseFloat(pago.monto_total).toLocaleString()}</td>
                                        <td><span class="badge bg-primary">${pago.tipo_pago}</span></td>
                                        <td>${pago.metodo_pago}</td>
                                        <td>${pago.referencia || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
                
                <!-- Servicios Pendientes -->
                ${detalle.servicios_pendientes.length > 0 ? `
                <div class="mt-4">
                    <h6><i class="fas fa-clock"></i> Servicios Pendientes de Pago</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Servicio</th>
                                    <th>Paciente</th>
                                    <th>Comisión</th>
                                    <th>Pendiente</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detalle.servicios_pendientes.map(servicio => `
                                    <tr>
                                        <td>${new Date(servicio.fecha_servicio).toLocaleDateString()}</td>
                                        <td>${servicio.concepto}</td>
                                        <td>${servicio.paciente_nombre || ''} ${servicio.paciente_apellido || ''}</td>
                                        <td>$${parseFloat(servicio.monto_comision).toLocaleString()}</td>
                                        <td class="text-warning">$${parseFloat(servicio.saldo_pendiente).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
            `;
            
            mostrarModalDetalle(`Detalle de ${odontologo.nombre} ${odontologo.apellido}`, contenido);
            
        } else {
            mostrarModalDetalle('Error', `
                <div class="alert alert-danger">
                    <h6>Error al cargar detalles</h6>
                    <p>${data.message}</p>
                </div>
            `);
        }
        
    } catch (error) {
        console.error('❌ Error cargando detalle:', error);
        mostrarModalDetalle('Error', `
            <div class="alert alert-danger">
                <h6>Error de conexión</h6>
                <p>No se pudo cargar la información del odontólogo.</p>
            </div>
        `);
    }
}

// Función auxiliar para mostrar modales de detalle
function mostrarModalDetalle(titulo, contenido) {
    // Crear o actualizar modal de detalle
    let modalElement = document.getElementById('modalDetalleOdontologo');
    
    if (!modalElement) {
        // Crear modal si no existe
        const modalHTML = `
            <div class="modal fade" id="modalDetalleOdontologo" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalDetalleTitle">Detalle del Odontólogo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="modalDetalleBody">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalElement = document.getElementById('modalDetalleOdontologo');
    }
    
    // Actualizar contenido
    document.getElementById('modalDetalleTitle').textContent = titulo;
    document.getElementById('modalDetalleBody').innerHTML = contenido;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function pagarOdontologo(id) {
    console.log('💰 Pagando al odontólogo:', id);
    // Pre-seleccionar el odontólogo en el modal
    const select = document.getElementById('odontologoPagoAdmin');
    if (select) {
        select.value = id;
    }
    abrirModalPagoAdmin();
}

// Función de inicialización
function initPagosOdontologosAdmin() {
    console.log('🚀 Inicializando sistema de pagos a odontólogos...');
    
    // Listener para la pestaña de pagos a odontólogos
    const tabPagosOdontologos = document.getElementById('pagos-odontologos-tab');
    if (tabPagosOdontologos) {
        tabPagosOdontologos.addEventListener('shown.bs.tab', function() {
            console.log('📋 Pestaña de pagos a odontólogos activada');
            cargarDatosPagosOdontologos();
        });
        console.log('✅ Listener de pestaña configurado');
    } else {
        console.warn('⚠️ No se encontró la pestaña pagos-odontologos-tab');
    }
    
    // Hacer las funciones globalmente accesibles
    window.abrirModalPagoAdmin = abrirModalPagoAdmin;
    window.cargarOdontologosEnSelectAdmin = cargarOdontologosEnSelectAdmin;
    window.registrarPagoOdontologoAdmin = registrarPagoOdontologoAdmin;
    window.cargarDatosPagosOdontologos = cargarDatosPagosOdontologos;
    window.cargarEstadisticasPagosOdontologos = cargarEstadisticasPagosOdontologos;
    window.cargarTablaOdontologos = cargarTablaOdontologos;
    window.verDetalleOdontologo = verDetalleOdontologo;
    window.pagarOdontologo = pagarOdontologo;
    
    console.log('✅ Funciones de pagos a odontólogos inicializadas correctamente');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPagosOdontologosAdmin);
} else {
    // El DOM ya está cargado
    initPagosOdontologosAdmin();
}

console.log('📦 Módulo de pagos a odontólogos cargado');