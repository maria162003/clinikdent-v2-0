// public/js/agenda.js
// Renderiza la agenda del odontólogo y habilita acciones según ventanas horarias.

(function() {
  const DURACION_MIN = parseInt(window.CITA_DURACION_MINUTOS || 60);
  const NO_SHOW_INICIO_MIN = parseInt(window.CITA_NO_SHOW_INICIO_MIN || 15);
  const NO_SHOW_FIN_MIN = parseInt(window.CITA_NO_SHOW_FIN_MIN || 20);

  const userId = parseInt(localStorage.getItem('userId'));
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const token = localStorage.getItem('token');

  function qs(sel) { return document.querySelector(sel); }
  function ce(tag, cls) { const el = document.createElement(tag); if (cls) el.className = cls; return el; }

  function combineLocalDateTime(fecha, hora) {
    try {
      const f = new Date(fecha);
      const [hh, mm] = (hora || '').toString().slice(0,5).split(':').map(n => parseInt(n || '0'));
      return new Date(f.getFullYear(), f.getMonth(), f.getDate(), hh, mm, 0, 0);
    } catch (e) {
      return new Date();
    }
  }

  function within(now, start, end) {
    return now >= start && now <= end;
  }

  function buildActionButtons(cita) {
    const cont = ce('div', 'acciones-cita');
    const btnCompletar = ce('button', 'btn btn-success');
    btnCompletar.textContent = 'Completar';
    const btnNoShow = ce('button', 'btn btn-warning');
    btnNoShow.textContent = 'Marcar ausencia';

    const inicio = combineLocalDateTime(cita.fecha, cita.hora);
    const fin = new Date(inicio.getTime() + DURACION_MIN * 60000);
    const now = new Date();

    const ventanaNoShowInicio = new Date(inicio.getTime() + NO_SHOW_INICIO_MIN * 60000);
    const ventanaNoShowFin = new Date(Math.min(inicio.getTime() + NO_SHOW_FIN_MIN * 60000, fin.getTime()));

    const puedeCompletar = within(now, inicio, fin);
    const puedeNoShow = within(now, ventanaNoShowInicio, ventanaNoShowFin);

    const tooltipMsg = 'Acción disponible solo durante la ventana de la cita.';

    if (!puedeCompletar) {
      btnCompletar.disabled = true;
      btnCompletar.title = tooltipMsg;
    }

    if (!puedeNoShow) {
      btnNoShow.disabled = true;
      btnNoShow.title = tooltipMsg;
    }

    btnCompletar.addEventListener('click', () => actualizarEstado(cita.id, 'completada'));
    btnNoShow.addEventListener('click', () => actualizarEstado(cita.id, 'no_show'));

    cont.appendChild(btnCompletar);
    cont.appendChild(btnNoShow);
    return cont;
  }

  async function actualizarEstado(idCita, nuevoEstado) {
    if (!confirm(`¿Confirmas cambiar el estado a "${nuevoEstado}"?`)) return;

    try {
      const resp = await fetch(`/api/citas/${idCita}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'user-id': String(userId || ''),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await resp.json();
      if (!resp.ok) {
        alert(data.msg || 'Error al actualizar la cita.');
        return;
      }

      alert(data.message || 'Estado actualizado');
      // Recargar para refrescar botones/estado
      cargarAgenda();
    } catch (err) {
      console.error('Error PATCH estado cita:', err);
      alert('Error de comunicación con el servidor.');
    }
  }

  function renderAgenda(citas) {
    const tbody = qs('#tabla-agenda tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(citas) || citas.length === 0) {
      const tr = ce('tr');
      const td = ce('td');
      td.colSpan = 5;
      td.textContent = 'No hay citas para mostrar';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    citas.forEach(cita => {
      const tr = ce('tr');
      const tdPaciente = ce('td');
      const tdFecha = ce('td');
      const tdHora = ce('td');
      const tdMotivo = ce('td');
      const tdEstado = ce('td');

      tdPaciente.textContent = [cita.paciente_nombre, cita.paciente_apellido].filter(Boolean).join(' ') || '—';
      // Mostrar fecha local amigable
      const f = new Date(cita.fecha);
      tdFecha.textContent = isNaN(f.getTime()) ? (cita.fecha || '—') : f.toLocaleDateString('es-ES');
      tdHora.textContent = (cita.hora || '').toString().slice(0,5);
      tdMotivo.textContent = cita.motivo || '—';

      const estadoSpan = ce('span');
      estadoSpan.textContent = cita.estado || 'programada';
      tdEstado.appendChild(estadoSpan);

      // Acciones visibles solo para odontólogo dueño
      const acciones = buildActionButtons(cita);
      const tdAcciones = ce('td');
      tdAcciones.appendChild(acciones);

      // Reemplazar última celda con acciones y estado juntos
      tr.appendChild(tdPaciente);
      tr.appendChild(tdFecha);
      tr.appendChild(tdHora);
      tr.appendChild(tdMotivo);
      tr.appendChild(tdEstado);
      tr.appendChild(tdAcciones);
      tbody.appendChild(tr);
    });
  }

  async function cargarAgenda() {
    if (!userId || userRole !== 'odontologo') {
      const tbody = qs('#tabla-agenda tbody');
      tbody.innerHTML = '';
      const tr = ce('tr');
      const td = ce('td');
      td.colSpan = 5;
      td.textContent = 'Debes iniciar sesión como odontólogo para ver tu agenda.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    try {
      const url = `/api/citas/agenda/odontologo?id_odontologo=${encodeURIComponent(userId)}`;
      const resp = await fetch(url, {
        headers: {
          'user-id': String(userId || ''),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error('Error cargando agenda:', data);
        renderAgenda([]);
        alert(data.msg || 'Error al cargar agenda');
        return;
      }
      renderAgenda(data);
    } catch (err) {
      console.error('Error cargando agenda:', err);
      renderAgenda([]);
    }
  }

  document.addEventListener('DOMContentLoaded', cargarAgenda);
})();
