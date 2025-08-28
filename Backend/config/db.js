const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔧 Configurando conexión DB:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '[CONFIGURADO]' : '[VACÍO]',
  database: process.env.DB_NAME
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clinikdent',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de conexión inicial
pool.query('SELECT 1')
  .then(() => console.log('✅ Pool de conexiones DB inicializado correctamente'))
  .catch(err => console.error('❌ Error en pool DB:', err.message));

module.exports = pool;
