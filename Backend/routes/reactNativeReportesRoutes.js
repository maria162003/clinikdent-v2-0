const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reactNativeReportesController');

/**
 * Rutas de reportes para React Native
 * Prefix: /api/react-native-reportes
 */

// POST /api/react-native-reportes/financiero
router.post('/financiero', reportesController.generarReporteFinanciero);

// POST /api/react-native-reportes/citas
router.post('/citas', reportesController.generarReporteCitas);

module.exports = router;
