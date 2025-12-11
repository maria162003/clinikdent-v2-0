const express = require('express');
const router = express.Router();
const mercadoPagoController = require('../controllers/mercadoPagoController');

// Información básica de la API
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de MercadoPago para Clinikdent',
        version: '1.0.0',
        endpoints: {
            crear_preferencia: 'POST /crear-preferencia',
            pagos_pacientes: 'POST /crear-pago-paciente',
            pagos_odontologos: 'POST /pagar-odontologo', 
            pagos_proveedores: 'POST /pagar-proveedor',
            webhook: 'POST /webhook',
            transacciones: 'GET /transacciones',
            datos_prueba: 'GET /datos-prueba'
        },
        testing: {
            sandbox: process.env.MERCADOPAGO_SANDBOX === 'true',
            entorno: 'Los pagos son simulados en modo prueba'
        }
    });
});

// Crear preferencia de pago básica
router.post('/crear-preferencia', mercadoPagoController.crearPreferencia);

// Crear pago para paciente (consultas/tratamientos)
router.post('/crear-pago-paciente', mercadoPagoController.crearPagoPaciente);

// Procesar pago de honorarios a odontólogo
router.post('/pagar-odontologo', mercadoPagoController.pagarOdontologo);

// Procesar pago a proveedor
router.post('/pagar-proveedor', mercadoPagoController.pagarProveedor);

// Webhook para notificaciones de MercadoPago
router.post('/webhook', mercadoPagoController.webhook);
router.post('/webhook-honorarios', mercadoPagoController.webhook);
router.post('/webhook-proveedores', mercadoPagoController.webhook);

// Consultar estado de un pago específico
router.get('/pago/:payment_id', mercadoPagoController.consultarPago);

// Obtener historial de transacciones
router.get('/transacciones', mercadoPagoController.obtenerTransacciones);

// Cancelar factura/transacción pendiente
router.delete('/cancelar-factura/:transaccionId', mercadoPagoController.cancelarFactura);

// Obtener datos de prueba para testing
router.get('/datos-prueba', mercadoPagoController.obtenerDatosPrueba);

module.exports = router;
