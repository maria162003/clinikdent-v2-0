const db = require('../config/db');

// POST /actividad  body: { usuario_id, tipo, descripcion }
// Mapea "tipo" -> "accion" en la tabla; fecha_hora es automático en BD.
exports.registrarActividad = async (req, res) => {
    const { usuario_id, tipo, descripcion } = req.body;
    if (!usuario_id || !tipo) {
        return res.status(400).json({ msg: 'usuario_id y tipo son obligatorios' });
    }
    try {
        await db.query(
            'INSERT INTO registro_actividad (usuario_id, accion, descripcion) VALUES ($1, $2, $3)',
            [usuario_id, tipo, descripcion || null]
        );
        return res.json({ msg: 'Actividad registrada correctamente' });
    } catch (err) {
        console.error('registrarActividad:', err);
        return res.status(500).json({ msg: 'Error al registrar actividad' });
    }
};

// GET /actividad?fecha=YYYY-MM-DD&tipo=accionX
exports.obtenerActividades = async (req, res) => {
    const { fecha, tipo } = req.query;
    try {
        let sql = `
            SELECT ra.*, u.nombre AS usuario
            FROM registro_actividad ra
            JOIN usuarios u ON ra.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];
        if (fecha) { sql += ' AND DATE(ra.fecha_hora) = ?'; params.push(fecha); }
        if (tipo)  { sql += ' AND ra.accion = ?';          params.push(tipo);  }
        sql += ' ORDER BY ra.fecha_hora DESC';
        const [rows] = await db.query(sql, params);
        return res.json(rows);
    } catch (err) {
        console.error('obtenerActividades:', err);
        return res.status(500).json({ msg: 'Error al obtener actividades' });
    }
};
