const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Configurando conexión PostgreSQL:', {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD ? '[CONFIGURADO]' : '[VACÍO]',
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});

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
