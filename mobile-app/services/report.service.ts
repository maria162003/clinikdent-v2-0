/**
 * ============================================================================
 * SERVICIO DE REPORTES
 * Generación de reportes en PDF para pacientes, citas y tratamientos
 * ============================================================================
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getPacientes, getCitas, getTratamientos, type Usuario, type Cita, type Tratamiento } from './database.service';

// Estilos CSS para los reportes
const reportStyles = `
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin: -20px -20px 20px -20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    h2 {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
      color: #667eea;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #e8e8e8;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    .stat-box {
      background: #f8f9fa;
      padding: 15px 25px;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #667eea;
    }
    .stat-box h3 {
      margin: 0;
      color: #667eea;
      font-size: 28px;
    }
    .stat-box p {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 12px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 11px;
      color: #666;
    }
    .status-programada { color: #ffc107; font-weight: bold; }
    .status-confirmada { color: #28a745; font-weight: bold; }
    .status-completada { color: #17a2b8; font-weight: bold; }
    .status-cancelada { color: #dc3545; font-weight: bold; }
  </style>
`;

/**
 * Generar reporte de pacientes en PDF
 */
export async function generarReportePacientes(): Promise<{ success: boolean; message: string; uri?: string }> {
  try {
    console.log('📄 Generando reporte de pacientes...');
    
    // Obtener datos de pacientes
    const pacientes = await getPacientes();
    
    if (pacientes.length === 0) {
      return { success: false, message: 'No hay pacientes para generar el reporte' };
    }

    // Generar HTML del reporte
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${reportStyles}
      </head>
      <body>
        <div class="header">
          <h1>🦷 Clinikdent</h1>
          <p>Reporte de Pacientes</p>
          <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <h3>${pacientes.length}</h3>
            <p>Total Pacientes</p>
          </div>
          <div class="stat-box">
            <h3>${pacientes.filter(p => p.activo !== false).length}</h3>
            <p>Activos</p>
          </div>
        </div>

        <h2>📋 Lista de Pacientes</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Documento</th>
            </tr>
          </thead>
          <tbody>
            ${pacientes.map((p: Usuario) => `
              <tr>
                <td>${p.id}</td>
                <td>${p.nombre} ${p.apellido || ''}</td>
                <td>${p.correo || '-'}</td>
                <td>${p.telefono || '-'}</td>
                <td>${p.tipo_documento ? `${p.tipo_documento}: ${p.numero_documento}` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Este reporte fue generado automáticamente por Clinikdent Mobile</p>
          <p>© ${new Date().getFullYear()} Clinikdent - Sistema de Gestión Odontológica</p>
        </div>
      </body>
      </html>
    `;

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ html });
    console.log('✅ PDF generado:', uri);

    // Compartir el archivo
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte de Pacientes',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, message: 'Reporte generado exitosamente', uri };
  } catch (error) {
    console.error('❌ Error generando reporte de pacientes:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Generar reporte de citas en PDF
 */
export async function generarReporteCitas(
  fechaInicio?: string,
  fechaFin?: string
): Promise<{ success: boolean; message: string; uri?: string }> {
  try {
    console.log('📄 Generando reporte de citas...');
    console.log('   Período:', fechaInicio || 'inicio', '-', fechaFin || 'actual');
    
    // Obtener datos de citas
    let citas = await getCitas();
    
    // Filtrar por fechas si se especifican
    if (fechaInicio) {
      citas = citas.filter(c => c.fecha >= fechaInicio);
    }
    if (fechaFin) {
      citas = citas.filter(c => c.fecha <= fechaFin);
    }

    if (citas.length === 0) {
      return { success: false, message: 'No hay citas para el período seleccionado' };
    }

    // Calcular estadísticas
    const estadisticas = {
      total: citas.length,
      programadas: citas.filter(c => c.estado === 'programada').length,
      confirmadas: citas.filter(c => c.estado === 'confirmada').length,
      completadas: citas.filter(c => c.estado === 'completada').length,
      canceladas: citas.filter(c => c.estado === 'cancelada').length,
    };

    // Generar HTML del reporte
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${reportStyles}
      </head>
      <body>
        <div class="header">
          <h1>🦷 Clinikdent</h1>
          <p>Reporte de Citas</p>
          <p>${fechaInicio && fechaFin ? `Período: ${fechaInicio} - ${fechaFin}` : 'Todas las citas'}</p>
          <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <h3>${estadisticas.total}</h3>
            <p>Total</p>
          </div>
          <div class="stat-box">
            <h3>${estadisticas.confirmadas}</h3>
            <p>Confirmadas</p>
          </div>
          <div class="stat-box">
            <h3>${estadisticas.completadas}</h3>
            <p>Completadas</p>
          </div>
          <div class="stat-box">
            <h3>${estadisticas.canceladas}</h3>
            <p>Canceladas</p>
          </div>
        </div>

        <h2>📅 Lista de Citas</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Odontólogo</th>
              <th>Motivo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${citas.map((c: Cita) => `
              <tr>
                <td>${new Date(c.fecha).toLocaleDateString('es-ES')}</td>
                <td>${c.hora}</td>
                <td>${c.paciente_nombre || ''} ${c.paciente_apellido || ''}</td>
                <td>${c.odontologo_nombre || ''} ${c.odontologo_apellido || ''}</td>
                <td>${c.motivo || '-'}</td>
                <td class="status-${c.estado}">${c.estado}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Este reporte fue generado automáticamente por Clinikdent Mobile</p>
          <p>© ${new Date().getFullYear()} Clinikdent - Sistema de Gestión Odontológica</p>
        </div>
      </body>
      </html>
    `;

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ html });
    console.log('✅ PDF generado:', uri);

    // Compartir el archivo
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte de Citas',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, message: 'Reporte generado exitosamente', uri };
  } catch (error) {
    console.error('❌ Error generando reporte de citas:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Generar reporte de tratamientos en PDF
 */
export async function generarReporteTratamientos(): Promise<{ success: boolean; message: string; uri?: string }> {
  try {
    console.log('📄 Generando reporte de tratamientos...');
    
    // Obtener datos de tratamientos
    const tratamientos = await getTratamientos();
    
    if (tratamientos.length === 0) {
      return { success: false, message: 'No hay tratamientos para generar el reporte' };
    }

    // Calcular total de costos
    const totalCostos = tratamientos.reduce((sum, t) => sum + (t.costo_estimado || 0), 0);

    // Generar HTML del reporte
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${reportStyles}
      </head>
      <body>
        <div class="header">
          <h1>🦷 Clinikdent</h1>
          <p>Catálogo de Tratamientos</p>
          <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <h3>${tratamientos.length}</h3>
            <p>Tratamientos Disponibles</p>
          </div>
          <div class="stat-box">
            <h3>$${totalCostos.toLocaleString('es-CO')}</h3>
            <p>Suma Total Catálogo</p>
          </div>
        </div>

        <h2>💊 Lista de Tratamientos</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Costo Estimado</th>
            </tr>
          </thead>
          <tbody>
            ${tratamientos.map((t: Tratamiento) => `
              <tr>
                <td>${t.id}</td>
                <td><strong>${t.nombre}</strong></td>
                <td>${t.descripcion || '-'}</td>
                <td>$${(t.costo_estimado || 0).toLocaleString('es-CO')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Los precios son estimados y pueden variar según el caso específico del paciente</p>
          <p>© ${new Date().getFullYear()} Clinikdent - Sistema de Gestión Odontológica</p>
        </div>
      </body>
      </html>
    `;

    // Generar PDF
    const { uri } = await Print.printToFileAsync({ html });
    console.log('✅ PDF generado:', uri);

    // Compartir el archivo
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte de Tratamientos',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, message: 'Reporte generado exitosamente', uri };
  } catch (error) {
    console.error('❌ Error generando reporte de tratamientos:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Verificar si el compartir está disponible en el dispositivo
 */
export async function verificarCompartirDisponible(): Promise<boolean> {
  return await Sharing.isAvailableAsync();
}
