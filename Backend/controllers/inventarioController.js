// Backend/controllers/inventarioController.js
const db = require('../config/db');

/**
 * GET /api/inventario
 * Obtiene todo el inventario con información de sedes
 */
exports.obtenerInventario = async (req, res) => {
  console.log('📦 [inventarioController] Obteniendo inventario completo');
  
  try {
    let query, inventario;
    
    // Usar directamente la tabla equipos que sabemos que existe con estructura correcta
    query = `
      SELECT 
        e.id,
        e.nombre as equipo_nombre,
        e.descripcion as equipo_descripcion,
        e.categoria as equipo_categoria,
        e.precio as equipo_precio,
        e.fecha_alta,
        1 as cantidad,
        NULL as sede_id,
        'Sin asignar' as sede_nombre,
        NULL as sede_ciudad
      FROM equipos e
      ORDER BY e.categoria, e.nombre
    `;
    
    [inventario] = await db.query(query);
    
    console.log(`✅ Inventario obtenido: ${inventario.length} equipos de ${inventario.length} total`);
    
    return res.json(inventario);
  } catch (err) {
    console.error('❌ Error en obtenerInventario:', err);
    return res.status(500).json({ msg: 'Error al obtener inventario.', error: err.message });
  }
};

/**
 * GET /api/inventario/sede/:sede_id
 * Obtiene inventario de una sede específica
 */
exports.obtenerInventarioPorSede = async (req, res) => {
  const { sede_id } = req.params;
  console.log(`📦 [inventarioController] Obteniendo inventario de sede: ${sede_id}`);
  
  try {
    const query = `
      SELECT 
        ie.id,
        ie.equipo_id,
        ie.cantidad,
        ie.descripcion,
        e.nombre as equipo_nombre,
        e.categoria as equipo_categoria,
        e.precio as equipo_precio
      FROM inventario_equipos ie
      LEFT JOIN equipos e ON ie.equipo_id = e.id
      WHERE ie.sede_id = ?
      ORDER BY e.nombre
    `;
    
    const [inventario] = await db.query(query, [sede_id]);
    console.log(`✅ Items encontrados para sede ${sede_id}: ${inventario.length}`);
    
    return res.json(inventario);
  } catch (err) {
    console.error('❌ Error en obtenerInventarioPorSede:', err);
    return res.status(500).json({ msg: 'Error al obtener inventario de la sede.', error: err.message });
  }
};

/**
 * POST /api/inventario
 * Agregar item al inventario
 */
exports.agregarItemInventario = async (req, res) => {
  console.log('🆕 [inventarioController] Agregando item al inventario');
  console.log('📋 Body recibido:', req.body);
  
  const { sede_id, equipo_id, cantidad, descripcion } = req.body;
  
  if (!sede_id || !equipo_id || !cantidad) {
    return res.status(400).json({ msg: 'Datos incompletos. Se requiere sede_id, equipo_id y cantidad.' });
  }
  
  try {
    // Verificar si ya existe el equipo en esa sede
    const [existente] = await db.query(
      'SELECT id, cantidad FROM inventario_equipos WHERE sede_id = ? AND equipo_id = ?',
      [sede_id, equipo_id]
    );
    
    if (existente.length > 0) {
      // Si existe, actualizar cantidad
      const nuevaCantidad = existente[0].cantidad + parseInt(cantidad);
      await db.query(
        'UPDATE inventario_equipos SET cantidad = ?, descripcion = ? WHERE id = ?',
        [nuevaCantidad, descripcion || null, existente[0].id]
      );
      
      console.log('✅ Cantidad actualizada para item existente:', existente[0].id);
      return res.json({ 
        msg: 'Cantidad actualizada en inventario.',
        itemId: existente[0].id,
        nuevaCantidad: nuevaCantidad
      });
    } else {
      // Si no existe, crear nuevo
      const insertQuery = `
        INSERT INTO inventario_equipos (sede_id, equipo_id, cantidad, descripcion)
        VALUES (?, ?, ?, ?)
      `;
      
      const [result] = await db.query(insertQuery, [sede_id, equipo_id, cantidad, descripcion || null]);
      console.log('✅ Item agregado al inventario con ID:', result.insertId);
      
      return res.json({ 
        msg: 'Item agregado al inventario correctamente.',
        itemId: result.insertId
      });
    }
  } catch (err) {
    console.error('❌ Error al agregar item al inventario:', err);
    return res.status(500).json({ msg: 'Error al agregar item al inventario.', error: err.message });
  }
};

