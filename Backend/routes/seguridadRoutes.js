// ===================================================
// RUTAS DEL SISTEMA DE SEGURIDAD AVANZADA
// Endpoints para auditoría, logs y protección
// ===================================================

const express = require('express');
const router = express.Router();
const SeguridadController = require('../controllers/seguridadController');

// =================
// LOGS DE AUDITORÍA
// =================

// POST /api/seguridad/auditoria - Registrar acción en auditoría
router.post('/auditoria', SeguridadController.registrarAuditoria);

// GET /api/seguridad/auditoria - Obtener logs de auditoría
router.get('/auditoria', SeguridadController.obtenerLogsAuditoria);

// =================
// INTENTOS DE LOGIN
// =================

// POST /api/seguridad/login-intento - Registrar intento de login
router.post('/login-intento', SeguridadController.registrarIntentoLogin);

// =================
// GESTIÓN DE SESIONES
// =================

// POST /api/seguridad/sesiones - Crear nueva sesión
router.post('/sesiones', SeguridadController.crearSesion);

// GET /api/seguridad/sesiones - Obtener sesiones activas
router.get('/sesiones', SeguridadController.obtenerSesionesActivas);

// DELETE /api/seguridad/sesiones - Cerrar sesión
router.delete('/sesiones', SeguridadController.cerrarSesion);

// =================
// ALERTAS DE SEGURIDAD
// =================

// GET /api/seguridad/alertas - Obtener alertas de seguridad
router.get('/alertas', SeguridadController.obtenerAlertas);

// =================
// BLOQUEOS DE SEGURIDAD
// =================

// GET /api/seguridad/verificar-bloqueo - Verificar si algo está bloqueado
router.get('/verificar-bloqueo', SeguridadController.verificarBloqueo);

// =================
// DASHBOARD Y REPORTES
// =================

// GET /api/seguridad/dashboard - Dashboard de seguridad
router.get('/dashboard', SeguridadController.obtenerDashboardSeguridad);

// =================
// UTILIDADES
// =================

// POST /api/seguridad/limpiar-logs - Limpiar logs antiguos
router.post('/limpiar-logs', SeguridadController.limpiarLogsAntiguos);

// =================
// ENDPOINTS DE DEMOSTRACIÓN
// =================

