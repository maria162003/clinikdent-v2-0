// Middleware mínimo para exigir rol administrador basado en encabezados
// Puede adaptarse a JWT u otro mecanismo si se implementa más adelante.

function requireAdmin(req, res, next) {
  try {
    const roleHeader = (req.headers['x-user-role'] || req.headers['user-role'] || '').toString().toLowerCase();
    const roleBody = (req.body && req.body.rol ? String(req.body.rol) : '').toLowerCase();
    const roleQuery = (req.query && req.query.rol ? String(req.query.rol) : '').toLowerCase();

    const role = roleHeader || roleBody || roleQuery;

    if (role === 'administrador' || role === 'admin') {
      return next();
    }

    return res.status(403).json({ msg: 'Acceso restringido a administradores.' });
  } catch (err) {
    console.error('Error en requireAdmin:', err);
    return res.status(403).json({ msg: 'Acceso restringido.' });
  }
}

module.exports = { requireAdmin };
