/**
 * Sistema de Reportes y Estadísticas - Clinik Dent
 * Validación de campos y generación de reportes con exportación Excel
 */

// Estado global de reportes
const reportesState = {
  financiero: { data: null, fieldsValid: false },
  operativo: { data: null, fieldsValid: false },
  cancelaciones: { data: null, fieldsValid: false },
  actividad: { data: null, fieldsValid: false },
  tratamientos: { data: null, fieldsValid: false }
};

// Inicialización
function initReportesSystem() {
  console.log('📊 Inicializando sistema de reportes...');
  console.log('🔍 Verificando elementos del DOM...');
  
  // Verificar que existan los elementos clave dentro del container de reportes
  const reportesContainer = document.querySelector('.reportes-container');
  if (!reportesContainer) {
    console.log('⚠️ Container de reportes no encontrado, esperando...');
    return;
  }
  
  const tabs = reportesContainer.querySelectorAll('.tab-button');
  const contents = reportesContainer.querySelectorAll('.tab-content');
  console.log(`✅ Tabs encontrados: ${tabs.length}`);
  console.log(`✅ Tab contents encontrados: ${contents.length}`);
  
  setupTabs();
  setupFieldValidation();
  cargarOdontologos();
  cargarUsuarios();
  setDefaultDates();
  
  console.log('✅ Sistema de reportes inicializado correctamente');
}

// Ejecutar cuando el DOM esté listo o inmediatamente si ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReportesSystem);
} else {
  // DOM ya está listo, ejecutar inmediatamente
  setTimeout(initReportesSystem, 500);
}

// ==========================================
// MANEJO DE PESTAÑAS
// ==========================================

function setupTabs() {
  const reportesContainer = document.querySelector('.reportes-container');
  if (!reportesContainer) return;
  
  const tabButtons = reportesContainer.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Actualizar botones solo dentro del container de reportes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Actualizar contenido solo dentro del container de reportes
      reportesContainer.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      const targetTab = reportesContainer.querySelector(`#tab-${tabName}`);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });
}

// ==========================================
// VALIDACIÓN DE CAMPOS
// ==========================================

function setupFieldValidation() {
  const tabs = ['financiero', 'operativo', 'cancelaciones', 'actividad', 'tratamientos'];
  
  tabs.forEach(tab => {
    const prefix = getFieldPrefix(tab);
    const fechaInicio = document.getElementById(`${prefix}-fecha-inicio`);
    const fechaFin = document.getElementById(`${prefix}-fecha-fin`);
    
    if (fechaInicio && fechaFin) {
      fechaInicio.addEventListener('change', () => validateFields(tab));
      fechaFin.addEventListener('change', () => validateFields(tab));
      fechaInicio.addEventListener('blur', () => validateFields(tab));
      fechaFin.addEventListener('blur', () => validateFields(tab));
    }
  });
}

function getFieldPrefix(tab) {
  const prefixes = {
    financiero: 'fin',
    operativo: 'op',
    cancelaciones: 'canc',
    actividad: 'act',
    tratamientos: 'trat'
  };
  return prefixes[tab];
}

function validateFields(tab) {
  const prefix = getFieldPrefix(tab);
  const fechaInicio = document.getElementById(`${prefix}-fecha-inicio`);
  const fechaFin = document.getElementById(`${prefix}-fecha-fin`);
  
  let isValid = true;
  
  // Validar fecha inicio
  if (!fechaInicio.value) {
    markFieldAsInvalid(fechaInicio);
    isValid = false;
  } else {
    markFieldAsValid(fechaInicio);
  }
  
  // Validar fecha fin
  if (!fechaFin.value) {
    markFieldAsInvalid(fechaFin);
    isValid = false;
  } else {
    markFieldAsValid(fechaFin);
  }
  
  // Validar que fecha fin sea mayor que fecha inicio
  if (fechaInicio.value && fechaFin.value) {
    if (new Date(fechaFin.value) < new Date(fechaInicio.value)) {
      markFieldAsInvalid(fechaFin);
      showError(fechaFin, 'La fecha fin debe ser mayor a la fecha inicio');
      isValid = false;
    }
  }
  
  reportesState[tab].fieldsValid = isValid;
  updateDownloadButton(tab, isValid && reportesState[tab].data !== null);
  
  return isValid;
}

function markFieldAsInvalid(field) {
  field.classList.add('error');
  field.parentElement.classList.add('has-error');
}

function markFieldAsValid(field) {
  field.classList.remove('error');
  field.parentElement.classList.remove('has-error');
}

