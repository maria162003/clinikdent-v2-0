/**
 * Rutas para Sistema de Reportes y Analytics
 * Endpoints para dashboards, KPIs, reportes programados y métricas
 */

const express = require('express');
const router = express.Router();
const reportesAnalyticsController = require('../controllers/reportesAnalyticsController');

console.log('🛣️ Configurando rutas de reportes y analytics...');

// ==========================================
// RUTAS DE MÉTRICAS Y DASHBOARDS
// ==========================================

// Obtener métricas principales del dashboard
router.get('/dashboard/metricas', reportesAnalyticsController.obtenerMetricasDashboard);

// Obtener dashboards personalizados del usuario
router.get('/dashboard/personalizados', reportesAnalyticsController.obtenerDashboardPersonalizado);

// Obtener dashboard específico por ID
router.get('/dashboard/personalizados/:dashboardId', reportesAnalyticsController.obtenerDashboardPersonalizado);

// Crear nuevo dashboard personalizado
router.post('/dashboard/personalizado', reportesAnalyticsController.crearDashboardPersonalizado);

// Actualizar dashboard personalizado
router.put('/dashboard/personalizado/:dashboardId', reportesAnalyticsController.actualizarDashboardPersonalizado);

// Eliminar dashboard personalizado
router.delete('/dashboard/personalizado/:dashboardId', reportesAnalyticsController.eliminarDashboardPersonalizado);

// ==========================================
// RUTAS DE KPIs PERSONALIZADOS
// ==========================================

// Obtener todos los KPIs personalizados
router.get('/kpis', reportesAnalyticsController.obtenerKPIsPersonalizados);

// Crear nuevo KPI personalizado
router.post('/kpi', reportesAnalyticsController.crearKPIPersonalizado);

// Actualizar KPI personalizado
router.put('/kpi/:kpiId', reportesAnalyticsController.actualizarKPIPersonalizado);

// Eliminar KPI personalizado
router.delete('/kpi/:kpiId', reportesAnalyticsController.eliminarKPIPersonalizado);

// Calcular valor actual de un KPI específico
router.get('/kpi/:kpiId/calcular', reportesAnalyticsController.calcularKPIEspecifico);

// ==========================================
// RUTAS DE REPORTES PROGRAMADOS
// ==========================================

// Obtener todos los reportes programados
router.get('/reportes-programados', reportesAnalyticsController.obtenerReportesProgramados);

// Crear nuevo reporte programado
router.post('/reporte-programado', reportesAnalyticsController.crearReporteProgramado);

// Actualizar reporte programado
router.put('/reporte-programado/:reporteId', reportesAnalyticsController.actualizarReporteProgramado);

// Eliminar reporte programado
router.delete('/reporte-programado/:reporteId', reportesAnalyticsController.eliminarReporteProgramado);

// Ejecutar reporte programado manualmente
router.post('/reporte-programado/:reporteId/ejecutar', reportesAnalyticsController.ejecutarReporteProgramado);

// ==========================================
// RUTAS DE HISTORIAL DE REPORTES
// ==========================================

// Obtener historial de reportes generados
router.get('/historial-reportes', reportesAnalyticsController.obtenerHistorialReportes);

// Descargar reporte específico
router.get('/reporte/:reporteId/descargar', reportesAnalyticsController.descargarReporte);

// Obtener detalles de reporte específico
router.get('/reporte/:reporteId', reportesAnalyticsController.obtenerDetallesReporte);

// ==========================================
// RUTAS DE ANALYTICS ESPECÍFICOS
// ==========================================

// Análisis de tendencias por período
router.get('/analytics/tendencias', reportesAnalyticsController.obtenerTendenciasAnalytics);

// Análisis comparativo entre períodos
router.get('/analytics/comparativo', reportesAnalyticsController.obtenerAnalisisComparativo);

// Predicciones y proyecciones
router.get('/analytics/predicciones', reportesAnalyticsController.obtenerPredicciones);

// Análisis de correlaciones entre métricas
router.get('/analytics/correlaciones', reportesAnalyticsController.obtenerCorrelaciones);

// ==========================================
// RUTAS DE ADMINISTRACIÓN DE MÉTRICAS (COMENTADAS TEMPORALMENTE)
// ==========================================

// TODO: Implementar las siguientes funciones en el controlador:
// - registrarMetrica
// - actualizarMetrica  
// - obtenerMetricasPorTipo
// - limpiarMetricasAntiguas

// Rutas comentadas hasta implementar funciones:
// router.post('/metrica', reportesAnalyticsController.registrarMetrica);
// router.put('/metrica/:metricaId', reportesAnalyticsController.actualizarMetrica);
// router.get('/metricas/:tipoMetrica', reportesAnalyticsController.obtenerMetricasPorTipo);
// router.delete('/metricas/limpiar', reportesAnalyticsController.limpiarMetricasAntiguas);

console.log('✅ Rutas de reportes y analytics configuradas');

module.exports = router;
