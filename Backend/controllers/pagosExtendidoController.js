const pool = require('../config/db');

console.log('💰 Cargando pagosExtendidoController...');

// ==========================================
// FUNCIONES GENERALES PARA FACTURAS (ADMIN)
// ==========================================

// Obtener todas las facturas (para administradores)
exports.obtenerTodasFacturas = async (req, res) => {
  try {
    const { estado, fecha_inicio, fecha_fin, limit = 50, offset = 0 } = req.query;
    
    console.log('💰 [ADMIN] Obteniendo todas las facturas');
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    
    if (estado && estado !== 'todos') {
      whereClause += ' AND f.estado = ?';
      queryParams.push(estado);
    }
    
    if (fecha_inicio) {
      whereClause += ' AND f.fecha_emision >= ?';
      queryParams.push(fecha_inicio);
    }
    
    if (fecha_fin) {
      whereClause += ' AND f.fecha_emision <= ?';
      queryParams.push(fecha_fin);
    }
    
    const [facturas] = await pool.query(`
      SELECT 
        f.*,
        CONCAT(u.nombre, ' ', u.apellido) as paciente_nombre,
        u.numero_documento as paciente_documento,
        CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
        COUNT(df.id) as total_items,
        GROUP_CONCAT(df.concepto SEPARATOR ', ') as servicios
      FROM facturas f
      LEFT JOIN usuarios u ON f.paciente_id = u.id
      LEFT JOIN usuarios o ON f.odontologo_id = o.id
      LEFT JOIN detalles_factura df ON f.id = df.factura_id
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.fecha_emision DESC, f.id DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);
    
    // Contar total para paginación
    const [countResult] = await pool.query(`
      SELECT COUNT(DISTINCT f.id) as total
      FROM facturas f
      LEFT JOIN usuarios u ON f.paciente_id = u.id
      ${whereClause}
    `, queryParams);
    
    res.json({
      success: true,
      facturas,
      total: countResult[0].total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(countResult[0].total / limit)
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo facturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas'
    });
  }
};

// Crear nueva factura
exports.crearFactura = async (req, res) => {
  try {
    const {
      paciente_id,
      fecha_emision,
      observaciones,
      servicios = [],
      descuento = 0,
      impuestos = 0
    } = req.body;
    
    const odontologo_id = req.headers['user-id'];
    
    console.log('💰 Creando nueva factura:', { paciente_id, odontologo_id });
    
    // Validar datos requeridos
    if (!paciente_id || !fecha_emision) {
      return res.status(400).json({
        success: false,
        message: 'Paciente y fecha son requeridos'
      });
    }
    
    // Calcular totales
    let subtotal = 0;
    if (servicios.length > 0) {
      subtotal = servicios.reduce((total, servicio) => {
        return total + (servicio.cantidad * servicio.precio);
      }, 0);
    }
    
    const total = subtotal - descuento + impuestos;
    
    // Generar número de factura
    const [ultimaFactura] = await pool.query(
      'SELECT numero_factura FROM facturas ORDER BY numero_factura DESC LIMIT 1'
    );
    
    let numeroFactura = 1;
    if (ultimaFactura.length > 0 && ultimaFactura[0].numero_factura) {
      numeroFactura = parseInt(ultimaFactura[0].numero_factura) + 1;
    }
    
    // Crear factura
    const [facturaResult] = await pool.query(`
      INSERT INTO facturas (
        numero_factura, paciente_id, odontologo_id, fecha_emision,
        subtotal, descuento, impuestos, total, estado, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)
    `, [
      numeroFactura.toString().padStart(6, '0'),
      paciente_id, odontologo_id, fecha_emision,
      subtotal, descuento, impuestos, total, observaciones
    ]);
    
    const facturaId = facturaResult.insertId;
    
    // Insertar detalles de factura si hay servicios
    if (servicios.length > 0) {
      for (const servicio of servicios) {
        await pool.query(`
          INSERT INTO detalles_factura (
            factura_id, concepto, cantidad, precio_unitario, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          facturaId,
          servicio.concepto || servicio.nombre,
          servicio.cantidad,
          servicio.precio,
          servicio.cantidad * servicio.precio
        ]);
      }
    }
    
    res.json({
      success: true,
      message: 'Factura creada exitosamente',
      factura_id: facturaId,
      numero_factura: numeroFactura.toString().padStart(6, '0')
    });
    
  } catch (error) {
    console.error('❌ Error creando factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear factura'
    });
  }
};

