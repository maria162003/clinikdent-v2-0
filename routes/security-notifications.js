/**
 * ============================================================================
 * API DE NOTIFICACIONES DE SEGURIDAD - BACKEND
 * Envío de correos electrónicos para alertas de seguridad
 * ============================================================================
 */

const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Configuración del rate limiting para seguridad
const securityNotificationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // máximo 10 notificaciones por IP cada 5 minutos
    message: { error: 'Demasiadas notificaciones de seguridad' }
});

// Configurar transportador de email (temporal: deshabilitado)
let transporter = null;
console.log('⚠️ Servicio de email temporalmente deshabilitado (falta configuración SMTP)');

// Para habilitar email, configurar variables de entorno:
// SMTP_USER=tu-email@gmail.com
// SMTP_PASSWORD=tu-password-app

// Verificar configuración de email (deshabilitado temporalmente)
console.log('💡 Para configurar email, crear archivo .env con credenciales SMTP');

// Email del administrador (desde .env)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'camila@clinikdent.com';
const SYSTEM_EMAIL = process.env.SYSTEM_EMAIL || 'sistema@clinikdent.com';

// ============================================================================
// ENDPOINT PRINCIPAL DE NOTIFICACIONES
// ============================================================================

router.post('/security-notifications', securityNotificationLimiter, async (req, res) => {
    try {
        const { to, subject, template, data } = req.body;

        if (!to || !subject || !template || !data) {
            return res.status(400).json({ 
                error: 'Faltan datos requeridos para la notificación' 
            });
        }

        // Validar token de seguridad
        const securityToken = req.headers['x-security-token'];
        if (!isValidSecurityToken(securityToken)) {
            return res.status(401).json({ 
                error: 'Token de seguridad inválido' 
            });
        }

        // Generar contenido del email según la plantilla
        const emailContent = generateEmailContent(template, data);
        
        // Configurar email
        const mailOptions = {
            from: `"Sistema de Seguridad Clinikdent" <${SYSTEM_EMAIL}>`,
            to: to,
            subject: subject,
            html: emailContent.html,
            text: emailContent.text,
            priority: template.includes('critical') ? 'high' : 'normal'
        };

        // Enviar email (temporalmente deshabilitado)
        if (transporter) {
            const result = await transporter.sendMail(mailOptions);
            console.log('📧 Notificación de seguridad enviada:', {
                to: to,
                subject: subject,
                template: template,
                messageId: result.messageId,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('📧 Notificación simulada (email deshabilitado):', {
                to: to,
                subject: subject,
                template: template,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ 
            success: true, 
            messageId: result.messageId,
            message: 'Notificación enviada correctamente'
        });

    } catch (error) {
        console.error('❌ Error enviando notificación de seguridad:', error);
        
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================================================
// GENERADOR DE CONTENIDO DE EMAILS
// ============================================================================

function generateEmailContent(template, data) {
    const baseStyle = `
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-critical { background: #dc3545; color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .alert-warning { background: #ffc107; color: #333; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .alert-info { background: #17a2b8; color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .data-table th, .data-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .data-table th { background-color: #f2f2f2; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
        </style>
    `;

    switch (template) {
        case 'security-alert':
            return {
                html: `
                    ${baseStyle}
                    <div class="container">
                        <div class="header">
                            <h1>🚨 ALERTA DE SEGURIDAD</h1>
                            <p>Sistema de Monitoreo Clinikdent</p>
                        </div>
                        <div class="content">
                            <div class="alert-warning">
                                <h3>⚠️ Actividad Sospechosa Detectada</h3>
                                <p><strong>Severidad:</strong> ${data.severity}</p>
                            </div>
                            
                            <table class="data-table">
                                <tr><th>Tipo de Evento</th><td>${data.type}</td></tr>
                                <tr><th>Email Afectado</th><td>${data.email}</td></tr>
                                <tr><th>Número de Intentos</th><td>${data.attempts}</td></tr>
                                <tr><th>Fecha y Hora</th><td>${data.timestamp}</td></tr>
                                <tr><th>Navegador</th><td>${data.userAgent?.substring(0, 100) || 'No disponible'}</td></tr>
                                <tr><th>IP Cliente</th><td>${data.ip || 'No disponible'}</td></tr>
                            </table>

                            <div class="alert-info">
                                <h4>📋 Acción Requerida:</h4>
                                <p>${data.actionRequired}</p>
                            </div>

                            <p><strong>Recomendaciones:</strong></p>
                            <ul>
                                <li>Verificar si la actividad es legítima del usuario</li>
                                <li>Contactar al usuario si es necesario</li>
                                <li>Monitorear actividad adicional</li>
                                <li>Revisar logs del sistema para patrones</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>Este email fue generado automáticamente por el Sistema de Seguridad Clinikdent</p>
                            <p>No responder a este email</p>
                        </div>
                    </div>
                `,
                text: `
                    ALERTA DE SEGURIDAD - CLINIKDENT
                    
                    Actividad sospechosa detectada:
                    - Tipo: ${data.type}
                    - Email: ${data.email}
                    - Intentos: ${data.attempts}
                    - Timestamp: ${data.timestamp}
                    - Acción requerida: ${data.actionRequired}
                    
                    Por favor revise inmediatamente.
                `
            };

        case 'critical-alert':
            return {
                html: `
                    ${baseStyle}
                    <div class="container">
                        <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #6f42c1 100%);">
                            <h1>🔴 ALERTA CRÍTICA</h1>
                            <p>¡ATENCIÓN INMEDIATA REQUERIDA!</p>
                        </div>
                        <div class="content">
                            <div class="alert-critical">
                                <h3>🚫 CUENTA SUSPENDIDA POR SEGURIDAD</h3>
                                <p><strong>Prioridad:</strong> ${data.priority}</p>
                            </div>
                            
                            <table class="data-table">
                                <tr><th>Email Suspendido</th><td>${data.email}</td></tr>
                                <tr><th>Fecha de Suspensión</th><td>${data.timestamp}</td></tr>
                                <tr><th>Motivo</th><td>${data.suspensionData?.reason || 'Múltiples intentos fallidos'}</td></tr>
                                <tr><th>Total de Fallos</th><td>${data.suspensionData?.totalFailures || 'No disponible'}</td></tr>
                                <tr><th>Último Intento</th><td>${data.suspensionData?.lastAttempt ? new Date(data.suspensionData.lastAttempt).toLocaleString('es-ES') : 'No disponible'}</td></tr>
                            </table>

                            <div class="alert-critical">
                                <h4>🚨 ACCIONES INMEDIATAS REQUERIDAS:</h4>
                                <ul>
                                    <li><strong>Contactar al usuario inmediatamente</strong></li>
                                    <li><strong>Verificar identidad antes de reactivar</strong></li>
                                    <li><strong>Revisar logs de seguridad completos</strong></li>
                                    <li><strong>Evaluar si es un ataque dirigido</strong></li>
                                </ul>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}" class="btn">Ir al Panel de Administración</a>
                                <a href="${process.env.SECURITY_DASHBOARD_URL || '#'}" class="btn">Ver Dashboard de Seguridad</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p><strong>Este es un email de alta prioridad del Sistema de Seguridad</strong></p>
                            <p>Responder inmediatamente es crítico para la seguridad del sistema</p>
                        </div>
                    </div>
                `,
                text: `
                    *** ALERTA CRÍTICA - CLINIKDENT ***
                    
                    CUENTA SUSPENDIDA POR SEGURIDAD:
                    - Email: ${data.email}
                    - Suspendida: ${data.timestamp}
                    - Motivo: ${data.suspensionData?.reason}
                    - Total fallos: ${data.suspensionData?.totalFailures}
                    
                    ACCIÓN INMEDIATA REQUERIDA
                    Contactar usuario y verificar identidad.
                `
            };

        case 'recovery-request':
            return {
                html: `
                    ${baseStyle}
                    <div class="container">
                        <div class="header">
                            <h1>📧 SOLICITUD DE RECUPERACIÓN</h1>
                            <p>Sistema de Seguridad Clinikdent</p>
                        </div>
                        <div class="content">
                            <div class="alert-info">
                                <h3>🔐 Solicitud de Recuperación de Cuenta</h3>
                                <p>Un usuario ha solicitado recuperar acceso a su cuenta</p>
                            </div>
                            
                            <table class="data-table">
                                <tr><th>Email del Usuario</th><td>${data.email}</td></tr>
                                <tr><th>Fecha de Solicitud</th><td>${data.timestamp}</td></tr>
                                <tr><th>ID de Solicitud</th><td>${data.requestId}</td></tr>
                                <tr><th>Tipo</th><td>Recuperación de Cuenta</td></tr>
                            </table>

                            <div class="alert-warning">
                                <h4>📋 Pasos a Seguir:</h4>
                                <ol>
                                    <li>Verificar la identidad del usuario</li>
                                    <li>Confirmar que es el propietario legítimo</li>
                                    <li>Reactivar la cuenta si procede</li>
                                    <li>Informar al usuario sobre la resolución</li>
                                </ol>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="mailto:${data.email}?subject=Re: Recuperación de Cuenta Clinikdent&body=Estimado usuario, hemos recibido su solicitud..." class="btn">Responder al Usuario</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Solicitud generada automáticamente por el sistema</p>
                        </div>
                    </div>
                `,
                text: `
                    SOLICITUD DE RECUPERACIÓN - CLINIKDENT
                    
                    Usuario: ${data.email}
                    Fecha: ${data.timestamp}
                    ID: ${data.requestId}
                    
                    Verificar identidad y proceder según protocolo.
                `
            };

        case 'password-reset-user':
            return {
                html: `
                    ${baseStyle}
                    <div class="container">
                        <div class="header">
                            <h1>🔑 RECUPERACIÓN DE CONTRASEÑA</h1>
                            <p>Clinikdent - Sistema Médico</p>
                        </div>
                        <div class="content">
                            <h3>Hola,</h3>
                            <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta.</p>
                            
                            <div class="alert-info">
                                <h4>🔐 Restablecer Contraseña</h4>
                                <p>Haga clic en el siguiente enlace para crear una nueva contraseña:</p>
                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${data.resetLink}" class="btn" style="font-size: 16px; padding: 15px 30px;">RESTABLECER CONTRASEÑA</a>
                                </div>
                            </div>

                            <div class="alert-warning">
                                <h4>⚠️ Información Importante:</h4>
                                <ul>
                                    <li>Este enlace expira en <strong>${data.expiresIn}</strong></li>
                                    <li>Solo puede ser usado una vez</li>
                                    <li>Si no solicitó este cambio, ignore este email</li>
                                    <li>Su contraseña actual sigue siendo válida hasta que la cambie</li>
                                </ul>
                            </div>

                            <p><strong>¿No puede hacer clic en el enlace?</strong><br>
                            Copie y pegue esta URL en su navegador:</p>
                            <p style="background: #f8f9fa; padding: 10px; word-break: break-all; font-family: monospace;">
                                ${data.resetLink}
                            </p>
                        </div>
                        <div class="footer">
                            <p>Si tiene problemas, contacte nuestro soporte: soporte@clinikdent.com</p>
                            <p>Este email fue enviado el ${data.timestamp}</p>
                        </div>
                    </div>
                `,
                text: `
                    RECUPERACIÓN DE CONTRASEÑA - CLINIKDENT
                    
                    Hemos recibido una solicitud para restablecer su contraseña.
                    
                    Enlace de recuperación:
                    ${data.resetLink}
                    
                    Este enlace expira en ${data.expiresIn}.
                    Si no solicitó este cambio, ignore este email.
                    
                    Soporte: soporte@clinikdent.com
                `
            };

        case 'password-reset-admin':
            return {
                html: `
                    ${baseStyle}
                    <div class="container">
                        <div class="header">
                            <h1>📊 NOTIFICACIÓN ADMIN</h1>
                            <p>Solicitud de Reset de Contraseña</p>
                        </div>
                        <div class="content">
                            <div class="alert-info">
                                <h3>🔑 Reset de Contraseña Solicitado</h3>
                                <p>Un usuario ha solicitado restablecer su contraseña</p>
                            </div>
                            
                            <table class="data-table">
                                <tr><th>Email del Usuario</th><td>${data.email}</td></tr>
                                <tr><th>Fecha de Solicitud</th><td>${data.timestamp}</td></tr>
                                <tr><th>Token Generado</th><td>${data.resetToken?.substring(0, 20)}...</td></tr>
                            </table>

                            <p><strong>Nota:</strong> Se ha enviado un enlace de recuperación al usuario. El enlace expira en 24 horas.</p>
                        </div>
                        <div class="footer">
                            <p>Notificación automática del sistema</p>
                        </div>
                    </div>
                `,
                text: `
                    NOTIFICACIÓN ADMIN - RESET CONTRASEÑA
                    
                    Usuario: ${data.email}
                    Fecha: ${data.timestamp}
                    Token: ${data.resetToken?.substring(0, 20)}...
                    
                    Enlace de recuperación enviado al usuario.
                `
            };

        default:
            return {
                html: `<p>Plantilla no encontrada: ${template}</p>`,
                text: `Plantilla no encontrada: ${template}`
            };
    }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function isValidSecurityToken(token) {
    if (!token) return false;
    
    try {
        // Validación básica del token (en producción usar JWT o similar)
        const decoded = atob(token);
        return decoded.includes('security_service') || decoded.includes('security_token');
    } catch (error) {
        return false;
    }
}

// ============================================================================
// ENDPOINT DE PRUEBA (solo desarrollo)
// ============================================================================

if (process.env.NODE_ENV === 'development') {
    router.get('/test-email', async (req, res) => {
        try {
            const testData = {
                to: ADMIN_EMAIL,
                subject: '🧪 Prueba del Sistema de Notificaciones',
                template: 'security-alert',
                data: {
                    type: 'test_alert',
                    email: 'test@example.com',
                    attempts: 1,
                    severity: 'BAJA',
                    timestamp: new Date().toLocaleString('es-ES'),
                    actionRequired: 'Esta es una prueba del sistema',
                    userAgent: 'Test Browser',
                    ip: '127.0.0.1'
                }
            };

            const emailContent = generateEmailContent(testData.template, testData.data);
            
            const mailOptions = {
                from: `"Sistema de Seguridad Clinikdent" <${SYSTEM_EMAIL}>`,
                to: testData.to,
                subject: testData.subject,
                html: emailContent.html,
                text: emailContent.text
            };

            if (transporter) {
                const result = await transporter.sendMail(mailOptions);
                res.json({ 
                    success: true, 
                    messageId: result.messageId,
                    message: 'Email de prueba enviado correctamente'
                });
            } else {
                res.json({ 
                    success: true,
                    message: 'Email simulado (configuración SMTP no disponible)',
                    simulated: true
                });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = router;