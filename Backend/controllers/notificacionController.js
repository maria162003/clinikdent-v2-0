const db = require('../config/db');

exports.obtenerNotificacionesPorUsuario = async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha_envio DESC', [usuario_id]);
    
    // Si no hay notificaciones en la BD, devolver algunas de ejemplo
    if (rows.length === 0) {
      const notificacionesEjemplo = [
        {
          id: 1,
          usuario_id: usuario_id,
          tipo: 'info',
          mensaje: 'Bienvenido al sistema ClinkDent',
          fecha_envio: new Date().toISOString(),
          leida: false
        },
        {
          id: 2,
          usuario_id: usuario_id,
          tipo: 'alerta',
          mensaje: 'Tienes 3 citas pendientes para hoy',
          fecha_envio: new Date().toISOString(),
          leida: false
        },
        {
          id: 3,
          usuario_id: usuario_id,
          tipo: 'info',
          mensaje: 'Nuevo paciente registrado',
          fecha_envio: new Date().toISOString(),
          leida: true
        }
      ];
      return res.json(notificacionesEjemplo);
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener notificaciones:', err);
    res.status(500).json({ msg: 'Error al obtener notificaciones.' });
  }
};

exports.crearNotificacion = async (req, res) => {
  const { usuario_id, tipo, mensaje } = req.body;
  if (!usuario_id || !tipo || !mensaje) return res.status(400).json({ msg: 'Datos incompletos.' });
  try {
    await db.query('INSERT INTO notificaciones (usuario_id, tipo, mensaje, fecha_envio) VALUES (?, ?, ?, NOW())', [usuario_id, tipo, mensaje]);
    res.json({ msg: 'Notificación creada.' });
  } catch (err) {
    res.status(500).json({ msg: 'Error al crear notificación.' });
  }
};
