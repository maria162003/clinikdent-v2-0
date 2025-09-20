const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

router.get('/', faqController.listarFaqs);
router.get('/estadisticas', faqController.obtenerEstadisticasFaqs);
router.post('/', faqController.crearFaq);

module.exports = router;
