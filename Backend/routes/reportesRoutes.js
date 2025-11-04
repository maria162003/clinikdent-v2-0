const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

// Rutas de reportes
router.get('/resumen', reportesController.obtenerResumenGeneral);
router.get('/ventas', reportesController.obtenerReporteVentas);
router.get('/pacientes', reportesController.obtenerReportePacientes);

module.exports = router;
