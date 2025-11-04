const db = require('../config/db');

// GET /api/reportes/resumen
exports.obtenerResumenGeneral = async (req, res) => {
  try {
    console.log('📊 Obteniendo resumen general...');
    
    // Datos dummy para el resumen
    const resumen = {
      pacientes: {
        total: 156,
        nuevos_mes: 12,
        activos: 143
      },
      citas: {
        total_mes: 89,
        programadas: 34,
        completadas: 45,
        canceladas: 10
      },
      ingresos: {
        mes_actual: 2450000,
        mes_anterior: 2150000,
        porcentaje_cambio: 13.95
      },
      tratamientos: {
        en_progreso: 67,
        completados_mes: 23,
        pendientes: 15
      }
    };
    
    console.log('✅ Resumen general obtenido');
    return res.json(resumen);
  } catch (err) {
    console.error('❌ Error obteniendo resumen:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener resumen general',
      error: err.message 
    });
  }
};

// GET /api/reportes/ventas
exports.obtenerReporteVentas = async (req, res) => {
  try {
    console.log('💰 Obteniendo reporte de ventas...');
    
    const { fechaInicio, fechaFin } = req.query;
    
    // Datos dummy para el reporte de ventas
    const reporteVentas = {
      periodo: {
        inicio: fechaInicio || '2025-08-01',
        fin: fechaFin || '2025-08-31'
      },
      resumen: {
        total_ingresos: 3450000,
        total_transacciones: 156,
        ticket_promedio: 22115
      },
      por_tratamiento: [
        { nombre: 'Limpieza dental', cantidad: 45, total: 675000 },
        { nombre: 'Ortodoncia', cantidad: 12, total: 1200000 },
        { nombre: 'Endodoncia', cantidad: 23, total: 920000 },
        { nombre: 'Implantes', cantidad: 8, total: 640000 }
      ],
      por_dia: [
        { fecha: '2025-08-25', ingresos: 125000 },
        { fecha: '2025-08-24', ingresos: 89000 },
        { fecha: '2025-08-23', ingresos: 156000 },
        { fecha: '2025-08-22', ingresos: 78000 }
      ]
    };
    
    console.log('✅ Reporte de ventas obtenido');
    return res.json(reporteVentas);
  } catch (err) {
    console.error('❌ Error obteniendo reporte de ventas:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener reporte de ventas',
      error: err.message 
    });
  }
};

// GET /api/reportes/pacientes
exports.obtenerReportePacientes = async (req, res) => {
  try {
    console.log('👥 Obteniendo reporte de pacientes...');
    
    // Datos dummy para el reporte de pacientes
    const reportePacientes = {
      total_pacientes: 156,
      nuevos_registros: {
        mes_actual: 12,
        mes_anterior: 8,
        porcentaje_cambio: 50
      },
      por_edad: [
        { rango: '18-25', cantidad: 23 },
        { rango: '26-35', cantidad: 45 },
        { rango: '36-50', cantidad: 67 },
        { rango: '51-65', cantidad: 21 }
      ],
      por_tratamiento: [
        { tratamiento: 'Preventivo', pacientes: 89 },
        { tratamiento: 'Restaurativo', pacientes: 45 },
        { tratamiento: 'Ortodoncia', pacientes: 23 },
        { tratamiento: 'Cirugía', pacientes: 12 }
      ],
      frecuencia_visitas: {
        regulares: 78,
        ocasionales: 45,
        nuevos: 33
      }
    };
    
    console.log('✅ Reporte de pacientes obtenido');
    return res.json(reportePacientes);
  } catch (err) {
    console.error('❌ Error obteniendo reporte de pacientes:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener reporte de pacientes',
      error: err.message 
    });
  }
};

module.exports = exports;