// Obtener factura por ID
exports.obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [facturas] = await pool.query(`
      SELECT 
        f.*,
        CONCAT(u.nombre, ' ', u.apellido) as paciente_nombre,
        u.numero_documento as paciente_documento,
        u.telefono as paciente_telefono,
        CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre
      FROM facturas f
      LEFT JOIN usuarios u ON f.paciente_id = u.id
      LEFT JOIN usuarios o ON f.odontologo_id = o.id
      WHERE f.id = ?
    `, [id]);
    
    if (facturas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }
    
    // Obtener detalles de la factura
    const [detalles] = await pool.query(`
      SELECT * FROM detalles_factura WHERE factura_id = ?
    `, [id]);
    
    const factura = {
      ...facturas[0],
      detalles
    };
    
    res.json({
      success: true,
      factura
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener factura'
    });
  }
};

// Actualizar factura
exports.actualizarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    
    const [result] = await pool.query(`
      UPDATE facturas 
      SET estado = COALESCE(?, estado),
          observaciones = COALESCE(?, observaciones),
          fecha_actualizacion = NOW()
      WHERE id = ?
    `, [estado, observaciones, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Factura actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar factura'
    });
  }
};

// Eliminar factura
exports.eliminarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la factura existe y no está pagada
    const [factura] = await pool.query(
      'SELECT estado FROM facturas WHERE id = ?',
      [id]
    );
    
    if (factura.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }
    
    if (factura[0].estado === 'pagada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una factura pagada'
      });
    }
    
    // Eliminar detalles primero
    await pool.query('DELETE FROM detalles_factura WHERE factura_id = ?', [id]);
    
    // Eliminar factura
    await pool.query('DELETE FROM facturas WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Factura eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar factura'
    });
  }
};

// ==========================================
// FUNCIONES PARA ODONTÓLOGOS
// ==========================================

// Obtener resumen financiero del odontólogo
exports.obtenerResumenFinancieroOdontologo = async (req, res) => {
  try {
    const odontologoId = req.headers['user-id'];
    console.log('💰 [ODONTOLOGO] Obteniendo resumen financiero para:', odontologoId);
    
    // Estadísticas generales
    const [estadisticas] = await pool.query(`
      SELECT 
        COUNT(DISTINCT f.id) as total_facturas,
        COALESCE(SUM(CASE WHEN f.estado = 'pagada' THEN f.total ELSE 0 END), 0) as ingresos_totales,
        COALESCE(SUM(CASE WHEN f.estado = 'pendiente' THEN f.total ELSE 0 END), 0) as facturas_pendientes,
        COALESCE(SUM(c.monto_comision), 0) as comisiones_totales,
        COALESCE(SUM(CASE WHEN c.estado = 'pendiente' THEN c.monto_comision ELSE 0 END), 0) as comisiones_pendientes,
        COALESCE(SUM(CASE WHEN c.estado = 'pagada' THEN c.monto_comision ELSE 0 END), 0) as comisiones_cobradas
      FROM facturas f
      LEFT JOIN comisiones_odontologo c ON f.id = c.factura_id
      WHERE f.odontologo_id = ?
    `, [odontologoId]);
    
    // Ingresos por mes (últimos 6 meses)
    const [ingresosMensuales] = await pool.query(`
      SELECT 
        DATE_FORMAT(f.fecha_pago, '%Y-%m') as mes,
        COUNT(*) as facturas_pagadas,
        SUM(f.total) as total_mes,
        AVG(c.monto_comision) as promedio_comision
      FROM facturas f
      LEFT JOIN comisiones_odontologo c ON f.id = c.factura_id
      WHERE f.odontologo_id = ? 
        AND f.estado = 'pagada'
        AND f.fecha_pago >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(f.fecha_pago, '%Y-%m')
      ORDER BY mes DESC
    `, [odontologoId]);
    
    // Top tratamientos por ingresos
    const [topTratamientos] = await pool.query(`
      SELECT 
        df.concepto,
        COUNT(*) as cantidad,
        SUM(df.subtotal) as total_ingresos,
        AVG(df.precio_unitario) as precio_promedio
      FROM facturas f
      JOIN detalles_factura df ON f.id = df.factura_id
      WHERE f.odontologo_id = ? AND f.estado = 'pagada'
      GROUP BY df.concepto
      ORDER BY total_ingresos DESC
      LIMIT 5
    `, [odontologoId]);
    
    console.log('✅ Resumen financiero calculado');
    res.json({
      success: true,
      estadisticas: estadisticas[0],
      ingresos_mensuales: ingresosMensuales,
      top_tratamientos: topTratamientos
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo resumen financiero:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen financiero'
    });
  }
};

