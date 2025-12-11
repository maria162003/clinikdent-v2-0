const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Ruta básica para testing
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API de Chat funcionando correctamente',
        endpoints_disponibles: [
            'POST /enviar - Enviar mensaje',
            'GET /conversacion/:remitente_id/:destinatario_id - Ver conversación',
            'POST /bot/interaccion - Interacción con bot',
            'GET /bot/estadisticas - Stats del bot'
        ]
    });
});

// Rutas del chat de soporte
router.post('/enviar', chatController.enviarMensaje);
router.get('/conversacion/:remitente_id/:destinatario_id', chatController.obtenerConversacion);

// Rutas específicas del bot de soporte
router.post('/bot/interaccion', chatController.guardarInteraccionBot);
router.get('/bot/estadisticas', chatController.obtenerEstadisticasBot);

console.log('✅ Rutas de chat cargadas exitosamente');

module.exports = router;
