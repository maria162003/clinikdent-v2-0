const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllerNew');

console.log('🔍 AuthController funciones disponibles:', Object.keys(authController));

router.post('/recuperar', (req, res) => {
  console.log('📨 Ruta /recuperar llamada');
  authController.recuperarPassword(req, res);
});

router.post('/login', (req, res) => {
  console.log('🔐 Ruta /login llamada');
  authController.loginUser(req, res);
});

router.post('/cambiar-password', (req, res) => {
  console.log('🔑 Ruta /cambiar-password llamada');
  authController.cambiarPassword(req, res);
});

router.put('/actualizar-perfil', (req, res) => {
  console.log('👤 Ruta /actualizar-perfil llamada');
  authController.actualizarPerfil(req, res);
});

module.exports = router;
