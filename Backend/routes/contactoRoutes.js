const express = require('express');
const router = express.Router();
const {
  crearContacto,
  obtenerContactos,
  marcarComoRespondido,
  eliminarContacto
} = require('../controllers/contactoController');

// Ruta pública para crear contacto
router.post('/', crearContacto);

// Rutas protegidas para administración (requieren autenticación)
router.get('/', obtenerContactos); // Obtener todos los contactos
router.put('/:id/responder', marcarComoRespondido); // Marcar como respondido
router.delete('/:id', eliminarContacto); // Eliminar contacto

module.exports = router;
