// Controller de Seguridad Avanzada - NO INTERFIERE CON FUNCIONALIDADES EXISTENTES
const db = require('../config/db');
const emailService = require('../services/emailService');

/**
 * Servicio de seguridad que mejora el sistema existente sin romper nada
 */
class SeguridadService {
    
    // Obtener configuración de seguridad
    static async obtenerConfiguracion(parametro) {
        try {
            const result = await db.query(
                'SELECT valor FROM configuracion_seguridad WHERE parametro = $1 AND activo = true',
                [parametro]
            );
            return result.rows[0]?.valor || null;
        } catch (err) {
            console.error('Error obteniendo configuración:', err);
            return null;
        }
    }
    
    // Registrar intento de login (NO INTERFIERE con el login existente)
    static async registrarIntentoLogin(email, documento, ip, userAgent, resultado, detalles = {}) {
        try {
            await db.query(`
                INSERT INTO intentos_login 
                (email_intento, numero_documento, ip_origen, user_agent, resultado, detalles_adicionales)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [email, documento, ip, userAgent, resultado, JSON.stringify(detalles)]);
        } catch (err) {
            console.error('Error registrando intento de login:', err);
        }
    }
    
    // Verificar si está bloqueado (NO INTERFIERE, solo informa)
    static async verificarBloqueo(email, documento, ip) {
        try {
            const result = await db.query(`
                SELECT * FROM bloqueos_seguridad 
                WHERE (
                    (tipo_bloqueo = 'email' AND valor_bloqueado = $1) OR
                    (tipo_bloqueo = 'documento' AND valor_bloqueado = $2) OR
                    (tipo_bloqueo = 'ip' AND valor_bloqueado = $3)
                ) 
                AND estado = 'activo' 
                AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
            `, [email, documento, ip]);
            
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error verificando bloqueo:', err);
            return null;
        }
    }
    
    // Contar intentos fallidos recientes
    static async contarIntentosFallidos(email, documento) {
        try {
            const tiempoLimite = await this.obtenerConfiguracion('tiempo_bloqueo_minutos') || '15';
            
            const result = await db.query(`
                SELECT COUNT(*) as intentos 
                FROM intentos_login 
                WHERE (email_intento = $1 OR numero_documento = $2)
                AND resultado IN ('email_incorrecto', 'password_incorrecto', 'documento_incorrecto')
                AND timestamp_intento > NOW() - INTERVAL '${tiempoLimite} minutes'
            `, [email, documento]);
            
            return parseInt(result.rows[0].intentos);
        } catch (err) {
            console.error('Error contando intentos fallidos:', err);
            return 0;
        }
    }
    
    // Crear bloqueo automático
    static async crearBloqueoAutomatico(email, documento, ip, intentos) {
        try {
            const tiempoBloqueo = await this.obtenerConfiguracion('tiempo_bloqueo_minutos') || '15';
            const fechaExpiracion = new Date();
            fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + parseInt(tiempoBloqueo));
            
            // Bloquear por email
            await db.query(`
                INSERT INTO bloqueos_seguridad 
                (tipo_bloqueo, valor_bloqueado, razon_bloqueo, fecha_expiracion, intentos_automaticos)
                VALUES ($1, $2, $3, $4, $5)
            `, ['email', email, `Bloqueo automático por ${intentos} intentos fallidos`, fechaExpiracion, intentos]);
            
            // Bloquear por documento si se proporcionó
            if (documento) {
                await db.query(`
                    INSERT INTO bloqueos_seguridad 
                    (tipo_bloqueo, valor_bloqueado, razon_bloqueo, fecha_expiracion, intentos_automaticos)
                    VALUES ($1, $2, $3, $4, $5)
                `, ['documento', documento, `Bloqueo automático por ${intentos} intentos fallidos`, fechaExpiracion, intentos]);
            }
            
            // Enviar notificación por email
            await this.enviarNotificacionBloqueo(email, fechaExpiracion);
            
            return fechaExpiracion;
        } catch (err) {
            console.error('Error creando bloqueo automático:', err);
            return null;
        }
    }
    
    // Generar código de seguridad
    static async generarCodigoSeguridad(email, documento, tipo, ip) {
        try {
            // Limpiar códigos expirados
            await db.query('DELETE FROM codigos_seguridad WHERE fecha_expiracion < NOW()');
            
            // Limpiar códigos anteriores del usuario
            await db.query(`
                DELETE FROM codigos_seguridad 
                WHERE (email = $1 OR numero_documento = $2) AND tipo_codigo = $3
            `, [email, documento, tipo]);
            
            // Generar código de 4 dígitos
            const codigo = Math.floor(1000 + Math.random() * 9000).toString();
            
            // Configurar expiración (5 minutos por defecto)
            const duracionMinutos = await this.obtenerConfiguracion('duracion_codigo_seguridad_minutos') || '5';
            const fechaExpiracion = new Date();
            fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + parseInt(duracionMinutos));
            
            // Guardar código
            await db.query(`
                INSERT INTO codigos_seguridad 
                (email, numero_documento, codigo, tipo_codigo, fecha_expiracion, ip_origen)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [email, documento, codigo, tipo, fechaExpiracion, ip]);
            
            return { codigo, fechaExpiracion };
        } catch (err) {
            console.error('Error generando código de seguridad:', err);
            return null;
        }
    }
    
