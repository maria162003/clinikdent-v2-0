/**
 * Middleware de rate limiting simple en memoria.
 * En producción usar almacén centralizado (ej: Redis) para entornos con múltiples instancias.
 */
const limits = new Map();
function rateLimit(options = { windowMs: 60000, max: 60 }) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    let entry = limits.get(key);
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + options.windowMs };
    }
    entry.count += 1;
    limits.set(key, entry);
    if (entry.count > options.max) {
      return res.status(429).json({ error: 'Demasiadas peticiones. Inténtalo más tarde.' });
    }
    next();
  };
}

module.exports = rateLimit;