// Controlador simplificado para planes de tratamiento
const express = require('express');
const router = express.Router();

console.log('✅ Inicializando rutas de planes de tratamiento...');

// Datos de ejemplo
const planesData = [
    {
        id: 1,
        paciente_nombre: 'Juan Pérez',
        paciente_cedula: '12345678',
        nombre_tratamiento: 'Ortodoncia completa',
        tipo_tratamiento: 'ortodoncia',
        estado: 'en_progreso',
        fecha_inicio: '2024-01-15',
        fecha_fin_estimada: '2024-12-15',
        progreso: 35,
        sesiones_completadas: 7,
        sesiones_estimadas: 20,
        prioridad: 'alta',
        costo_estimado: 2500000,
        proxima_cita: '2024-01-25'
    },
    {
        id: 2,
        paciente_nombre: 'María González',
        paciente_cedula: '87654321',
        nombre_tratamiento: 'Limpieza dental profunda',
        tipo_tratamiento: 'periodoncia',
        estado: 'planificado',
        fecha_inicio: '2024-01-30',
        fecha_fin_estimada: '2024-03-30',
        progreso: 0,
        sesiones_completadas: 0,
        sesiones_estimadas: 4,
        prioridad: 'media',
        costo_estimado: 450000,
        proxima_cita: '2024-01-30'
    }
];

// Middleware de logging para estas rutas
router.use((req, res, next) => {
    console.log(`🔥 PLANES API: ${req.method} ${req.path}`);
    next();
});

// Ruta de prueba
router.get('/test', (req, res) => {
    console.log('🧪 Ejecutando ruta de test');
    res.json({ 
        success: true,
        message: 'API de planes funcionando',
        timestamp: new Date().toISOString()
    });
});

// Obtener planes de un odontólogo
router.get('/odontologo/:id', (req, res) => {
    console.log('� RUTA ODONTOLOGO EJECUTADA - ID:', req.params.id);
    console.log('🔥 PATH COMPLETO:', req.path);
    console.log('🔥 URL COMPLETA:', req.url);
    res.json({
        success: true,
        planes: planesData,
        total: planesData.length,
        debug: {
            path: req.path,
            url: req.url,
            params: req.params
        }
    });
});

// Obtener pacientes
router.get('/pacientes/:id', (req, res) => {
    console.log('👥 Obteniendo pacientes para odontólogo:', req.params.id);
    const pacientes = [
        { id: 1, nombre: 'Juan Pérez', cedula: '12345678', telefono: '3001234567', email: 'juan@email.com' },
        { id: 2, nombre: 'María González', cedula: '87654321', telefono: '3009876543', email: 'maria@email.com' }
    ];
    res.json({
        success: true,
        pacientes: pacientes
    });
});

// Crear plan
router.post('/', (req, res) => {
    console.log('💾 Creando plan:', req.body);
    res.json({
        success: true,
        message: 'Plan creado exitosamente',
        planId: Date.now()
    });
});

// Actualizar plan
router.put('/:id', (req, res) => {
    console.log('📝 Actualizando plan:', req.params.id);
    res.json({
        success: true,
        message: 'Plan actualizado exitosamente'
    });
});

// Eliminar plan
router.delete('/:id', (req, res) => {
    console.log('🗑️ Eliminando plan:', req.params.id);
    res.json({
        success: true,
        message: 'Plan eliminado exitosamente'
    });
});

console.log('✅ Rutas de planes configuradas exitosamente');

module.exports = router;
