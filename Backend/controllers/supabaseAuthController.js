const db = require('../config/db');
const supabase = require('../config/supabase');
const SeguridadService = require('../services/seguridadService');
const bcrypt = require('bcrypt');

exports.solicitarRecuperacion = async (req, res) => {
    console.log(' Solicitud de recuperación con Supabase Auth');
    
    const { correo, numero_documento } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!correo || !numero_documento) {
        return res.status(400).json({ msg: 'Debe proporcionar correo y número de documento.' });
    }
    
    try {
        const bloqueo = await SeguridadService.verificarBloqueo(correo, numero_documento, ip);
        if (bloqueo) {
            return res.status(423).json({
                msg: 'Su cuenta está bloqueada temporalmente por seguridad.',
                bloqueado: true
            });
        }
        
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
        console.log(' Usuario verificado:', usuario.correo);
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(correo, {
            redirectTo: ${process.env.FRONTEND_URL || 'http://localhost:3001'}/nueva-password-supabase.html
        });
        
        if (error) {
            console.error(' Error de Supabase Auth:', error);
            return res.status(500).json({ msg: 'Error al enviar el email de recuperación.' });
        }
        
        console.log(' Email de recuperación enviado por Supabase Auth');
        
        await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'exitoso', {
            accion: 'solicitud_recuperacion_exitosa',
            usuario_id: usuario.id,
            metodo: 'supabase_auth'
        });
        
        return res.json({
            msg: 'Se ha enviado un enlace de recuperación a su correo electrónico.',
            success: true
        });
        
    } catch (err) {
        console.error('Error en solicitarRecuperacion:', err);
        return res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

exports.actualizarPassword = async (req, res) => {
    console.log(' Actualizar password con Supabase Auth');
    
    const { correo, nueva_password } = req.body;
    
    if (!correo || !nueva_password) {
        return res.status(400).json({ msg: 'Debe proporcionar correo y nueva contraseña.' });
    }
    
    if (nueva_password.length < 6) {
        return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(nueva_password, 10);
        
        const { rows } = await db.query(
            'UPDATE usuarios SET password = $1 WHERE correo = $2 RETURNING id, correo',
            [hashedPassword, correo]
        );
        
        if (!rows.length) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }
        
        console.log(' Contraseña actualizada para:', correo);
        
        return res.json({
            msg: 'Contraseña actualizada correctamente.',
            success: true
        });
        
    } catch (err) {
        console.error('Error en actualizarPassword:', err);
        return res.status(500).json({ msg: 'Error al actualizar contraseña.' });
    }
};

module.exports = { 
    solicitarRecuperacion: exports.solicitarRecuperacion,
    actualizarPassword: exports.actualizarPassword
};
