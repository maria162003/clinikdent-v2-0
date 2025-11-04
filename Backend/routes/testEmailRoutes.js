const express = require('express');
const router = express.Router();
const { crearPQRSTest } = require('../controllers/test-email/pqrsTestController');
const { crearContactoTest } = require('../controllers/test-email/contactoTestController');

// Información de la API de prueba
router.get('/', (req, res) => {
  res.json({
    message: '🧪 API de Prueba de Emails PQRS y Contacto',
    version: '1.0.0',
    modo: 'TEST - No afecta base de datos',
    endpoints: [
      'POST /pqrs - Enviar PQRS de prueba',
      'POST /contacto - Enviar contacto de prueba'
    ],
    nota: 'Estos endpoints SOLO envían emails y NO guardan datos en la base de datos'
  });
});

// Rutas de prueba
router.post('/pqrs', crearPQRSTest);
router.post('/contacto', crearContactoTest);

module.exports = router;
