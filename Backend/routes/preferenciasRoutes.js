const express = require('express');
const router = express.Router();
const preferenciasController = require('../controllers/preferenciasController');

/**
 * POST /api/preferencias
 * Guardar preferencias de notificaciones y ofertas de un usuario
 * Body: { usuario_id, acepta_notificaciones, acepta_ofertas, canales_preferidos }
 */
router.post('/', (req, res) => {
    console.log(' POST /api/preferencias - Guardar preferencias');
    preferenciasController.guardarPreferencias(req, res);
});

/**
 * GET /api/preferencias/:usuario_id
 * Obtener preferencias de un usuario específico
 */
router.get('/:usuario_id', (req, res) => {
    console.log(' GET /api/preferencias/:usuario_id - Obtener preferencias');
    preferenciasController.obtenerPreferencias(req, res);
});

/**
 * PUT /api/preferencias/:usuario_id
 * Actualizar preferencias de un usuario
 * Body: { acepta_notificaciones, acepta_ofertas, canales_preferidos }
 */
router.put('/:usuario_id', (req, res) => {
    console.log(' PUT /api/preferencias/:usuario_id - Actualizar preferencias');
    preferenciasController.actualizarPreferencias(req, res);
});

/**
 * GET /api/preferencias/estadisticas/general
 * Obtener estadísticas de consentimiento (admin only)
 */
router.get('/estadisticas/general', (req, res) => {
    console.log(' GET /api/preferencias/estadisticas - Obtener estadísticas');
    preferenciasController.obtenerEstadisticas(req, res);
});

console.log(' Rutas de preferencias de notificaciones configuradas');

module.exports = router;