// GET /api/seguridad/demo/reporte-seguridad - Reporte completo de seguridad
router.get('/demo/reporte-seguridad', async (req, res) => {
    try {
        const reporteSeguridad = {
            resumen_ejecutivo: {
                estado_general: 'SEGURO',
                nivel_riesgo: 'BAJO',
                puntuacion_seguridad: 94.7,
                ultima_auditoria: '2025-08-25T14:30:00Z',
                tiempo_reporte: new Date().toISOString()
            },
            metricas_principales: {
                intentos_login_24h: {
                    exitosos: 87,
                    fallidos: 12,
                    tasa_exito: 0.879
                },
                sesiones_activas: {
                    total: 23,
                    usuarios_unicos: 19,
                    tiempo_promedio_sesion: '2.4 horas'
                },
                alertas_seguridad: {
                    pendientes: 2,
                    criticas: 0,
                    resueltas_24h: 5
                },
                bloqueos_activos: {
                    ips_bloqueadas: 3,
                    usuarios_bloqueados: 0,
                    bloqueos_automaticos: 2
                }
            },
            analisis_vulnerabilidades: {
                vulnerabilidades_criticas: 0,
                vulnerabilidades_altas: 1,
                vulnerabilidades_medias: 3,
                vulnerabilidades_bajas: 5,
                vulnerabilidades_total: 9,
                porcentaje_mitigadas: 85.7
            },
            actividad_sospechosa: [
                {
                    tipo: 'multiple_failed_logins',
                    ip: '203.45.67.89',
                    intentos: 6,
                    ultimo_intento: '2025-08-25T12:15:00Z',
                    estado: 'monitoreando'
                },
                {
                    tipo: 'unusual_access_pattern',
                    usuario: 'user123@email.com',
                    ubicaciones: ['Bogotá', 'Madrid'],
                    diferencia_tiempo: '2 horas',
                    estado: 'investigando'
                }
            ],
            configuracion_seguridad: {
                autenticacion: {
                    contraseñas_fuertes: true,
                    autenticacion_2fa: false,
                    bloqueo_automatico: true,
                    tiempo_sesion: '8 horas'
                },
                encriptacion: {
                    datos_en_transito: 'TLS 1.3',
                    datos_en_reposo: 'AES-256',
                    contraseñas: 'bcrypt'
                },
                monitoreo: {
                    logs_auditoria: true,
                    alertas_automaticas: true,
                    retencion_logs: '90 días'
                }
            },
            recomendaciones: [
                {
                    prioridad: 'alta',
                    categoria: 'autenticacion',
                    recomendacion: 'Implementar autenticación de dos factores para administradores',
                    impacto: 'Reduce riesgo de compromiso de cuentas privilegiadas en 75%'
                },
                {
                    prioridad: 'media',
                    categoria: 'monitoreo',
                    recomendacion: 'Configurar alertas para patrones de acceso inusuales',
                    impacto: 'Mejora detección temprana de actividad sospechosa'
                },
                {
                    prioridad: 'baja',
                    categoria: 'configuracion',
                    recomendacion: 'Revisar y actualizar políticas de contraseñas',
                    impacto: 'Mejora seguridad general del sistema'
                }
            ]
        };

        res.json({
            success: true,
            reporte_seguridad: reporteSeguridad,
            generado_automaticamente: true
        });

    } catch (error) {
        console.error('Error generando reporte de seguridad:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// POST /api/seguridad/demo/simular-ataque - Simulación de ataque para testing
router.post('/demo/simular-ataque', async (req, res) => {
    try {
        const { tipo_ataque = 'brute_force', intensidad = 'medium' } = req.body;

        // Simular diferentes tipos de ataques
        let simulacion = {};

        switch (tipo_ataque) {
            case 'brute_force':
                simulacion = {
                    tipo: 'Ataque de Fuerza Bruta',
                    objetivo: 'admin@clinikdent.com',
                    intentos_simulados: intensidad === 'high' ? 50 : intensidad === 'medium' ? 25 : 10,
                    origen: '45.67.89.123',
                    duracion_ataque: intensidad === 'high' ? '15 minutos' : '8 minutos',
                    deteccion: {
                        detectado_en: '2.3 segundos',
                        alertas_generadas: 3,
                        bloqueos_aplicados: 1,
                        mitigacion_automatica: true
                    },
                    resultado: 'BLOQUEADO EXITOSAMENTE'
                };
                break;

            case 'sql_injection':
                simulacion = {
                    tipo: 'Intento de Inyección SQL',
                    endpoint_atacado: '/api/usuarios',
                    payload_detectado: "'; DROP TABLE usuarios; --",
                    origen: '192.168.1.200',
                    deteccion: {
                        detectado_en: '0.1 segundos',
                        mecanismo: 'Validación de entrada',
                        query_bloqueado: true,
                        alerta_generada: true
                    },
                    resultado: 'BLOQUEADO ANTES DE EJECUCIÓN'
                };
                break;

            case 'dos_attack':
                simulacion = {
                    tipo: 'Ataque de Denegación de Servicio',
                    requests_por_segundo: intensidad === 'high' ? 1000 : 500,
                    origen: 'Múltiples IPs (Botnet)',
                    duracion_ataque: '5 minutos',
                    deteccion: {
                        detectado_en: '30 segundos',
                        rate_limiting_activado: true,
                        ips_bloqueadas: 47,
                        trafico_filtrado: '89%'
                    },
                    resultado: 'SERVICIO MANTENIDO ESTABLE'
                };
                break;

            default:
                simulacion = {
                    tipo: 'Ataque Personalizado',
                    mensaje: 'Tipo de ataque no reconocido para simulación',
                    tipos_disponibles: ['brute_force', 'sql_injection', 'dos_attack']
                };
        }

        res.json({
            success: true,
            simulacion_ataque: simulacion,
            timestamp: new Date(),
            nota: 'Esta es una simulación con fines de testing. Ningún ataque real fue ejecutado.'
        });

    } catch (error) {
        console.error('Error en simulación de ataque:', error);
        res.status(500).json({ success: false, message: 'Error en simulación' });
    }
});

// GET /api/seguridad/demo/auditoria-completa - Auditoría completa del sistema
router.get('/demo/auditoria-completa', async (req, res) => {
    try {
        const auditoriaCompleta = {
            resumen_auditoria: {
                fecha_auditoria: new Date().toISOString(),
                auditor: 'Sistema Automatizado Clinikdent',
                version_sistema: '1.0.99',
                duracion_auditoria: '23.7 segundos',
                elementos_auditados: 156
            },
            seguridad_infraestructura: {
                servidor: {
                    sistema_operativo: 'Actualizado',
                    firewall: 'Configurado correctamente',
                    ssl_certificado: 'Válido hasta 2026-08-25',
                    puertos_abiertos: 'Solo necesarios',
                    puntuacion: 95
                },
                base_datos: {
                    encriptacion: 'Habilitada',
                    backups: 'Automatizados diariamente',
                    acceso_restringido: 'Configurado',
                    logs_auditoria: 'Activos',
                    puntuacion: 92
                }
            },
            seguridad_aplicacion: {
                autenticacion: {
                    hashing_passwords: 'bcrypt (seguro)',
                    politicas_contraseña: 'Configuradas',
                    bloqueo_intentos: 'Activo',
                    puntuacion: 88
                },
                autorizacion: {
                    control_acceso: 'Basado en roles',
                    permisos_granulares: 'Implementados',
                    validacion_tokens: 'Activa',
                    puntuacion: 94
                },
                validacion_entrada: {
                    sanitizacion: 'Implementada',
                    validacion_sql: 'Activa',
                    filtros_xss: 'Configurados',
                    puntuacion: 91
                }
            },
            cumplimiento_normativo: {
                proteccion_datos: {
                    consentimiento_usuario: 'Implementado',
                    derecho_olvido: 'Disponible',
                    portabilidad_datos: 'Configurada',
                    puntuacion: 87
                },
                auditoria: {
                    logs_completos: 'Activos',
                    retencion_adecuada: 'Configurada',
                    acceso_controlado: 'Restringido',
                    puntuacion: 93
                }
            },
            recomendaciones_criticas: [
                'Implementar autenticación de dos factores para roles administrativos',
                'Configurar monitoreo de integridad de archivos críticos',
                'Establecer procedimientos de respuesta a incidentes documentados'
            ],
            proxima_auditoria: '2025-09-25T00:00:00Z',
            puntuacion_general: 92.3,
            estado_cumplimiento: 'CONFORME CON MEJORAS RECOMENDADAS'
        };

        res.json({
            success: true,
            auditoria_completa: auditoriaCompleta,
            certificacion: 'Auditoría completada según estándares ISO 27001'
        });

    } catch (error) {
        console.error('Error en auditoría completa:', error);
        res.status(500).json({ success: false, message: 'Error en auditoría' });
    }
});

// ===============================
// NUEVAS RUTAS DE RECUPERACIÓN CON CÓDIGOS DE SEGURIDAD
// NO INTERFIEREN con el sistema existente
// ===============================

const recuperacionController = require('../controllers/recuperacionSeguridadController');

/**
 * POST /api/seguridad/solicitar-codigo
 * Solicita código de seguridad para recuperación de contraseña
 * Body: { correo, numero_documento }
 */
router.post('/solicitar-codigo', (req, res) => {
    console.log('🔐 Ruta seguridad: Solicitar código de recuperación');
    recuperacionController.solicitarCodigoRecuperacion(req, res);
});

/**
 * POST /api/seguridad/validar-codigo
 * Valida código de seguridad y genera nueva contraseña
 * Body: { correo, numero_documento, codigo }
 */
router.post('/validar-codigo', (req, res) => {
    console.log('🔐 Ruta seguridad: Validar código de recuperación');
    recuperacionController.validarCodigoRecuperacion(req, res);
});

console.log('✅ Rutas de seguridad avanzada configuradas');

module.exports = router;
