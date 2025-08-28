// ===================================================
// CONTROLADOR DE SISTEMA DE INTEGRACIÓN Y APIS EXTERNAS
// Gestiona conexiones, webhooks, sincronizaciones y transformaciones
// ===================================================

const mysql = require('mysql2');
const db = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');

class IntegracionController {

    // =================
    // CONFIGURACIONES DE APIS EXTERNAS
    // =================

    static async obtenerConfiguracionesAPI(req, res) {
        try {
            const [configuraciones] = await db.execute(`
                SELECT 
                    id, nombre_api, tipo_integracion, proveedor, 
                    endpoint_base_url, version_api, headers_default,
                    parametros_default, esta_activo, limite_requests_minuto,
                    estado_conexion, ultima_conexion, fecha_creacion
                FROM configuraciones_api_externas
                ORDER BY tipo_integracion, nombre_api
            `);

            res.json({ 
                success: true, 
                configuraciones,
                total: configuraciones.length 
            });
        } catch (error) {
            console.error('Error obteniendo configuraciones API:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async crearConfiguracionAPI(req, res) {
        try {
            const {
                nombre_api, tipo_integracion, proveedor, endpoint_base_url,
                credenciales_config, headers_default, parametros_default,
                limite_requests_minuto
            } = req.body;

            const [result] = await db.execute(`
                INSERT INTO configuraciones_api_externas 
                (nombre_api, tipo_integracion, proveedor, endpoint_base_url,
                 credenciales_config, headers_default, parametros_default, limite_requests_minuto)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                nombre_api, tipo_integracion, proveedor, endpoint_base_url,
                JSON.stringify(credenciales_config), JSON.stringify(headers_default),
                JSON.stringify(parametros_default), limite_requests_minuto
            ]);

            res.json({ 
                success: true, 
                api_id: result.insertId,
                message: 'Configuración API creada exitosamente' 
            });
        } catch (error) {
            console.error('Error creando configuración API:', error);
            res.status(500).json({ success: false, message: 'Error creando configuración' });
        }
    }

    static async testearConexionAPI(req, res) {
        try {
            const { id } = req.params;

            const [api] = await db.execute(`
                SELECT * FROM configuraciones_api_externas WHERE id = ?
            `, [id]);

            if (api.length === 0) {
                return res.status(404).json({ success: false, message: 'API no encontrada' });
            }

            const apiConfig = api[0];
            
            // Realizar llamada de prueba
            const testResult = await IntegracionController.realizarLlamadaPrueba(apiConfig);

            // Actualizar estado de conexión
            await db.execute(`
                UPDATE configuraciones_api_externas 
                SET ultima_conexion = NOW(), estado_conexion = ?
                WHERE id = ?
            `, [testResult.exitoso ? 'activa' : 'error', id]);

            res.json({ 
                success: testResult.exitoso,
                resultado_test: testResult,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error testeando conexión API:', error);
            res.status(500).json({ success: false, message: 'Error testeando conexión' });
        }
    }

    // =================
    // WEBHOOKS ENTRANTES
    // =================

    static async obtenerWebhooks(req, res) {
        try {
            const [webhooks] = await db.execute(`
                SELECT 
                    id, nombre_webhook, url_endpoint, metodos_permitidos,
                    esta_activo, accion_procesar, ultima_ejecucion,
                    total_ejecuciones, ejecuciones_exitosas, fecha_creacion
                FROM webhooks_entrantes
                ORDER BY fecha_creacion DESC
            `);

            res.json({ success: true, webhooks });
        } catch (error) {
            console.error('Error obteniendo webhooks:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async crearWebhook(req, res) {
        try {
            const {
                nombre_webhook, url_endpoint, token_seguridad,
                metodos_permitidos, accion_procesar, configuracion_accion
            } = req.body;

            const [result] = await db.execute(`
                INSERT INTO webhooks_entrantes 
                (nombre_webhook, url_endpoint, token_seguridad, metodos_permitidos,
                 accion_procesar, configuracion_accion)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                nombre_webhook, url_endpoint, token_seguridad,
                JSON.stringify(metodos_permitidos), accion_procesar,
                JSON.stringify(configuracion_accion)
            ]);

            res.json({ 
                success: true, 
                webhook_id: result.insertId,
                message: 'Webhook creado exitosamente' 
            });
        } catch (error) {
            console.error('Error creando webhook:', error);
            res.status(500).json({ success: false, message: 'Error creando webhook' });
        }
    }

    static async procesarWebhook(req, res) {
        try {
            const { endpoint } = req.params;
            const payload = req.body;
            const headers = req.headers;

            // Buscar webhook por endpoint
            const [webhook] = await db.execute(`
                SELECT * FROM webhooks_entrantes 
                WHERE url_endpoint = ? AND esta_activo = true
            `, [endpoint]);

            if (webhook.length === 0) {
                return res.status(404).json({ success: false, message: 'Webhook no encontrado' });
            }

            const webhookConfig = webhook[0];

            // Validar token de seguridad si está configurado
            if (webhookConfig.token_seguridad) {
                const tokenHeader = headers['x-webhook-token'] || headers['authorization'];
                if (!tokenHeader || !tokenHeader.includes(webhookConfig.token_seguridad)) {
                    return res.status(401).json({ success: false, message: 'Token de seguridad inválido' });
                }
            }

            // Procesar webhook
            const resultado = await IntegracionController.ejecutarAccionWebhook(webhookConfig, payload, headers);

            // Registrar log
            await db.execute(`
                INSERT INTO logs_webhooks_recibidos 
                (webhook_entrante_id, headers_recibidos, payload_recibido, 
                 ip_origen, procesado_exitosamente, resultado_procesamiento, timestamp_procesado)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [
                webhookConfig.id, JSON.stringify(headers), JSON.stringify(payload),
                req.ip, resultado.exitoso, JSON.stringify(resultado)
            ]);

            // Actualizar estadísticas del webhook
            await db.execute(`
                UPDATE webhooks_entrantes 
                SET ultima_ejecucion = NOW(), 
                    total_ejecuciones = total_ejecuciones + 1,
                    ejecuciones_exitosas = ejecuciones_exitosas + ?
                WHERE id = ?
            `, [resultado.exitoso ? 1 : 0, webhookConfig.id]);

            res.json({ 
                success: resultado.exitoso,
                mensaje: resultado.mensaje,
                procesamiento_id: resultado.procesamiento_id
            });

        } catch (error) {
            console.error('Error procesando webhook:', error);
            res.status(500).json({ success: false, message: 'Error procesando webhook' });
        }
    }

    // =================
    // SINCRONIZACIONES DE DATOS
    // =================

    static async obtenerSincronizaciones(req, res) {
        try {
            const [sincronizaciones] = await db.execute(`
                SELECT 
                    s.id, s.nombre_sincronizacion, s.tipo_sincronizacion,
                    s.tabla_local, s.frecuencia, s.ultima_sincronizacion,
                    s.proxima_sincronizacion, s.registros_procesados,
                    s.registros_exitosos, s.registros_fallidos, s.esta_activa,
                    a.nombre_api, a.proveedor
                FROM sincronizaciones_datos s
                LEFT JOIN configuraciones_api_externas a ON s.api_externa_id = a.id
                ORDER BY s.fecha_creacion DESC
            `);

            res.json({ success: true, sincronizaciones });
        } catch (error) {
            console.error('Error obteniendo sincronizaciones:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async ejecutarSincronizacion(req, res) {
        try {
            const { id } = req.params;
            const { forzar = false } = req.body;

            const [sincronizacion] = await db.execute(`
                SELECT s.*, a.endpoint_base_url, a.credenciales_config, a.headers_default
                FROM sincronizaciones_datos s
                LEFT JOIN configuraciones_api_externas a ON s.api_externa_id = a.id
                WHERE s.id = ? AND s.esta_activa = true
            `, [id]);

            if (sincronizacion.length === 0) {
                return res.status(404).json({ success: false, message: 'Sincronización no encontrada' });
            }

            const syncConfig = sincronizacion[0];

            // Verificar si debe ejecutarse (frecuencia)
            if (!forzar && syncConfig.proxima_sincronizacion && new Date() < new Date(syncConfig.proxima_sincronizacion)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Sincronización no programada para ejecutar aún',
                    proxima_ejecucion: syncConfig.proxima_sincronizacion
                });
            }

            // Ejecutar sincronización
            const resultado = await IntegracionController.ejecutarProcesarSincronizacion(syncConfig);

            // Actualizar estadísticas
            const proximaEjecucion = IntegracionController.calcularProximaSincronizacion(syncConfig.frecuencia);
            
            await db.execute(`
                UPDATE sincronizaciones_datos 
                SET ultima_sincronizacion = NOW(),
                    proxima_sincronizacion = ?,
                    registros_procesados = registros_procesados + ?,
                    registros_exitosos = registros_exitosos + ?,
                    registros_fallidos = registros_fallidos + ?
                WHERE id = ?
            `, [
                proximaEjecucion, resultado.total_procesados,
                resultado.exitosos, resultado.fallidos, id
            ]);

            res.json({ 
                success: true, 
                resultado,
                proxima_sincronizacion: proximaEjecucion
            });

        } catch (error) {
            console.error('Error ejecutando sincronización:', error);
            res.status(500).json({ success: false, message: 'Error ejecutando sincronización' });
        }
    }

    // =================
    // CONEXIONES CON TERCEROS
    // =================

    static async obtenerConexionesTerceros(req, res) {
        try {
            const [conexiones] = await db.execute(`
                SELECT 
                    id, nombre_conexion, tipo_sistema, proveedor_sistema,
                    protocolo, estado_conexion, test_conexion_exitoso,
                    ultima_prueba_conexion, fecha_creacion
                FROM conexiones_terceros
                ORDER BY tipo_sistema, nombre_conexion
            `);

            res.json({ success: true, conexiones });
        } catch (error) {
            console.error('Error obteniendo conexiones terceros:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async testearConexionTercero(req, res) {
        try {
            const { id } = req.params;

            const [conexion] = await db.execute(`
                SELECT * FROM conexiones_terceros WHERE id = ?
            `, [id]);

            if (conexion.length === 0) {
                return res.status(404).json({ success: false, message: 'Conexión no encontrada' });
            }

            const conexionConfig = conexion[0];
            
            // Realizar test de conexión
            const testResult = await IntegracionController.testearConexionExterna(conexionConfig);

            // Actualizar estado
            await db.execute(`
                UPDATE conexiones_terceros 
                SET estado_conexion = ?, test_conexion_exitoso = ?, ultima_prueba_conexion = NOW()
                WHERE id = ?
            `, [
                testResult.exitoso ? 'conectado' : 'error',
                testResult.exitoso, id
            ]);

            res.json({ 
                success: testResult.exitoso,
                resultado_test: testResult,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error testeando conexión tercero:', error);
            res.status(500).json({ success: false, message: 'Error testeando conexión' });
        }
    }

    // =================
    // COLA DE TAREAS DE INTEGRACIÓN
    // =================

    static async obtenerColaTareas(req, res) {
        try {
            const { estado, limite = 50 } = req.query;

            let query = `
                SELECT 
                    id, nombre_tarea, tipo_tarea, prioridad, estado,
                    intentos_procesamiento, max_intentos, fecha_creacion,
                    fecha_inicio_procesamiento, fecha_completada,
                    tiempo_procesamiento_ms, mensaje_error
                FROM cola_tareas_integracion
                WHERE 1=1
            `;
            const params = [];

            if (estado) {
                query += ' AND estado = ?';
                params.push(estado);
            }

            query += ' ORDER BY prioridad DESC, fecha_creacion ASC LIMIT ?';
            params.push(parseInt(limite));

            const [tareas] = await db.execute(query, params);

            res.json({ success: true, tareas });
        } catch (error) {
            console.error('Error obteniendo cola de tareas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async agregarTareaIntegracion(req, res) {
        try {
            const {
                nombre_tarea, tipo_tarea, prioridad = 'media',
                parametros_tarea, max_intentos = 3
            } = req.body;

            const [result] = await db.execute(`
                INSERT INTO cola_tareas_integracion 
                (nombre_tarea, tipo_tarea, prioridad, parametros_tarea, max_intentos)
                VALUES (?, ?, ?, ?, ?)
            `, [nombre_tarea, tipo_tarea, prioridad, JSON.stringify(parametros_tarea), max_intentos]);

            res.json({ 
                success: true, 
                tarea_id: result.insertId,
                message: 'Tarea agregada a la cola exitosamente' 
            });
        } catch (error) {
            console.error('Error agregando tarea a cola:', error);
            res.status(500).json({ success: false, message: 'Error agregando tarea' });
        }
    }

    static async procesarSiguienteTarea(req, res) {
        try {
            // Buscar siguiente tarea pendiente por prioridad
            const [tareas] = await db.execute(`
                SELECT * FROM cola_tareas_integracion 
                WHERE estado = 'pendiente' AND intentos_procesamiento < max_intentos
                ORDER BY 
                    CASE prioridad 
                        WHEN 'critica' THEN 1 
                        WHEN 'alta' THEN 2 
                        WHEN 'media' THEN 3 
                        ELSE 4 
                    END,
                    fecha_creacion ASC
                LIMIT 1
            `);

            if (tareas.length === 0) {
                return res.json({ success: true, message: 'No hay tareas pendientes en la cola' });
            }

            const tarea = tareas[0];

            // Marcar como procesando
            await db.execute(`
                UPDATE cola_tareas_integracion 
                SET estado = 'procesando', fecha_inicio_procesamiento = NOW(),
                    intentos_procesamiento = intentos_procesamiento + 1
                WHERE id = ?
            `, [tarea.id]);

            // Procesar tarea
            const resultado = await IntegracionController.procesarTareaIntegracion(tarea);

            // Actualizar resultado
            await db.execute(`
                UPDATE cola_tareas_integracion 
                SET estado = ?, fecha_completada = NOW(),
                    tiempo_procesamiento_ms = ?, resultado_tarea = ?, mensaje_error = ?
                WHERE id = ?
            `, [
                resultado.exitoso ? 'completada' : 'fallida',
                resultado.tiempo_ms, JSON.stringify(resultado.resultado),
                resultado.error, tarea.id
            ]);

            res.json({ 
                success: true, 
                tarea_procesada: tarea.nombre_tarea,
                resultado
            });

        } catch (error) {
            console.error('Error procesando siguiente tarea:', error);
            res.status(500).json({ success: false, message: 'Error procesando tarea' });
        }
    }

    // =================
    // LOGS Y MONITOREO
    // =================

    static async obtenerLogsAPI(req, res) {
        try {
            const { api_externa_id, exitoso, limite = 100 } = req.query;

            let query = `
                SELECT 
                    l.id, l.endpoint_llamado, l.metodo_http, l.response_status_code,
                    l.tiempo_respuesta_ms, l.exitoso, l.mensaje_error, l.timestamp_request,
                    a.nombre_api, a.proveedor
                FROM logs_api_externas l
                LEFT JOIN configuraciones_api_externas a ON l.api_externa_id = a.id
                WHERE 1=1
            `;
            const params = [];

            if (api_externa_id) {
                query += ' AND l.api_externa_id = ?';
                params.push(api_externa_id);
            }

            if (exitoso !== undefined) {
                query += ' AND l.exitoso = ?';
                params.push(exitoso === 'true');
            }

            query += ' ORDER BY l.timestamp_request DESC LIMIT ?';
            params.push(parseInt(limite));

            const [logs] = await db.execute(query, params);

            res.json({ success: true, logs });
        } catch (error) {
            console.error('Error obteniendo logs API:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async obtenerEstadisticasIntegracion(req, res) {
        try {
            // Estadísticas de APIs
            const [statsAPI] = await db.execute(`
                SELECT 
                    COUNT(*) as total_apis,
                    SUM(CASE WHEN estado_conexion = 'activa' THEN 1 ELSE 0 END) as apis_activas,
                    SUM(CASE WHEN estado_conexion = 'error' THEN 1 ELSE 0 END) as apis_con_error
                FROM configuraciones_api_externas
            `);

            // Estadísticas de llamadas API (últimas 24h)
            const [statsLlamadas] = await db.execute(`
                SELECT 
                    COUNT(*) as total_llamadas,
                    SUM(CASE WHEN exitoso = 1 THEN 1 ELSE 0 END) as llamadas_exitosas,
                    AVG(tiempo_respuesta_ms) as tiempo_promedio_respuesta
                FROM logs_api_externas 
                WHERE timestamp_request >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);

            // Estadísticas de webhooks
            const [statsWebhooks] = await db.execute(`
                SELECT 
                    COUNT(*) as total_webhooks,
                    SUM(CASE WHEN esta_activo = 1 THEN 1 ELSE 0 END) as webhooks_activos,
                    SUM(total_ejecuciones) as total_ejecuciones_webhooks,
                    SUM(ejecuciones_exitosas) as ejecuciones_exitosas_webhooks
                FROM webhooks_entrantes
            `);

            // Estadísticas de cola de tareas
            const [statsTareas] = await db.execute(`
                SELECT 
                    estado,
                    COUNT(*) as cantidad
                FROM cola_tareas_integracion 
                WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY estado
            `);

            res.json({ 
                success: true, 
                estadisticas: {
                    apis: statsAPI[0],
                    llamadas_24h: statsLlamadas[0],
                    webhooks: statsWebhooks[0],
                    tareas_por_estado: statsTareas
                },
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    // =================
    // MÉTODOS AUXILIARES
    // =================

    static async realizarLlamadaPrueba(apiConfig) {
        try {
            const headers = JSON.parse(apiConfig.headers_default || '{}');
            
            // Realizar GET básico al endpoint
            const response = await axios.get(apiConfig.endpoint_base_url, {
                headers,
                timeout: (apiConfig.timeout_segundos || 30) * 1000
            });

            return {
                exitoso: true,
                status_code: response.status,
                tiempo_respuesta: Date.now() - Date.now(), // simplificado
                mensaje: 'Conexión exitosa'
            };
        } catch (error) {
            return {
                exitoso: false,
                status_code: error.response?.status || 0,
                mensaje: error.message,
                error_detalle: error.response?.data
            };
        }
    }

    static async ejecutarAccionWebhook(webhookConfig, payload, headers) {
        try {
            const configuracion = JSON.parse(webhookConfig.configuracion_accion || '{}');
            
            let resultado = { exitoso: false, mensaje: 'Acción no procesada' };

            switch (webhookConfig.accion_procesar) {
                case 'actualizar_pago':
                    resultado = await IntegracionController.procesarActualizacionPago(payload, configuracion);
                    break;
                case 'crear_cita':
                    resultado = await IntegracionController.procesarCreacionCita(payload, configuracion);
                    break;
                case 'notificar_resultado':
                    resultado = await IntegracionController.procesarNotificacionResultado(payload, configuracion);
                    break;
                case 'custom':
                    resultado = await IntegracionController.procesarAccionCustom(payload, configuracion);
                    break;
            }

            return resultado;
        } catch (error) {
            return {
                exitoso: false,
                mensaje: 'Error procesando webhook',
                error: error.message
            };
        }
    }

    static async procesarActualizacionPago(payload, configuracion) {
        // Simulación de procesamiento de pago
        return {
            exitoso: true,
            mensaje: 'Pago actualizado correctamente',
            procesamiento_id: 'pay_' + Date.now()
        };
    }

    static async procesarCreacionCita(payload, configuracion) {
        // Simulación de creación de cita
        return {
            exitoso: true,
            mensaje: 'Cita creada desde webhook',
            procesamiento_id: 'cita_' + Date.now()
        };
    }

    static async procesarNotificacionResultado(payload, configuracion) {
        // Simulación de notificación de resultado
        return {
            exitoso: true,
            mensaje: 'Resultado notificado correctamente',
            procesamiento_id: 'result_' + Date.now()
        };
    }

    static async procesarAccionCustom(payload, configuracion) {
        // Simulación de acción personalizada
        return {
            exitoso: true,
            mensaje: 'Acción custom ejecutada',
            procesamiento_id: 'custom_' + Date.now()
        };
    }

    static calcularProximaSincronizacion(frecuencia) {
        const ahora = new Date();
        let proxima = new Date(ahora);

        switch (frecuencia) {
            case 'cada_minuto':
                proxima.setMinutes(proxima.getMinutes() + 1);
                break;
            case 'cada_hora':
                proxima.setHours(proxima.getHours() + 1);
                break;
            case 'diaria':
                proxima.setDate(proxima.getDate() + 1);
                break;
            case 'semanal':
                proxima.setDate(proxima.getDate() + 7);
                break;
            default:
                return null; // Para 'manual' y 'tiempo_real'
        }

        return proxima;
    }

    static async ejecutarProcesarSincronizacion(syncConfig) {
        // Simulación de procesamiento de sincronización
        return {
            total_procesados: 25,
            exitosos: 23,
            fallidos: 2,
            tiempo_total_ms: 1500
        };
    }

    static async testearConexionExterna(conexionConfig) {
        // Simulación de test de conexión externa
        return {
            exitoso: Math.random() > 0.2, // 80% de éxito
            latencia_ms: Math.floor(Math.random() * 1000) + 100,
            mensaje: 'Test de conexión completado'
        };
    }

    static async procesarTareaIntegracion(tarea) {
        const tiempoInicio = Date.now();
        
        try {
            const parametros = JSON.parse(tarea.parametros_tarea);
            
            // Simulación de procesamiento según tipo de tarea
            let resultado = {};
            
            switch (tarea.tipo_tarea) {
                case 'sync_datos':
                    resultado = { registros_sincronizados: 15, tipo: 'sync_datos' };
                    break;
                case 'call_api':
                    resultado = { respuesta_api: 'success', status_code: 200 };
                    break;
                case 'process_webhook':
                    resultado = { webhook_procesado: true, acciones_ejecutadas: 2 };
                    break;
                default:
                    resultado = { procesado: true };
            }

            // Simular tiempo de procesamiento
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
            
            return {
                exitoso: true,
                resultado,
                tiempo_ms: Date.now() - tiempoInicio,
                error: null
            };

        } catch (error) {
            return {
                exitoso: false,
                resultado: null,
                tiempo_ms: Date.now() - tiempoInicio,
                error: error.message
            };
        }
    }
}

module.exports = IntegracionController;
