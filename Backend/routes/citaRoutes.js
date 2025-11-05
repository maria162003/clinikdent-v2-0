const express = require('express');
const router = express.Router();
const basicAuth = require('../middleware/authMiddleware');
const citaController = require('../controllers/citaController');

// Ruta básica para testing
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API de Citas funcionando correctamente',
        endpoints_disponibles: [
            'GET /admin/todas - Todas las citas',
            'GET /admin/proximas - Citas próximas',
            'GET /admin/hoy - Citas de hoy',
            'POST / - Agendar nueva cita',
            'GET /:id_usuario - Citas por usuario'
        ]
    });
});

// Obtener todas las citas para administrador
router.get('/admin/todas', citaController.obtenerTodasLasCitas);
// Obtener citas próximas para administrador
router.get('/admin/proximas', citaController.obtenerCitasProximas);
// Obtener citas de hoy
router.get('/admin/hoy', citaController.obtenerCitasHoy);
// Obtener historial general de cambios
router.get('/admin/historial-general', citaController.obtenerHistorialGeneral);
// Obtener citas específicas de un odontólogo
router.get('/odontologo/:odontologo_id', citaController.obtenerCitasPorOdontologo);
// Obtener agenda de odontólogo (ruta específica)
router.get('/agenda/odontologo', (req, res) => {
    // Manualmente asignar el rol para esta ruta específica
    req.params.rol = 'odontologo';
    citaController.obtenerAgendaPorRol(req, res);
});
// Obtener historial de una cita específica
router.get('/:id_cita/historial', citaController.obtenerHistorialCita);
// Agendar cita
router.post('/', citaController.agendarCita);
// Ver citas por usuario
router.get('/:id_usuario', citaController.obtenerCitasPorUsuario);
// Reagendar cita
router.put('/:id_cita', citaController.reagendarCita);
// Actualizar estado de cita (protegido: requiere usuario para validar permisos)
router.patch('/:id_cita', basicAuth, citaController.actualizarEstadoCita);
// Reasignar odontólogo a una cita
router.patch('/:id_cita/reasignar', citaController.reasignarOdontologo);
// Cancelar cita (cambiar estado)
router.delete('/:id_cita', citaController.cancelarCita);
// Eliminar cita completamente
router.delete('/:id_cita/eliminar', citaController.eliminarCita);
// Panel de agenda (por rol) - DEBE IR DESPUÉS de rutas específicas
router.get('/agenda/:rol', citaController.obtenerAgendaPorRol);

module.exports = router;
