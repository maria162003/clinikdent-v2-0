const express = require('express');
const router = express.Router();
const chatInteligentController = require('../controllers/chatInteligentController');

console.log('🤖 Configurando rutas del chatbot inteligente...');

// Ruta principal del chatbot inteligente
router.post('/intelligent', chatInteligentController.chatInteligente);

// Ruta de prueba del chatbot
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot inteligente funcionando correctamente',
    endpoints: [
      'POST /api/chat/intelligent - Chatbot con Groq AI'
    ],
    requiere: [
      'GROQ_API_KEY en .env',
      'Base de datos configurada',
      'Email service configurado'
    ]
  });
});

console.log('✅ Rutas del chatbot inteligente configuradas');

module.exports = router;