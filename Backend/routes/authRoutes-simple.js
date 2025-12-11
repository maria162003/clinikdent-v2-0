const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllerNew');

// Solo las rutas esenciales sin parámetros
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/recuperar', authController.recuperarPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/cambiar-password', authController.cambiarPassword);
router.put('/actualizar-perfil', authController.actualizarPerfil);

module.exports = router;