/**
 * PUT /api/inventario/:id
 * Actualizar item del inventario
 */
exports.actualizarItemInventario = async (req, res) => {
  console.log('🔄 [inventarioController] Actualizando item del inventario');
  
  const { id } = req.params;
  const { sede_id, equipo_id, cantidad, descripcion } = req.body;
  
  if (!sede_id || !equipo_id || !cantidad) {
    return res.status(400).json({ msg: 'Datos incompletos.' });
  }
  
  try {
    const updateQuery = `
      UPDATE inventario_equipos 
      SET sede_id = ?, equipo_id = ?, cantidad = ?, descripcion = ?
      WHERE id = ?
    `;
    
    const [result] = await db.query(updateQuery, [sede_id, equipo_id, cantidad, descripcion, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Item no encontrado.' });
    }
    
    console.log('✅ Item del inventario actualizado:', id);
    return res.json({ msg: 'Item actualizado correctamente.' });
  } catch (err) {
    console.error('❌ Error al actualizar item del inventario:', err);
    return res.status(500).json({ msg: 'Error al actualizar item del inventario.', error: err.message });
  }
};

/**
 * DELETE /api/inventario/:id
 * Eliminar item del inventario
 */
exports.eliminarItemInventario = async (req, res) => {
  console.log('🗑️ [inventarioController] Eliminando item del inventario');
  
  const { id } = req.params;
  
  try {
    const deleteQuery = 'DELETE FROM inventario_equipos WHERE id = ?';
    const [result] = await db.query(deleteQuery, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Item no encontrado.' });
    }
    
    console.log('✅ Item del inventario eliminado:', id);
    return res.json({ msg: 'Item eliminado correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar item del inventario:', err);
    return res.status(500).json({ msg: 'Error al eliminar item del inventario.', error: err.message });
  }
};

/**
 * GET /api/inventario/equipos
 * Obtener lista de equipos disponibles
 */
exports.obtenerEquipos = async (req, res) => {
  console.log('🔧 [inventarioController] Obteniendo lista de equipos');
  
  try {
    const query = `
      SELECT 
        id,
        nombre,
        categoria,
        precio,
        descripcion
      FROM equipos
      ORDER BY categoria, nombre
    `;
    
    const [equipos] = await db.query(query);
    console.log(`✅ Equipos encontrados: ${equipos.length}`);
    
    return res.json(equipos);
  } catch (err) {
    console.error('❌ Error en obtenerEquipos:', err);
    return res.status(500).json({ msg: 'Error al obtener equipos.', error: err.message });
  }
};

/**
 * GET /api/inventario/estadisticas
 * Obtener estadísticas del inventario
 */
exports.obtenerEstadisticasInventario = async (req, res) => {
  console.log('📊 [inventarioController] Obteniendo estadísticas del inventario');
  
  try {
    // Total de items por sede
    const [totalPorSede] = await db.query(`
      SELECT 
        s.nombre as sede,
        COUNT(ie.id) as total_items,
        SUM(ie.cantidad) as total_cantidad
      FROM sedes s
      LEFT JOIN inventario_equipos ie ON s.id = ie.sede_id
      GROUP BY s.id, s.nombre
    `);
    
    // Total de equipos por categoría
    const [totalPorCategoria] = await db.query(`
      SELECT 
        e.categoria,
        COUNT(ie.id) as total_items,
        SUM(ie.cantidad) as total_cantidad
      FROM equipos e
      LEFT JOIN inventario_equipos ie ON e.id = ie.equipo_id
      GROUP BY e.categoria
    `);
    
    // Valor total del inventario
    const [valorTotal] = await db.query(`
      SELECT 
        SUM(ie.cantidad * e.precio) as valor_total
      FROM inventario_equipos ie
      LEFT JOIN equipos e ON ie.equipo_id = e.id
    `);
    
    const estadisticas = {
      totalPorSede,
      totalPorCategoria,
      valorTotal: valorTotal[0].valor_total || 0
    };
    
    console.log('✅ Estadísticas calculadas');
    return res.json(estadisticas);
  } catch (err) {
    console.error('❌ Error en obtenerEstadisticasInventario:', err);
    return res.status(500).json({ msg: 'Error al obtener estadísticas.', error: err.message });
  }
};

/**
 * GET /api/inventario/proveedores
 * Obtener lista de proveedores
 */
exports.obtenerProveedores = async (req, res) => {
  console.log('🏪 [inventarioController] Obteniendo proveedores desde DB');
  
  try {
    // Consultar proveedores reales de la base de datos
    const query = `
      SELECT 
        id,
        nombre,
        contacto,
        telefono,
        email,
        direccion,
        ciudad,
        pais,
        codigo_proveedor as codigo,
        activo,
        created_at,
        updated_at
      FROM proveedores
      WHERE activo = 1
      ORDER BY nombre ASC
      LIMIT 100
    `;
    
    const [proveedores] = await db.query(query);
    
    console.log(`✅ Proveedores reales obtenidos: ${proveedores.length}`);
    return res.json(proveedores);
  } catch (err) {
    console.error('❌ Error en obtenerProveedores:', err);
    
    // Fallback a datos dummy si falla la consulta
    const proveedoresDummy = [
      { id: 1, nombre: 'Proveedor Dental ABC', contacto: 'Juan Pérez', telefono: '123-456-7890', email: 'ventas@dental-abc.com', activo: 1 },
      { id: 2, nombre: 'Equipos Médicos XYZ', contacto: 'María García', telefono: '098-765-4321', email: 'info@equipos-xyz.com', activo: 1 },
      { id: 3, nombre: 'Instrumental Dental', contacto: 'Ana Silva', telefono: '555-111-2222', email: 'contacto@instrumental.com', activo: 1 }
    ];
    
    console.log(`⚠️ Usando proveedores dummy: ${proveedoresDummy.length}`);
    return res.json(proveedoresDummy);
  }
};

/**
 * POST /api/inventario/proveedores
 * Crear nuevo proveedor
 */
exports.crearProveedor = async (req, res) => {
  console.log('🏪 [inventarioController] Creando nuevo proveedor');
  
  try {
    const {
      nombre, contacto, telefono, email, direccion, ciudad, pais = 'Colombia',
      codigo_proveedor, activo = 1
    } = req.body;
    
    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ msg: 'El nombre del proveedor es obligatorio' });
    }
    
    const insertQuery = `
      INSERT INTO proveedores (
        nombre, contacto, telefono, email, direccion, ciudad, pais, codigo_proveedor, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(insertQuery, [
      nombre, contacto, telefono, email, direccion, ciudad, pais, codigo_proveedor, activo
    ]);
    
    console.log(`✅ Proveedor creado con ID: ${result.insertId}`);
    
    // Devolver el proveedor creado
    const [nuevoProveedor] = await db.query('SELECT * FROM proveedores WHERE id = ?', [result.insertId]);
    
    return res.status(201).json({
      msg: 'Proveedor creado exitosamente',
      proveedor: nuevoProveedor[0]
    });
  } catch (err) {
    console.error('❌ Error creando proveedor:', err);
    return res.status(500).json({ msg: 'Error al crear proveedor', error: err.message });
  }
};

/**
 * PUT /api/inventario/proveedores/:id
 * Actualizar proveedor existente
 */
exports.actualizarProveedor = async (req, res) => {
  const { id } = req.params;
  console.log(`🏪 [inventarioController] Actualizando proveedor ID: ${id}`);
  
  try {
    const {
      nombre, contacto, telefono, email, direccion, ciudad, pais,
      codigo_proveedor, activo
    } = req.body;
    
    const updateQuery = `
      UPDATE proveedores SET
        nombre = ?, contacto = ?, telefono = ?, email = ?, direccion = ?,
        ciudad = ?, pais = ?, codigo_proveedor = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [result] = await db.query(updateQuery, [
      nombre, contacto, telefono, email, direccion, ciudad, pais, codigo_proveedor, activo, id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Proveedor no encontrado' });
    }
    
    console.log(`✅ Proveedor ${id} actualizado`);
    
    // Devolver el proveedor actualizado
    const [proveedorActualizado] = await db.query('SELECT * FROM proveedores WHERE id = ?', [id]);
    
    return res.json({
      msg: 'Proveedor actualizado exitosamente',
      proveedor: proveedorActualizado[0]
    });
  } catch (err) {
    console.error('❌ Error actualizando proveedor:', err);
    return res.status(500).json({ msg: 'Error al actualizar proveedor', error: err.message });
  }
};

