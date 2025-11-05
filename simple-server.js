const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

// Datos mock para el sistema
let citas = [
    {
        id: 9,
        id_paciente: 4,
        id_odontologo: 2,
        fecha: '2025-09-13',
        hora: '14:30:00',
        motivo: 'Limpieza dental',
        notas: 'Primera consulta',
        estado: 'completada',
        odontologo_nombre: 'Carlos',
        odontologo_apellido: 'Rodriguez'
    },
    {
        id: 11,
        id_paciente: 4,
        id_odontologo: 2,
        fecha: '2025-09-14',
        hora: '09:00:00',
        motivo: 'Control',
        notas: 'Revisión general',
        estado: 'completada',
        odontologo_nombre: 'Carlos',
        odontologo_apellido: 'Rodriguez'
    },
    {
        id: 15,
        id_paciente: 4,
        id_odontologo: 2,
        fecha: '2025-09-20',
        hora: '09:00:00',
        motivo: 'Tratamiento',
        notas: 'Seguimiento',
        estado: 'confirmada',
        odontologo_nombre: 'Carlos',
        odontologo_apellido: 'Rodriguez'
    }
];

// API para obtener citas de un paciente
app.get('/api/citas/paciente/:id', (req, res) => {
    const pacienteId = parseInt(req.params.id);
    const citasPaciente = citas.filter(cita => cita.id_paciente === pacienteId);
    console.log(`📅 Obteniendo citas para paciente ${pacienteId}:`, citasPaciente.length);
    res.json(citasPaciente);
});

// API para crear nueva cita
app.post('/api/citas', (req, res) => {
    try {
        console.log('🏥 Nueva cita recibida:', req.body);
        
        const nuevaCita = {
            id: Math.max(...citas.map(c => c.id)) + 1,
            id_paciente: parseInt(req.body.id_paciente),
            id_odontologo: 2, // Dr. Carlos Rodriguez
            fecha: req.body.fecha,
            hora: req.body.hora + ':00',
            motivo: req.body.motivo,
            notas: req.body.notas || '',
            estado: 'pendiente',
            odontologo_nombre: 'Carlos',
            odontologo_apellido: 'Rodriguez'
        };
        
        citas.push(nuevaCita);
        console.log('✅ Cita creada:', nuevaCita);
        res.json({ success: true, cita: nuevaCita });
        
    } catch (error) {
        console.error('❌ Error creando cita:', error);
        res.status(500).json({ msg: 'Error al agendar cita.', error: error.message });
    }
});

// API para obtener usuarios
app.get('/api/usuarios', (req, res) => {
    const usuarios = [
        { id: 1, nombre: 'Administrador', apellido: 'Sistema', correo: 'admin@clinik.com', rol: 'administrador' },
        { id: 2, nombre: 'Carlos', apellido: 'Rodriguez', correo: 'carlos@gmail.com', rol: 'odontologo' },
        { id: 3, nombre: 'Juan', apellido: 'Pérez', correo: 'juan@gmail.com', rol: 'paciente' },
        { id: 4, nombre: 'María', apellido: 'García', correo: 'maria@email.com', rol: 'paciente' }
    ];
    
    const rolFiltro = req.query.rol;
    if (rolFiltro) {
        const usuariosFiltrados = usuarios.filter(usuario => usuario.rol === rolFiltro);
        res.json(usuariosFiltrados);
    } else {
        res.json(usuarios);
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Servidor simple corriendo en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, 'public')}`);
    console.log(`🔗 APIs disponibles:`);
    console.log(`   GET  /api/citas/paciente/:id`);
    console.log(`   POST /api/citas`);
    console.log(`   GET  /api/usuarios`);
});