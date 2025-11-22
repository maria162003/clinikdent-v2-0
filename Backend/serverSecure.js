const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { Pool } = require('pg');
const connectPgSimple = require('connect-pg-simple');

// 🛡️ Importar middlewares de seguridad
const {
  securityHeaders,
  loginLimiter,
  registerLimiter,
  apiLimiter,
  sanitizeInput,
  securityLogger,
  authenticateToken,
  authorizeRole,
  optionalAuth
} = require('./middleware/authSecure');

// 🔐 Importar configuración segura de BD
const { pool, healthCheck, logSecurityEvent } = require('./config/databaseSecure');

// 🚀 Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// 📝 Session store con PostgreSQL
const PgSession = connectPgSimple(session);

// 🛡️ CONFIGURACIÓN DE SEGURIDAD
// ============================================

// Headers de seguridad (debe ir PRIMERO)
app.use(securityHeaders);

// Logging de seguridad
app.use(securityLogger);

// Rate limiting general para API
app.use('/api/', apiLimiter);

// CORS configurado de forma segura
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://clinikdent.com', 'https://www.clinikdent.com'] // Cambiar por dominio real
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 horas de preflight cache
}));

// Middleware básico
app.use(express.json({ 
  limit: '10mb', // Límite de payload
  strict: true   // Solo JSON válido
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100 // Máximo 100 parámetros
}));
app.use(cookieParser(process.env.COOKIE_SECRET || 'clinikdent_demo_secret_2025'));

// Configuración de sesiones seguras
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: false // Tabla ya existe en schema
  }),
  secret: process.env.SESSION_SECRET || 'clinikdent_session_secret_demo_2025',
  name: 'clinikdent.sid', // Nombre personalizado de cookie
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en producción
    httpOnly: true, // No accesible desde JavaScript
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'strict' // Protección CSRF
  },
  rolling: true, // Renovar cookie en cada request
  proxy: process.env.NODE_ENV === 'production' // Trust proxy en producción
}));

// Sanitizar todos los inputs
app.use(sanitizeInput);

// 📁 ARCHIVOS ESTÁTICOS SEGUROS
// ============================================
app.use(express.static(path.join(__dirname, '../Frontend'), {
  maxAge: process.env.NODE_ENV === 'production' ? 86400000 : 0, // 1 día en prod
  setHeaders: (res, filePath) => {
    // Headers adicionales para archivos estáticos
    if (filePath.endsWith('.html')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
    }
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// 🚦 RUTAS DE SISTEMA
// ============================================

// Health Check público
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const systemHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version
    };
    
    res.status(200).json(systemHealth);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Sistema no disponible',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de seguridad (solo para admins)
app.get('/api/security/status', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const securityStatus = {
      active_sessions: await pool.query('SELECT COUNT(*) FROM user_sessions WHERE expires_at > NOW()'),
      recent_logins: await pool.query('SELECT COUNT(*) FROM audit_log WHERE event_type = $1 AND created_at > NOW() - INTERVAL \'24 hours\'', ['user_login']),
      failed_attempts: await pool.query('SELECT COUNT(*) FROM audit_log WHERE event_type = $1 AND created_at > NOW() - INTERVAL \'1 hour\'', ['login_failed']),
      blocked_ips: [], // Implementar si usas fail2ban o similar
      last_audit: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: securityStatus
    });
  } catch (error) {
    console.error('❌ Error obteniendo status de seguridad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔐 RUTAS DE AUTENTICACIÓN SEGURAS
// ============================================

// Importar controlador de autenticación segura
const authController = require('./controllers/authControllerSecure');
const siteContentRoutes = require('./routes/siteContentRoutes');

// Registro con rate limiting estricto
app.post('/api/auth/register', registerLimiter, authController.registerUser);

// Confirmación de email
app.get('/api/auth/confirm/:token', authController.confirmRegistration);

// Login con rate limiting muy estricto
app.post('/api/auth/login', loginLimiter, authController.loginUser);

// Refresh token
app.post('/api/auth/refresh-token', authController.refreshToken);

// Logout
app.post('/api/auth/logout', authenticateToken, authController.logoutUser);

// Logout de todas las sesiones
app.post('/api/auth/logout-all', authenticateToken, authController.logoutAllSessions);

// Perfil del usuario
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      nombre: req.user.nombre,
      apellido: req.user.apellido,
      correo: req.user.correo,
      rol: req.user.rol
    }
  });
});

