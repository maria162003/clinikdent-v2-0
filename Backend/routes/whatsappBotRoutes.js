/**
 * Rutas para integración con BotSailor (WhatsApp Bot)
 * Recibe webhooks desde BotSailor y registra contactos/citas en Supabase
 */

const express = require('express');
const router = express.Router();
const whatsappBotController = require('../controllers/whatsappBotController');

// Webhook para nuevos contactos desde WhatsApp
router.post('/nuevo-contacto', whatsappBotController.registrarNuevoContacto);

// Webhook para agendar citas desde WhatsApp
router.post('/agendar-cita', whatsappBotController.agendarCita);

// Webhook para consultar citas del paciente
router.post('/consultar-citas', whatsappBotController.consultarCitas);

// Webhook para registro completo de paciente
router.post('/registrar-paciente', whatsappBotController.registrarPacienteCompleto);

// Webhook para PQR/Soporte
router.post('/pqr', whatsappBotController.registrarPQR);

module.exports = router;
