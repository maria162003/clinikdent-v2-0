const express = require('express');
const router = express.Router();

console.log('🔄 Cargando rutas de usuario...');

const {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerPerfil,
  actualizarPerfil,
  obtenerPacientesOdontologo,
  obtenerEstadisticas,
  obtenerProximasCitas,
  obtenerOdontologos,
  reasignarOdontologo
} = require('../controllers/usuarioController');

// Middleware de debug para todas las rutas
router.use((req, res, next) => {
  console.log(`🌐 REQUEST: ${req.method} ${req.originalUrl} - Params:`, req.params);
  next();
});

console.log('✅ Funciones de controlador cargadas:', {
  obtenerPacientesOdontologo: typeof obtenerPacientesOdontologo
});

// Rutas para usuarios
router.get('/estadisticas', obtenerEstadisticas); // Nueva ruta para estadísticas
router.get('/proximas-citas', obtenerProximasCitas); // Nueva ruta para próximas citas
router.get('/odontologos', obtenerOdontologos); // Nueva ruta para obtener solo odontólogos
router.get('/:id/pacientes', (req, res, next) => {
  console.log('🎯 Ruta /pacientes activada para ID:', req.params.id);
  obtenerPacientesOdontologo(req, res, next);
}); // Nueva ruta para obtener pacientes del odontólogo
router.get('/:id/perfil', obtenerPerfil); // Nueva ruta para obtener perfil
router.get('/', obtenerUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);
router.put('/:id/perfil', actualizarPerfil); // Nueva ruta para actualizar perfil
router.put('/:paciente_id/reasignar-odontologo', reasignarOdontologo); // Reasignar odontólogo a paciente
router.delete('/:id', eliminarUsuario);

console.log('📋 Rutas de usuario registradas exitosamente');

module.exports = router;
