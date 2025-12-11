const db = require('../config/db');
const crypto = require('crypto');
const SeguridadService = require('../services/seguridadService');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Configurar transporter de email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * POST /api/seguridad/recuperar-password
 * Envía email de recuperación con token propio (sin Supabase Auth)
 */
exports.solicitarRecuperacion = async (req, res) => {
    console.log('🔐 Solicitud de recuperación con sistema propio de tokens');
    
    const { correo, numero_documento } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!correo || !numero_documento) {
        return res.status(400).json({ msg: 'Debe proporcionar correo y número de documento.' });
    }
    
    try {
        // Verificar bloqueo de seguridad
        const bloqueo = await SeguridadService.verificarBloqueo(correo, numero_documento, ip);
        if (bloqueo) {
            return res.status(423).json({
                msg: 'Su cuenta está bloqueada temporalmente por seguridad.',
                bloqueado: true
            });
        }
        
        // Buscar usuario en PostgreSQL
        const { rows: usuarios } = await db.query(
            'SELECT id, nombre, apellido, correo FROM usuarios WHERE correo = $1 AND numero_documento = $2',
            [correo, numero_documento]
        );
        
        if (!usuarios.length) {
            await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'password_incorrecto', {
                accion: 'solicitud_recuperacion_fallida',
                razon: 'usuario_no_encontrado'
            });
            return res.status(400).json({ msg: 'Usuario o documento no encontrado.' });
        }
        
        const usuario = usuarios[0];
        console.log('✅ Usuario verificado:', usuario.correo);
        
        // Generar token de recuperación único
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        
        // Guardar token en la base de datos
        await db.query(
            `UPDATE usuarios 
             SET reset_token = $1, reset_token_expiry = $2 
             WHERE id = $3`,
            [resetTokenHash, resetTokenExpiry, usuario.id]
        );
        
        console.log('🔑 Token de recuperación generado y guardado');
        
        // Crear URL de recuperación
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password.html?token=${resetToken}`;
        
        // Enviar email con el token
        const mailOptions = {
            from: `"Clinikdent" <${process.env.EMAIL_USER}>`,
            to: correo,
            subject: '🔐 Recuperación de Contraseña - Clinikdent',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #0077b6, #00a3e1); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
                        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #0077b6, #00a3e1); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Clinikdent</h1>
                            <p>Recuperación de Contraseña</p>
                        </div>
                        <div class="content">
                            <h2>Hola ${usuario.nombre},</h2>
                            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Clinikdent.</p>
                            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                            <center>
                                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                            </center>
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                            </p>
                            <p style="color: #0077b6; word-break: break-all; font-size: 14px;">
                                ${resetUrl}
                            </p>
                            <div class="warning">
                                <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>60 minutos</strong> por seguridad.
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2025 Clinikdent. Todos los derechos reservados.</p>
                            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log('✅ Email de recuperación enviado exitosamente a:', correo);
        } catch (emailError) {
            console.error('❌ Error al enviar email:', emailError);
            return res.status(500).json({ 
                msg: 'Error al enviar el email. Verifica la configuración SMTP en .env (EMAIL_USER y EMAIL_PASS).',
                error: emailError.message
            });
        }
        
        // Registrar intento exitoso
        await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'exitoso', {
            accion: 'solicitud_recuperacion_exitosa',
            usuario_id: usuario.id,
            metodo: 'sistema_propio_nodemailer'
        });
        
        return res.json({
            msg: 'Se ha enviado un enlace de recuperación a su correo electrónico.',
            success: true
        });
        
    } catch (err) {
        console.error('❌ Error en solicitarRecuperacion:', err);
        return res.status(500).json({ msg: 'Error en el servidor: ' + err.message });
    }
};

/**
 * POST /api/auth/reset-password
 * Valida el token y actualiza la contraseña
 */
exports.resetPasswordConToken = async (req, res) => {
    console.log('🔑 Validando token y actualizando contraseña');
    
    const { token, nueva_password } = req.body;
    
    if (!token || !nueva_password) {
        return res.status(400).json({ msg: 'Debe proporcionar token y nueva contraseña.' });
    }
    
    if (nueva_password.length < 6) {
        return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    
    try {
        // Hash del token recibido
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Buscar usuario con este token y que no haya expirado
        const { rows: usuarios } = await db.query(
            `SELECT id, nombre, correo 
             FROM usuarios 
             WHERE reset_token = $1 
             AND reset_token_expiry > NOW()`,
            [resetTokenHash]
        );
        
        if (!usuarios.length) {
            console.log('❌ Token inválido o expirado');
            return res.status(400).json({ 
                msg: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.' 
            });
        }
        
        const usuario = usuarios[0];
        console.log('✅ Token válido para usuario:', usuario.correo);
        
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(nueva_password, 10);
        
        // Actualizar contraseña y limpiar token
        await db.query(
            `UPDATE usuarios 
             SET contraseña_hash = $1, 
                 reset_token = NULL, 
                 reset_token_expiry = NULL 
             WHERE id = $2`,
            [hashedPassword, usuario.id]
        );
        
        console.log('✅ Contraseña actualizada para:', usuario.correo);
        
        return res.json({
            msg: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.',
            success: true
        });
        
    } catch (err) {
        console.error('❌ Error en resetPasswordConToken:', err);
        return res.status(500).json({ msg: 'Error al actualizar contraseña: ' + err.message });
    }
};

module.exports = {
    solicitarRecuperacion,
    resetPasswordConToken: exports.resetPasswordConToken
};