// 🏥 RUTAS DE LA APLICACIÓN (PROTEGIDAS)
// ============================================

// 🏥 RUTAS DE LA APLICACIÓN (PROTEGIDAS)
// ============================================

// Importar controladores existentes
const citaController = require('./controllers/citaController');
const usuarioController = require('./controllers/usuarioController');
const evaluacionesController = require('./controllers/evaluacionesController');
const historialController = require('./controllers/historialController');

// 📅 Citas - Solo usuarios autenticados
// TEMPORAL: Comentado para probar
// app.get('/api/citas', authenticateToken, citaController.obtenerTodasLasCitas);
// app.get('/api/citas/paciente/:pacienteId', authenticateToken, citaController.obtenerCitasPorPaciente);
// app.get('/api/citas/:id', authenticateToken, citaController.obtenerCitaPorId);
// app.post('/api/citas', authenticateToken, citaController.crearCita);
// app.put('/api/citas/:id', authenticateToken, citaController.actualizarCita);
// app.delete('/api/citas/:id', authenticateToken, authorizeRole('admin', 'odontologo'), citaController.eliminarCita);

// 👤 Usuarios (Pacientes/Odontólogos) - Con autorización por rol
app.get('/api/usuarios', authenticateToken, authorizeRole('admin', 'odontologo'), usuarioController.obtenerUsuarios);
app.get('/api/usuarios/:id', authenticateToken, usuarioController.obtenerUsuarioPorId);
app.put('/api/usuarios/:id', authenticateToken, usuarioController.actualizarUsuario);

// 🌐 Contenido público administrable
app.use('/api/site-content', siteContentRoutes);

// 📊 Evaluaciones - Solo usuarios autenticados
app.get('/api/evaluaciones', authenticateToken, evaluacionesController.obtenerTodasEvaluaciones);
app.post('/api/evaluaciones', authenticateToken, evaluacionesController.crearEvaluacion);

// 📋 Historial médico - Solo usuarios autenticados
app.get('/api/historial/:pacienteId', authenticateToken, historialController.obtenerHistorialPorPaciente);
app.post('/api/historial', authenticateToken, authorizeRole('admin', 'odontologo'), historialController.registrarHistorial);

// 📄 RUTAS DE PÁGINAS (CON AUTH OPCIONAL)
// ============================================

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/login.html'));
});

// Registro page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/register.html'));
});

// Dashboard - requiere autenticación
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dashboard.html'));
});

// Admin panel - solo admins
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/admin.html'));
});

// 🚫 MANEJO DE ERRORES GLOBAL
// ============================================

// 404 - Página no encontrada
app.use('*', (req, res) => {
  // Log de intentos de acceso a rutas inexistentes
  logSecurityEvent('NOT_FOUND_ACCESS', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user_agent: req.get('User-Agent'),
    user_id: req.user?.id || null
  });

  res.status(404).json({
    success: false,
    message: 'Recurso no encontrado',
    code: 'NOT_FOUND'
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  
  // Log de error crítico
  logSecurityEvent('UNHANDLED_ERROR', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    user_id: req.user?.id || null
  });

  // En producción, no exponer detalles del error
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  } else {
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// 🚀 INICIAR SERVIDOR
// ============================================

const server = app.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log('🏥 CLINIKDENT SECURE SERVER');
  console.log('🚀 ================================');
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🛡️ Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Seguridad: JWT + Rate Limiting + Audit Log`);
  console.log(`📊 Pool BD: Activo y monitoreado`);
  console.log('🚀 ================================');
  
  // Log de inicio del servidor
  logSecurityEvent('SERVER_STARTED', {
    port: PORT,
    mode: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

// 🏁 CIERRE GRACEFUL
// ============================================

const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
  
  logSecurityEvent('SERVER_SHUTDOWN', {
    signal: signal,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });

  server.close(() => {
    console.log('✅ Servidor HTTP cerrado');
    
    // Cerrar pool de BD
    pool.end(() => {
      console.log('✅ Pool de BD cerrado');
      process.exit(0);
    });
  });

  // Forzar cierre si no responde en 10 segundos
  setTimeout(() => {
    console.error('❌ Forzando cierre del proceso');
    process.exit(1);
  }, 10000);
};

// Manejo de señales del sistema
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logSecurityEvent('UNCAUGHT_EXCEPTION', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  logSecurityEvent('UNHANDLED_REJECTION', {
    reason: reason?.toString(),
    timestamp: new Date().toISOString()
  });
});

module.exports = app;