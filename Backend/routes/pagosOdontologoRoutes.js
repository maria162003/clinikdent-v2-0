/**
 * RUTAS PARA PAGOS A ODONTÓLOGOS
 * Sistema manual de registro de pagos y comisiones
 */

const express = require('express');
const router = express.Router();
const pagosOdontologoController = require('../controllers/pagosOdontologoController');

console.log('🛣️ Configurando rutas de pagos a odontólogos...');

// ==========================================
// RUTAS PARA ODONTÓLOGOS (ver sus propios datos)
// ==========================================

// Obtener resumen financiero propio
router.get('/:id/resumen', pagosOdontologoController.obtenerResumenFinanciero);

// Obtener servicios pendientes de pago
router.get('/:id/pendientes', pagosOdontologoController.obtenerServiciosPendientes);

// Obtener historial de pagos recibidos
router.get('/:id/historial', pagosOdontologoController.obtenerHistorialPagos);

// ==========================================
// RUTAS PARA ADMINISTRADORES
// ==========================================

// Obtener resumen general de todos los odontólogos
router.get('/admin/resumen-general', pagosOdontologoController.obtenerResumenGeneral);

// Rutas específicas para el dashboard admin
router.get('/resumen', pagosOdontologoController.obtenerResumenGeneral);
router.get('/lista', pagosOdontologoController.obtenerListaOdontologos);

// Obtener detalle completo de un odontólogo específico
router.get('/detalle/:id', pagosOdontologoController.obtenerDetalleOdontologo);

// Registrar un pago a odontólogo (SOLO ADMIN)
router.post('/registrar', pagosOdontologoController.registrarPago);

// Registrar un pago simple desde dashboard admin
router.post('/registrar-simple', pagosOdontologoController.registrarPagoSimple);

// ==========================================
// RUTAS AUTOMÁTICAS (llamadas por el sistema)
// ==========================================

// Registrar comisión automáticamente al completar servicio
router.post('/registrar-comision', pagosOdontologoController.registrarComision);

console.log('✅ Rutas de pagos a odontólogos configuradas');

module.exports = router;