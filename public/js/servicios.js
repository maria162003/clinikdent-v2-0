// Función para agendar cita
function agendarCita(servicio) {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        // Si no está autenticado, redirigir al login
        window.location.href = 'index.html?redirect=servicios&servicio=' + encodeURIComponent(servicio);
        return;
    }

    // Si está autenticado, obtener los horarios disponibles
    fetch('/api/citas/horarios-disponibles', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        // Mostrar modal de agendamiento
        mostrarModalAgendamiento(servicio, data.horarios);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al obtener horarios disponibles');
    });
}

// Función para mostrar el modal de agendamiento
function mostrarModalAgendamiento(servicio, horarios) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Agendar Cita - ${servicio}</h3>
            <form id="formAgendarCita">
                <label for="fecha">Fecha:</label>
                <input type="date" id="fecha" required min="${new Date().toISOString().split('T')[0]}">
                
                <label for="hora">Hora:</label>
                <select id="hora" required>
                    <option value="">Seleccione un horario</option>
                    ${horarios.map(h => `<option value="${h}">${h}</option>`).join('')}
                </select>
                
                <button type="submit">Confirmar Cita</button>
                <button type="button" onclick="cerrarModal()">Cancelar</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Manejar el envío del formulario
    document.getElementById('formAgendarCita').addEventListener('submit', function(e) {
        e.preventDefault();
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;
        
        confirmarCita(servicio, fecha, hora);
    });
}

// Función para confirmar la cita
function confirmarCita(servicio, fecha, hora) {
    const token = localStorage.getItem('token');
    
    fetch('/api/citas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            servicio,
            fecha,
            hora
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Cita agendada exitosamente');
        cerrarModal();
        // Opcional: redirigir a la página de citas del usuario
        window.location.href = 'mis-citas.html';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al agendar la cita');
    });
}

// Función para cerrar el modal
function cerrarModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Exportar funciones para uso global
window.agendarCita = agendarCita;
window.cerrarModal = cerrarModal;
