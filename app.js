const express = require('express');
const cors = require('cors');

// Importar rutas correctamente desde la carpeta Backend/routes
console.log('🔄 Cargando authRoutes...');
const authRoutes = require('./Backend/routes/authRoutes');
console.log('✅ authRoutes cargado exitosamente');

console.log('� Cargando citaRoutes...');
const citaRoutes = require('./Backend/routes/citaRoutes');
console.log('✅ citaRoutes cargado exitosamente');

console.log('🔄 Cargando tratamientoRoutes...');
const tratamientoRoutes = require('./Backend/routes/tratamientoRoutes');
console.log('✅ tratamientoRoutes cargado exitosamente');

console.log('🔄 Cargando historialRoutes...');
const historialRoutes = require('./Backend/routes/historialRoutes');
console.log('✅ historialRoutes cargado exitosamente');

const notificacionRoutes = require('./Backend/routes/notificacionRoutes');
const faqRoutes = require('./Backend/routes/faqRoutes');
const pqrsRoutes = require('./Backend/routes/pqrsRoutes');
const pagoRoutes = require('./Backend/routes/pagoRoutes');
const chatRoutes = require('./Backend/routes/chatRoutes');
const contactoRoutes = require('./Backend/routes/contactoRoutes');
const usuarioRoutes = require('./Backend/routes/usuarioRoutes');
const testEmailRoutes = require('./Backend/routes/testEmailRoutes'); // Rutas de prueba aisladas

console.log('🔄 Cargando rutas de inventario...');
const inventarioRoutes = require('./Backend/routes/inventarioRoutes');
console.log('✅ Rutas de inventario cargadas');

console.log('🔄 Cargando rutas de sedes...');
const sedeRoutes = require('./Backend/routes/sedeRoutes');
console.log('✅ Rutas de sedes cargadas');

console.log('🔄 Cargando rutas de estadísticas...');
const estadisticasRoutes = require('./Backend/routes/estadisticasRoutes');
console.log('✅ Rutas de estadísticas cargadas');

console.log('🔄 Cargando rutas de evaluaciones...');
const evaluacionesRoutes = require('./Backend/routes/evaluacionesRoutes');
console.log('✅ Rutas de evaluaciones cargadas');

console.log('🔄 Cargando rutas de pagos extendido...');
const pagosExtendidoRoutes = require('./Backend/routes/pagosExtendidoRoutes');
console.log('✅ Rutas de pagos extendido cargadas');

console.log('🔄 Cargando rutas de pagos a odontólogos...');
const pagosOdontologoRoutes = require('./Backend/routes/pagosOdontologoRoutes');
console.log('✅ Rutas de pagos a odontólogos cargadas');

console.log('🔄 Cargando rutas de reportes y analytics...');
const reportesAnalyticsRoutes = require('./Backend/routes/reportesAnalyticsRoutes');
console.log('✅ Rutas de reportes y analytics cargadas');

console.log('🔄 Cargando rutas de comunicaciones...');
// const comunicacionesRoutes = require('./Backend/routes/comunicacionesRoutes'); // TEMPORALMENTE COMENTADO
console.log('✅ Rutas de comunicaciones temporalmente deshabilitadas para testing');

console.log('🔄 Cargando rutas de seguridad avanzada...');
const seguridadRoutes = require('./Backend/routes/seguridadRoutes');
console.log('✅ Rutas de seguridad avanzada cargadas');

console.log('🔄 Cargando rutas de IA y automatización...');
const iaAutomatizacionRoutes = require('./Backend/routes/iaAutomatizacionRoutes');
console.log('✅ Rutas de IA y automatización cargadas');

console.log('🔄 Cargando rutas de integración...');
const integracionRoutes = require('./Backend/routes/integracionRoutes');
console.log('✅ Rutas de integración cargadas');

console.log('🔄 Cargando rutas de performance...');
const performanceRoutes = require('./Backend/routes/performanceRoutes');
console.log('✅ Rutas de performance cargadas');

console.log('🔄 Cargando rutas de MercadoPago...');
const mercadoPagoRoutes = require('./Backend/routes/mercadoPagoRoutes');
console.log('✅ Rutas de MercadoPago cargadas');

const app = express();

// Middlewares
app.use(cors());
// Log global para debug
app.use((req, res, next) => {
  console.log(`🌍 GLOBAL REQUEST: ${req.method} ${req.url}`);
  console.log(`🌍 BODY:`, req.body);
  next();
});
// Soporta JSON
app.use(express.json());
// Soporta formularios <form method="POST">
app.use(express.urlencoded({ extended: true })); // <-- agrega esto

// Rutas API
console.log('🔗 Registrando rutas de autenticación...');
// Middleware de debug para rutas de auth
app.use('/api/auth', (req, res, next) => {
  console.log(`🔍 AUTH ROUTE DEBUG: ${req.method} ${req.url}`);
  console.log(`� BODY:`, req.body);
  next();
});

try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Rutas de autenticación registradas exitosamente');
} catch (error) {
  console.error('❌ Error registrando rutas de auth:', error);
}

