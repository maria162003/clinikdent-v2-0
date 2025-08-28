const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

// Rutas específicas primero (antes de las generales)
router.post('/registro', pagoController.registrarPago);      // POST /api/pagos/registro - Registro por cita
router.get('/paciente/:id', pagoController.pagosPorPaciente); // GET /api/pagos/paciente/:id - Pagos por paciente

// Rutas para administradores (más generales al final)
router.get('/:id', pagoController.obtenerDetallePago);       // GET /api/pagos/:id - Detalles de un pago
router.get('/', pagoController.obtenerTodosPagos);           // GET /api/pagos - Obtener todos los pagos
router.post('/', pagoController.crearPago);                  // POST /api/pagos - Crear nuevo pago

module.exports = router;
