// ============================================================================
// FUNCIONES CITAS CON ESQUEMA DE COLORES ESTANDARIZADO
// ============================================================================

// Datos de ejemplo para citas (simula lo que vería el usuario del screenshot)
const CITAS_EJEMPLO = [
    {
        id: 1,
        paciente: { nombre: 'Juan Pérez', email: 'juan.perez@gmail.com' },
        odontologo: { nombre: 'Dr. Carlos Rodríguez', email: 'carlos.rodriguez@clinikdent.com' },
        fecha: '2025-09-25',
        hora: '09:00:00',
        estado: 'confirmada',
        motivo: 'Revisión general'
    },
    {
        id: 2,
        paciente: { nombre: 'María González', email: 'maria.gonzalez@gmail.com' },
        odontologo: { nombre: 'Dr. Carlos Rodríguez', email: 'carlos.rodriguez@clinikdent.com' },
        fecha: '2025-09-25',
        hora: '10:00:00',
        estado: 'confirmada',
        motivo: 'Consulta general'
    },
    {
        id: 3,
        paciente: { nombre: 'Juan Pérez', email: 'juan.perez@gmail.com' },
        odontologo: { nombre: 'Dra. Ana García', email: 'ana.garcia@clinikdent.com' },
        fecha: '2025-09-25',
        hora: '14:30:00',
        estado: 'completada',
        motivo: 'Limpieza dental'
    },
    {
        id: 4,
        paciente: { nombre: 'Carlos López', email: 'carlos.lopez@gmail.com' },
        odontologo: { nombre: 'Dr. Carlos Rodríguez', email: 'carlos.rodriguez@clinikdent.com' },
        fecha: '2025-09-24',
        hora: '09:00:00',
        estado: 'completada',
        motivo: 'Ortodoncia'
    }
];

// Función para cargar y renderizar citas con colores estandarizados
async function loadCitasConColores() {
    console.log('📅 Cargando citas con esquema de colores...');
    
    const tableBody = document.getElementById('citasTableBody');
    const loadingMsg = document.getElementById('citasLoadingMsg');
    const noCitasMsg = document.getElementById('noCitasMsg');
    
    if (!tableBody) {
        console.error('❌ No se encontró la tabla de citas');
        return;
    }
    
    // Mostrar loading
    if (loadingMsg) loadingMsg.style.display = 'block';
    if (noCitasMsg) noCitasMsg.classList.add('d-none');
    
    try {
        // Simular carga de datos (en producción sería una llamada a API)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const citas = CITAS_EJEMPLO;
        
        // Limpiar tabla
        tableBody.innerHTML = '';
        
        if (citas.length === 0) {
            if (loadingMsg) loadingMsg.style.display = 'none';
            if (noCitasMsg) noCitasMsg.classList.remove('d-none');
            return;
        }
        
        citas.forEach(cita => {
            const row = document.createElement('tr');
            
            // Formatear fecha y hora
            const fecha = new Date(cita.fecha).toLocaleDateString('es-ES');
            const hora = cita.hora.substring(0, 5); // HH:MM
            
            row.innerHTML = `
                <td>${cita.id}</td>
                <td>
                    <div>
                        <strong>${cita.paciente.nombre}</strong>
                        <br>
                        <small class="text-muted">${cita.paciente.email}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${cita.odontologo.nombre}</strong>
                        <br>
                        <small class="text-muted">${cita.odontologo.email}</small>
                    </div>
                </td>
                <td>${fecha}</td>
                <td>
                    <span class="badge bg-info text-white">${hora}</span>
                </td>
                <td>
                    ${ColorScheme.createStatusBadge(cita.estado, cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1))}
                </td>
                <td>${cita.motivo}</td>
                <td>
                    <div class="btn-group" role="group">
                        ${ColorScheme.createActionButton('ver', '', `verCita(${cita.id})`, 'bi bi-eye')}
                        ${ColorScheme.createActionButton('editar', '', `editarCita(${cita.id})`, 'bi bi-pencil')}
                        ${ColorScheme.createActionButton('eliminar', '', `eliminarCita(${cita.id})`, 'bi bi-trash')}
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Aplicar esquema de colores automáticamente
        ColorScheme.applyToTable('citasTable');
        
        console.log(`✅ ${citas.length} citas cargadas con colores estandarizados`);
        
    } catch (error) {
        console.error('❌ Error al cargar citas:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error al cargar las citas: ${error.message}
                </td>
            </tr>
        `;
    } finally {
        if (loadingMsg) loadingMsg.style.display = 'none';
    }
}

// Funciones de acción para citas
function verCita(id) {
    const cita = CITAS_EJEMPLO.find(c => c.id === id);
    if (cita) {
        alert(`👁️ Ver detalles de cita #${id}\nPaciente: ${cita.paciente.nombre}\nEstado: ${cita.estado}`);
    }
}

function editarCita(id) {
    const cita = CITAS_EJEMPLO.find(c => c.id === id);
    if (cita) {
        alert(`✏️ Editar cita #${id}\nPaciente: ${cita.paciente.nombre}\nEstado: ${cita.estado}`);
        // Aquí iría la lógica de edición real
    }
}

function eliminarCita(id) {
    const cita = CITAS_EJEMPLO.find(c => c.id === id);
    if (cita && confirm(`🗑️ ¿Eliminar cita #${id} de ${cita.paciente.nombre}?`)) {
        alert(`❌ Cita #${id} eliminada`);
        // Aquí iría la lógica de eliminación real
        loadCitasConColores(); // Recargar tabla
    }
}

// Función para aplicar filtros de estado con colores
function aplicarFiltroEstado() {
    const filtro = document.getElementById('estadoFiltro')?.value || '';
    const rows = document.querySelectorAll('#citasTable tbody tr');
    
    rows.forEach(row => {
        if (!filtro) {
            row.style.display = '';
            return;
        }
        
        const badge = row.querySelector('td:nth-child(6) .badge');
        if (badge) {
            const estado = badge.textContent.toLowerCase().trim();
            row.style.display = estado.includes(filtro.toLowerCase()) ? '' : 'none';
        }
    });
}

// Auto-inicializar cuando se carga la sección de citas
document.addEventListener('DOMContentLoaded', function() {
    // Escuchar cuando se activa la sección de citas
    const citasLink = document.querySelector('[data-section="citas"]');
    if (citasLink) {
        citasLink.addEventListener('click', function() {
            setTimeout(() => {
                loadCitasConColores();
            }, 100);
        });
    }
    
    // Configurar filtro de estado
    const estadoFiltro = document.getElementById('estadoFiltro');
    if (estadoFiltro) {
        estadoFiltro.addEventListener('change', aplicarFiltroEstado);
    }
    
    // Botón de actualizar citas
    const refreshBtn = document.getElementById('refreshCitasBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadCitasConColores);
    }
});

console.log('✅ Módulo de citas con colores estandarizados cargado');