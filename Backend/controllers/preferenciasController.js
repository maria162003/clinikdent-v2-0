const db = require('../config/db');
const SeguridadService = require('../services/seguridadService');

/**
 * Guardar preferencias de notificaciones de un usuario
 * POST /api/preferencias
 */
exports.guardarPreferencias = async (req, res) => {
    console.log(' Guardando preferencias de notificaciones');
    
    const { 
        usuario_id, 
        acepta_notificaciones = false, 
        acepta_ofertas = false, 
        canales_preferidos = [] 
    } = req.body;
    
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!usuario_id) {
        return res.status(400).json({ 
            success: false, 
            msg: 'El ID de usuario es requerido.' 
        });
    }
    
    try {
        // Verificar que el usuario existe
        const { rows: usuarios } = await db.query(
            'SELECT id FROM usuarios WHERE id = $1',
            [usuario_id]
        );
        
        if (!usuarios.length) {
            return res.status(404).json({ 
                success: false, 
                msg: 'Usuario no encontrado.' 
            });
        }
        
        // Insertar o actualizar preferencias
        const { rows } = await db.query(
            `INSERT INTO usuarios_preferencias 
                (usuario_id, acepta_notificaciones, acepta_ofertas, canales_preferidos, ip_consentimiento, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (usuario_id) 
            DO UPDATE SET
                acepta_notificaciones = $2,
                acepta_ofertas = $3,
                canales_preferidos = $4,
                ip_consentimiento = $5,
                user_agent = $6,
                fecha_consentimiento = CURRENT_TIMESTAMP,
                ultima_actualizacion = CURRENT_TIMESTAMP
            RETURNING *`,
            [usuario_id, acepta_notificaciones, acepta_ofertas, JSON.stringify(canales_preferidos), ip, userAgent]
        );
        
        // Registrar en auditor�a
        await SeguridadService.registrarAuditoria({
            usuario_id: usuario_id,
            accion: 'guardar_preferencias_notificaciones',
            detalles: {
                acepta_notificaciones,
                acepta_ofertas,
                canales: canales_preferidos
            },
            ip: ip,
            user_agent: userAgent,
            nivel_criticidad: 'baja'
        });
        
        console.log(' Preferencias guardadas para usuario:', usuario_id);
        
        return res.json({
            success: true,
            msg: 'Preferencias guardadas correctamente.',
            preferencias: rows[0]
        });
        
    } catch (error) {
        console.error(' Error al guardar preferencias:', error);
        return res.status(500).json({ 
            success: false, 
            msg: 'Error al guardar preferencias.' 
        });
    }
};

/**
 * Obtener preferencias de un usuario
 * GET /api/preferencias/:usuario_id
 */
exports.obtenerPreferencias = async (req, res) => {
    const { usuario_id } = req.params;
    
    if (!usuario_id) {
        return res.status(400).json({ 
            success: false, 
            msg: 'El ID de usuario es requerido.' 
        });
    }
    
    try {
        const { rows } = await db.query(
            'SELECT * FROM usuarios_preferencias WHERE usuario_id = $1',
            [usuario_id]
        );
        
        if (!rows.length) {
            // Si no tiene preferencias, devolver valores por defecto
            return res.json({
                success: true,
                preferencias: {
                    acepta_notificaciones: false,
                    acepta_ofertas: false,
                    canales_preferidos: []
                }
            });
        }
        
        return res.json({
            success: true,
            preferencias: rows[0]
        });
        
    } catch (error) {
        console.error(' Error al obtener preferencias:', error);
        return res.status(500).json({ 
            success: false, 
            msg: 'Error al obtener preferencias.' 
        });
    }
};

/**
 * Actualizar preferencias de un usuario
 * PUT /api/preferencias/:usuario_id
 */
exports.actualizarPreferencias = async (req, res) => {
    const { usuario_id } = req.params;
    const { acepta_notificaciones, acepta_ofertas, canales_preferidos } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!usuario_id) {
        return res.status(400).json({ 
            success: false, 
            msg: 'El ID de usuario es requerido.' 
        });
    }
    
    try {
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (acepta_notificaciones !== undefined) {
            updates.push(`acepta_notificaciones = $${paramCount++}`);
            values.push(acepta_notificaciones);
        }
        
        if (acepta_ofertas !== undefined) {
            updates.push(`acepta_ofertas = $${paramCount++}`);
            values.push(acepta_ofertas);
        }
        
        if (canales_preferidos !== undefined) {
            updates.push(`canales_preferidos = $${paramCount++}`);
            values.push(JSON.stringify(canales_preferidos));
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                msg: 'No hay campos para actualizar.' 
            });
        }
        
        updates.push(`ip_consentimiento = $${paramCount++}`);
        values.push(ip);
        updates.push(`user_agent = $${paramCount++}`);
        values.push(userAgent);
        updates.push('ultima_actualizacion = CURRENT_TIMESTAMP');
        
        values.push(usuario_id);
        
        const { rows } = await db.query(
            `UPDATE usuarios_preferencias 
            SET ${updates.join(', ')}
            WHERE usuario_id = $${paramCount}
            RETURNING *`,
            values
        );
        
        if (!rows.length) {
            return res.status(404).json({ 
                success: false, 
                msg: 'Preferencias no encontradas.' 
            });
        }
        
        // Registrar en auditor�a
        await SeguridadService.registrarAuditoria({
            usuario_id: parseInt(usuario_id),
            accion: 'actualizar_preferencias_notificaciones',
            detalles: { acepta_notificaciones, acepta_ofertas, canales_preferidos },
            ip: ip,
            user_agent: userAgent,
            nivel_criticidad: 'baja'
        });
        
        console.log(' Preferencias actualizadas para usuario:', usuario_id);
        
        return res.json({
            success: true,
            msg: 'Preferencias actualizadas correctamente.',
            preferencias: rows[0]
        });
        
    } catch (error) {
        console.error(' Error al actualizar preferencias:', error);
        return res.status(500).json({ 
            success: false, 
            msg: 'Error al actualizar preferencias.' 
        });
    }
};

/**
 * Obtener estad�sticas de consentimiento (solo admin)
 * GET /api/preferencias/estadisticas
 */
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM obtener_estadisticas_consentimiento()');
        
        return res.json({
            success: true,
            estadisticas: rows[0]
        });
        
    } catch (error) {
        console.error(' Error al obtener estad�sticas:', error);
        return res.status(500).json({ 
            success: false, 
            msg: 'Error al obtener estad�sticas.' 
        });
    }
};

module.exports = {
    guardarPreferencias: exports.guardarPreferencias,
    obtenerPreferencias: exports.obtenerPreferencias,
    actualizarPreferencias: exports.actualizarPreferencias,
    obtenerEstadisticas: exports.obtenerEstadisticas
};