// Ruta de prueba simple GET
app.get('/test-login', (req, res) => {
  console.log('🧪 Ruta test-login funciona');
  res.json({ message: 'Test login route working' });
});

// Ruta TEMPORAL directa para cambiar contraseña (BYPASS del router)
app.post('/cambiar-password-directo', async (req, res) => {
  console.log('🔧 RUTA DIRECTA TEMPORAL - Cambiar contraseña');
  console.log('🔧 Body recibido:', req.body);
  console.log('🔧 Headers:', req.headers);
  
  try {
    const { userId, current_password, new_password, isTokenLogin } = req.body;
    
    console.log('🔧 Datos extraídos:', { userId, current_password: '***', new_password: '***', isTokenLogin });
    
    if (!userId || !new_password) {
      console.log('❌ Faltan datos básicos:', { userId: !!userId, new_password: !!new_password });
      return res.status(400).json({ msg: 'UserId y nueva contraseña son requeridos' });
    }
    
    // Si NO es token login, verificar contraseña actual
    if (!isTokenLogin && !current_password) {
      console.log('❌ No es token login y falta contraseña actual');
      return res.status(400).json({ msg: 'Contraseña actual es requerida' });
    }
    
    const bcrypt = require('bcrypt');
    const db = require('./Backend/config/db');
    
    // Verificar que el usuario existe
    const [rows] = await db.query(
      'SELECT id, contraseña_hash FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (!rows.length) {
      console.log('❌ Usuario no encontrado:', userId);
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    const usuario = rows[0];
    const currentHash = usuario['contraseña_hash'];
    
    // Solo verificar contraseña actual si NO es token login
    if (!isTokenLogin) {
      console.log('🔍 Verificando contraseña actual (no es token login)');
      let isValidCurrent = false;
      
      if (currentHash && currentHash.startsWith('$2')) {
        isValidCurrent = await bcrypt.compare(current_password, currentHash);
      } else {
        isValidCurrent = current_password === (currentHash || '');
      }
      
      if (!isValidCurrent) {
        console.log('❌ Contraseña actual incorrecta');
        return res.status(400).json({ msg: 'La contraseña actual es incorrecta.' });
      }
    } else {
      console.log('✅ Token login detectado - omitiendo verificación de contraseña actual');
    }
    
    // Cambiar contraseña
    const newHash = await bcrypt.hash(new_password, 10);
    
    await db.query(
      'UPDATE usuarios SET contraseña_hash = ? WHERE id = ?',
      [newHash, userId]
    );
    
    console.log(`✅ Contraseña cambiada exitosamente para usuario ${userId}`);
    return res.json({ 
      msg: 'Contraseña cambiada exitosamente.',
      success: true
    });
    
  } catch (err) {
    console.error('❌ Error:', err);
    return res.status(500).json({ msg: 'Error en el servidor.' });
  }
});

// Rutas de prueba anteriores
// Ruta de prueba directa para cambiar contraseña
app.post('/api/auth/test-cambiar-password', (req, res) => {
  console.log('🧪 TEST: Ruta de cambio de contraseña directa funciona');
  console.log('🧪 Body:', req.body);
  res.json({ msg: 'Ruta de prueba funciona', body: req.body });
});

// Ruta de prueba sin prefijo auth
app.post('/test-simple', (req, res) => {
  console.log('🧪 TEST SIMPLE: Funciona');
  res.json({ msg: 'Test simple funciona' });
});

console.log('🔗 Registrando rutas de citas...');
app.use('/api/citas', citaRoutes);
console.log('✅ Rutas de citas registradas exitosamente');

console.log('🔗 Registrando rutas de tratamientos...');
app.use('/api/tratamientos', tratamientoRoutes);
console.log('✅ Rutas de tratamientos registradas exitosamente');

console.log('🔗 Registrando rutas de historial...');
app.use('/api/historial', historialRoutes);
console.log('✅ Rutas de historial registradas exitosamente');
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/pqrs', pqrsRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/test-email', testEmailRoutes); // 🧪 Rutas de prueba aisladas
console.log('🔗 Registrando rutas de inventario...');
app.use('/api/inventario', inventarioRoutes);
console.log('✅ Rutas de inventario registradas exitosamente');
console.log('🔗 Registrando rutas de sedes...');
app.use('/api/sedes', sedeRoutes);
console.log('✅ Rutas de sedes registradas exitosamente');

console.log('🔗 Registrando rutas de estadísticas...');
app.use('/api/reportes', estadisticasRoutes);
console.log('✅ Rutas de estadísticas registradas exitosamente');

console.log('🔗 Registrando rutas de evaluaciones...');
app.use('/api/evaluaciones', evaluacionesRoutes);
console.log('✅ Rutas de evaluaciones registradas exitosamente');

console.log('🔗 Registrando rutas de pagos extendido...');
// Debug middleware específico para pagos-ext
app.use('/api/pagos-ext', (req, res, next) => {
  console.log('🐛 [DEBUG] Middleware pagos-ext alcanzado:', req.method, req.url);
  console.log('🐛 [DEBUG] Headers user-id:', req.headers['user-id']);
  next();
});
app.use('/api/pagos-ext', pagosExtendidoRoutes);
console.log('✅ Rutas de pagos extendido registradas exitosamente');

