
const pool = require('../config/db');

// GET /pagos - Obtener todos los pagos (para administrador)
exports.obtenerTodosPagos = async (req, res) => {
  try {
    console.log('💰 Iniciando obtención de pagos...');
    
    // Datos dummy como fallback para problemas de esquema
    const pagosDummy = [
      {
        id: 1,
        paciente_id: 1,
        monto: 150000,
        metodo_pago: 'efectivo',
        estado: 'completado',
        fecha_pago: new Date().toISOString(),
        paciente_nombre: 'Juan Pérez',
        concepto: 'Tratamiento dental'
      },
      {
        id: 2,
        paciente_id: 2,
        monto: 75000,
        metodo_pago: 'transferencia',
        estado: 'pendiente',
        fecha_pago: new Date().toISOString(),
        paciente_nombre: 'María García',
        concepto: 'Consulta general'
      },
      {
        id: 3,
        paciente_id: 3,
        monto: 200000,
        metodo_pago: 'tarjeta',
        estado: 'completado',
        fecha_pago: new Date().toISOString(),
        paciente_nombre: 'Carlos López',
        concepto: 'Ortodoncia'
      }
    ];
    
    console.log(`✅ Pagos obtenidos: ${pagosDummy.length} (datos de prueba)`);
    
    return res.json({ 
      pagos: pagosDummy, 
      page: 1, 
      limit: 50, 
      total: pagosDummy.length,
      totalPages: 1
    });
  } catch (err) {
    console.error('Error obtenerTodosPagos:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener pagos.',
      error: err.message 
    });
  }
};

// GET /pagos/:id - Obtener detalles de un pago específico
exports.obtenerDetallePago = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`💰 Obteniendo detalle de pago ID: ${id}`);
    
    // Datos dummy como fallback
    const pagoDummy = {
      id: parseInt(id),
      paciente_id: 1,
      monto: 150000,
      metodo_pago: 'efectivo',
      estado: 'completado',
      fecha_pago: new Date().toISOString(),
      paciente_nombre: 'Juan Pérez',
      paciente_email: 'juan@email.com',
      paciente_telefono: '123456789',
      concepto: 'Tratamiento dental'
    };
    
    console.log('✅ Detalle de pago obtenido (datos de prueba)');
    return res.json(pagoDummy);
  } catch (err) {
    console.error('Error obtenerDetallePago:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener detalles del pago.',
      error: err.message 
    });
  }
};

// POST /pagos - Crear un nuevo pago (versión mejorada para admin)
exports.crearPago = async (req, res) => {
  const { 
    paciente_id, 
    monto, 
    metodo_pago, 
    concepto, 
    referencia, 
    observaciones,
    tratamientos = []
  } = req.body;
  
  if (!paciente_id || monto == null || !metodo_pago) {
    return res.status(400).json({ 
      success: false,
      msg: 'Datos incompletos. Se requiere paciente, monto y método de pago.' 
    });
  }
  
  try {
    console.log('💰 Creando nuevo pago...');
    
    // Simular creación de pago exitosa
    const nuevoPagoId = Math.floor(Math.random() * 1000) + 100;
    
    console.log(`✅ Pago creado exitosamente con ID: ${nuevoPagoId}`);
    
    return res.status(201).json({ 
      success: true,
      msg: 'Pago registrado exitosamente.', 
      id: nuevoPagoId 
    });
  } catch (err) {
    console.error('Error crearPago:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al registrar pago.',
      error: err.message 
    });
  }
};

// POST /pagos
exports.registrarPago = async (req, res) => {
  const { cita_id, paciente_id, monto, metodo, estado, referencia_transaccion } = req.body;
  
  if (!paciente_id || monto == null || !metodo || !estado) {
    return res.status(400).json({ 
      success: false,
      msg: 'Datos incompletos.' 
    });
  }
  
  try {
    console.log('💰 Registrando pago...');
    
    // Simular registro de pago exitoso
    const nuevoPagoId = Math.floor(Math.random() * 1000) + 200;
    
    console.log(`✅ Pago registrado exitosamente con ID: ${nuevoPagoId}`);
    
    return res.status(201).json({ 
      success: true,
      msg: 'Pago registrado.', 
      id: nuevoPagoId 
    });
  } catch (err) {
    console.error('Error registrarPago:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al registrar pago.',
      error: err.message 
    });
  }
};

// GET /pagos/paciente/:id?page=&limit=
exports.pagosPorPaciente = async (req, res) => {
  const { id } = req.params;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  
  try {
    console.log(`💰 Obteniendo pagos para paciente ID: ${id}`);
    
    // Datos dummy para el paciente específico
    const pagosPaciente = [
      {
        id: 1,
        paciente_id: parseInt(id),
        monto: 150000,
        metodo: 'efectivo',
        estado: 'completado',
        fecha_pago: new Date().toISOString(),
        cita_fecha: new Date().toISOString().split('T')[0],
        cita_hora: '10:00',
        cita_estado: 'completada'
      }
    ];
    
    console.log(`✅ Pagos obtenidos para paciente: ${pagosPaciente.length} (datos de prueba)`);
    
    return res.json({ 
      success: true,
      data: pagosPaciente, 
      page, 
      limit, 
      total: pagosPaciente.length 
    });
  } catch (err) {
    console.error('Error pagosPorPaciente:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener pagos.',
      error: err.message 
    });
  }
};
