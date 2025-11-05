const express = require('express');
const router = express.Router();
const { obtenerHistorialPorPaciente, registrarHistorial, obtenerHistorialPorId, actualizarHistorial, eliminarHistorial } = require('../controllers/historialController');

// Rutas para historial clínico
router.get('/paciente/:paciente_id', obtenerHistorialPorPaciente); // Obtener historial por paciente
router.get('/:id', obtenerHistorialPorId); // Obtener un historial específico por ID
router.post('/', registrarHistorial); // Crear nuevo historial
router.put('/:id', actualizarHistorial); // Actualizar historial existente
router.delete('/:id', eliminarHistorial); // Eliminar historial

module.exports = router;
