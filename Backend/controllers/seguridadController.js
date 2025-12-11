// ===================================================
// CONTROLADOR DE SEGURIDAD AVANZADA
// Gestión de auditoría, logs y protección del sistema
// ===================================================

const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SeguridadController = {

    // =================
    // LOGS DE AUDITORÍA
    // =================

    // Registrar acción en logs de auditoría
    registrarAuditoria: async (req, res) => {
        try {
            const {
                usuario_id,
                accion,
                tabla_afectada,
                registro_id,
                datos_anteriores = {},
                datos_nuevos = {},
                nivel_riesgo = 'bajo',
                detalles_adicionales = {}
            } = req.body;

            const ip_origen = req.ip || req.connection.remoteAddress;
            const user_agent = req.get('User-Agent');

            const query = `
                INSERT INTO logs_auditoria 
                (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, 
                 datos_nuevos, ip_origen, user_agent, nivel_riesgo, detalles_adicionales)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                usuario_id,
                accion,
                tabla_afectada,
                registro_id,
                JSON.stringify(datos_anteriores),
                JSON.stringify(datos_nuevos),
                ip_origen,
                user_agent,
                nivel_riesgo,
                JSON.stringify(detalles_adicionales)
            ]);

            res.json({ 
                success: true, 
                message: 'Auditoría registrada exitosamente' 
            });

        } catch (error) {
            console.error('Error registrando auditoría:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Obtener logs de auditoría con filtros
    obtenerLogsAuditoria: async (req, res) => {
        try {
            const {
                usuario_id,
                accion,
                fecha_inicio,
                fecha_fin,
                nivel_riesgo,
                limite = 100
            } = req.query;

            let query = `
                SELECT 
                    la.id,
                    la.usuario_id,
                    u.nombre as usuario_nombre,
                    u.email as usuario_email,
                    la.accion,
                    la.tabla_afectada,
                    la.registro_id,
                    la.datos_anteriores,
                    la.datos_nuevos,
                    la.ip_origen,
                    la.timestamp_accion,
                    la.resultado,
                    la.nivel_riesgo,
                    la.detalles_adicionales
                FROM logs_auditoria la
                LEFT JOIN usuarios u ON la.usuario_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (usuario_id) {
                query += ' AND la.usuario_id = ?';
                params.push(usuario_id);
            }

            if (accion) {
                query += ' AND la.accion = ?';
                params.push(accion);
            }

            if (fecha_inicio) {
                query += ' AND la.timestamp_accion >= ?';
                params.push(fecha_inicio);
            }

            if (fecha_fin) {
                query += ' AND la.timestamp_accion <= ?';
                params.push(fecha_fin);
            }

            if (nivel_riesgo) {
                query += ' AND la.nivel_riesgo = ?';
                params.push(nivel_riesgo);
            }

            query += ' ORDER BY la.timestamp_accion DESC LIMIT ?';
            params.push(parseInt(limite));

            const [logs] = await db.execute(query, params);

            // Procesar JSON data
            const logsProcesados = logs.map(log => ({
                ...log,
                datos_anteriores: JSON.parse(log.datos_anteriores || '{}'),
                datos_nuevos: JSON.parse(log.datos_nuevos || '{}'),
                detalles_adicionales: JSON.parse(log.detalles_adicionales || '{}')
            }));

            res.json({ 
                success: true, 
                logs: logsProcesados,
                total: logs.length
            });

        } catch (error) {
            console.error('Error obteniendo logs de auditoría:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // INTENTOS DE LOGIN
    // =================

    // Registrar intento de login
    registrarIntentoLogin: async (req, res) => {
        try {
            const {
                email_intento,
                resultado,
                ubicacion_estimada = '',
                metodo_autenticacion = 'password',
                detalles_adicionales = {},
                sesion_id = null
            } = req.body;

            const ip_origen = req.ip || req.connection.remoteAddress;
            const user_agent = req.get('User-Agent');

            const query = `
                INSERT INTO intentos_login 
                (email_intento, ip_origen, user_agent, resultado, ubicacion_estimada, 
                 metodo_autenticacion, detalles_adicionales, sesion_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                email_intento,
                ip_origen,
                user_agent,
                resultado,
                ubicacion_estimada,
                metodo_autenticacion,
                JSON.stringify(detalles_adicionales),
                sesion_id
            ]);

            // Verificar si necesitamos generar alerta por intentos fallidos
            if (resultado !== 'exitoso') {
                await SeguridadController.verificarIntentosExcesivos(email_intento, ip_origen);
            }

            res.json({ 
                success: true, 
                message: 'Intento de login registrado' 
            });

        } catch (error) {
            console.error('Error registrando intento de login:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Verificar intentos excesivos de login
    verificarIntentosExcesivos: async (email, ip) => {
        try {
            // Contar intentos fallidos en las últimas 24 horas
            const [intentos] = await db.execute(`
                SELECT COUNT(*) as total_intentos
                FROM intentos_login 
                WHERE (email_intento = ? OR ip_origen = ?)
                AND resultado != 'exitoso'
                AND timestamp_intento >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `, [email, ip]);

            const totalIntentos = intentos[0].total_intentos;
            const maxIntentos = 5; // Configurable

            if (totalIntentos >= maxIntentos) {
                // Generar alerta de seguridad
                await SeguridadController.generarAlerta({
                    tipo_alerta: 'multiple_login_attempts',
                    nivel_severidad: totalIntentos > 10 ? 'critical' : 'high',
                    titulo: 'Múltiples intentos de login fallidos',
                    descripcion: `Se detectaron ${totalIntentos} intentos fallidos para ${email} desde ${ip}`,
                    datos_evento: { email, ip, total_intentos: totalIntentos },
                    ip_origen: ip
                });

                // Considerar bloqueo automático si es necesario
                if (totalIntentos >= maxIntentos * 2) {
                    await SeguridadController.aplicarBloqueoAutomatico('ip', ip, 'Intentos excesivos de login', totalIntentos);
                }
            }

        } catch (error) {
            console.error('Error verificando intentos excesivos:', error);
        }
    },

    // =================
    // GESTIÓN DE SESIONES
    // =================

    // Crear nueva sesión
    crearSesion: async (req, res) => {
        try {
            const {
                usuario_id,
                duracion_horas = 8,
                ubicacion_estimada = '',
                dispositivo = ''
            } = req.body;

            const ip_origen = req.ip || req.connection.remoteAddress;
            const user_agent = req.get('User-Agent');
            const sesion_id = crypto.randomBytes(64).toString('hex');
            
            const fecha_expiracion = new Date();
            fecha_expiracion.setHours(fecha_expiracion.getHours() + duracion_horas);

            const query = `
                INSERT INTO sesiones_activas 
                (usuario_id, sesion_id, ip_origen, user_agent, fecha_expiracion, 
                 ubicacion_estimada, dispositivo)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                usuario_id,
                sesion_id,
                ip_origen,
                user_agent,
                fecha_expiracion,
                ubicacion_estimada,
                dispositivo
            ]);

            res.json({ 
                success: true, 
                sesion_id,
                fecha_expiracion,
                message: 'Sesión creada exitosamente' 
            });

        } catch (error) {
            console.error('Error creando sesión:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Obtener sesiones activas
    obtenerSesionesActivas: async (req, res) => {
        try {
            const { usuario_id } = req.query;

            let query = `
                SELECT 
                    sa.*,
                    u.nombre,
                    u.email,
                    TIMESTAMPDIFF(MINUTE, sa.fecha_ultimo_acceso, NOW()) as minutos_inactivo
                FROM sesiones_activas sa
                JOIN usuarios u ON sa.usuario_id = u.id
                WHERE sa.estado = 'activa'
                AND sa.fecha_expiracion > NOW()
            `;
            const params = [];

            if (usuario_id) {
                query += ' AND sa.usuario_id = ?';
                params.push(usuario_id);
            }

            query += ' ORDER BY sa.fecha_ultimo_acceso DESC';

            const [sesiones] = await db.execute(query, params);

            res.json({ 
                success: true, 
                sesiones,
                total: sesiones.length
            });

        } catch (error) {
            console.error('Error obteniendo sesiones activas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // Cerrar sesión
    cerrarSesion: async (req, res) => {
        try {
            const { sesion_id, forzar = false } = req.body;

            const estado = forzar ? 'cerrada_forzada' : 'cerrada_manual';

            await db.execute(`
                UPDATE sesiones_activas 
                SET estado = ?, fecha_ultimo_acceso = NOW()
                WHERE sesion_id = ?
            `, [estado, sesion_id]);

            res.json({ 
                success: true, 
                message: 'Sesión cerrada exitosamente' 
            });

        } catch (error) {
            console.error('Error cerrando sesión:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // ALERTAS DE SEGURIDAD
    // =================

    // Generar alerta de seguridad
    generarAlerta: async (alertaData) => {
        try {
            const {
                tipo_alerta,
                nivel_severidad,
                titulo,
                descripcion,
                datos_evento = {},
                ip_origen = null,
                usuario_relacionado = null
            } = alertaData;

            const query = `
                INSERT INTO alertas_seguridad 
                (tipo_alerta, nivel_severidad, titulo, descripcion, datos_evento, ip_origen, usuario_relacionado)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(query, [
                tipo_alerta,
                nivel_severidad,
                titulo,
                descripcion,
                JSON.stringify(datos_evento),
                ip_origen,
                usuario_relacionado
            ]);

            console.log(`🚨 Alerta de seguridad generada: ${titulo} (ID: ${result.insertId})`);
            
            return result.insertId;

        } catch (error) {
            console.error('Error generando alerta de seguridad:', error);
            throw error;
        }
    },

    // Obtener alertas de seguridad
    obtenerAlertas: async (req, res) => {
        try {
            const {
                nivel_severidad,
                estado = 'pendiente',
                tipo_alerta,
                limite = 50
            } = req.query;

            let query = `
                SELECT 
                    as.*,
                    u.nombre as usuario_nombre,
                    u.email as usuario_email
                FROM alertas_seguridad as
                LEFT JOIN usuarios u ON as.usuario_relacionado = u.id
                WHERE 1=1
            `;
            const params = [];

            if (nivel_severidad) {
                query += ' AND as.nivel_severidad = ?';
                params.push(nivel_severidad);
            }

            if (estado) {
                query += ' AND as.estado = ?';
                params.push(estado);
            }

            if (tipo_alerta) {
                query += ' AND as.tipo_alerta = ?';
                params.push(tipo_alerta);
            }

            query += ' ORDER BY as.fecha_alerta DESC LIMIT ?';
            params.push(parseInt(limite));

            const [alertas] = await db.execute(query, params);

            // Procesar datos JSON
            const alertasProcesadas = alertas.map(alerta => ({
                ...alerta,
                datos_evento: JSON.parse(alerta.datos_evento || '{}')
            }));

            res.json({ 
                success: true, 
                alertas: alertasProcesadas,
                total: alertas.length
            });

        } catch (error) {
            console.error('Error obteniendo alertas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // BLOQUEOS DE SEGURIDAD
    // =================

    // Aplicar bloqueo automático
    aplicarBloqueoAutomatico: async (tipo, valor, razon, intentos = 0) => {
        try {
            // Calcular tiempo de expiración (1 hora por defecto)
            const fecha_expiracion = new Date();
            fecha_expiracion.setHours(fecha_expiracion.getHours() + 1);

            const query = `
                INSERT INTO bloqueos_seguridad 
                (tipo_bloqueo, valor_bloqueado, razon_bloqueo, fecha_expiracion, 
                 intentos_automaticos, detalles_adicionales)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            await db.execute(query, [
                tipo,
                valor,
                razon,
                fecha_expiracion,
                intentos,
                JSON.stringify({ bloqueo_automatico: true, timestamp: new Date() })
            ]);

            console.log(`🔒 Bloqueo automático aplicado: ${tipo} ${valor}`);

        } catch (error) {
            console.error('Error aplicando bloqueo automático:', error);
            throw error;
        }
    },

    // Verificar si algo está bloqueado
    verificarBloqueo: async (req, res) => {
        try {
            const { tipo, valor } = req.query;

            const [bloqueos] = await db.execute(`
                SELECT * FROM bloqueos_seguridad
                WHERE tipo_bloqueo = ? AND valor_bloqueado = ?
                AND estado = 'activo'
                AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
            `, [tipo, valor]);

            const bloqueado = bloqueos.length > 0;

            res.json({ 
                success: true, 
                bloqueado,
                detalles: bloqueado ? bloqueos[0] : null
            });

        } catch (error) {
            console.error('Error verificando bloqueo:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // DASHBOARD DE SEGURIDAD
    // =================

    // Dashboard principal de seguridad
    obtenerDashboardSeguridad: async (req, res) => {
        try {
            // Obtener estadísticas del dashboard
            const [dashboard] = await db.execute('SELECT * FROM vista_dashboard_seguridad LIMIT 1');
            
            // Obtener actividad sospechosa
            const [actividadSospechosa] = await db.execute('SELECT * FROM vista_actividad_sospechosa LIMIT 10');
            
            // Obtener alertas recientes críticas
            const [alertasCriticas] = await db.execute(`
                SELECT * FROM alertas_seguridad 
                WHERE nivel_severidad = 'critical' AND estado = 'pendiente'
                ORDER BY fecha_alerta DESC LIMIT 5
            `);

            // Obtener eventos recientes
            const [eventosRecientes] = await db.execute(`
                SELECT 
                    'login_attempt' as tipo_evento,
                    email_intento as detalle,
                    ip_origen,
                    resultado,
                    timestamp_intento as timestamp
                FROM intentos_login 
                WHERE timestamp_intento >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                ORDER BY timestamp_intento DESC LIMIT 10
            `);

            const dashboardData = {
                resumen: dashboard[0] || {},
                actividad_sospechosa: actividadSospechosa,
                alertas_criticas: alertasCriticas.map(alerta => ({
                    ...alerta,
                    datos_evento: JSON.parse(alerta.datos_evento || '{}')
                })),
                eventos_recientes: eventosRecientes,
                timestamp: new Date()
            };

            res.json({ 
                success: true, 
                dashboard: dashboardData
            });

        } catch (error) {
            console.error('Error obteniendo dashboard de seguridad:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // =================
    // UTILIDADES
    // =================

    // Limpiar logs antiguos
    limpiarLogsAntiguos: async (req, res) => {
        try {
            const [result] = await db.execute('CALL LimpiarLogsSeguridad()');
            
            res.json({ 
                success: true, 
                message: 'Limpieza de logs completada',
                resultado: result[0]
            });

        } catch (error) {
            console.error('Error limpiando logs antiguos:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
};

console.log('✅ Controller de seguridad avanzada configurado');

module.exports = SeguridadController;
