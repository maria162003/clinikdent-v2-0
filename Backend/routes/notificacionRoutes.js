const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');

// Ruta básica para testing
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API de Notificaciones funcionando correctamente',
        endpoints_disponibles: [
            'GET /:usuario_id - Notificaciones por usuario',
            'POST / - Crear nueva notificación'
        ]
    });
});

router.get('/:usuario_id', notificacionController.obtenerNotificacionesPorUsuario);
router.post('/', notificacionController.crearNotificacion);

module.exports = router;
