const express = require('express');
const router = express.Router();
const tratamientoController = require('../controllers/tratamientoController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas para tipos de tratamientos (no requieren autenticación específica)
router.get('/', tratamientoController.listarTratamientos);
router.post('/', tratamientoController.crearTratamiento);

// Rutas que requieren autenticación
router.post('/asignar', authMiddleware, tratamientoController.asignarTratamientoAPaciente);
router.get('/paciente/:id', tratamientoController.tratamientosPorPaciente);
router.get('/odontologo', authMiddleware, tratamientoController.tratamientosPorOdontologo);
router.get('/paciente-tratamiento/:id', tratamientoController.obtenerTratamientoPaciente);
router.put('/paciente-tratamiento/:id', tratamientoController.actualizarTratamientoPaciente);
router.delete('/paciente-tratamiento/:id', tratamientoController.eliminarTratamientoPaciente);

module.exports = router;
