/**
 * Rutas para Sistema de Comunicaciones y Notificaciones
 * Endpoints para chat, notificaciones, recordatorios y comunicaciones familiares
 */

const express = require('express');
const router = express.Router();
const comunicacionesController = require('../controllers/comunicacionesController');

console.log('🛣️ Configurando rutas de comunicaciones...');

// ==========================================
// RUTAS DE CHAT Y MENSAJERÍA
// ==========================================

// Obtener conversaciones del usuario
router.get('/conversaciones', comunicacionesController.obtenerConversaciones);

// Obtener mensajes de una conversación específica
router.get('/conversacion/:conversacionId/mensajes', comunicacionesController.obtenerMensajesConversacion);

// Enviar nuevo mensaje
router.post('/mensaje', comunicacionesController.enviarMensaje);

// Marcar mensajes como leídos
router.put('/conversacion/:conversacionId/marcar-leidos', comunicacionesController.marcarMensajesLeidos);

// Buscar usuarios para iniciar conversación
router.get('/usuarios/buscar', comunicacionesController.buscarUsuarios);

// Obtener información de contacto
router.get('/contacto/:usuarioId', comunicacionesController.obtenerInfoContacto);

// ==========================================
// RUTAS DE CONFIGURACIÓN DE NOTIFICACIONES
// ==========================================

// Obtener configuración actual de notificaciones
router.get('/notificaciones/configuracion', comunicacionesController.obtenerConfiguracionNotificaciones);

// Actualizar configuración de notificaciones
router.put('/notificaciones/configuracion', comunicacionesController.actualizarConfiguracionNotificaciones);

// Obtener historial de notificaciones
router.get('/notificaciones/historial', comunicacionesController.obtenerHistorialNotificaciones);

// Marcar notificación como leída
router.put('/notificacion/:notificacionId/leer', comunicacionesController.marcarNotificacionLeida);

// Obtener notificaciones no leídas
router.get('/notificaciones/no-leidas', comunicacionesController.obtenerNotificacionesNoLeidas);

// ==========================================
// RUTAS DE PLANTILLAS DE NOTIFICACIONES
// ==========================================

// Obtener plantillas disponibles
router.get('/plantillas', comunicacionesController.obtenerPlantillasNotificaciones);

// Crear plantilla personalizada (solo admins)
router.post('/plantilla', comunicacionesController.crearPlantillaNotificacion);

// Actualizar plantilla
router.put('/plantilla/:plantillaId', comunicacionesController.actualizarPlantillaNotificacion);

// Eliminar plantilla personalizada
router.delete('/plantilla/:plantillaId', comunicacionesController.eliminarPlantillaNotificacion);

// Preview de plantilla con datos de ejemplo
router.post('/plantilla/:plantillaId/preview', comunicacionesController.previewPlantilla);

// ==========================================
// RUTAS DE RECORDATORIOS PROGRAMADOS
// ==========================================

// Obtener recordatorios del usuario
router.get('/recordatorios', comunicacionesController.obtenerRecordatorios);

// Crear nuevo recordatorio
router.post('/recordatorio', comunicacionesController.crearRecordatorio);

// Actualizar recordatorio
router.put('/recordatorio/:recordatorioId', comunicacionesController.actualizarRecordatorio);

// Eliminar/cancelar recordatorio
router.delete('/recordatorio/:recordatorioId', comunicacionesController.cancelarRecordatorio);

// Pausar/reactivar recordatorio
router.put('/recordatorio/:recordatorioId/estado', comunicacionesController.cambiarEstadoRecordatorio);

// Ejecutar recordatorio manualmente
router.post('/recordatorio/:recordatorioId/ejecutar', comunicacionesController.ejecutarRecordatorio);

// ==========================================
// RUTAS DE COMUNICACIONES FAMILIARES
// ==========================================

// Obtener relaciones familiares del paciente
router.get('/familiares', comunicacionesController.obtenerComunicacionesFamiliares);

// Agregar responsable familiar
router.post('/familiar', comunicacionesController.agregarResponsableFamiliar);

// Actualizar permisos de responsable
router.put('/familiar/:relacionId', comunicacionesController.actualizarPermisosResponsable);

// Eliminar relación familiar
router.delete('/familiar/:relacionId', comunicacionesController.eliminarRelacionFamiliar);

// Obtener pacientes bajo responsabilidad (para padres/tutores)
router.get('/pacientes-responsabilidad', comunicacionesController.obtenerPacientesResponsabilidad);

// ==========================================
// RUTAS DE NOTIFICACIONES PUSH EN TIEMPO REAL
// ==========================================

// Registrar token de dispositivo para push notifications
router.post('/dispositivo/token', comunicacionesController.registrarTokenDispositivo);

// Obtener estado de conexión en tiempo real
router.get('/estado-conexion', comunicacionesController.obtenerEstadoConexion);

// Enviar notificación de prueba
router.post('/notificacion/prueba', comunicacionesController.enviarNotificacionPrueba);

// ==========================================
// RUTAS DE ANALYTICS DE COMUNICACIONES
// ==========================================

// Estadísticas de mensajes por período
router.get('/analytics/mensajes', comunicacionesController.obtenerEstadisticasMensajes);

// Estadísticas de notificaciones por tipo
router.get('/analytics/notificaciones', comunicacionesController.obtenerEstadisticasNotificaciones);

// Efectividad de recordatorios
router.get('/analytics/recordatorios', comunicacionesController.obtenerEfectividadRecordatorios);

// Uso del sistema de chat por usuario
router.get('/analytics/uso-chat', comunicacionesController.obtenerAnalyticsChat);

console.log('✅ Rutas de comunicaciones configuradas');

module.exports = router;
