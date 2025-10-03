const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');

// Rutas de configuración del sistema
router.get('/sistema', configuracionController.obtenerConfiguracionSistema);
router.post('/sistema', configuracionController.actualizarConfiguracionSistema);

// Rutas de configuración de email
router.get('/email', configuracionController.obtenerConfiguracionEmail);
router.post('/email', configuracionController.actualizarConfiguracionEmail);
router.post('/email/test', configuracionController.probarConfiguracionEmail);

module.exports = router;
