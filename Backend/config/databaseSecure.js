const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 🔐 Configuración de Supabase - Segurisam
const supabaseConfig = {
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  host: process.env.SUPABASE_DB_HOST || 'db.your-project.supabase.co',
  port: process.env.SUPABASE_DB_PORT || 5432,
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  
  // ⚡ Configuración de pool optimizada para Supabase Pooler
  max: 5, // Máximo 5 conexiones (pooler tiene límites estrictos)
  min: 1,  // Mínimo 1 conexión activa
  idleTimeoutMillis: 10000, // 10 segundos timeout (liberar rápido)
  connectionTimeoutMillis: 5000, // 5 segundos para conectar
  
  // 🛡️ SSL requerido para producción
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Ajustar según certificados
  } : false,
  
  // 🔒 Statement timeout para prevenir queries largas
  statement_timeout: 30000, // 30 segundos máximo por query
  
  // 🛡️ Configuración adicional de seguridad
  application_name: 'clinikdent_secure_v1.0'
};

// 💾 Pool de conexiones global
const pool = new Pool(supabaseConfig);

// 🚨 Manejo de errores del pool
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en cliente de BD:', err);
  
  // Log de seguridad para errores de BD
  logSecurityEvent('DATABASE_ERROR', {
    error: err.message,
    code: err.code,
    timestamp: new Date().toISOString()
  });
});

pool.on('connect', (client) => {
  console.log('✅ Nueva conexión establecida con la BD');
});

pool.on('acquire', (client) => {
  console.log('🔄 Cliente adquirido del pool');
});

pool.on('remove', (client) => {
  console.log('🗑️ Cliente removido del pool');
});

// 🛡️ Función para logging de eventos de seguridad
const logSecurityEvent = async (eventType, details) => {
  try {
    // Log en archivo local (backup)
    const logEntry = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      details: details,
      source: 'database_pool'
    };
    
    const logFile = path.join(__dirname, '..', 'logs', 'security.log');
    
    // Crear directorio si no existe
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // También intentar log en BD si está disponible
    // DESHABILITADO: estructura de audit_log no coincide
    // try {
    //   await pool.query(`
    //     INSERT INTO audit_log (event_type, table_name, user_id, details, ip_address, user_agent)
    //     VALUES ($1, 'system', NULL, $2, 'system', 'database_pool')
    //   `, [eventType, details]);
    // } catch (dbErr) {
    //   // Si falla el log en BD, al menos tenemos el archivo
    //   console.warn('⚠️ No se pudo guardar audit_log en BD:', dbErr.message);
    // }
    
  } catch (err) {
    console.error('❌ Error logging evento de seguridad:', err);
  }
};

// 🔍 Función para ejecutar queries con logging de seguridad
const secureQuery = async (text, params = [], context = {}) => {
  const start = Date.now();
  
  try {
    // 🛡️ Detectar queries peligrosas
    const dangerousPatterns = [
      /drop\s+table/i,
      /truncate\s+table/i,
      /delete\s+from\s+\w+\s*$/i, // DELETE sin WHERE
      /update\s+\w+\s+set\s+.*\s*$/i, // UPDATE sin WHERE
      /grant\s+/i,
      /revoke\s+/i,
      /alter\s+/i,
      /create\s+user/i,
      /drop\s+user/i
    ];
    
    const isDangerous = dangerousPatterns.some(pattern => 
      pattern.test(text.replace(/\s+/g, ' '))
    );
    
    if (isDangerous && process.env.NODE_ENV === 'production') {
      await logSecurityEvent('DANGEROUS_QUERY_BLOCKED', {
        query: text.substring(0, 200), // Solo los primeros 200 chars
        params: params ? params.length : 0,
        context: context,
        blocked: true
      });
      
      throw new Error('Query potencialmente peligrosa bloqueada');
    }
    
    // ⚡ Ejecutar query
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // 📊 Log de queries lentas
    if (duration > 5000) { // > 5 segundos
      await logSecurityEvent('SLOW_QUERY', {
        query: text.substring(0, 200),
        duration: duration,
        rows: result.rowCount,
        context: context
      });
    }
    
    // 📊 Log de queries que afectan muchas filas
    if (result.rowCount > 1000) {
      await logSecurityEvent('HIGH_IMPACT_QUERY', {
        query: text.substring(0, 200),
        rows_affected: result.rowCount,
        context: context
      });
    }
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - start;
    
    // 🚨 Log de errores de query
    await logSecurityEvent('QUERY_ERROR', {
      query: text.substring(0, 200),
      error: error.message,
      duration: duration,
      context: context
    });
    
    throw error;
  }
};

// 🔒 Función para obtener conexión del pool con timeout
const getConnection = async (timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout obteniendo conexión de BD'));
    }, timeoutMs);
    
    pool.connect((err, client, release) => {
      clearTimeout(timeout);
      
      if (err) {
        reject(err);
      } else {
        resolve({ client, release });
      }
    });
  });
};

// 🔄 Función para verificar salud de la BD
const healthCheck = async () => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: responseTime,
      timestamp: result.rows[0].current_time,
      postgresVersion: result.rows[0].pg_version,
      activeConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    };
  } catch (error) {
    await logSecurityEvent('HEALTH_CHECK_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// 🧹 Función para limpiar sesiones expiradas
const cleanupExpiredSessions = async () => {
  try {
    const result = await secureQuery(`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW()
    `);
    
    if (result.rowCount > 0) {
      await logSecurityEvent('SESSIONS_CLEANUP', {
        expired_sessions_removed: result.rowCount,
        timestamp: new Date().toISOString()
      });
    }
    
    return result.rowCount;
  } catch (error) {
    console.error('❌ Error limpiando sesiones:', error);
    throw error;
  }
};

// 🔄 Programar limpieza automática cada 1 hora
setInterval(() => {
  cleanupExpiredSessions().catch(err => {
    console.error('❌ Error en limpieza automática de sesiones:', err);
  });
}, 60 * 60 * 1000); // 1 hora

// 🏁 Función de cierre limpio
const closePool = async () => {
  try {
    await logSecurityEvent('POOL_SHUTDOWN', {
      timestamp: new Date().toISOString(),
      activeConnections: pool.totalCount
    });
    
    await pool.end();
    console.log('✅ Pool de conexiones cerrado correctamente');
  } catch (error) {
    console.error('❌ Error cerrando pool:', error);
  }
};

// 🚨 Manejo de cierre limpio del proceso
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);
process.on('exit', closePool);

// 🎯 Test de conexión inicial
(async () => {
  try {
    const health = await healthCheck();
    if (health.status === 'healthy') {
      console.log('✅ Conexión segura a Supabase establecida');
      console.log(`📊 PostgreSQL ${health.postgresVersion.split(' ')[1]}`);
      console.log(`⚡ Tiempo de respuesta: ${health.responseTime}ms`);
    } else {
      console.error('❌ BD no disponible:', health.error);
    }
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
  }
})();

module.exports = {
  pool,
  secureQuery,
  getConnection,
  healthCheck,
  cleanupExpiredSessions,
  closePool,
  logSecurityEvent
};