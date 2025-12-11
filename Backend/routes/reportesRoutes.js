const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// Rutas de reportes legacy (compatibilidad)
router.get('/resumen', reportesController.obtenerResumenGeneral);
router.get('/ventas', reportesController.obtenerReporteVentas);
router.get('/pacientes', reportesController.obtenerReportePacientes);

// Nuevas rutas de reportes detallados
router.post('/financiero', reportesController.obtenerReporteFinanciero);
router.post('/citas-agendadas', reportesController.obtenerReporteCitasAgendadas);
router.post('/cancelaciones', reportesController.obtenerReporteCancelaciones);
router.post('/actividad-usuarios', reportesController.obtenerReporteActividadUsuarios);
router.post('/seguimiento-tratamientos', reportesController.obtenerReporteSeguimientoTratamientos);

// Ruta de exportación a Excel
router.post('/exportar-excel/:tipo', reportesController.exportarReporteExcel);

// Rutas de exportación a PDF y DOCX
router.post('/exportar-pdf/:tipo', reportesController.exportarReportePDF);
router.post('/exportar-docx/:tipo', reportesController.exportarReporteDOCX);

module.exports = router;
