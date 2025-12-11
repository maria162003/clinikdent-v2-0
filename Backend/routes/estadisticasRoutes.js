/**
 * Rutas de Estadísticas y Reportes - Clinik Dent
 */

const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticasController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas principales de estadísticas
router.get('/metricas-principales', estadisticasController.obtenerMetricasPrincipales);
router.get('/ingresos-grafico', estadisticasController.obtenerIngresosGrafico);
router.get('/tratamientos-distribucion', estadisticasController.obtenerDistribucionTratamientos);
router.get('/citas-estadisticas', estadisticasController.obtenerEstadisticasCitas);
router.get('/sedes-rendimiento', estadisticasController.obtenerRendimientoSedes);
router.get('/top-tratamientos', estadisticasController.obtenerTopTratamientos);

// Rutas para reportes personalizados
router.post('/reporte-personalizado', estadisticasController.generarReportePersonalizado);

module.exports = router;