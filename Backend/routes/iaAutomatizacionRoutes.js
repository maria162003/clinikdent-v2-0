// ===================================================
// RUTAS DEL SISTEMA DE IA Y AUTOMATIZACIÓN (VERSIÓN SIMPLIFICADA)
// Endpoints básicos para funcionalidades inteligentes
// ===================================================

const express = require('express');
const router = express.Router();
const IAAutomatizacionController = require('../controllers/iaAutomatizacionController');

// =================
// RUTAS BÁSICAS DE IA (FUNCIONALES)
// =================

// GET /api/ia-automatizacion/configuraciones - Obtener configuraciones de IA
router.get('/configuraciones', IAAutomatizacionController.obtenerConfiguracionesIA);

// POST /api/ia-automatizacion/chatbot/mensaje - Procesar mensaje del chatbot
router.post('/chatbot/mensaje', IAAutomatizacionController.procesarMensajeChatbot);

// GET /api/ia-automatizacion/chatbot/historial/:usuario_id/:session_id - Historial de conversación
router.get('/chatbot/historial/:usuario_id/:session_id', IAAutomatizacionController.obtenerHistorialChatbot);

// POST /api/ia-automatizacion/predicciones/generar - Generar nueva predicción
router.post('/predicciones/generar', IAAutomatizacionController.generarPrediccion);

// GET /api/ia-automatizacion/predicciones - Obtener predicciones
router.get('/predicciones', IAAutomatizacionController.obtenerPredicciones);

// POST /api/ia-automatizacion/recomendaciones/generar/:usuario_id - Generar recomendaciones
router.post('/recomendaciones/generar/:usuario_id', IAAutomatizacionController.generarRecomendaciones);

// GET /api/ia-automatizacion/recomendaciones/usuario/:usuario_id - Recomendaciones del usuario
router.get('/recomendaciones/usuario/:usuario_id', IAAutomatizacionController.obtenerRecomendacionesUsuario);

// =================
// RUTAS DE DEMOSTRACIÓN
// =================

// GET /api/ia-automatizacion/demo/dashboard - Dashboard de IA
router.get('/demo/dashboard', async (req, res) => {
    try {
        const metricas = {
            chatbot: {
                conversaciones_hoy: 47,
                satisfaccion_promedio: 4.3,
                tiempo_respuesta_promedio: 0.8,
                escalamientos_humano: 3,
                intenciones_detectadas: {
                    'agendar_cita': 18,
                    'consulta_precios': 12,
                    'emergencia_dental': 3,
                    'informacion_general': 14
                }
            },
            predicciones: {
                predicciones_generadas: 156,
                precision_promedio: 0.847,
                modelos_activos: 3,
                predicciones_por_tipo: {
                    'citas_canceladas': 89,
                    'ingresos_futuros': 34,
                    'tratamientos_necesarios': 33
                }
            },
            recomendaciones: {
                recomendaciones_generadas: 234,
                tasa_aceptacion: 0.312,
                puntuacion_relevancia_promedio: 0.789,
                tipos_mas_efectivos: ['tratamiento', 'cita_siguiente']
            },
            automatizaciones: {
                workflows_activos: 8,
                ejecuciones_exitosas: 1247,
                tiempo_ahorro_estimado: 18.5,
                errores_ultimo_mes: 2
            }
        };

        res.json({ 
            success: true, 
            metricas,
            timestamp: new Date(),
            periodo: 'últimos_30_dias'
        });

    } catch (error) {
        console.error('Error en dashboard de IA:', error);
        res.status(500).json({ success: false, message: 'Error obteniendo métricas de IA' });
    }
});

// GET /api/ia-automatizacion/demo/test-simple - Test simple
router.get('/demo/test-simple', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Sistema de IA y Automatización funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date(),
        componentes: {
            chatbot: 'operativo',
            predicciones: 'operativo', 
            recomendaciones: 'operativo',
            automatizaciones: 'operativo'
        }
    });
});

console.log('✅ Rutas de IA y automatización configuradas (versión simplificada)');

module.exports = router;
