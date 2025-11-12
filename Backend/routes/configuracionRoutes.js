const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');

// Rutas de configuración del sistema
router.get('/publica', configuracionController.obtenerConfiguracionPublica); // GET /api/configuracion/publica (sin autenticación)
router.get('/', configuracionController.obtenerConfiguracion); // GET /api/configuracion
router.put('/', configuracionController.actualizarConfiguracion); // PUT /api/configuracion
router.get('/:clave', configuracionController.obtenerConfiguracionPorClave); // GET /api/configuracion/:clave

// Mantener compatibilidad con rutas antiguas
router.get('/sistema', configuracionController.obtenerConfiguracionSistema);

// Rutas de configuración de email (si existen)
if (configuracionController.obtenerConfiguracionEmail) {
  router.get('/email', configuracionController.obtenerConfiguracionEmail);
  router.post('/email', configuracionController.actualizarConfiguracionEmail);
  router.post('/email/test', configuracionController.probarConfiguracionEmail);
}

module.exports = router;