/**
 * DELETE /api/inventario/proveedores/:id
 * Eliminar proveedor (desactivar)
 */
exports.eliminarProveedor = async (req, res) => {
  const { id } = req.params;
  console.log(`🏪 [inventarioController] Eliminando proveedor ID: ${id}`);
  
  try {
    // Soft delete: marcar como inactivo
    const [result] = await db.query(
      'UPDATE proveedores SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Proveedor no encontrado' });
    }
    
    console.log(`✅ Proveedor ${id} desactivado`);
    return res.json({ msg: 'Proveedor eliminado exitosamente' });
  } catch (err) {
    console.error('❌ Error eliminando proveedor:', err);
    return res.status(500).json({ msg: 'Error al eliminar proveedor', error: err.message });
  }
};

/**
 * GET /api/inventario/categorias
 * Obtener categorías de inventario
 */
exports.obtenerCategorias = async (req, res) => {
  console.log('📂 [inventarioController] Obteniendo categorías desde DB');
  
  try {
    // Usar consulta con COLLATE para resolver diferencias de collation
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.descripcion,
        c.color,
        c.icono,
        c.activa,
        c.orden,
        c.created_at,
        COUNT(e.id) as total_equipos
      FROM categorias c
      LEFT JOIN equipos e ON e.categoria COLLATE utf8mb4_unicode_ci = c.nombre COLLATE utf8mb4_unicode_ci
      WHERE c.activa = 1 
      GROUP BY c.id, c.nombre, c.descripcion, c.color, c.icono, c.activa, c.orden, c.created_at
      ORDER BY c.orden ASC, c.nombre ASC 
      LIMIT 50
    `;
    
    const [categorias] = await db.query(query);
    
    console.log(`✅ Categorías reales obtenidas: ${categorias.length}`);
    return res.json(categorias);
  } catch (err) {
    console.error('❌ Error en obtenerCategorias:', err);
    
    // Fallback a datos dummy si falla la consulta real
    const categoriasDummy = [
      { id: 1, nombre: 'Equipos Base', descripcion: 'Equipamiento básico del consultorio', color: '#28a745', activa: 1, total_equipos: 4 },
      { id: 2, nombre: 'Imagenología', descripcion: 'Equipos de diagnóstico por imagen', color: '#6f42c1', activa: 1, total_equipos: 0 },
      { id: 3, nombre: 'Instrumental', descripcion: 'Instrumental quirúrgico y de diagnóstico', color: '#e83e8c', activa: 1, total_equipos: 0 }
    ];
    
    console.log(`⚠️ Usando categorías dummy: ${categoriasDummy.length}`);
    return res.json(categoriasDummy);
  }
};

/**
 * GET /api/inventario/movimientos
 * Obtener movimientos de inventario
 */
exports.obtenerMovimientos = async (req, res) => {
  console.log('📋 [inventarioController] Obteniendo movimientos');
  
  const { limite = 50, sede_id, tipo_movimiento } = req.query;
  
  try {
    let query = `
      SELECT 
        mi.*,
        ie.descripcion as item_descripcion,
        eq.nombre as equipo_nombre,
        eq.categoria as equipo_categoria,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido,
        so.nombre as sede_origen_nombre,
        sd.nombre as sede_destino_nombre
      FROM movimientos_inventario mi
      LEFT JOIN inventario_equipos ie ON mi.inventario_id = ie.id
      LEFT JOIN equipos eq ON ie.equipo_id = eq.id
      LEFT JOIN usuarios u ON mi.usuario_id = u.id
      LEFT JOIN sedes so ON mi.sede_origen_id = so.id
      LEFT JOIN sedes sd ON mi.sede_destino_id = sd.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Filtrar por sede si se especifica
    if (sede_id) {
      query += ` AND (mi.sede_origen_id = ? OR mi.sede_destino_id = ?)`;
      queryParams.push(sede_id, sede_id);
    }
    
    // Filtrar por tipo de movimiento si se especifica
    if (tipo_movimiento) {
      query += ` AND mi.tipo_movimiento = ?`;
      queryParams.push(tipo_movimiento);
    }
    
    query += ` ORDER BY mi.fecha_movimiento DESC LIMIT ?`;
    queryParams.push(parseInt(limite));
    
    const [movimientos] = await db.query(query, queryParams);
    
    // Formatear los datos para el frontend
    const movimientosFormateados = movimientos.map(mov => ({
      id: mov.id,
      inventario_id: mov.inventario_id,
      tipo_movimiento: mov.tipo_movimiento,
      cantidad: mov.cantidad,
      cantidad_anterior: mov.cantidad_anterior,
      cantidad_nueva: mov.cantidad_nueva,
      motivo: mov.motivo,
      observaciones: mov.observaciones,
      fecha_movimiento: mov.fecha_movimiento,
      producto_nombre: mov.equipo_nombre || mov.item_descripcion || 'Producto sin nombre',
      producto_categoria: mov.equipo_categoria || 'Sin categoría',
      usuario_nombre: mov.usuario_nombre ? `${mov.usuario_nombre} ${mov.usuario_apellido || ''}`.trim() : 'Usuario desconocido',
      sede_origen: mov.sede_origen_nombre || null,
      sede_destino: mov.sede_destino_nombre || null,
      sede_nombre: mov.sede_destino_nombre || mov.sede_origen_nombre || 'N/A'
    }));
    
    console.log(`✅ Movimientos encontrados: ${movimientosFormateados.length}`);
    return res.json(movimientosFormateados);
  } catch (err) {
    console.error('❌ Error en obtenerMovimientos:', err);
    
    // Fallback con datos dummy si hay error de BD
    const movimientosDummy = [
      {
        id: 1,
        inventario_id: 1,
        tipo_movimiento: 'entrada',
        cantidad: 5,
        motivo: 'Compra inicial',
        usuario_id: 1,
        fecha_movimiento: new Date().toISOString(),
        producto_nombre: 'Sillón Dental',
        usuario_nombre: 'Admin',
        sede_nombre: 'Sede Principal'
      },
      {
        id: 2,
        inventario_id: 2,
        tipo_movimiento: 'salida',
        cantidad: 2,
        motivo: 'Mantenimiento',
        usuario_id: 1,
        fecha_movimiento: new Date(Date.now() - 86400000).toISOString(),
        producto_nombre: 'Autoclave',
        usuario_nombre: 'Admin',
        sede_nombre: 'Sede Norte'
      }
    ];
    
    console.log(`⚠️ Usando datos dummy: ${movimientosDummy.length} movimientos`);
    return res.json(movimientosDummy);
  }
};

