/**
 * Configuración de base de datos dual (MySQL / PostgreSQL).
 * Selecciona el vendor vía env: DB_VENDOR = 'mysql' | 'postgres'
 * Este archivo requiere instalar los drivers:
 *  - mysql2
 *  - pg
 */
const mysql = require('mysql2/promise');
const { Pool: PgPool } = require('pg');

const vendor = process.env.DB_VENDOR || 'mysql';

let pool;

async function initDB() {
  if (pool) return pool;

  if (vendor === 'postgres') {
    pool = new PgPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
      idleTimeoutMillis: 30000
    });
  } else {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 10
    });
  }

  return pool;
}

async function query(sql, params = []) {
  const p = await initDB();
  if (vendor === 'postgres') {
    const res = await p.query(sql, params);
    return res.rows;
  } else {
    const [rows] = await p.execute(sql, params);
    return rows;
  }
}

module.exports = {
  vendor,
  initDB,
  query
};