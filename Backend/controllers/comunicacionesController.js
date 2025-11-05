/**
 * Controlador de Sistema de Comunicaciones y Notificaciones
 * Gestión de chat, notificaciones, recordatorios y comunicaciones familiares
 */

const pool = require('../config/db');
const fs = require('fs').promises;

console.log('💬 Cargando comunicacionesController...');

// ==========================================
// SISTEMA DE CHAT
// ==========================================

// Obtener conversaciones del usuario
exports.obtenerConversaciones = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];
        console.log('💬 Obteniendo conversaciones para usuario:', usuarioId);

        const [conversaciones] = await pool.query(`
            SELECT DISTINCT
                CASE 
                    WHEN mc.remitente_id = ? THEN mc.destinatario_id 
                    ELSE mc.remitente_id 
                END as contacto_id,
                u.nombre as contacto_nombre,
                u.rol as contacto_rol,
                u.avatar,
                mc.conversacion_id,
                (SELECT mensaje FROM mensajes_chat mc2 
                 WHERE mc2.conversacion_id = mc.conversacion_id 
                 ORDER BY created_at DESC LIMIT 1) as ultimo_mensaje,
                (SELECT created_at FROM mensajes_chat mc3 
                 WHERE mc3.conversacion_id = mc.conversacion_id 
                 ORDER BY created_at DESC LIMIT 1) as fecha_ultimo_mensaje,
                (SELECT COUNT(*) FROM mensajes_chat mc4 
                 WHERE mc4.conversacion_id = mc.conversacion_id 
                   AND mc4.destinatario_id = ? 
                   AND mc4.leido = FALSE) as mensajes_no_leidos
            FROM mensajes_chat mc
            JOIN usuarios u ON (u.id = CASE 
                WHEN mc.remitente_id = ? THEN mc.destinatario_id 
                ELSE mc.remitente_id 
            END)
            WHERE mc.remitente_id = ? OR mc.destinatario_id = ?
            GROUP BY contacto_id, mc.conversacion_id
            ORDER BY fecha_ultimo_mensaje DESC
        `, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]);

        res.json({
            success: true,
            data: conversaciones
        });

    } catch (error) {
        console.error('❌ Error obteniendo conversaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conversaciones'
        });
    }
};

// Obtener mensajes de una conversación
exports.obtenerMensajesConversacion = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];
        const { conversacionId } = req.params;
        const { limite = 50, offset = 0 } = req.query;

        console.log(`💬 Obteniendo mensajes conversación ${conversacionId} para usuario ${usuarioId}`);

        const [mensajes] = await pool.query(`
            SELECT 
                mc.*,
                ur.nombre as remitente_nombre,
                ur.rol as remitente_rol,
                ud.nombre as destinatario_nombre,
                ud.rol as destinatario_rol,
                (CASE WHEN mc.respuesta_a IS NOT NULL THEN 
                    (SELECT mensaje FROM mensajes_chat mc2 WHERE mc2.id = mc.respuesta_a)
                END) as mensaje_respondido
            FROM mensajes_chat mc
            JOIN usuarios ur ON mc.remitente_id = ur.id
            JOIN usuarios ud ON mc.destinatario_id = ud.id
            WHERE mc.conversacion_id = ?
              AND (mc.remitente_id = ? OR mc.destinatario_id = ?)
            ORDER BY mc.created_at DESC
            LIMIT ? OFFSET ?
        `, [conversacionId, usuarioId, usuarioId, parseInt(limite), parseInt(offset)]);

        // Marcar mensajes como leídos
        await pool.query(`
            UPDATE mensajes_chat 
            SET leido = TRUE, fecha_leido = NOW()
            WHERE conversacion_id = ? 
              AND destinatario_id = ? 
              AND leido = FALSE
        `, [conversacionId, usuarioId]);

        res.json({
            success: true,
            data: mensajes.reverse() // Mostrar en orden cronológico
        });

    } catch (error) {
        console.error('❌ Error obteniendo mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes'
        });
    }
};

