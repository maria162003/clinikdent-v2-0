const express = require('express');
const router = express.Router();
const actividadController = require('../controllers/actividadController');

// Rutas para el registro de actividad
router.post('/', actividadController.registrarActividad);
router.get('/', actividadController.obtenerActividades);

module.exports = router;
