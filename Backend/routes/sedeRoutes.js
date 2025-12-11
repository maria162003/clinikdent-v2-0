// Backend/routes/sedeRoutes.js
const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sedeController');

// Obtener todas las sedes
router.get('/', sedeController.obtenerSedes);

// Obtener sede por ID
router.get('/:id', sedeController.obtenerSedePorId);

// Crear nueva sede
router.post('/', sedeController.crearSede);

// Actualizar sede
router.put('/:id', sedeController.actualizarSede);

// Eliminar sede
router.delete('/:id', sedeController.eliminarSede);

module.exports = router;
