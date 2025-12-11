// Script temporal para cargar pagos directamente
console.log('🔧 Script de carga directa de pagos iniciado');

// Función para cargar y mostrar pagos directamente
async function cargarPagosDirecto() {
    try {
        console.log('💰 Cargando pagos directamente...');
        
        const response = await fetch('/api/pagos');
        console.log('📡 Respuesta:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Datos recibidos:', data);
        console.log('📊 Primer pago para debug:', data.pagos?.[0]);
        
        const tbody = document.querySelector('#pagosTableBody');
        if (!tbody) {
            console.error('❌ No se encontró #pagosTableBody');
            return;
        }
        
        if (!data.pagos || data.pagos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="bi bi-inbox display-6 d-block mb-2"></i>
                        No hay pagos registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.pagos.map((pago, index) => {
            console.log(`📊 Procesando pago ${index}:`, pago);
            
            // Asegurar que tenemos los campos correctos
            const id = pago.id || index + 1;
            const fecha = pago.fecha_pago || '2025-09-24';
            const nombre = pago.paciente_nombre || 'Sin nombre';
            const concepto = pago.concepto || 'Pago realizado';
            const monto = pago.monto || 0;
            const metodo = (pago.metodo_pago || 'efectivo').replace(/_/g, ' ');
            const estado = pago.estado || 'completado';
            
            return `
            <tr>
                <td>${id}</td>
                <td>${fecha}</td>
                <td>${nombre}</td>
                <td>${concepto}</td>
                <td>$${monto.toLocaleString()}</td>
                <td>${metodo}</td>
                <td>
                    <span class="badge bg-success">
                        ${estado}
                    </span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="verDetallePago(${id})" title="Ver detalles">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button type="button" class="btn btn-sm btn-success" onclick="editarPago(${id})" title="Editar">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="eliminarPago(${id})" title="Eliminar">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
            `;
        }).join('');
        
        console.log(`✅ ${data.pagos.length} pagos mostrados en la tabla`);
        
    } catch (error) {
        console.error('❌ Error cargando pagos:', error);
        
        const tbody = document.querySelector('#pagosTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle display-6 d-block mb-2"></i>
                        Error al cargar pagos: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Función placeholder para ver detalle
function verDetallePago(id) {
    console.log('Ver detalle de pago:', id);
    alert(`Ver detalle de pago ${id}`);
}

// Cargar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(cargarPagosDirecto, 1000);
    });
} else {
    setTimeout(cargarPagosDirecto, 1000);
}

// También cargar cuando se haga clic en la sección de pagos
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-section="pagos"]')) {
        console.log('🔄 Detectado clic en sección de pagos');
        setTimeout(cargarPagosDirecto, 500);
    }
});

console.log('✅ Script de carga directa configurado');