console.log('🔗 Registrando rutas de pagos a odontólogos...');
app.use('/api/pagos-odontologo', pagosOdontologoRoutes);
console.log('✅ Rutas de pagos a odontólogos registradas exitosamente');

console.log('🔗 Registrando rutas de reportes y analytics...');
app.use('/api/analytics', reportesAnalyticsRoutes);
console.log('✅ Rutas de reportes y analytics registradas exitosamente');

console.log('🔗 Registrando rutas de comunicaciones...');
// app.use('/api/comunicaciones', comunicacionesRoutes); // TEMPORALMENTE COMENTADO
console.log('✅ Rutas de comunicaciones temporalmente deshabilitadas');

console.log('🔗 Registrando rutas de IA y automatización...');
app.use('/api/ia-automatizacion', iaAutomatizacionRoutes);
console.log('✅ Rutas de IA y automatización registradas exitosamente');

console.log('🔗 Registrando rutas de integración...');
app.use('/api/integracion', integracionRoutes);
console.log('✅ Rutas de integración registradas exitosamente');

console.log('🔗 Registrando rutas de performance...');
app.use('/api/performance', performanceRoutes);
console.log('✅ Rutas de performance registradas exitosamente');

// Agregar rutas de planes de tratamiento
const planesRoutes = require('./Backend/routes/planesRoutes');
console.log('🔗 Registrando rutas de planes...');
app.use('/api/planes', planesRoutes);
console.log('✅ Rutas de planes registradas exitosamente');

// Agregar rutas de seguridad avanzada
console.log('🔗 Registrando rutas de seguridad...');
app.use('/api/seguridad', seguridadRoutes);
console.log('✅ Rutas de seguridad avanzada registradas exitosamente');

// Agregar rutas de MercadoPago para pagos
console.log('🔗 Registrando rutas de MercadoPago...');
app.use('/api/mercadopago', mercadoPagoRoutes);
console.log('✅ Rutas de MercadoPago registradas exitosamente');

// Agregar rutas de reportes básicos
console.log('🔗 Registrando rutas de reportes básicos...');
const reportesRoutes = require('./Backend/routes/reportesRoutes');
app.use('/api/reportes-basicos', reportesRoutes);
console.log('✅ Rutas de reportes básicos registradas exitosamente');

// Agregar rutas de configuración
console.log('🔗 Registrando rutas de configuración...');
const configuracionRoutes = require('./Backend/routes/configuracionRoutes');
app.use('/api/configuracion', configuracionRoutes);
console.log('✅ Rutas de configuración registradas exitosamente');

// Servir archivos estáticos del frontend (DESPUÉS de las rutas API)
app.use(express.static('public'));

// Ruta de prueba simple
app.get('/test', (req, res) => {
  console.log('🧪 Test route accessed');
  res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});

// Endpoint para cerrar el servidor de forma controlada
app.post('/api/server/shutdown', (req, res) => {
  console.log('🔄 Solicitud de cierre del servidor recibida');
  res.json({ message: 'Cerrando servidor...', timestamp: new Date().toISOString() });
  
  // Cerrar el servidor después de enviar la respuesta
  setTimeout(() => {
    gracefulShutdown('API_SHUTDOWN');
  }, 1000);
});

// Debug: Listar todas las rutas registradas
console.log('🔍 LISTANDO TODAS LAS RUTAS REGISTRADAS:');
if (app._router && app._router.stack) {
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      console.log(`  ${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      console.log(`  Router montado en: ${middleware.regexp}`);
    }
  });
} else {
  console.log('  No se pudo acceder a las rutas registradas');
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('ERROR INTERNO:', err.stack);
  res.status(500).json({ msg: 'Error interno del servidor.' });
});

// Puerto del servidor - Clinikdent usa puerto 3001 para evitar conflictos
const PORT = process.env.PORT || 3001;

// Manejo de cierre graceful mejorado (definir antes del servidor)
let isClosing = false;

const gracefulShutdown = (signal) => {
  if (isClosing) {
    console.log('🔄 Ya se está cerrando el servidor...');
    return;
  }
  
  console.log(`🔄 Señal ${signal} recibida. Cerrando servidor gracefully...`);
  isClosing = true;
  
  // Cerrar el servidor HTTP
  server.close((err) => {
    if (err) {
      console.error('❌ Error cerrando servidor:', err);
      process.exit(1);
    }
    console.log('✅ Servidor HTTP cerrado exitosamente');
    process.exit(0);
  });
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.log('⚠️ Forzando cierre del servidor...');
    process.exit(1);
  }, 10000);
};

// Agregar manejo de errores del servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`🌐 También accesible en: http://0.0.0.0:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
  }
});

// Escuchar múltiples señales de cierre
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// En Windows también escuchar Ctrl+C específicamente
if (process.platform === 'win32') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada no manejada:', reason);
  gracefulShutdown('unhandledRejection');
});