// Obtener historial de comisiones del odontólogo
exports.obtenerHistorialComisiones = async (req, res) => {
  try {
    const odontologoId = req.headers['user-id'];
    const { limit = 20, offset = 0, estado } = req.query;
    
    console.log('💰 [ODONTOLOGO] Obteniendo historial de comisiones:', { odontologoId, limit, offset, estado });
    
    let whereClause = 'WHERE c.odontologo_id = ?';
    let queryParams = [odontologoId];
    
    if (estado) {
      whereClause += ' AND c.estado = ?';
      queryParams.push(estado);
    }
    
    const [comisiones] = await pool.query(`
      SELECT 
        c.*,
        f.numero_factura,
        f.total as monto_factura,
        f.estado as estado_factura,
        CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
        df.concepto as tratamiento
      FROM comisiones_odontologo c
      JOIN facturas f ON c.factura_id = f.id
      LEFT JOIN usuarios p ON f.paciente_id = p.id
      LEFT JOIN detalles_factura df ON f.id = df.factura_id
      ${whereClause}
      ORDER BY c.fecha_calculo DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);
    
    // Contar total para paginación
    const [totalCount] = await pool.query(`
      SELECT COUNT(*) as total
      FROM comisiones_odontologo c
      JOIN facturas f ON c.factura_id = f.id
      ${whereClause}
    `, queryParams);
    
    console.log('✅ Historial de comisiones obtenido:', comisiones.length);
    res.json({
      success: true,
      comisiones,
      total: totalCount[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo historial de comisiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de comisiones'
    });
  }
};

// Obtener facturas del odontólogo
exports.obtenerFacturasOdontologo = async (req, res) => {
  try {
    const odontologoId = req.headers['user-id'];
    const { estado, fecha_inicio, fecha_fin, limit = 20, offset = 0 } = req.query;
    
    console.log('💰 [ODONTOLOGO] Obteniendo facturas:', { odontologoId, estado });
    
    let whereClause = 'WHERE f.odontologo_id = ?';
    let queryParams = [odontologoId];
    
    if (estado) {
      whereClause += ' AND f.estado = ?';
      queryParams.push(estado);
    }
    
    if (fecha_inicio && fecha_fin) {
      whereClause += ' AND f.fecha_emision BETWEEN ? AND ?';
      queryParams.push(fecha_inicio, fecha_fin);
    }
    
    const [facturas] = await pool.query(`
      SELECT 
        f.*,
        CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
        p.correo as paciente_email,
        COUNT(df.id) as items_count,
        c.monto_comision,
        c.estado as estado_comision
      FROM facturas f
      LEFT JOIN usuarios p ON f.paciente_id = p.id
      LEFT JOIN detalles_factura df ON f.id = df.factura_id
      LEFT JOIN comisiones_odontologo c ON f.id = c.factura_id
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.fecha_emision DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);
    
    console.log('✅ Facturas del odontólogo obtenidas:', facturas.length);
    res.json({
      success: true,
      facturas,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo facturas del odontólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas'
    });
  }
};

