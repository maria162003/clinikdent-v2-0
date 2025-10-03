/**
 * Filtro de IP básico basado en:
 * - Whitelist (si existe, sólo permite esas IPs)
 * - Blacklist
 */
const whitelist = (process.env.FW_WHITELIST || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

const blacklist = (process.env.FW_BLACKLIST || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

function firewall(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress;
  if (blacklist.includes(ip)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  if (whitelist.length > 0 && !whitelist.includes(ip)) {
    return res.status(403).json({ error: 'IP no autorizada' });
  }
  next();
}

module.exports = firewall;