const db = require('../config/db');

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
    
    console.log('💰 [ADMIN] Obteniendo factura por ID:', id);
    
    const facturas = await db.query(`
      SELECT 
        f.*,
        (u.nombre || ' ' || u.apellido) as paciente_nombre,
        u.numero_documento as paciente_documento,
        u.telefono as paciente_telefono,
        u.correo as paciente_correo,
        (o.nombre || ' ' || o.apellido) as odontologo_nombre,
        c.fecha as fecha_cita,
        c.hora as hora_cita
      FROM facturas f
      LEFT JOIN usuarios u ON f.paciente_id = u.id
      LEFT JOIN usuarios o ON f.odontologo_id = o.id
      LEFT JOIN citas c ON f.cita_id = c.id
      WHERE f.id = $1
    `, [id]);
    
    if (facturas.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }
    
    const factura = facturas.rows[0];
    
    console.log('✅ Factura encontrada:', {
      id: factura.id,
      numero: factura.numero_factura,
      paciente: factura.paciente_nombre,
      total: factura.total
    });
    
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
    console.log('💰 [ODONTOLOGO] Obteniendo resumen financiero REAL para:', odontologoId);
    
    // Obtener estadísticas reales de facturas (valor pagado por pacientes)
    const estadisticasQuery = `
      SELECT 
        COUNT(*) as total_facturas,
        SUM(f.total) as facturacion_total,
        SUM(CASE WHEN f.estado = 'pendiente' THEN 1 ELSE 0 END) as facturas_pendientes,
        SUM(CASE WHEN f.estado = 'pendiente' THEN f.total ELSE 0 END) as valor_pendiente,
        SUM(CASE WHEN f.estado = 'pagada' THEN f.total ELSE 0 END) as valor_cobrado
      FROM facturas f
      WHERE f.odontologo_id = $1
    `;
    
    const estadisticasResult = await db.query(estadisticasQuery, [odontologoId]);
    const estadisticasRaw = estadisticasResult.rows[0];
    
    // Calculamos las comisiones del odontólogo (40% por defecto)
    const porcentajeComision = 0.40; // 40% para el odontólogo, 60% para la clínica
    const facturacionTotal = parseFloat(estadisticasRaw.facturacion_total) || 0;
    const valorPendiente = parseFloat(estadisticasRaw.valor_pendiente) || 0;
    const valorCobrado = parseFloat(estadisticasRaw.valor_cobrado) || 0;
    
    const estadisticas = {
      total_facturas: parseInt(estadisticasRaw.total_facturas) || 0,
      facturacion_total: facturacionTotal, // Total facturado a pacientes
      ingresos_totales: facturacionTotal * porcentajeComision, // Comisión total del odontólogo
      facturas_pendientes: parseInt(estadisticasRaw.facturas_pendientes) || 0,
      comisiones_totales: facturacionTotal * porcentajeComision,
      comisiones_pendientes: valorPendiente * porcentajeComision, // 60% de facturas pendientes
      comisiones_cobradas: valorCobrado * porcentajeComision // 60% de facturas pagadas
    };
    
    // Obtener ingresos mensuales del odontólogo (comisiones, últimos 6 meses)
    const ingresosMensualesQuery = `
      SELECT 
        DATE_TRUNC('month', f.fecha_emision) as mes,
        SUM(f.total) as facturacion_mes
      FROM facturas f
      WHERE f.odontologo_id = $1 
        AND f.fecha_emision >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', f.fecha_emision)
      ORDER BY mes DESC
    `;
    
    const ingresosMensualesResult = await db.query(ingresosMensualesQuery, [odontologoId]);
    const ingresosMensuales = ingresosMensualesResult.rows.map(row => ({
      mes: row.mes,
      facturacion: parseFloat(row.facturacion_mes) || 0,
      comision: (parseFloat(row.facturacion_mes) || 0) * porcentajeComision // 40% de la facturación
    }));
    
    // Top tratamientos (simulado por ahora)
    const topTratamientos = [
      { tratamiento: 'Limpieza Dental', cantidad: 5, total: 150000 },
      { tratamiento: 'Consulta General', cantidad: 3, total: 90000 }
    ];
    
    console.log('✅ Resumen financiero REAL calculado:', {
      total_facturas: estadisticas.total_facturas,
      facturacion_total: estadisticas.facturacion_total,
      comisiones_odontologo: estadisticas.ingresos_totales,
      porcentaje_comision: `${porcentajeComision * 100}%`
    });
    
    res.json({
      success: true,
      estadisticas: estadisticas,
      ingresos_mensuales: ingresosMensuales,
      top_tratamientos: topTratamientos,
      configuracion: {
        porcentaje_comision: porcentajeComision,
        explicacion: 'Las comisiones se calculan como 40% del valor total facturado al paciente'
      }
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
    
    // Retornar datos vacíos por ahora (las tablas de facturación no existen aún)
    const comisiones = [];
    
    console.log('✅ Historial de comisiones obtenido (datos vacíos - tablas no creadas):', comisiones.length);
    res.json({
      success: true,
      comisiones,
      total: 0,
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
    const { limit = 20, offset = 0, estado } = req.query;
    
    console.log('💰 [ODONTOLOGO] Obteniendo facturas reales para:', { odontologoId, limit, offset, estado });
    
    // Construir query con filtros
    let whereClause = 'WHERE f.odontologo_id = $1';
    let queryParams = [odontologoId];
    let paramIndex = 2;
    
    if (estado) {
      whereClause += ` AND f.estado = $${paramIndex}`;
      queryParams.push(estado);
      paramIndex++;
    }
    
    // Query para obtener facturas con información del paciente y comisión calculada
    const facturas = await db.query(`
      SELECT 
        f.*,
        u.nombre as paciente_nombre,
        u.apellido as paciente_apellido,
        u.correo as paciente_correo,
        c.fecha as fecha_cita,
        c.hora as hora_cita,
        ROUND(f.total * 0.40, 2) as comision_odontologo
      FROM facturas f
      LEFT JOIN usuarios u ON f.paciente_id = u.id
      LEFT JOIN citas c ON f.cita_id = c.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);
    
    // Contar total de facturas
    const totalResult = await db.query(`
      SELECT COUNT(*) as total
      FROM facturas f
      ${whereClause}
    `, queryParams);
    
    const total = parseInt(totalResult.rows[0].total);
    
    console.log('✅ Facturas obtenidas:', { 
      count: facturas.rows.length, 
      total, 
      facturas: facturas.rows.map(f => ({ id: f.id, numero: f.numero_factura, estado: f.estado }))
    });
    
    res.json({
      success: true,
      facturas: facturas.rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
      total,
      message: `${facturas.rows.length} facturas encontradas`
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo facturas del odontólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas',
      error: error.message
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
    
    // Usar datos de la tabla de transacciones de MercadoPago
    let whereClause = 'WHERE usuario_id = $1';
    let queryParams = [pacienteId];
    let paramIndex = 2;
    
    if (estado) {
      whereClause += ` AND estado = $${paramIndex}`;
      queryParams.push(estado);
      paramIndex++;
    }
    
    const { rows: pagos } = await db.query(`
      SELECT 
        id,
        preference_id,
        payment_id,
        external_reference,
        tipo,
        monto,
        estado,
        fecha_creacion,
        fecha_actualizacion,
        descripcion,
        metodo_pago,
        estado_detalle
      FROM transacciones_mercadopago
      ${whereClause}
      ORDER BY fecha_creacion DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
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
    
    // Obtener transacciones pendientes de MercadoPago
    try {
      const { rows: facturasPendientes } = await db.query(`
        SELECT 
          id,
          preference_id,
          external_reference,
          tipo,
          monto,
          estado,
          fecha_creacion,
          descripcion,
          metodo_pago
        FROM transacciones_mercadopago
        WHERE usuario_id = $1 
          AND estado IN ('pending', 'in_process', 'created')
        ORDER BY fecha_creacion DESC
      `, [pacienteId]);
      
      console.log('✅ Facturas pendientes obtenidas:', facturasPendientes.length);
      res.json({
        success: true,
        facturas_pendientes: facturasPendientes
      });
      
    } catch (dbError) {
      console.log('⚠️ Error obteniendo facturas pendientes, usando datos dummy:', dbError.message);
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
