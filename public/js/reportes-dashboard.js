/**
 * Sistema de Reportes Integrado en Dashboard
 * Funciones para generar y exportar reportes
 */

// Estado global de reportes
const reportesData = {
  financiero: null,
  operativo: null
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 Inicializando sistema de reportes en dashboard...');
  
  // Cargar odontólogos para el filtro
  cargarOdontologos();
  
  // Configurar fechas por defecto
  setDefaultDates();
  
  // Configurar validación de campos
  setupFieldValidation();
  
  console.log('✅ Sistema de reportes inicializado');
});

// ==========================================
// CARGAR DATOS INICIALES
// ==========================================

async function cargarOdontologos() {
  try {
    const response = await fetch('/api/usuarios/odontologos');
    const data = await response.json();
    
    const select = document.getElementById('op-odontologo');
    if (select && data.odontologos) {
      data.odontologos.forEach(odontologo => {
        const option = document.createElement('option');
        option.value = odontologo.id;
        option.textContent = `${odontologo.nombre} ${odontologo.apellido}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando odontólogos:', error);
  }
}

function setDefaultDates() {
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  
  const formatoFecha = (fecha) => fecha.toISOString().split('T')[0];
  
  // Financiero
  const finInicio = document.getElementById('fin-fecha-inicio');
  const finFin = document.getElementById('fin-fecha-fin');
  if (finInicio) finInicio.value = formatoFecha(primerDiaMes);
  if (finFin) finFin.value = formatoFecha(hoy);
  
  // Operativo
  const opInicio = document.getElementById('op-fecha-inicio');
  const opFin = document.getElementById('op-fecha-fin');
  if (opInicio) opInicio.value = formatoFecha(primerDiaMes);
  if (opFin) opFin.value = formatoFecha(hoy);
}

function setupFieldValidation() {
  // Validar cuando cambien los campos de fechas
  ['fin-fecha-inicio', 'fin-fecha-fin'].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener('change', () => validateFields('financiero'));
    }
  });
  
  ['op-fecha-inicio', 'op-fecha-fin'].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener('change', () => validateFields('operativo'));
    }
  });
}

function validateFields(tipo) {
  let valido = false;
  
  if (tipo === 'financiero') {
    const inicio = document.getElementById('fin-fecha-inicio')?.value;
    const fin = document.getElementById('fin-fecha-fin')?.value;
    valido = inicio && fin;
  } else if (tipo === 'operativo') {
    const inicio = document.getElementById('op-fecha-inicio')?.value;
    const fin = document.getElementById('op-fecha-fin')?.value;
    valido = inicio && fin;
  }
  
  // Habilitar/deshabilitar botones de descarga
  const btnExcel = document.getElementById(`btn-excel-${tipo}`);
  const btnPDF = document.getElementById(`btn-pdf-${tipo}`);
  const btnDOCX = document.getElementById(`btn-docx-${tipo}`);
  
  if (reportesData[tipo]) {
    if (btnExcel) btnExcel.disabled = false;
    if (btnPDF) btnPDF.disabled = false;
    if (btnDOCX) btnDOCX.disabled = false;
  } else {
    if (btnExcel) btnExcel.disabled = true;
    if (btnPDF) btnPDF.disabled = true;
    if (btnDOCX) btnDOCX.disabled = true;
  }
  
  return valido;
}

// ==========================================
// GENERAR REPORTES
// ==========================================

async function generarReporte(tipo) {
  console.log(`📊 Generando reporte: ${tipo}`);
  
  let url, datos;
  
  if (tipo === 'financiero') {
    const fechaInicio = document.getElementById('fin-fecha-inicio')?.value;
    const fechaFin = document.getElementById('fin-fecha-fin')?.value;
    const metodoPago = document.getElementById('fin-metodo-pago')?.value;
    
    if (!fechaInicio || !fechaFin) {
      mostrarAlerta('Por favor complete las fechas', 'warning');
      return;
    }
    
    url = '/api/reportes-basicos/financiero';
    datos = { fechaInicio, fechaFin, metodoPago };
    
  } else if (tipo === 'operativo') {
    const fechaInicio = document.getElementById('op-fecha-inicio')?.value;
    const fechaFin = document.getElementById('op-fecha-fin')?.value;
    const estado = document.getElementById('op-estado')?.value;
    const odontologoId = document.getElementById('op-odontologo')?.value;
    
    if (!fechaInicio || !fechaFin) {
      mostrarAlerta('Por favor complete las fechas', 'warning');
      return;
    }
    
    url = '/api/reportes-basicos/citas-agendadas';
    datos = { fechaInicio, fechaFin, estado, odontologoId };
  }
  
  try {
    mostrarAlerta('Generando reporte...', 'info');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const resultado = await response.json();
    console.log('✅ Reporte generado:', resultado);
    
    // Guardar datos para exportación
    reportesData[tipo] = resultado;
    
    // Mostrar resultados
    mostrarResultados(tipo, resultado);
    
    // Habilitar botones de descarga
    validateFields(tipo);
    
    mostrarAlerta(`Reporte generado exitosamente: ${resultado.detalles?.length || 0} registros`, 'success');
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    mostrarAlerta('Error al generar el reporte: ' + error.message, 'danger');
  }
}

function mostrarResultados(tipo, resultado) {
  const contenedor = document.getElementById(`resultados-${tipo}`);
  if (!contenedor) return;
  
  let html = '';
  
  // Mostrar resumen
  if (resultado.resumen) {
    html += '<div class="card mb-3"><div class="card-body">';
    html += '<h5 class="card-title">Resumen</h5>';
    html += '<div class="row">';
    
    Object.entries(resultado.resumen).forEach(([key, value]) => {
      const label = formatLabel(key);
      const formatted = formatValue(key, value);
      html += `<div class="col-md-4"><strong>${label}:</strong> ${formatted}</div>`;
    });
    
    html += '</div></div></div>';
  }
  
  // Mostrar tabla de detalles
  if (resultado.detalles && resultado.detalles.length > 0) {
    html += '<div class="table-responsive">';
    html += '<table class="table table-striped table-bordered">';
    html += '<thead class="table-dark"><tr>';
    
    // Headers
    const headers = Object.keys(resultado.detalles[0]);
    headers.forEach(header => {
      html += `<th>${formatLabel(header)}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    // Rows
    resultado.detalles.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        html += `<td>${formatValue(header, row[header])}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
  } else {
    html += '<div class="alert alert-info">No se encontraron registros para el período seleccionado</div>';
  }
  
  contenedor.innerHTML = html;
}

function formatLabel(key) {
  const labels = {
    total: 'Total',
    totalTransacciones: 'Total Transacciones',
    ticketPromedio: 'Ticket Promedio',
    completadas: 'Completadas',
    programadas: 'Programadas',
    fecha: 'Fecha',
    concepto: 'Concepto',
    paciente: 'Paciente',
    metodoPago: 'Método de Pago',
    monto: 'Monto',
    estado: 'Estado',
    hora: 'Hora',
    odontologo: 'Odontólogo',
    tratamiento: 'Tratamiento'
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function formatValue(key, value) {
  if (value === null || value === undefined) return '-';
  
  if (key.includes('monto') || key.includes('total') || key.includes('Promedio')) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  }
  
  if (key.includes('fecha')) {
    return new Date(value).toLocaleDateString('es-CO');
  }
  
  return value;
}

function mostrarAlerta(mensaje, tipo = 'info') {
  // Usar SweetAlert si está disponible, si no, alert simple
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      text: mensaje,
      icon: tipo === 'danger' ? 'error' : tipo,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  } else {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }
}

// ==========================================
// EXPORTAR EXCEL
// ==========================================

async function descargarExcel(tipo) {
  if (!reportesData[tipo]) {
    mostrarAlerta('Primero debe generar el reporte', 'warning');
    return;
  }
  
  try {
    mostrarAlerta('Generando archivo Excel...', 'info');
    
    const response = await fetch(`/api/reportes-basicos/exportar-excel/${tipo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportesData[tipo])
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    mostrarAlerta('Excel descargado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error descargando Excel:', error);
    mostrarAlerta('Error al descargar Excel: ' + error.message, 'danger');
  }
}

// ==========================================
// EXPORTAR PDF
// ==========================================

async function descargarPDF(tipo) {
  if (!reportesData[tipo]) {
    mostrarAlerta('Primero debe generar el reporte', 'warning');
    return;
  }
  
  try {
    mostrarAlerta('Generando archivo PDF...', 'info');
    
    const response = await fetch(`/api/reportes-basicos/exportar-pdf/${tipo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportesData[tipo])
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    mostrarAlerta('PDF descargado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error descargando PDF:', error);
    mostrarAlerta('Error al descargar PDF: ' + error.message, 'danger');
  }
}

// ==========================================
// EXPORTAR DOCX
// ==========================================

async function descargarDOCX(tipo) {
  if (!reportesData[tipo]) {
    mostrarAlerta('Primero debe generar el reporte', 'warning');
    return;
  }
  
  try {
    mostrarAlerta('Generando archivo Word...', 'info');
    
    const response = await fetch(`/api/reportes-basicos/exportar-docx/${tipo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportesData[tipo])
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    mostrarAlerta('Word descargado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error descargando Word:', error);
    mostrarAlerta('Error al descargar Word: ' + error.message, 'danger');
  }
}
