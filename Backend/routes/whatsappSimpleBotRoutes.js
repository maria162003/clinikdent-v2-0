/**
 * Rutas simples para WhatsApp Bot
 * Versión standalone sin BotSailor
 */

const express = require('express');
const router = express.Router();
const whatsappBot = require('../controllers/whatsappSimpleBotController');

// Endpoint principal - recibe cualquier mensaje y responde automáticamente
router.post('/mensaje', whatsappBot.recibirMensaje);

// Endpoint de contacto (compatible con webhook anterior)
router.post('/contacto', whatsappBot.registrarContacto);

module.exports = router;
