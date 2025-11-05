// Controlador de Recuperación de Contraseña con Seguridad Avanzada
// NO INTERFIERE con el sistema existente, solo lo mejora
const db = require('../config/db');
const emailService = require('../services/emailService');
const SeguridadService = require('../services/seguridadService');

/**
 * POST /api/auth/solicitar-codigo-recuperacion
 * Paso 1: Solicitar código de seguridad para recuperación
 */
exports.solicitarCodigoRecuperacion = async (req, res) => {
    console.log('🔐 Solicitando código de recuperación con seguridad mejorada');
    
    const { correo, numero_documento } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!correo || !numero_documento) {
        return res.status(400).json({ 
            msg: 'Debe proporcionar correo electrónico y número de documento.' 
        });
    }
    
    try {
        // 1. Verificar si está bloqueado
        const bloqueo = await SeguridadService.verificarBloqueo(correo, numero_documento, ip);
        if (bloqueo) {
            await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'cuenta_bloqueada');
            
            const tiempoRestante = bloqueo.fecha_expiracion 
                ? Math.ceil((new Date(bloqueo.fecha_expiracion) - new Date()) / (1000 * 60))
                : 'indefinido';
                
            return res.status(423).json({
                msg: `Su cuenta está bloqueada por seguridad. ${tiempoRestante !== 'indefinido' ? `Tiempo restante: ${tiempoRestante} minutos.` : 'Contacte al administrador.'}`,
                bloqueado: true,
                tiempo_restante: tiempoRestante
            });
        }
        
        // 2. Verificar que el usuario existe
        const { rows } = await db.query(
            'SELECT id, nombre, apellido FROM usuarios WHERE correo = $1 AND numero_documento = $2',
            [correo, numero_documento]
        );
        
        if (!rows.length) {
            // Registrar intento fallido
            await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'documento_incorrecto');
            
            // Verificar si necesita bloqueo
            const intentosFallidos = await SeguridadService.contarIntentosFallidos(correo, numero_documento);
            const maxIntentos = parseInt(await SeguridadService.obtenerConfiguracion('max_intentos_login')) || 3;
            
            if (intentosFallidos >= maxIntentos) {
                await SeguridadService.crearBloqueoAutomatico(correo, numero_documento, ip, intentosFallidos);
                return res.status(423).json({
                    msg: 'Su cuenta ha sido bloqueada temporalmente por seguridad. Recibirá un correo con instrucciones.',
                    bloqueado: true
                });
            }
            
            const intentosRestantes = maxIntentos - intentosFallidos;
            return res.status(400).json({ 
                msg: `Los datos ingresados no coinciden con ninguna cuenta. Intentos restantes: ${intentosRestantes}`,
                intentos_restantes: intentosRestantes
            });
        }
        
        const usuario = rows[0];
        
        // 3. Generar código de seguridad
        const codigoData = await SeguridadService.generarCodigoSeguridad(
            correo, 
            numero_documento, 
            'recuperacion_password', 
            ip
        );
        
        if (!codigoData) {
            return res.status(500).json({ msg: 'Error generando código de seguridad.' });
        }
        
        // 4. Enviar email con código
        const tiempoExpiracion = Math.ceil((codigoData.fechaExpiracion - new Date()) / (1000 * 60));
        
        const emailResult = await emailService.sendEmail(
            correo,
            'Código de Seguridad - ClinikDent',
            `
            <h2>Código de Seguridad</h2>
            <p>Estimado(a) ${usuario.nombre} ${usuario.apellido},</p>
            <p>Hemos recibido su solicitud para recuperar su contraseña. Su código de seguridad es:</p>
            <h1 style="color: #007bff; font-size: 2em; text-align: center; border: 2px solid #007bff; padding: 10px; display: inline-block;">${codigoData.codigo}</h1>
            <p><strong>Este código tiene una vigencia de ${tiempoExpiracion} minutos.</strong></p>
            <p>Si no solicitó este código, ignore este mensaje.</p>
            <br>
            <p>Por seguridad, no comparta este código con nadie.</p>
            `
        );
        
        // 5. Registrar intento exitoso
        await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'exitoso', {
            accion: 'solicitud_codigo_recuperacion',
            usuario_id: usuario.id
        });
        
        if (emailResult.success) {
            return res.json({
                msg: `Se ha enviado un código de seguridad a su correo electrónico. Válido por ${tiempoExpiracion} minutos.`,
                success: true,
                vigencia_minutos: tiempoExpiracion,
                siguiente_paso: 'validar_codigo'
            });
        } else {
            return res.status(500).json({
                msg: 'Error enviando el código de seguridad.',
                success: false
            });
        }
        
    } catch (err) {
        console.error('Error en solicitarCodigoRecuperacion:', err);
        return res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * POST /api/auth/validar-codigo-recuperacion  
 * Paso 2: Validar código y generar nueva contraseña
 */
exports.validarCodigoRecuperacion = async (req, res) => {
    console.log('🔐 Validando código de recuperación');
    
    const { correo, numero_documento, codigo } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!correo || !numero_documento || !codigo) {
        return res.status(400).json({ 
            msg: 'Debe proporcionar correo, documento y código de seguridad.' 
        });
    }
    
    try {
        // 1. Verificar bloqueo
        const bloqueo = await SeguridadService.verificarBloqueo(correo, numero_documento, ip);
        if (bloqueo) {
            return res.status(423).json({
                msg: 'Su cuenta está bloqueada por seguridad.',
                bloqueado: true
            });
        }
        
        // 2. Validar código
        const validacion = await SeguridadService.validarCodigoSeguridad(
            correo, 
            numero_documento, 
            codigo, 
            'recuperacion_password'
        );
        
        if (!validacion.valido) {
            await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'password_incorrecto', {
                accion: 'validacion_codigo_fallida',
                razon: validacion.razon
            });
            
            const mensajes = {
                'codigo_invalido_expirado': 'El código es inválido o ha expirado.',
                'excedio_intentos': 'Ha excedido el número máximo de intentos para este código.',
                'error_interno': 'Error interno del sistema.'
            };
            
            return res.status(400).json({
                msg: mensajes[validacion.razon] || 'Código inválido.',
                intentos_restantes: validacion.intentos_restantes || 0
            });
        }
        
        // 3. Buscar usuario
        const { rows } = await db.query(
            'SELECT id, nombre, apellido FROM usuarios WHERE correo = $1 AND numero_documento = $2',
            [correo, numero_documento]
        );
        
        if (!rows.length) {
            return res.status(400).json({ msg: 'Usuario no encontrado.' });
        }
        
        const usuario = rows[0];
        
        // 4. Generar nueva contraseña temporal
        const nuevaPassword = Math.random().toString(36).slice(-8); // 8 caracteres aleatorios
        
        // 5. Actualizar contraseña en la base de datos (usando el método existente)
        await db.query(
            'UPDATE usuarios SET password = $1 WHERE id = $2',
            [nuevaPassword, usuario.id] // Nota: En producción esto debería ser hasheado
        );
        
        // 6. Enviar nueva contraseña por email
        const emailResult = await emailService.sendEmail(
            correo,
            'Nueva Contraseña - ClinikDent',
            `
            <h2>Nueva Contraseña Temporal</h2>
            <p>Estimado(a) ${usuario.nombre} ${usuario.apellido},</p>
            <p>Su nueva contraseña temporal para acceder al sistema es:</p>
            <h2 style="color: #28a745; font-size: 1.5em; text-align: center; border: 2px solid #28a745; padding: 10px; display: inline-block;">${nuevaPassword}</h2>
            <p><strong>Por seguridad, le recomendamos cambiar esta contraseña después de iniciar sesión.</strong></p>
            <p>Para ingresar al sistema, use esta contraseña temporal junto con su correo electrónico.</p>
            <br>
            <p>Si no solicitó este cambio, contacte inmediatamente al administrador del sistema.</p>
            `
        );
        
        // 7. Registrar recuperación exitosa
        await SeguridadService.registrarIntentoLogin(correo, numero_documento, ip, userAgent, 'exitoso', {
            accion: 'recuperacion_password_exitosa',
            usuario_id: usuario.id,
            codigo_validado: validacion.codigo_id
        });
        
        if (emailResult.success) {
            return res.json({
                msg: 'Se ha enviado su nueva contraseña temporal a su correo electrónico.',
                success: true,
                siguiente_paso: 'iniciar_sesion'
            });
        } else {
            return res.status(500).json({
                msg: 'Error enviando la nueva contraseña.',
                success: false
            });
        }
        
    } catch (err) {
        console.error('Error en validarCodigoRecuperacion:', err);
        return res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

module.exports = {
    solicitarCodigoRecuperacion: exports.solicitarCodigoRecuperacion,
    validarCodigoRecuperacion: exports.validarCodigoRecuperacion
};