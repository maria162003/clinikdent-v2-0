const express = require('express');
const router = express.Router();
const {
  crearPQRS,
  obtenerPQRSporUsuario,
  obtenerTodosPQRS,
  responderPQRS,
  actualizarEstadoPQRS,
  consultarPorRadicado
} = require('../controllers/pqrsController');

router.post('/', (req, res, next) => {
  console.log('>> BODY /api/pqrs:', req.body); // DEBUG
  next();
}, crearPQRS);


// Rutas públicas
// (handled above with debug middleware)
router.get('/consultar/:numero_radicado', consultarPorRadicado); // Consultar por número de radicado

// Rutas para usuarios autenticados
router.get('/usuario/:usuario_id', obtenerPQRSporUsuario); // PQRS por usuario

// Rutas para administradores
router.get('/', obtenerTodosPQRS); // Todos los PQRS (admin)
router.put('/:id/responder', responderPQRS); // Responder PQRS
router.put('/:id/estado', actualizarEstadoPQRS); // Actualizar estado

module.exports = router;