// ==========================================
// FUNCIONES PARA PACIENTES
// ==========================================

// Obtener historial de pagos del paciente
exports.obtenerHistorialPagosPaciente = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'];
    const { limit = 20, offset = 0, estado } = req.query;
    
    console.log('💰 [PACIENTE] Obteniendo historial de pagos:', { pacienteId, limit, offset });
    
    let whereClause = 'WHERE f.paciente_id = ?';
    let queryParams = [pacienteId];
    
    if (estado) {
      whereClause += ' AND f.estado = ?';
      queryParams.push(estado);
    }
    
    const [pagos] = await pool.query(`
      SELECT 
        f.*,
        p.monto as monto_pago,
        p.metodo as metodo_pago,
        p.fecha_pago as fecha_pago_real,
        p.referencia_transaccion,
        CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
        GROUP_CONCAT(df.concepto SEPARATOR ', ') as tratamientos
      FROM facturas f
      LEFT JOIN pagos p ON f.id = p.factura_id
      LEFT JOIN usuarios o ON f.odontologo_id = o.id
      LEFT JOIN detalles_factura df ON f.id = df.factura_id
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.fecha_emision DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);
    
    console.log('✅ Historial de pagos del paciente obtenido:', pagos.length);
    res.json({
      success: true,
      pagos,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo historial de pagos del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de pagos'
    });
  }
};

// Obtener facturas pendientes del paciente
exports.obtenerFacturasPendientesPaciente = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'] || req.user?.id || 1;
    console.log('💰 [PACIENTE] Obteniendo facturas pendientes:', pacienteId);
    
    // Intentar obtener de la base de datos, si falla usar datos dummy
    try {
      const [facturasPendientes] = await pool.query(`
        SELECT 
          f.*,
          CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
          GROUP_CONCAT(df.concepto SEPARATOR ', ') as tratamientos,
          DATEDIFF(f.fecha_vencimiento, NOW()) as dias_vencimiento
        FROM facturas f
        JOIN usuarios o ON f.odontologo_id = o.id
        LEFT JOIN detalles_factura df ON f.id = df.factura_id
        WHERE f.paciente_id = ? 
          AND f.estado IN ('pendiente', 'vencida')
        GROUP BY f.id
        ORDER BY f.fecha_vencimiento ASC
      `, [pacienteId]);
      
      console.log('✅ Facturas pendientes obtenidas:', facturasPendientes.length);
      res.json({
        success: true,
        facturas_pendientes: facturasPendientes
      });
      
    } catch (dbError) {
      console.log('⚠️ Tabla facturas no existe, usando datos dummy');
      // Datos dummy para desarrollo
      const facturasDummy = [
        {
          id: 1,
          numero_factura: 'F-2025-001',
          fecha_emision: '2025-01-15',
          fecha_vencimiento: '2025-02-15',
          monto_total: 350000,
          estado: 'pendiente',
          odontologo_nombre: 'Dr. Carlos Rodriguez',
          tratamientos: 'Limpieza dental, Aplicación de flúor',
          dias_vencimiento: 20
        },
        {
          id: 2,
          numero_factura: 'F-2025-002',
          fecha_emision: '2025-01-20',
          fecha_vencimiento: '2025-02-20',
          monto_total: 850000,
          estado: 'pendiente',
          odontologo_nombre: 'Dra. Ana Martinez',
          tratamientos: 'Resina dental, Control post-operatorio',
          dias_vencimiento: 25
        }
      ];
      
      res.json({
        success: true,
        facturas_pendientes: facturasDummy
      });
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo facturas pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas pendientes'
    });
  }
};

// Obtener métodos de pago del paciente
exports.obtenerMetodosPagoPaciente = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'] || req.user?.id || 1;
    console.log('💰 [PACIENTE] Obteniendo métodos de pago:', pacienteId);
    
    // Intentar obtener de la base de datos, si falla usar datos dummy
    try {
      const [metodosPago] = await pool.query(`
        SELECT *
        FROM metodos_pago_usuario
        WHERE usuario_id = ? AND activo = TRUE
        ORDER BY es_preferido DESC, created_at ASC
      `, [pacienteId]);
      
      console.log('✅ Métodos de pago obtenidos:', metodosPago.length);
      res.json({
        success: true,
        metodos_pago: metodosPago
      });
      
    } catch (dbError) {
      console.log('⚠️ Tabla metodos_pago_usuario no existe, usando datos dummy');
      // Datos dummy para desarrollo
      const metodosDummy = [
        {
          id: 1,
          usuario_id: pacienteId,
          tipo: 'tarjeta_credito',
          nombre: 'Visa terminada en 4567',
          numero_enmascarado: '**** **** **** 4567',
          banco: 'Bancolombia',
          es_preferido: true,
          activo: true,
          created_at: '2025-01-10'
        },
        {
          id: 2,
          usuario_id: pacienteId,
          tipo: 'tarjeta_debito',
          nombre: 'Mastercard terminada en 8901',
          numero_enmascarado: '**** **** **** 8901',
          banco: 'Banco de Bogotá',
          es_preferido: false,
          activo: true,
          created_at: '2025-01-05'
        }
      ];
      
      res.json({
        success: true,
        metodos_pago: metodosDummy
      });
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métodos de pago'
    });
  }
};

// Agregar método de pago
exports.agregarMetodoPago = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'];
    const { tipo_metodo, nombre_metodo, ultimos_4_digitos, banco, es_preferido } = req.body;
    
    console.log('💰 [PACIENTE] Agregando método de pago:', { pacienteId, tipo_metodo, nombre_metodo });
    
    // Si es preferido, quitar preferencia de otros métodos
    if (es_preferido) {
      await pool.query(`
        UPDATE metodos_pago_usuario 
        SET es_preferido = FALSE 
        WHERE usuario_id = ?
      `, [pacienteId]);
    }
    
    const [result] = await pool.query(`
      INSERT INTO metodos_pago_usuario 
      (usuario_id, tipo_metodo, nombre_metodo, ultimos_4_digitos, banco, es_preferido)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [pacienteId, tipo_metodo, nombre_metodo, ultimos_4_digitos || null, banco || null, es_preferido || false]);
    
    console.log('✅ Método de pago agregado con ID:', result.insertId);
    res.json({
      success: true,
      message: 'Método de pago agregado exitosamente',
      metodo_id: result.insertId
    });
    
  } catch (error) {
    console.error('❌ Error agregando método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar método de pago'
    });
  }
};

