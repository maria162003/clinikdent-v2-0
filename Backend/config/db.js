require('dotenv').config();

// Adaptador de base de datos dual: PostgreSQL o MySQL (mysql2)
// Selecciona el motor automáticamente en base a variables de entorno disponibles.

let db;

const hasPg = process.env.PGHOST || process.env.PGDATABASE || process.env.PGUSER;
const hasMy = process.env.DB_HOST || process.env.DB_NAME || process.env.DB_USER;

if (hasPg) {
  const { Pool } = require('pg');
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
    family: 4 // Forzar IPv4
  });

  // Normalizar interfaz a estilo mysql2: db.query(sql, params) -> [rows]
  db = {
    async query(sql, params) {
      const result = await pool.query(sql, params);
      return [result.rows, result];
    },
    pool
  };

  // Test de conexión inicial (silencioso si falta config)
  pool.query('SELECT 1')
    .then(() => console.log('✅ PostgreSQL listo'))
    .catch(err => console.error('❌ Error PostgreSQL:', err.message));
} else if (hasMy) {
  // Preferir mysql2/promise para await/async
  const mysql = require('mysql2/promise');
  console.log('🔧 Configurando conexión MySQL:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '[CONFIGURADO]' : '[VACÍO]',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  db = {
    async query(sql, params) {
      return pool.query(sql, params); // devuelve [rows, fields]
    },
    pool
  };

  // Test de conexión inicial
  pool.query('SELECT 1')
    .then(() => console.log('✅ MySQL listo'))
    .catch(err => console.error('❌ Error MySQL:', err.message));
} else {
  // Sin configuración: exportar stub que evita caídas y da mensaje claro
  console.warn('⚠️ Sin configuración de DB (ni PG* ni DB_*). Las operaciones de BD fallarán hasta configurar .env');
  db = {
    async query() {
      throw new Error('Base de datos no configurada. Defina variables .env para PostgreSQL (PG*) o MySQL (DB_*)');
    }
  };
}

module.exports = db;
