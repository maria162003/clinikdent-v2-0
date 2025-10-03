const express = require('express');
const router = express.Router();
const pagosExtendidoController = require('../controllers/pagosExtendidoController');

console.log('🛣️ Configurando rutas de pagos extendido...');

// ==========================================
// RUTAS GENERALES PARA FACTURAS (ADMIN)
// ==========================================
router.get('/facturas', pagosExtendidoController.obtenerTodasFacturas);
router.post('/facturas', pagosExtendidoController.crearFactura);
router.get('/facturas/:id', pagosExtendidoController.obtenerFacturaPorId);
router.put('/facturas/:id', pagosExtendidoController.actualizarFactura);
router.delete('/facturas/:id', pagosExtendidoController.eliminarFactura);

// ==========================================
// RUTAS PARA ODONTÓLOGOS
// ==========================================
router.get('/odontologo/resumen-financiero', pagosExtendidoController.obtenerResumenFinancieroOdontologo);
router.get('/odontologo/comisiones', pagosExtendidoController.obtenerHistorialComisiones);
router.get('/odontologo/facturas', pagosExtendidoController.obtenerFacturasOdontologo);

// ==========================================
// RUTAS PARA PACIENTES
// ==========================================
router.get('/facturas/paciente', (req, res, next) => {
  console.log('🔍 [DEBUG] Ruta /facturas/paciente alcanzada');
  console.log('🔍 [DEBUG] Headers:', req.headers);
  console.log('🔍 [DEBUG] Query:', req.query);
  next();
}, pagosExtendidoController.obtenerFacturasPendientesPaciente);
router.get('/paciente/historial', pagosExtendidoController.obtenerHistorialPagosPaciente);
router.get('/paciente/facturas-pendientes', pagosExtendidoController.obtenerFacturasPendientesPaciente);
router.get('/metodos-pago', pagosExtendidoController.obtenerMetodosPagoPaciente);
router.post('/paciente/metodo-pago', pagosExtendidoController.agregarMetodoPago);
router.post('/paciente/procesar-pago', pagosExtendidoController.procesarPagoFactura);

console.log('✅ Rutas de pagos extendido configuradas');

module.exports = router;
