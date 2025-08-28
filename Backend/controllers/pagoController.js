
const pool = require('../config/db');

// GET /pagos - Obtener todos los pagos (para administrador)
exports.obtenerTodosPagos = async (req, res) => {
  const { fecha, estado, paciente } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const offset = (page - 1) * limit;
  
  try {
    let whereConditions = [];
    let queryParams = [];
    
    if (fecha && fecha !== 'todos') {
      if (fecha === 'hoy') {
        whereConditions.push('DATE(p.fecha_pago) = CURDATE()');
      } else if (fecha === 'semana') {
        whereConditions.push('p.fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
      } else if (fecha === 'mes') {
        whereConditions.push('p.fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
      }
    }
    
    if (estado && estado !== 'todos') {
      whereConditions.push('p.estado = ?');
      queryParams.push(estado);
    }
    
    if (paciente && paciente.trim()) {
      whereConditions.push('(u.nombre LIKE ? OR u.apellido LIKE ?)');
      queryParams.push(`%${paciente}%`, `%${paciente}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const [rows] = await pool.query(
      `SELECT p.*, 
              CONCAT(u.nombre, ' ', u.apellido) AS paciente_nombre,
              c.fecha AS cita_fecha,
              c.hora AS cita_hora,
              'tratamiento' AS concepto
       FROM pagos p
       LEFT JOIN usuarios u ON u.id = p.paciente_id
       LEFT JOIN citas c ON c.id = p.cita_id
       ${whereClause}
       ORDER BY p.fecha_pago DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pagos p
       LEFT JOIN usuarios u ON u.id = p.paciente_id
       LEFT JOIN citas c ON c.id = p.cita_id
       ${whereClause}`,
      queryParams
    );
    
    return res.json({ 
      pagos: rows, 
      page, 
      limit, 
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error obtenerTodosPagos:', err);
    return res.status(500).json({ msg: 'Error al obtener pagos.' });
  }
};

// GET /pagos/:id - Obtener detalles de un pago específico
exports.obtenerDetallePago = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [[pago]] = await pool.query(
      `SELECT p.*, 
              CONCAT(u.nombre, ' ', u.apellido) AS paciente_nombre,
              u.email AS paciente_email,
              u.telefono AS paciente_telefono,
              c.fecha AS cita_fecha,
              c.hora AS cita_hora,
              c.estado AS cita_estado
       FROM pagos p
       LEFT JOIN usuarios u ON u.id = p.paciente_id
       LEFT JOIN citas c ON c.id = p.cita_id
       WHERE p.id = ?`,
      [id]
    );
    
    if (!pago) {
      return res.status(404).json({ msg: 'Pago no encontrado.' });
    }
    
    // Obtener tratamientos asociados si los hay
    // Por ahora retornamos el pago básico
    return res.json(pago);
  } catch (err) {
    console.error('Error obtenerDetallePago:', err);
    return res.status(500).json({ msg: 'Error al obtener detalles del pago.' });
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
    return res.status(400).json({ msg: 'Datos incompletos. Se requiere paciente, monto y método de pago.' });
  }
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Verificar que el paciente existe
    const [[paciente]] = await conn.query(
      'SELECT id FROM usuarios WHERE id = ? AND rol = "paciente"',
      [paciente_id]
    );
    
    if (!paciente) {
      await conn.rollback();
      return res.status(404).json({ msg: 'Paciente no encontrado.' });
    }
    
    // Insertar pago
    const [result] = await conn.execute(
      `INSERT INTO pagos
        (paciente_id, monto, metodo, estado, fecha_pago, referencia_transaccion, observaciones)
       VALUES (?, ?, ?, 'completado', NOW(), ?, ?)`,
      [paciente_id, Number(monto), metodo_pago, referencia || null, observaciones || null]
    );
    
    const pagoId = result.insertId;
    
    // Si hay tratamientos asociados, crear relaciones
    // Por ahora solo registramos el pago básico
    
    await conn.commit();
    return res.status(201).json({ 
      msg: 'Pago registrado exitosamente.', 
      id: pagoId 
    });
  } catch (err) {
    console.error('Error crearPago:', err);
    await conn.rollback();
    return res.status(500).json({ msg: 'Error al registrar pago.' });
  } finally {
    conn.release();
  }
};

// POST /pagos
exports.registrarPago = async (req, res) => {
  const { cita_id, paciente_id, monto, metodo, estado, referencia_transaccion } = req.body;
  if (!cita_id || !paciente_id || monto == null || !metodo || !estado) {
    return res.status(400).json({ msg: 'Datos incompletos.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[cita]] = await conn.query(
      'SELECT id, paciente_id AS pacienteId FROM citas WHERE id = ?',
      [cita_id]
    );
    if (!cita) { await conn.rollback(); return res.status(404).json({ msg: 'La cita no existe.' }); }
    if (Number(cita.pacienteId) !== Number(paciente_id)) {
      await conn.rollback(); return res.status(400).json({ msg: 'La cita no corresponde al paciente indicado.' });
    }
    const [result] = await conn.execute(
      `INSERT INTO pagos
        (cita_id, paciente_id, monto, metodo, estado, fecha_pago, referencia_transaccion)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [cita_id, paciente_id, Number(monto), metodo, estado, referencia_transaccion || null]
    );
    await conn.commit();
    return res.status(201).json({ msg: 'Pago registrado.', id: result.insertId });
  } catch (err) {
    console.error('Error registrarPago:', err);
    await conn.rollback();
    return res.status(500).json({ msg: 'Error al registrar pago.' });
  } finally {
    conn.release();
  }
};

// GET /pagos/paciente/:id?page=&limit=
exports.pagosPorPaciente = async (req, res) => {
  const { id } = req.params;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const offset = (page - 1) * limit;
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.fecha AS cita_fecha, c.hora AS cita_hora, c.estado AS cita_estado
         FROM pagos p
         JOIN citas c ON c.id = p.cita_id
        WHERE p.paciente_id = ?
        ORDER BY p.fecha_pago DESC, p.id DESC
        LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM pagos WHERE paciente_id = ?',
      [id]
    );
    return res.json({ data: rows, page, limit, total });
  } catch (err) {
    console.error('Error pagosPorPaciente:', err);
    return res.status(500).json({ msg: 'Error al obtener pagos.' });
  }
};