function showError(field, message) {
  const errorElement = field.parentElement.querySelector('.error-message');
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function updateDownloadButton(tab, enabled) {
  const button = document.getElementById(`btn-descargar-${tab}`);
  if (button) {
    button.disabled = !enabled;
  }
}

// ==========================================
// FECHAS POR DEFECTO
// ==========================================

function setDefaultDates() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
  
  const tabs = ['fin', 'op', 'canc', 'act', 'trat'];
  tabs.forEach(prefix => {
    const fechaInicio = document.getElementById(`${prefix}-fecha-inicio`);
    const fechaFin = document.getElementById(`${prefix}-fecha-fin`);
    if (fechaInicio) fechaInicio.value = firstDayStr;
    if (fechaFin) fechaFin.value = todayStr;
  });
}

// ==========================================
// CARGAR DATOS DE SELECTS
// ==========================================

async function cargarOdontologos() {
  try {
    const response = await fetch('/api/usuarios/odontologos');
    if (response.ok) {
      const odontologos = await response.json();
      const select = document.getElementById('op-odontologo');
      
      if (odontologos && select) {
        odontologos.forEach(odontologo => {
          const option = document.createElement('option');
          option.value = odontologo.id;
          option.textContent = `${odontologo.nombre} ${odontologo.apellido}`;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Error cargando odontólogos:', error);
  }
}

async function cargarUsuarios() {
  try {
    const response = await fetch('/api/usuarios');
    if (response.ok) {
      const usuarios = await response.json();
      const select = document.getElementById('act-usuario');
      
      if (usuarios && select) {
        usuarios.forEach(usuario => {
          const option = document.createElement('option');
          option.value = usuario.id;
          option.textContent = `${usuario.nombre} ${usuario.apellido} (${usuario.rol})`;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Error cargando usuarios:', error);
  }
}

// ==========================================
// GENERAR REPORTES
// ==========================================

async function generarReporte(tipo) {
  console.log(`🔄 Generando reporte tipo: ${tipo}`);
  
  if (!validateFields(tipo)) {
    console.warn('⚠️ Validación de campos falló');
    alert('⚠️ Por favor complete todos los campos requeridos');
    return;
  }
  
  const resultadosDiv = document.getElementById(`resultados-${tipo}`);
  console.log(`📍 Elemento resultados encontrado:`, resultadosDiv ? 'Sí' : 'NO');
  
  resultadosDiv.innerHTML = '<div class="loading">Generando reporte</div>';
  resultadosDiv.classList.add('visible');
  
  try {
    const filtros = getFiltros(tipo);
    const endpoint = getEndpoint(tipo);
    
    console.log(`📡 Llamando a: ${endpoint}`);
    console.log(`📦 Con filtros:`, filtros);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filtros)
    });
    
    console.log(`📊 Respuesta recibida: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Datos recibidos:`, data);
      console.log(`📋 Total registros: ${data.detalles ? data.detalles.length : 0}`);
      
      reportesState[tipo].data = data;
      mostrarResultados(tipo, data);
      updateDownloadButton(tipo, true);
    } else {
      const errorText = await response.text();
      console.error(`❌ Error del servidor: ${errorText}`);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    resultadosDiv.innerHTML = `<div style="color: #dc3545; text-align: center; padding: 20px;">
      ❌ Error al generar el reporte: ${error.message}<br>
      Por favor intente nuevamente o revise la consola para más detalles.
    </div>`;
  }
}

function getFiltros(tipo) {
  const prefix = getFieldPrefix(tipo);
  const filtros = {
    fechaInicio: document.getElementById(`${prefix}-fecha-inicio`).value,
    fechaFin: document.getElementById(`${prefix}-fecha-fin`).value
  };
  
  // Agregar filtros específicos por tipo
  switch(tipo) {
    case 'financiero':
      filtros.metodoPago = document.getElementById('fin-metodo-pago').value;
      break;
    case 'operativo':
      filtros.estado = document.getElementById('op-estado').value;
      filtros.odontologoId = document.getElementById('op-odontologo').value;
      break;
    case 'cancelaciones':
      filtros.motivo = document.getElementById('canc-motivo').value;
      break;
    case 'actividad':
      filtros.usuarioId = document.getElementById('act-usuario').value;
      filtros.tipoAccion = document.getElementById('act-tipo-accion').value;
      break;
    case 'tratamientos':
      filtros.estado = document.getElementById('trat-estado').value;
      filtros.tipo = document.getElementById('trat-tipo').value;
      break;
  }
  
  return filtros;
}

function getEndpoint(tipo) {
  const endpoints = {
    financiero: '/api/reportes-basicos/financiero',
    operativo: '/api/reportes-basicos/citas-agendadas',
    cancelaciones: '/api/reportes-basicos/cancelaciones',
    actividad: '/api/reportes-basicos/actividad-usuarios',
    tratamientos: '/api/reportes-basicos/seguimiento-tratamientos'
  };
  return endpoints[tipo];
}

// ==========================================
// MOSTRAR RESULTADOS
// ==========================================

function mostrarResultados(tipo, data) {
  const resultadosDiv = document.getElementById(`resultados-${tipo}`);
  
  let html = '';
  
  switch(tipo) {
    case 'financiero':
      html = renderFinanciero(data);
      break;
    case 'operativo':
      html = renderOperativo(data);
      break;
    case 'cancelaciones':
      html = renderCancelaciones(data);
      break;
    case 'actividad':
      html = renderActividad(data);
      break;
    case 'tratamientos':
      html = renderTratamientos(data);
      break;
  }
  
  resultadosDiv.innerHTML = html;
}

function renderFinanciero(data) {
  return `
    <h3>📊 Resumen Financiero</h3>
    <div class="stats-grid">
      <div class="stat-card green">
        <h3>Ingresos Totales</h3>
        <div class="value">$${formatNumber(data.resumen.total)}</div>
      </div>
      <div class="stat-card blue">
        <h3>Total Transacciones</h3>
        <div class="value">${data.resumen.totalTransacciones}</div>
      </div>
      <div class="stat-card orange">
        <h3>Ticket Promedio</h3>
        <div class="value">$${formatNumber(data.resumen.ticketPromedio)}</div>
      </div>
    </div>
    
    <h4>Detalle de Ingresos</h4>
    <table class="tabla-reportes">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Concepto</th>
          <th>Paciente</th>
          <th>Método de Pago</th>
          <th>Monto</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${data.detalles.map(item => `
          <tr>
            <td>${formatDate(item.fecha)}</td>
            <td>${item.concepto}</td>
            <td>${item.paciente}</td>
            <td>${item.metodoPago}</td>
            <td>$${formatNumber(item.monto)}</td>
            <td><span class="badge badge-${getBadgeClass(item.estado)}">${item.estado}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderOperativo(data) {
  return `
    <h3>📋 Citas Agendadas</h3>
    <div class="stats-grid">
      <div class="stat-card blue">
        <h3>Total Citas</h3>
        <div class="value">${data.resumen.total}</div>
      </div>
      <div class="stat-card green">
        <h3>Completadas</h3>
        <div class="value">${data.resumen.completadas}</div>
      </div>
      <div class="stat-card orange">
        <h3>Programadas</h3>
        <div class="value">${data.resumen.programadas}</div>
      </div>
    </div>
    
    <h4>Detalle de Citas</h4>
    <table class="tabla-reportes">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Paciente</th>
          <th>Odontólogo</th>
          <th>Tratamiento</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${data.detalles.map(item => `
          <tr>
            <td>${formatDate(item.fecha)}</td>
            <td>${item.hora}</td>
            <td>${item.paciente}</td>
            <td>${item.odontologo}</td>
            <td>${item.tratamiento}</td>
            <td><span class="badge badge-${getBadgeClass(item.estado)}">${item.estado}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderCancelaciones(data) {
  return `
    <h3>❌ Análisis de Cancelaciones</h3>
    <div class="stats-grid">
      <div class="stat-card orange">
        <h3>Total Cancelaciones</h3>
        <div class="value">${data.resumen.total}</div>
      </div>
      <div class="stat-card blue">
        <h3>Por Paciente</h3>
        <div class="value">${data.resumen.porPaciente}</div>
      </div>
      <div class="stat-card">
        <h3>Por Clínica</h3>
        <div class="value">${data.resumen.porClinica}</div>
      </div>
    </div>
    
    <h4>Detalle de Cancelaciones</h4>
    <table class="tabla-reportes">
      <thead>
        <tr>
          <th>Fecha Cita</th>
          <th>Fecha Cancelación</th>
          <th>Paciente</th>
          <th>Tratamiento</th>
          <th>Motivo</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        ${data.detalles.map(item => `
          <tr>
            <td>${formatDate(item.fechaCita)}</td>
            <td>${formatDate(item.fechaCancelacion)}</td>
            <td>${item.paciente}</td>
            <td>${item.tratamiento}</td>
            <td><span class="badge badge-warning">${item.motivo}</span></td>
            <td>${item.observaciones || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderActividad(data) {
  return `
    <h3>👥 Actividad de Usuarios</h3>
    <div class="stats-grid">
      <div class="stat-card blue">
        <h3>Total Acciones</h3>
        <div class="value">${data.resumen.total}</div>
      </div>
      <div class="stat-card green">
        <h3>Usuarios Activos</h3>
        <div class="value">${data.resumen.usuariosActivos}</div>
      </div>
      <div class="stat-card orange">
        <h3>Promedio Diario</h3>
        <div class="value">${data.resumen.promedioDiario}</div>
      </div>
    </div>
    
    <h4>Registro de Actividad</h4>
    <table class="tabla-reportes">
      <thead>
        <tr>
          <th>Fecha y Hora</th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Acción</th>
          <th>Módulo</th>
          <th>Detalles</th>
        </tr>
      </thead>
      <tbody>
        ${data.detalles.map(item => `
          <tr>
            <td>${formatDateTime(item.fecha)}</td>
            <td>${item.usuario}</td>
            <td><span class="badge badge-info">${item.rol}</span></td>
            <td>${item.accion}</td>
            <td>${item.modulo}</td>
            <td>${item.detalles || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderTratamientos(data) {
  return `
    <h3>🦷 Seguimiento de Tratamientos</h3>
    <div class="stats-grid">
      <div class="stat-card blue">
        <h3>Total Tratamientos</h3>
        <div class="value">${data.resumen.total}</div>
      </div>
      <div class="stat-card green">
        <h3>Completados</h3>
        <div class="value">${data.resumen.completados}</div>
      </div>
      <div class="stat-card orange">
        <h3>En Progreso</h3>
        <div class="value">${data.resumen.enProgreso}</div>
      </div>
      <div class="stat-card">
        <h3>Tasa de Éxito</h3>
        <div class="value">${data.resumen.tasaExito}%</div>
      </div>
    </div>
    
    <h4>Detalle de Tratamientos</h4>
    <table class="tabla-reportes">
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Tipo Tratamiento</th>
          <th>Fecha Inicio</th>
          <th>Fecha Estimada Fin</th>
          <th>Progreso</th>
          <th>Estado</th>
          <th>Odontólogo</th>
        </tr>
      </thead>
      <tbody>
        ${data.detalles.map(item => `
          <tr>
            <td>${item.paciente}</td>
            <td>${item.tipoTratamiento}</td>
            <td>${formatDate(item.fechaInicio)}</td>
            <td>${formatDate(item.fechaEstimadaFin)}</td>
            <td>${item.progreso}%</td>
            <td><span class="badge badge-${getBadgeClass(item.estado)}">${item.estado}</span></td>
            <td>${item.odontologo}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ==========================================
// DESCARGAR EXCEL
// ==========================================

async function descargarExcel(tipo) {
  const data = reportesState[tipo].data;
  if (!data) {
    alert('No hay datos para descargar');
    return;
  }
  
  try {
    const filtros = getFiltros(tipo);
    const response = await fetch(`/api/reportes-basicos/exportar-excel/${tipo}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data, filtros })
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('✅ Reporte descargado exitosamente');
    } else {
      throw new Error('Error al descargar el reporte');
    }
  } catch (error) {
    console.error('Error descargando Excel:', error);
    alert('❌ Error al descargar el reporte. Por favor intente nuevamente.');
  }
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================

function limpiarFiltros(tipo) {
  const prefix = getFieldPrefix(tipo);
  const inputs = document.querySelectorAll(`#tab-${tipo} input, #tab-${tipo} select`);
  
  inputs.forEach(input => {
    if (input.type === 'date') {
      input.value = '';
    } else {
      input.value = '';
    }
    markFieldAsValid(input);
  });
  
  // Limpiar resultados
  const resultadosDiv = document.getElementById(`resultados-${tipo}`);
  resultadosDiv.innerHTML = '';
  resultadosDiv.classList.remove('visible');
  
  // Actualizar estado
  reportesState[tipo].data = null;
  reportesState[tipo].fieldsValid = false;
  updateDownloadButton(tipo, false);
  
  // Restablecer fechas por defecto
  setDefaultDates();
}

// ==========================================
// UTILIDADES
// ==========================================

function formatNumber(num) {
  return new Intl.NumberFormat('es-CO').format(num);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('es-CO', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getBadgeClass(estado) {
  const classes = {
    'completada': 'success',
    'completado': 'success',
    'pagado': 'success',
    'programada': 'info',
    'en_progreso': 'info',
    'pendiente': 'warning',
    'pausado': 'warning',
    'cancelada': 'danger',
    'cancelado': 'danger'
  };
  return classes[estado.toLowerCase()] || 'info';
}

console.log('✅ Sistema de reportes cargado correctamente');