// Enviar mensaje
exports.enviarMensaje = async (req, res) => {
    try {
        const remitenteId = req.headers['user-id'];
        const { destinatario_id, mensaje, tipo_mensaje = 'texto', archivo_adjunto, respuesta_a } = req.body;

        console.log(`💬 Enviando mensaje de ${remitenteId} a ${destinatario_id}`);

        // Generar ID de conversación
        const conversacionId = `conv_${Math.min(remitenteId, destinatario_id)}_${Math.max(remitenteId, destinatario_id)}`;

        const [result] = await pool.query(`
            INSERT INTO mensajes_chat (
                conversacion_id, remitente_id, destinatario_id, 
                mensaje, tipo_mensaje, archivo_adjunto, respuesta_a
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [conversacionId, remitenteId, destinatario_id, mensaje, tipo_mensaje, archivo_adjunto, respuesta_a]);

        // Obtener el mensaje completo insertado
        const [nuevoMensaje] = await pool.query(`
            SELECT 
                mc.*,
                ur.nombre as remitente_nombre,
                ud.nombre as destinatario_nombre
            FROM mensajes_chat mc
            JOIN usuarios ur ON mc.remitente_id = ur.id
            JOIN usuarios ud ON mc.destinatario_id = ud.id
            WHERE mc.id = ?
        `, [result.insertId]);

        // Programar notificación push al destinatario
        await programarNotificacion(destinatario_id, 'push', 'chat', 
            'Nuevo Mensaje', 
            `${nuevoMensaje[0].remitente_nombre}: ${mensaje.substring(0, 50)}${mensaje.length > 50 ? '...' : ''}`,
            null, {
                conversacion_id: conversacionId,
                remitente_id: remitenteId
            }
        );

        res.json({
            success: true,
            data: nuevoMensaje[0],
            message: 'Mensaje enviado correctamente'
        });

    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje'
        });
    }
};

// ==========================================
// SISTEMA DE NOTIFICACIONES
// ==========================================

// Obtener configuración de notificaciones del usuario
exports.obtenerConfiguracionNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];

        const [config] = await pool.query(`
            SELECT * FROM configuracion_notificaciones 
            WHERE usuario_id = ?
        `, [usuarioId]);

        if (config.length === 0) {
            // Crear configuración por defecto
            await pool.query(`
                INSERT INTO configuracion_notificaciones (usuario_id) 
                VALUES (?)
            `, [usuarioId]);

            const [nuevaConfig] = await pool.query(`
                SELECT * FROM configuracion_notificaciones 
                WHERE usuario_id = ?
            `, [usuarioId]);

            return res.json({
                success: true,
                data: nuevaConfig[0]
            });
        }

        res.json({
            success: true,
            data: config[0]
        });

    } catch (error) {
        console.error('❌ Error obteniendo configuración de notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración'
        });
    }
};

// Actualizar configuración de notificaciones
exports.actualizarConfiguracionNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];
        const configuracion = req.body;

        console.log('🔔 Actualizando configuración notificaciones usuario:', usuarioId);

        const campos = Object.keys(configuracion).map(key => `${key} = ?`).join(', ');
        const valores = Object.values(configuracion);
        valores.push(usuarioId);

        await pool.query(`
            UPDATE configuracion_notificaciones 
            SET ${campos}, updated_at = NOW()
            WHERE usuario_id = ?
        `, valores);

        res.json({
            success: true,
            message: 'Configuración actualizada correctamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración'
        });
    }
};

// Obtener historial de notificaciones
exports.obtenerHistorialNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];
        const { limite = 20, offset = 0, categoria, tipo } = req.query;

        let whereClause = 'WHERE usuario_id = ?';
        const params = [usuarioId];

        if (categoria) {
            whereClause += ' AND categoria = ?';
            params.push(categoria);
        }

        if (tipo) {
            whereClause += ' AND tipo_notificacion = ?';
            params.push(tipo);
        }

        const [notificaciones] = await pool.query(`
            SELECT *
            FROM historial_notificaciones
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limite), parseInt(offset)]);

        res.json({
            success: true,
            data: notificaciones
        });

    } catch (error) {
        console.error('❌ Error obteniendo historial notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial'
        });
    }
};

