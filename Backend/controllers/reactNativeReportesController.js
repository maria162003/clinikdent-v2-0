const db = require('../config/databaseSecure');
const ExcelJS = require('exceljs');
const emailService = require('../services/emailService');

/**
 * POST /api/react-native-reportes/financiero
 * Genera reporte financiero y lo envía por email
 */
exports.generarReporteFinanciero = async (req, res) => {
  let client = null;
  
  try {
    console.log('📊 ========================================');
    console.log('📊 GENERANDO REPORTE FINANCIERO');
    console.log('📊 Body recibido:', JSON.stringify(req.body, null, 2));
    
    const { fechaInicio, fechaFin, email, pacienteId } = req.body;
    
    // Validar fechas
    const inicio = fechaInicio || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const fin = fechaFin || new Date().toISOString().split('T')[0];
    
    console.log('📊 Período:', { inicio, fin, email, pacienteId });
    
    // Obtener conexión
    const dbConnection = await db.getConnection();
    client = dbConnection.client;
    
    // Consultar datos financieros de la BD
    let query = `
      SELECT 
        c.fecha::date as fecha,
        TO_CHAR(c.fecha, 'DD/MM/YYYY') as fecha_formateada,
        COALESCE(c.motivo, 'Consulta Odontológica') as concepto,
        CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) as paciente,
        u.correo as paciente_correo,
        u.telefono as paciente_telefono,
        COALESCE(c.notas, 'Sin notas') as notas,
        c.estado,
        c.hora,
        c.id,
        c.paciente_id
      FROM citas c
      INNER JOIN usuarios u ON c.paciente_id = u.id
      WHERE c.fecha::date BETWEEN $1 AND $2
    `;
    
    const params = [inicio, fin];
    
    // Si hay pacienteId, filtrar por ese paciente
    if (pacienteId) {
      query += ` AND c.paciente_id = $3`;
      params.push(pacienteId);
    }
    
    query += ` ORDER BY c.fecha DESC LIMIT 100`;
    
    console.log('📊 Query SQL:', query);
    console.log('📊 Parámetros:', params);
    
    const result = await client.query(query, params);
    const citas = result.rows;
    
    console.log('📊 Registros encontrados:', citas.length);
    console.log('📊 Primeros 3 registros:', JSON.stringify(citas.slice(0, 3), null, 2));
    
    // Crear workbook de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clinikdent Mobile App';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Reporte Financiero');
    
    // Título
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '🦷 CLINIKDENT - Reporte Financiero';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1976d2' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Período
    worksheet.mergeCells('A2:E2');
    const periodoCell = worksheet.getCell('A2');
    periodoCell.value = `Período: ${inicio} al ${fin}`;
    periodoCell.font = { bold: true, size: 12 };
    periodoCell.alignment = { horizontal: 'center' };
    
    worksheet.getRow(3).values = [''];
    
    // Encabezados
    worksheet.getRow(4).values = ['Fecha', 'Concepto', 'Paciente', 'Estado', 'Notas'];
    worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976d2' }
    };
    
    // Datos
    citas.forEach((cita, index) => {
      worksheet.getRow(5 + index).values = [
        cita.fecha,
        cita.concepto,
        cita.paciente,
        cita.estado,
        cita.notas
      ];
    });
    
    // Ajustar anchos
    worksheet.columns = [
      { width: 12 },
      { width: 25 },
      { width: 30 },
      { width: 15 },
      { width: 35 }
    ];
    
    // Resumen
    const resumenRow = 5 + citas.length + 1;
    worksheet.mergeCells(`A${resumenRow}:B${resumenRow}`);
    const resumenCell = worksheet.getCell(`A${resumenRow}`);
    resumenCell.value = 'Total de registros:';
    resumenCell.font = { bold: true };
    worksheet.getCell(`C${resumenRow}`).value = citas.length;
    worksheet.getCell(`C${resumenRow}`).font = { bold: true };
    
    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Enviar por email si se proporciona
    let emailEnviado = false;
    if (email) {
      try {
        const attachments = [{
          filename: `reporte_financiero_${inicio}_${fin}.xlsx`,
          content: buffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }];

        await emailService.sendEmail(
          email,
          `Reporte Financiero Clinikdent ${inicio} - ${fin}`,
          `
            <h2>🦷 Reporte Financiero Generado</h2>
            <p>Se ha generado tu reporte financiero del período ${inicio} al ${fin}.</p>
            <p><strong>Total de registros:</strong> ${citas.length}</p>
            <p>El archivo Excel está adjunto a este correo.</p>
            <br/>
            <p style="color: #666;">Generado desde Clinikdent Mobile App</p>
          `,
          attachments
        );
        emailEnviado = true;
        console.log('✅ Email enviado exitosamente a:', email);
      } catch (emailErr) {
        console.warn('⚠️ No se pudo enviar email:', emailErr.message);
      }
    } else {
      console.log('ℹ️ No se proporcionó email, se retornará el archivo Excel');
    }
    
    // Liberar conexión
    await dbConnection.release();
    
    console.log('📊 Retornando JSON completo con', citas.length, 'registros');
    
    // Si NO hay email, retornar archivo Excel para descarga
    if (!email) {
      console.log('📊 SIN EMAIL - Retornando archivo Excel para descarga directa');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_financiero_${inicio}_${fin}.xlsx`);
      return res.send(buffer);
    }
    
    // Si hay email, enviar Excel por correo Y retornar JSON con datos
    return res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      consultaBD: {
        timestamp: new Date().toISOString(),
        servidor: 'PostgreSQL Supabase',
        tabla: 'citas JOIN usuarios',
        registrosEncontrados: citas.length
      },
      data: {
        registros: citas.length,
        fechaInicio: inicio,
        fechaFin: fin,
        pacienteId: pacienteId || null,
        emailEnviado,
        destinatario: email || null,
        citasCompletas: citas,
        preview: citas.slice(0, 10)
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO EN REPORTE:', error);
    console.error('❌ Stack:', error.stack);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
        client.release();
      } catch (releaseErr) {
        console.error('Error liberando conexión:', releaseErr);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};

/**
 * POST /api/react-native-reportes/citas
 * Genera reporte de citas y lo envía por email
 */
exports.generarReporteCitas = async (req, res) => {
  let client = null;
  
  try {
    console.log('📅 Generando reporte de citas desde React Native...');
    const { fechaInicio, fechaFin, email, pacienteId } = req.body;
    
    const inicio = fechaInicio || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const fin = fechaFin || new Date().toISOString().split('T')[0];
    
    const dbConnection = await db.getConnection();
    client = dbConnection.client;
    
    // Query con filtro opcional de paciente
    let query = `
      SELECT 
        c.id,
        c.fecha::date as fecha,
        c.hora,
        CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) as paciente,
        COALESCE(c.motivo, 'Consulta general') as motivo,
        c.estado,
        c.notas
      FROM citas c
      INNER JOIN usuarios u ON c.paciente_id = u.id
      WHERE c.fecha::date BETWEEN $1 AND $2
    `;
    
    const params = [inicio, fin];
    
    if (pacienteId) {
      query += ` AND c.paciente_id = $3`;
      params.push(pacienteId);
    }
    
    query += ` ORDER BY c.fecha DESC, c.hora DESC LIMIT 100`;
    
    const result = await client.query(query, params);
    const citas = result.rows;
    
    // Estadísticas
    const stats = {
      total: citas.length,
      confirmadas: citas.filter(c => c.estado === 'confirmada').length,
      completadas: citas.filter(c => c.estado === 'completada').length,
      canceladas: citas.filter(c => c.estado === 'cancelada').length,
      pendientes: citas.filter(c => c.estado === 'pendiente').length
    };
    
    await dbConnection.release();
    
    return res.json({
      success: true,
      message: 'Reporte de citas generado',
      data: {
        registros: citas.length,
        fechaInicio: inicio,
        fechaFin: fin,
        estadisticas: stats,
        citas: citas.slice(0, 10), // Primeras 10 para preview
        emailEnviado: false // Implementar si necesitas
      }
    });
    
  } catch (error) {
    console.error('❌ Error generando reporte de citas:', error);
    
    if (client) {
      try {
        client.release();
      } catch (releaseErr) {
        console.error('Error liberando conexión:', releaseErr);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error al generar reporte de citas',
      error: error.message
    });
  }
};

module.exports = exports;
