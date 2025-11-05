const express = require('express');
const router = express.Router();
const evaluacionesController = require('../controllers/evaluacionesController');

console.log('🛣️ Configurando rutas de evaluaciones...');

// Rutas para administradores
router.get('/admin/todas', evaluacionesController.obtenerTodasEvaluaciones);
router.get('/estadisticas', evaluacionesController.obtenerEstadisticasEvaluaciones);
router.put('/:id', evaluacionesController.actualizarEvaluacion);

// Rutas para odontólogos
router.get('/odontologo/:odontologoId', evaluacionesController.obtenerEvaluacionesOdontologo);
router.get('/odontologo', evaluacionesController.obtenerEvaluacionesOdontologo);

// Rutas para pacientes
router.get('/paciente/:pacienteId', evaluacionesController.obtenerEvaluacionesPaciente);
router.get('/paciente', evaluacionesController.obtenerEvaluacionesPaciente);
router.get('/pendientes', evaluacionesController.obtenerCitasPendientesEvaluacion);
router.post('/crear', evaluacionesController.crearEvaluacion);

console.log('✅ Rutas de evaluaciones configuradas');

module.exports = router;
