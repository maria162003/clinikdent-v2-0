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
  max: 20, // Aumentar máximo de conexiones
  min: 2, // Mantener mínimo de conexiones activas
  idleTimeoutMillis: 60000, // Aumentar timeout a 60 segundos
  connectionTimeoutMillis: 15000, // 15 segundos para conectar (aumentado para Supabase)
  // Configuración SSL para Supabase (REQUERIDO)
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración adicional para estabilidad
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Manejar errores de conexión del pool
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en cliente PostgreSQL:', err.message);
  console.error('🔄 El pool intentará reconectar automáticamente');
});

// Manejar conexiones exitosas
pool.on('connect', (client) => {
  console.log('🔗 Nueva conexión establecida al pool de PostgreSQL');
});

// Manejar cuando un cliente es removido del pool
pool.on('remove', (client) => {
  console.log('🔌 Cliente removido del pool de PostgreSQL');
});

// Test de conexión inicial con retry (sin bloquear el arranque)
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Pool de conexiones PostgreSQL inicializado correctamente');
  } catch (err) {
    console.warn('⚠️  Conexión PostgreSQL pendiente:', err.message);
    console.log('� El pool intentará conectar cuando se realice la primera consulta');
  }
};

// Ejecutar test sin await para no bloquear
testConnection();

module.exports = pool;