// Función auxiliar para programar notificaciones
async function programarNotificacion(usuarioId, tipo, categoria, titulo, mensaje, programadoPara = null, metadata = {}) {
    try {
        // Verificar configuración del usuario
        const [config] = await pool.query(`
            SELECT * FROM configuracion_notificaciones WHERE usuario_id = ?
        `, [usuarioId]);

        if (config.length === 0) return false;

        const configuracion = config[0];
        
        // Verificar si el usuario permite este tipo de notificación
        const permisos = {
            'push_mensajes_chat': categoria === 'chat',
            'push_recordatorio_citas': categoria === 'cita',
            'email_nuevas_citas': categoria === 'cita' && tipo === 'email',
            'email_recordatorio_citas': categoria === 'cita' && tipo === 'email'
        };

        let permitida = false;
        for (const [permiso, aplica] of Object.entries(permisos)) {
            if (aplica && configuracion[permiso]) {
                permitida = true;
                break;
            }
        }

        if (!permitida) return false;

        // Obtener destinatario (email, teléfono, etc.)
        const [usuario] = await pool.query(`
            SELECT email, telefono FROM usuarios WHERE id = ?
        `, [usuarioId]);

        if (usuario.length === 0) return false;

        const destinatario = tipo === 'email' ? usuario[0].email : 
                           tipo === 'sms' ? usuario[0].telefono : 
                           `user_${usuarioId}`;

        // Insertar notificación
        await pool.query(`
            INSERT INTO historial_notificaciones (
                usuario_id, tipo_notificacion, categoria, titulo, mensaje, 
                destinatario, programado_para, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [usuarioId, tipo, categoria, titulo, mensaje, destinatario, programadoPara, JSON.stringify(metadata)]);

        return true;

    } catch (error) {
        console.error('❌ Error programando notificación:', error);
        return false;
    }
}

// ==========================================
// RECORDATORIOS PROGRAMADOS
// ==========================================

// Obtener recordatorios del usuario
exports.obtenerRecordatorios = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];

        const [recordatorios] = await pool.query(`
            SELECT 
                rp.*,
                c.fecha as fecha_cita,
                c.hora as hora_cita,
                t.nombre as tratamiento_nombre
            FROM recordatorios_programados rp
            LEFT JOIN citas c ON rp.cita_id = c.id
            LEFT JOIN tratamientos t ON c.tratamiento_id = t.id
            WHERE rp.usuario_id = ? AND rp.estado = 'activo'
            ORDER BY rp.fecha_programada ASC
        `, [usuarioId]);

        res.json({
            success: true,
            data: recordatorios.map(r => ({
                ...r,
                canales: JSON.parse(r.canales || '[]')
            }))
        });

    } catch (error) {
        console.error('❌ Error obteniendo recordatorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recordatorios'
        });
    }
};

// Crear recordatorio personalizado
exports.crearRecordatorio = async (req, res) => {
    try {
        const usuarioId = req.headers['user-id'];
        const { 
            tipo_recordatorio, titulo, mensaje, fecha_programada,
            repetir = false, intervalo_repeticion, max_repeticiones, canales = ['push']
        } = req.body;

        console.log('⏰ Creando recordatorio para usuario:', usuarioId);

        const [result] = await pool.query(`
            INSERT INTO recordatorios_programados (
                usuario_id, tipo_recordatorio, titulo, mensaje,
                fecha_programada, repetir, intervalo_repeticion, 
                max_repeticiones, canales
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            usuarioId, tipo_recordatorio, titulo, mensaje,
            fecha_programada, repetir, intervalo_repeticion,
            max_repeticiones, JSON.stringify(canales)
        ]);

        res.json({
            success: true,
            data: { id: result.insertId },
            message: 'Recordatorio creado correctamente'
        });

    } catch (error) {
        console.error('❌ Error creando recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear recordatorio'
        });
    }
};

console.log('✅ comunicacionesController cargado exitosamente');

module.exports = exports;
