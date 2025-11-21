/**
 * 🟢 WHATSAPP ROUTES - CLINIKDENT
 * Rutas para integración con WhatsApp Business API
 */

const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

console.log('🟢 Configurando rutas de WhatsApp...');

// Webhook para recibir mensajes de WhatsApp (Twilio)
// POST /api/whatsapp/webhook
router.post('/webhook', whatsappController.receiveWhatsAppMessage);

// Enviar mensaje individual
// POST /api/whatsapp/send
router.post('/send', whatsappController.sendWhatsAppMessage);

// Enviar recordatorio de cita
// POST /api/whatsapp/reminder
router.post('/reminder', whatsappController.sendAppointmentReminder);

// Obtener historial de conversación
// GET /api/whatsapp/history?phoneNumber=+573001234567
router.get('/history', whatsappController.getWhatsAppHistory);

// Test de conectividad
// GET /api/whatsapp/test
router.get('/test', whatsappController.testWhatsApp);

console.log('✅ Rutas de WhatsApp configuradas');

module.exports = router;