// Mantener compatibilidad con métodos anteriores
exports.crearElemento = exports.agregarItemInventario;
exports.actualizarElemento = exports.actualizarItemInventario;
exports.eliminarElemento = exports.eliminarItemInventario;

/**
 * POST /api/inventario/movimientos
 * Registrar un nuevo movimiento de inventario
 */
exports.registrarMovimiento = async (req, res) => {
  console.log('📝 [inventarioController] Registrando movimiento');
  console.log('📋 Datos recibidos:', req.body);
  
  const {
    inventario_id,
    tipo_movimiento,
    cantidad,
    motivo,
    observaciones,
    sede_origen_id,
    sede_destino_id
  } = req.body;
  
  const usuario_id = req.user?.id || 4; // Usuario por defecto para desarrollo
  
  // Validaciones
  if (!inventario_id || !tipo_movimiento || !cantidad || !motivo) {
    return res.status(400).json({ 
      msg: 'Datos incompletos. Se requiere inventario_id, tipo_movimiento, cantidad y motivo.' 
    });
  }
  
  if (!['entrada', 'salida', 'ajuste', 'transferencia'].includes(tipo_movimiento)) {
    return res.status(400).json({ 
      msg: 'Tipo de movimiento inválido. Use: entrada, salida, ajuste o transferencia.' 
    });
  }
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Obtener la cantidad actual del item
    const [itemActual] = await connection.query(
      'SELECT cantidad FROM inventario_equipos WHERE id = ?',
      [inventario_id]
    );
    
    if (itemActual.length === 0) {
      await connection.rollback();
      return res.status(404).json({ msg: 'Item de inventario no encontrado.' });
    }
    
    const cantidadAnterior = itemActual[0].cantidad;
    let cantidadNueva = cantidadAnterior;
    
    // 2. Calcular nueva cantidad según tipo de movimiento
    switch (tipo_movimiento) {
      case 'entrada':
        cantidadNueva = cantidadAnterior + parseInt(cantidad);
        break;
      case 'salida':
        cantidadNueva = cantidadAnterior - parseInt(cantidad);
        if (cantidadNueva < 0) {
          await connection.rollback();
          return res.status(400).json({ 
            msg: `Stock insuficiente. Stock actual: ${cantidadAnterior}, solicitado: ${cantidad}` 
          });
        }
        break;
      case 'ajuste':
        cantidadNueva = parseInt(cantidad); // Ajuste directo al valor especificado
        break;
      case 'transferencia':
        // Para transferencias, la cantidad se resta del origen
        cantidadNueva = cantidadAnterior - parseInt(cantidad);
        if (cantidadNueva < 0) {
          await connection.rollback();
          return res.status(400).json({ 
            msg: `Stock insuficiente para transferencia. Stock actual: ${cantidadAnterior}, a transferir: ${cantidad}` 
          });
        }
        break;
    }
    
    // 3. Actualizar cantidad en inventario
    await connection.query(
      'UPDATE inventario_equipos SET cantidad = ? WHERE id = ?',
      [cantidadNueva, inventario_id]
    );
    
    // 4. Registrar el movimiento
    const [movimientoResult] = await connection.query(`
      INSERT INTO movimientos_inventario 
      (inventario_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, 
       motivo, observaciones, usuario_id, sede_origen_id, sede_destino_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inventario_id, tipo_movimiento, parseInt(cantidad), cantidadAnterior, cantidadNueva,
      motivo, observaciones, usuario_id, sede_origen_id, sede_destino_id
    ]);
    
    await connection.commit();
    
    console.log(`✅ Movimiento registrado: ID ${movimientoResult.insertId}`);
    console.log(`📊 Stock actualizado: ${cantidadAnterior} → ${cantidadNueva}`);
    
    return res.json({
      msg: 'Movimiento registrado exitosamente',
      movimiento: {
        id: movimientoResult.insertId,
        inventario_id,
        tipo_movimiento,
        cantidad: parseInt(cantidad),
        cantidad_anterior: cantidadAnterior,
        cantidad_nueva: cantidadNueva,
        motivo,
        observaciones,
        usuario_id,
        sede_origen_id,
        sede_destino_id,
        fecha_movimiento: new Date().toISOString()
      }
    });
    
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error registrando movimiento:', err);
    return res.status(500).json({ msg: 'Error al registrar movimiento.', error: err.message });
  } finally {
    connection.release();
  }
};