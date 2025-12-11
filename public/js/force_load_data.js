// Script para forzar carga de datos en el dashboard
console.log('🚀 FORZANDO CARGA DE DATOS DEL DASHBOARD');

// Configurar usuario admin por defecto
const adminUser = {
    id: 4,
    nombre: 'Admin',
    apellido: 'Sistema',
    email: 'admin@clinikdent.com',
    tipo_usuario: 'administrador',
    rol: 'administrador'
};

// Configurar localStorage
localStorage.setItem('user', JSON.stringify(adminUser));
localStorage.setItem('userId', '4');
console.log('👤 Usuario admin configurado');

// Función para cargar datos específicos de cada sección
async function forceLoadSectionData() {
    if (!window.dashboardAdmin) {
        console.log('⚠️ Dashboard no disponible, intentando de nuevo...');
        setTimeout(forceLoadSectionData, 1000);
        return;
    }
    
    console.log('📊 Dashboard disponible, forzando carga...');
    
    try {
        // 1. Usuarios
        console.log('👥 Forzando carga de usuarios...');
        await window.dashboardAdmin.loadUsuarios();
        
        // 2. Citas
        console.log('📅 Forzando carga de citas...');
        await window.dashboardAdmin.loadCitas();
        
        // 3. FAQs
        console.log('❓ Forzando carga de FAQs...');
        await window.dashboardAdmin.loadFAQs();
        
        // 4. Evaluaciones
        console.log('⭐ Forzando carga de evaluaciones...');
        await window.dashboardAdmin.loadEvaluaciones();
        
        // 5. Inventario (función global)
        console.log('📦 Forzando carga de inventario...');
        if (typeof loadInventario === 'function') {
            await loadInventario();
        } else if (window.dashboardAdmin.loadInventario) {
            await window.dashboardAdmin.loadInventario();
        }
        
        // 6. Sedes
        console.log('🏥 Forzando carga de sedes...');
        if (typeof loadSedes === 'function') {
            await loadSedes();
        }
        
        // 7. Pagos - usar el módulo correcto
        console.log('💰 Forzando carga de pagos...');
        if (window.adminPagosModule && window.adminPagosModule.cargarHistorialPagos) {
            await window.adminPagosModule.cargarHistorialPagos();
        } else {
            // Cargar pagos directamente si no hay módulo
            await cargarPagosDirectamente();
        }
        
        console.log('✅ TODAS LAS SECCIONES CARGADAS');
        
    } catch (error) {
        console.error('❌ Error al forzar carga:', error);
    }
}

// Función para cargar pagos directamente
async function cargarPagosDirectamente() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId') || user.id || '4';
        
        const response = await fetch('/api/pagos', {
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const pagos = data.pagos || data || [];
            console.log('💰 Pagos obtenidos:', pagos.length, 'registros');
            
            // Renderizar en tabla
            const tbody = document.querySelector('#pagosTableBody');
            if (tbody && pagos.length > 0) {
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
                            <span class="badge bg-success">
                                ${(pago.estado || 'COMPLETADO').toUpperCase()}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" title="Ver detalles">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
                console.log('✅ Tabla de pagos actualizada');
            } else if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay pagos registrados</td></tr>';
            }
        }
    } catch (error) {
        console.error('❌ Error cargando pagos directamente:', error);
    }
}

// Función para mostrar estado de las tablas
function checkTableStatus() {
    console.log('🔍 VERIFICANDO ESTADO DE LAS TABLAS:');
    
    const tables = [
        { id: 'usuariosTable', name: 'Usuarios', bodyId: 'usuariosTableBody' },
        { id: 'citasTable', name: 'Citas', bodyId: 'citasTableBody' },
        { id: 'pagosTable', name: 'Pagos', bodyId: 'pagosTableBody' },
        { id: 'faqsTable', name: 'FAQs', bodyId: 'faqsTableBody' },
        { id: 'evaluacionesTable', name: 'Evaluaciones', bodyId: 'evaluacionesTableBody' },
        { id: 'inventarioTable', name: 'Inventario', bodyId: 'inventarioTableBody' }
    ];
    
    tables.forEach(({ id, name, bodyId }) => {
        const table = document.getElementById(id);
        const tbody = document.getElementById(bodyId);
        
        if (table && tbody) {
            const rows = tbody.children.length;
            const hasData = rows > 0 && !tbody.textContent.includes('No hay') && !tbody.textContent.includes('Cargando');
            console.log(`📊 ${name}: ${rows} filas - ${hasData ? '✅ Con datos' : '❌ Sin datos'}`);
            
            if (!hasData && rows > 0) {
                console.log(`   📝 Contenido: ${tbody.textContent.trim().substring(0, 100)}...`);
            }
        } else {
            console.log(`❌ ${name}: Tabla ${table ? 'encontrada' : 'NO encontrada'}, Body ${tbody ? 'encontrado' : 'NO encontrado'}`);
        }
    });
}

// Auto-ejecutar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM cargado, esperando 3 segundos...');
    
    setTimeout(() => {
        forceLoadSectionData();
        
        // Verificar después de 5 segundos más
        setTimeout(checkTableStatus, 5000);
    }, 3000);
});

// Exponer funciones globalmente
window.forceLoadData = forceLoadSectionData;
window.checkTables = checkTableStatus;
