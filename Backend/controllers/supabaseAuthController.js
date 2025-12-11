const db = require('../config/db');
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

/**
 * POST /api/seguridad/recuperar-password-supabase
 * Envía email de recuperación via Supabase Auth
 * Body: { correo, numero_documento }
 */
exports.solicitarRecuperacion = async (req, res) => {
    console.log('🔐 Solicitud de recuperación con Supabase Auth');
    
    const { correo, numero_documento } = req.body;
    
    if (!correo || !numero_documento) {
        return res.status(400).json({ msg: 'Debe proporcionar correo y número de documento.' });
    }
    
    try {
        // Verificar que el usuario existe en PostgreSQL
        const { rows: usuarios } = await db.query(
            'SELECT id, nombre, apellido, correo, supabase_user_id FROM usuarios WHERE correo = $1 AND numero_documento = $2',
            [correo, numero_documento]
        );
        
        if (!usuarios.length) {
            console.log('❌ Usuario no encontrado');
            return res.status(400).json({ msg: 'Usuario o documento no encontrado.' });
        }
        
        const usuario = usuarios[0];
        console.log('✅ Usuario verificado:', usuario.correo);
        
        // Enviar email de recuperación via Supabase Auth
        const frontend = process.env.FRONTEND_URL || 'http://localhost:3001';
        const redirectUrl = `${frontend}/nueva-password-supabase.html?email=${encodeURIComponent(correo)}`;
        const { data, error } = await supabase.auth.resetPasswordForEmail(correo, {
            redirectTo: redirectUrl
        });
        
        if (error) {
            console.error('❌ Error de Supabase Auth:', error);
            return res.status(500).json({ 
                msg: 'Error al enviar el email de recuperación: ' + error.message 
            });
        }
        
        console.log('✅ Email de recuperación enviado por Supabase Auth');
        
        return res.json({
            msg: 'Se ha enviado un enlace de recuperación a su correo electrónico.',
            success: true
        });
        
    } catch (err) {
        console.error('❌ Error en solicitarRecuperacion:', err);
        return res.status(500).json({ msg: 'Error en el servidor: ' + err.message });
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

        // Actualizar la contraseña en la columna correcta (contraseña_hash)
        const { rows } = await db.query(
            'UPDATE usuarios SET contraseña_hash = $1 WHERE correo = $2 RETURNING id, correo, supabase_user_id',
            [hashedPassword, correo]
        );

        if (!rows.length) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        const usuario = rows[0];

        // Además, intentar sincronizar la contraseña en Supabase Auth si tenemos supabase_user_id
        if (usuario.supabase_user_id) {
            try {
                const { error } = await supabase.auth.admin.updateUserById(usuario.supabase_user_id, { password: nueva_password });
                if (error) {
                    console.error('⚠️ Error sincronizando contraseña en Supabase Auth:', error);
                    // No fallar la petición por esto
                } else {
                    console.log('✅ Contraseña sincronizada en Supabase Auth para:', correo);
                }
            } catch (supErr) {
                console.error('⚠️ Excepción al sincronizar Supabase Auth:', supErr);
            }
        }

        console.log('✅ Contraseña actualizada localmente para:', correo);

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