    // Validar código de seguridad
    static async validarCodigoSeguridad(email, documento, codigo, tipo) {
        try {
            // Buscar código válido
            const result = await db.query(`
                SELECT * FROM codigos_seguridad 
                WHERE (email = $1 OR numero_documento = $2)
                AND codigo = $3 
                AND tipo_codigo = $4
                AND fecha_expiracion > NOW()
                AND usado = false
            `, [email, documento, codigo, tipo]);
            
            if (result.rows.length === 0) {
                return { valido: false, razon: 'codigo_invalido_expirado' };
            }
            
            const codigoData = result.rows[0];
            
            // Incrementar intentos usados
            const nuevosIntentos = codigoData.intentos_usados + 1;
            await db.query(`
                UPDATE codigos_seguridad 
                SET intentos_usados = $1 
                WHERE id = $2
            `, [nuevosIntentos, codigoData.id]);
            
            // Verificar si excedió máximo intentos
            if (nuevosIntentos > codigoData.max_intentos) {
                await db.query(`
                    UPDATE codigos_seguridad 
                    SET usado = true 
                    WHERE id = $1
                `, [codigoData.id]);
                
                return { valido: false, razon: 'excedio_intentos', intentos_restantes: 0 };
            }
            
            // Marcar como usado
            await db.query(`
                UPDATE codigos_seguridad 
                SET usado = true 
                WHERE id = $1
            `, [codigoData.id]);
            
            return { 
                valido: true, 
                codigo_id: codigoData.id,
                intentos_restantes: codigoData.max_intentos - nuevosIntentos
            };
            
        } catch (err) {
            console.error('Error validando código de seguridad:', err);
            return { valido: false, razon: 'error_interno' };
        }
    }
    
    // Enviar notificación de bloqueo
    static async enviarNotificacionBloqueo(email, fechaExpiracion) {
        try {
            const fechaFormateada = fechaExpiracion.toLocaleString('es-ES', {
                timeZone: 'America/Bogota',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const mensaje = `Su cuenta ha sido bloqueada temporalmente por seguridad debido a múltiples intentos de acceso fallidos. El bloqueo se levantará automáticamente el ${fechaFormateada}.`;
            
            await emailService.sendEmail(email, 'Cuenta Bloqueada - ClinikDent', mensaje);
            console.log(`Notificación de bloqueo enviada a ${email}`);
        } catch (err) {
            console.error('Error enviando notificación de bloqueo:', err);
        }
    }
    
    // Limpiar datos expirados automáticamente
    static async limpiarDatosExpirados() {
        try {
            // Limpiar códigos expirados
            await db.query('DELETE FROM codigos_seguridad WHERE fecha_expiracion < NOW()');
            
            // Limpiar intentos antiguos (más de 30 días)
            await db.query(`DELETE FROM intentos_login WHERE timestamp_intento < NOW() - INTERVAL '30 days'`);
            
            // Marcar bloqueos expirados
            await db.query(`
                UPDATE bloqueos_seguridad 
                SET estado = 'expirado' 
                WHERE fecha_expiracion IS NOT NULL 
                AND fecha_expiracion < NOW() 
                AND estado = 'activo'
            `);
            
            console.log('Datos de seguridad expirados limpiados');
        } catch (err) {
            console.error('Error limpiando datos expirados:', err);
        }
    }
}

module.exports = SeguridadService;