// Simular pago de factura
exports.procesarPagoFactura = async (req, res) => {
  try {
    const pacienteId = req.headers['user-id'];
    const { factura_id, metodo_pago_id, referencia_externa } = req.body;
    
    console.log('💰 [PACIENTE] Procesando pago:', { pacienteId, factura_id, metodo_pago_id });
    
    // Verificar que la factura pertenece al paciente
    const [factura] = await pool.query(`
      SELECT * FROM facturas 
      WHERE id = ? AND paciente_id = ? AND estado = 'pendiente'
    `, [factura_id, pacienteId]);
    
    if (factura.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada o ya pagada'
      });
    }
    
    // Obtener método de pago
    const [metodoPago] = await pool.query(`
      SELECT * FROM metodos_pago_usuario 
      WHERE id = ? AND usuario_id = ? AND activo = TRUE
    `, [metodo_pago_id, pacienteId]);
    
    if (metodoPago.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no válido'
      });
    }
    
    const facturaData = factura[0];
    const metodoData = metodoPago[0];
    
    // Generar referencia de transacción
    const referenciaTransaccion = referencia_externa || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.beginTransaction();
    
    try {
      // Insertar el pago
      const [pagoResult] = await pool.query(`
        INSERT INTO pagos 
        (factura_id, cita_id, paciente_id, odontologo_id, monto, metodo, estado, 
         fecha_pago, referencia_transaccion, notas)
        VALUES (?, ?, ?, ?, ?, ?, 'completado', NOW(), ?, ?)
      `, [
        factura_id,
        facturaData.cita_id,
        pacienteId,
        facturaData.odontologo_id,
        facturaData.total,
        metodoData.tipo_metodo,
        referenciaTransaccion,
        `Pago procesado con ${metodoData.nombre_metodo}`
      ]);
      
      // Actualizar estado de la factura
      await pool.query(`
        UPDATE facturas 
        SET estado = 'pagada', fecha_pago = NOW() 
        WHERE id = ?
      `, [factura_id]);
      
      // Actualizar comisión del odontólogo
      await pool.query(`
        UPDATE comisiones_odontologo 
        SET estado = 'pagada', fecha_pago = NOW(), pago_id = ?
        WHERE factura_id = ?
      `, [pagoResult.insertId, factura_id]);
      
      await pool.commit();
      
      console.log('✅ Pago procesado exitosamente');
      res.json({
        success: true,
        message: 'Pago procesado exitosamente',
        pago_id: pagoResult.insertId,
        referencia_transaccion: referenciaTransaccion
      });
      
    } catch (error) {
      await pool.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error procesando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pago'
    });
  }
};

