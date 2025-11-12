const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Cargar .env del CWD y fallback al .env del proyecto anidado
require('dotenv').config();
if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGPASSWORD) {
  const nestedEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(nestedEnvPath)) {
    require('dotenv').config({ path: nestedEnvPath });
    console.log(`🔄 Variables de BD re-cargadas desde fallback: ${nestedEnvPath}`);
  }
}

// Compatibilidad: mapear variables legacy DB_* a PG_* si faltan
process.env.PGHOST = process.env.PGHOST || process.env.DB_HOST;
process.env.PGUSER = process.env.PGUSER || process.env.DB_USER;
process.env.PGPASSWORD = process.env.PGPASSWORD || process.env.DB_PASSWORD;
process.env.PGDATABASE = process.env.PGDATABASE || process.env.DB_NAME;
process.env.PGPORT = process.env.PGPORT || process.env.DB_PORT;

console.log('🔧 Configurando conexión PostgreSQL:', {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD ? '[CONFIGURADO]' : '[VACÍO]',
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});

// Validaciones básicas
if (typeof process.env.PGPASSWORD !== 'string' || !process.env.PGPASSWORD.length) {
  console.error('❌ PGPASSWORD no está definido o no es una cadena');
}

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  // Forzar IPv4 para evitar problemas de conectividad
  family: 4
});

// Test de conexión inicial
pool.query('SELECT 1')
  .then(() => console.log('✅ Pool de conexiones PostgreSQL inicializado correctamente'))
  .catch(err => console.error('❌ Error en pool PostgreSQL:', err.message));

module.exports = pool;