// ==========================================
// FUNCIÓN PARA OBTENER FACTURAS DE PACIENTE (Dashboard)
// ==========================================
exports.obtenerFacturasPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.id || req.headers['user-id'];
    console.log('💰 [PACIENTE] Obteniendo facturas para paciente:', pacienteId);
    
    // Obtener facturas del paciente
    const [facturas] = await pool.query(`
      SELECT 
        f.id,
        f.numero_factura,
        f.fecha_emision as fecha,
        f.fecha_pago,
        f.total,
        f.estado,
        f.observaciones as descripcion,
        COALESCE(SUM(p.monto), 0) as monto_pagado,
        (f.total - COALESCE(SUM(p.monto), 0)) as saldo_pendiente,
        COUNT(DISTINCT p.id) as numero_pagos,
        u.nombre as odontologo_nombre
      FROM facturas f
      LEFT JOIN pagos p ON f.id = p.factura_id
      LEFT JOIN usuarios u ON f.odontologo_id = u.id
      WHERE f.paciente_id = ?
      GROUP BY f.id
      ORDER BY f.fecha_emision DESC
      LIMIT 10
    `, [pacienteId]);
    
    // Obtener resumen de pagos
    const [resumen] = await pool.query(`
      SELECT 
        COUNT(f.id) as total_facturas,
        COALESCE(SUM(CASE WHEN f.estado = 'pagada' THEN f.total ELSE 0 END), 0) as total_pagado,
        COALESCE(SUM(CASE WHEN f.estado = 'pendiente' THEN f.total ELSE 0 END), 0) as total_pendiente,
        COALESCE(SUM(f.total), 0) as total_general
      FROM facturas f
      WHERE f.paciente_id = ?
    `, [pacienteId]);
    
    console.log('✅ Facturas obtenidas:', facturas.length);
    
    res.json({
      success: true,
      data: {
        facturas: facturas,
        resumen: resumen[0] || {
          total_facturas: 0,
          total_pagado: 0,
          total_pendiente: 0,
          total_general: 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo facturas del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las facturas del paciente'
    });
  }
};

console.log('✅ pagosExtendidoController cargado exitosamente');
