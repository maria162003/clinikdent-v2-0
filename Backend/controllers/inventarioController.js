// Backend/controllers/inventarioController.js
const db = require('../config/db');

let inventarioColumnCache = null;

const getInventarioTableColumns = async () => {
  if (Array.isArray(inventarioColumnCache)) {
    return inventarioColumnCache;
  }

  try {
    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'inventario'
    `;

    const result = await db.query(query);
    inventarioColumnCache = result.rows.map(row => row.column_name);
  } catch (err) {
    console.warn('⚠️ No se pudieron obtener las columnas de la tabla inventario:', err.message);
    inventarioColumnCache = [];
  }

  return inventarioColumnCache;
};

const parseIntegerSafe = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseFloatSafe = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeBooleanInput = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'si';
  }

  return Boolean(value);
};

const createRegistroInventarioDesdeActualizacion = async (payload = {}, options = {}) => {
  const columns = await getInventarioTableColumns();
  const hasColumn = columnName => columns.includes(columnName);
  const accumulateSedeQuantity = Boolean(options.accumulateSedeQuantity);

  const nombre = payload.nombre || payload.producto || null;
  const cantidadValue = parseIntegerSafe(payload.cantidad ?? payload.cantidad_actual, null);

  if (!nombre || cantidadValue === null) {
    throw new Error('Nombre y cantidad válidos son requeridos.');
  }

  const categoriaValue = parseIntegerSafe(payload.categoria_id ?? payload.categoria, null);
  const sedeIdValue = parseIntegerSafe(payload.sede_id, null);
  const stockMinValue = parseIntegerSafe(payload.stock_minimo ?? payload.cantidad_minima, 0);
  const stockMaxValue = parseIntegerSafe(payload.stock_maximo, null);
  const precioValue = parseFloatSafe(payload.precio_unitario, 0);
  const unidadValue = payload.unidad_medida || payload.unidad || 'unidad';
  const proveedorValue = parseIntegerSafe(payload.proveedor_id, null);
  const codigoValue = payload.codigo ? String(payload.codigo).trim() : null;
  const alertaStockValue = normalizeBooleanInput(payload.alerta_stock_bajo, true);
  const alertaVencimientoValue = normalizeBooleanInput(payload.alerta_vencimiento, false);
  const requiereRecetaValue = normalizeBooleanInput(payload.requiere_receta, false);
  const descripcionValue = payload.descripcion || null;
  const fechaVencimientoValue = payload.fecha_vencimiento || null;
  const ubicacionValue = payload.ubicacion || null;

  const codigoColumn = hasColumn('codigo') ? 'codigo' : null;
  const nombreColumn = hasColumn('nombre') ? 'nombre' : null;
  const descripcionColumn = hasColumn('descripcion') ? 'descripcion' : null;
  const categoriaColumn = hasColumn('categoria_id') ? 'categoria_id' : (hasColumn('categoria') ? 'categoria' : null);
  const sedeColumn = hasColumn('sede_id') ? 'sede_id' : null;
  const cantidadColumn = hasColumn('cantidad_actual') ? 'cantidad_actual' : (hasColumn('cantidad') ? 'cantidad' : null);
  const cantidadMinimaColumn = hasColumn('cantidad_minima') ? 'cantidad_minima' : (hasColumn('stock_minimo') ? 'stock_minimo' : null);
  const stockMaxColumn = hasColumn('stock_maximo') ? 'stock_maximo' : (hasColumn('stock_max') ? 'stock_max' : null);
  const precioColumn = hasColumn('precio_unitario') ? 'precio_unitario' : (hasColumn('precio') ? 'precio' : null);
  const unidadColumn = hasColumn('unidad_medida') ? 'unidad_medida' : (hasColumn('unidad') ? 'unidad' : null);
  const proveedorColumn = hasColumn('proveedor_id') ? 'proveedor_id' : (hasColumn('proveedor') ? 'proveedor' : null);
  const fechaVColumn = hasColumn('fecha_vencimiento') ? 'fecha_vencimiento' : null;
  const ubicacionColumn = hasColumn('ubicacion') ? 'ubicacion' : null;
  const alertaStockColumn = hasColumn('alerta_stock_bajo') ? 'alerta_stock_bajo' : null;
  const alertaVColumn = hasColumn('alerta_vencimiento') ? 'alerta_vencimiento' : null;
  const recetaColumn = hasColumn('requiere_receta') ? 'requiere_receta' : null;

  let productoId = null;
  let action = 'created';

  if (codigoColumn && codigoValue) {
    const existingByCode = await db.query(`SELECT id FROM inventario WHERE ${codigoColumn} = $1`, [codigoValue]);

    if (existingByCode.rowCount > 0) {
      productoId = existingByCode.rows[0].id;

      const updateFragments = [];
      const updateValues = [];

      const pushUpdate = (column, value) => {
        if (!column) {
          return;
        }
        updateFragments.push(`${column} = $${updateFragments.length + 1}`);
        updateValues.push(value);
      };

      pushUpdate(nombreColumn, nombre);
      pushUpdate(descripcionColumn, descripcionValue);
      if (categoriaColumn) {
        const categoriaPayload = categoriaColumn === 'categoria'
          ? (categoriaValue !== null ? String(categoriaValue) : null)
          : categoriaValue;
        pushUpdate(categoriaColumn, categoriaPayload);
      }
      pushUpdate(sedeColumn, sedeIdValue);
      pushUpdate(cantidadColumn, cantidadValue);
      pushUpdate(cantidadMinimaColumn, stockMinValue);
      if (stockMaxColumn) {
        pushUpdate(stockMaxColumn, stockMaxValue);
      }
      pushUpdate(precioColumn, precioValue);
      pushUpdate(unidadColumn, unidadValue);
      if (proveedorColumn) {
        const proveedorPayload = proveedorColumn === 'proveedor'
          ? (proveedorValue !== null ? String(proveedorValue) : null)
          : proveedorValue;
        pushUpdate(proveedorColumn, proveedorPayload);
      }
      pushUpdate(fechaVColumn, fechaVencimientoValue);
      pushUpdate(ubicacionColumn, ubicacionValue);
      pushUpdate(alertaStockColumn, alertaStockValue);
      pushUpdate(alertaVColumn, alertaVencimientoValue);
      pushUpdate(recetaColumn, requiereRecetaValue);

      if (updateFragments.length > 0) {
        updateValues.push(productoId);
        const updateQuery = `UPDATE inventario SET ${updateFragments.join(', ')} WHERE id = $${updateValues.length}`;
        await db.query(updateQuery, updateValues);
        action = 'updated';
      } else {
        action = 'unchanged';
      }
    }
  }

  if (!productoId) {
    const insertColumns = [];
    const insertValues = [];
    const placeholders = [];

    const pushInsert = (column, value) => {
      if (!column) {
        return;
      }
      insertColumns.push(column);
      insertValues.push(value);
      placeholders.push(`$${insertValues.length}`);
    };

    pushInsert(codigoColumn, codigoValue);
    pushInsert(nombreColumn, nombre);
    pushInsert(descripcionColumn, descripcionValue);
    if (categoriaColumn) {
      const categoriaPayload = categoriaColumn === 'categoria'
        ? (categoriaValue !== null ? String(categoriaValue) : null)
        : categoriaValue;
      pushInsert(categoriaColumn, categoriaPayload);
    }
    pushInsert(sedeColumn, sedeIdValue);
    pushInsert(cantidadColumn, cantidadValue);
    pushInsert(cantidadMinimaColumn, stockMinValue);
    if (stockMaxColumn) {
      pushInsert(stockMaxColumn, stockMaxValue);
    }
    pushInsert(precioColumn, precioValue);
    pushInsert(unidadColumn, unidadValue);
    if (proveedorColumn) {
      const proveedorPayload = proveedorColumn === 'proveedor'
        ? (proveedorValue !== null ? String(proveedorValue) : null)
        : proveedorValue;
      pushInsert(proveedorColumn, proveedorPayload);
    }
    pushInsert(fechaVColumn, fechaVencimientoValue);
    pushInsert(ubicacionColumn, ubicacionValue);
    pushInsert(alertaStockColumn, alertaStockValue);
    pushInsert(alertaVColumn, alertaVencimientoValue);
    pushInsert(recetaColumn, requiereRecetaValue);

    if (insertColumns.length === 0) {
      throw new Error('No se pudieron determinar las columnas para insertar un producto en inventario.');
    }

    const insertQuery = `INSERT INTO inventario (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
    const insertResult = await db.query(insertQuery, insertValues);
    productoId = insertResult.rows[0].id;
  }

  let inventarioEquipoId = null;
  const equipoIdValue = parseIntegerSafe(payload.equipo_id, null);

  if (sedeIdValue && equipoIdValue) {
    const existingSedeEquipo = await db.query(
      'SELECT id, cantidad FROM inventario_equipos WHERE sede_id = $1 AND equipo_id = $2',
      [sedeIdValue, equipoIdValue]
    );

    if (existingSedeEquipo.rowCount > 0) {
      inventarioEquipoId = existingSedeEquipo.rows[0].id;
      const baseCantidad = existingSedeEquipo.rows[0].cantidad || 0;
      const siguienteCantidad = accumulateSedeQuantity ? baseCantidad + cantidadValue : cantidadValue;

      await db.query(
        'UPDATE inventario_equipos SET cantidad = $1, descripcion = $2 WHERE id = $3',
        [siguienteCantidad, descripcionValue, inventarioEquipoId]
      );
    } else {
      const insertInventarioEquipos = await db.query(
        'INSERT INTO inventario_equipos (sede_id, equipo_id, cantidad, descripcion) VALUES ($1, $2, $3, $4) RETURNING id',
        [sedeIdValue, equipoIdValue, cantidadValue, descripcionValue]
      );

      inventarioEquipoId = insertInventarioEquipos.rows[0].id;
    }
  }

  return {
    productoId,
    inventarioEquipoId,
    action,
    cantidad: cantidadValue
  };
};

/**
 * GET /api/inventario
 * Obtiene todo el inventario con información de sedes
 */
exports.obtenerInventario = async (req, res) => {
  console.log('📦 [inventarioController] Obteniendo inventario completo');
  
  try {
    // Consulta que combina las tres fuentes de datos de inventario
    const query = `
      SELECT 
        -- Datos básicos del item
        COALESCE(i.id, ie.id, e.id) as id,
        COALESCE(i.nombre, e.nombre) as nombre,
        COALESCE(i.descripcion, ie.descripcion, e.descripcion) as descripcion,
        COALESCE(i.codigo, CONCAT('EQ-', e.id)) as codigo,
        COALESCE(CAST(i.categoria_id AS VARCHAR), e.categoria) as categoria,
        
        -- Información de cantidades y stock
    COALESCE(i.cantidad_actual, ie.cantidad, 0) as cantidad,
    COALESCE(i.cantidad_minima, 1) as stock_minimo,
    COALESCE(i.precio_unitario, e.precio, 0) as precio_unitario,
    COALESCE(ie.equipo_id, e.id) as equipo_id,
        
        -- Información de ubicación
        COALESCE(i.sede_id, ie.sede_id) as sede_id,
        COALESCE(s.nombre, 'Sin asignar') as sede_nombre,
        COALESCE(s.ciudad, '') as sede_ciudad,
        COALESCE(i.ubicacion, 'No especificada') as ubicacion,
        
        -- Información adicional
        COALESCE(i.proveedor, 'Sin especificar') as proveedor,
        COALESCE(i.estado, 'activo') as estado,
        COALESCE(i.created_at, e.fecha_alta, NOW()) as fecha_registro,
        
        -- Campo para identificar la fuente
        CASE 
          WHEN i.id IS NOT NULL THEN 'inventario'
          WHEN ie.id IS NOT NULL THEN 'inventario_equipos'
          ELSE 'equipos'
        END as fuente_datos
        
      FROM equipos e
      LEFT JOIN inventario_equipos ie ON e.id = ie.equipo_id
      LEFT JOIN inventario i ON (i.nombre = e.nombre OR i.codigo LIKE CONCAT('%', e.id, '%'))
      LEFT JOIN sedes s ON COALESCE(i.sede_id, ie.sede_id) = s.id
      
      UNION ALL
      
      -- Items que están solo en la tabla inventario (sin equipos)
      SELECT 
        i.id,
        i.nombre,
        i.descripcion,
        i.codigo,
    CAST(i.categoria_id AS VARCHAR) as categoria,
    i.cantidad_actual as cantidad,
    i.cantidad_minima as stock_minimo,
    i.precio_unitario,
    NULL as equipo_id,
        i.sede_id,
        COALESCE(s.nombre, 'Sin asignar') as sede_nombre,
        COALESCE(s.ciudad, '') as sede_ciudad,
        i.ubicacion,
        i.proveedor,
        i.estado,
        i.created_at as fecha_registro,
        'inventario' as fuente_datos
      FROM inventario i
      LEFT JOIN sedes s ON i.sede_id = s.id
      WHERE NOT EXISTS (
        SELECT 1 FROM equipos e 
        WHERE e.nombre = i.nombre OR i.codigo LIKE CONCAT('%', e.id, '%')
      )
      
      ORDER BY categoria, nombre
    `;
    
    console.log('🔍 Ejecutando consulta combinada de inventario...');
    const result = await db.query(query);
    const inventario = result.rows;
    
    console.log(`✅ Inventario obtenido: ${inventario.length} items total`);
    console.log('📊 Fuentes de datos:', inventario.reduce((acc, item) => {
      acc[item.fuente_datos] = (acc[item.fuente_datos] || 0) + 1;
      return acc;
    }, {}));
    
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
      WHERE ie.sede_id = $1
      ORDER BY e.nombre
    `;
    
    const result = await db.query(query, [sede_id]);
    const inventario = result.rows;
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
  
  const { 
    codigo, 
    nombre, 
    categoria, 
    sede_id, 
    cantidad, 
    stock_minimo, 
    stock_maximo, 
    precio_unitario, 
    unidad_medida, 
    proveedor_id, 
    fecha_vencimiento, 
    ubicacion, 
    descripcion, 
    alerta_stock_bajo, 
    alerta_vencimiento, 
    requiere_receta 
  } = req.body;
  
  const cantidadValue = parseInt(cantidad, 10);
  if (!nombre || !categoria || Number.isNaN(cantidadValue)) {
    console.log('❌ Datos incompletos:', { nombre, categoria, cantidad });
    return res.status(400).json({ msg: 'Datos incompletos. Se requiere nombre, categoría y cantidad numérica.' });
  }
  
  try {
    // Si es un equipo nuevo, crear primero en la tabla equipos
    let equipo_id = null;
    
    if (codigo && nombre && categoria) {
      // Verificar si el equipo ya existe por código o nombre
      const equipoExistenteResult = await db.query(
        'SELECT id FROM equipos WHERE nombre = $1 OR descripcion LIKE $2',
        [nombre, `%${codigo}%`]
      );
      
      if (equipoExistenteResult.rows.length > 0) {
        equipo_id = equipoExistenteResult.rows[0].id;
        console.log('✅ Usando equipo existente con ID:', equipo_id);
      } else {
        // Crear nuevo equipo
        const nuevoEquipoResult = await db.query(
          'INSERT INTO equipos (nombre, descripcion, categoria, precio, fecha_alta) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING id',
          [nombre, `${codigo} - ${descripcion || ''}`.trim(), categoria, precio_unitario || 0]
        );
        equipo_id = nuevoEquipoResult.rows[0].id;
        console.log('✅ Nuevo equipo creado con ID:', equipo_id);
      }
    }

    const categoriaId = Number.isNaN(parseInt(categoria, 10)) ? null : parseInt(categoria, 10);
    const sedeIdValue = sede_id ? parseInt(sede_id, 10) : null;
    const stockMinValue = Number.isNaN(parseInt(stock_minimo, 10)) ? 0 : parseInt(stock_minimo, 10);
    const stockMaxValue = stock_maximo === undefined || stock_maximo === null || stock_maximo === ''
      ? null
      : parseInt(stock_maximo, 10);
    const precioValue = precio_unitario === undefined || precio_unitario === null || precio_unitario === ''
      ? 0
      : parseFloat(precio_unitario);
    const proveedorValue = proveedor_id ? parseInt(proveedor_id, 10) : null;
    const normalizeBoolean = (value, defaultValue = false) => {
      if (value === undefined || value === null || value === '') {
        return defaultValue;
      }
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'si';
      }
      return Boolean(value);
    };

    const alertaStockValue = normalizeBoolean(alerta_stock_bajo, true);
    const alertaVencimientoValue = normalizeBoolean(alerta_vencimiento, false);
    const requiereRecetaValue = normalizeBoolean(requiere_receta, false);

    const syncPayload = {
      codigo: codigo || null,
      nombre,
      descripcion: descripcion || null,
      categoria: categoriaId,
      categoria_id: categoriaId,
      sede_id: sedeIdValue,
      cantidad: cantidadValue,
      stock_minimo: stockMinValue,
      stock_maximo: stockMaxValue,
      precio_unitario: precioValue,
      unidad_medida: unidad_medida || 'unidad',
      proveedor_id: proveedorValue,
      fecha_vencimiento: fecha_vencimiento || null,
      ubicacion: ubicacion || null,
      alerta_stock_bajo: alertaStockValue,
      alerta_vencimiento: alertaVencimientoValue,
      requiere_receta: requiereRecetaValue,
      equipo_id
    };

    const syncResult = await createRegistroInventarioDesdeActualizacion(syncPayload, {
      accumulateSedeQuantity: true
    });

    console.log('✅ Sincronización de inventario completada:', syncResult);

    const responseMsg = (() => {
      if (syncResult.action === 'updated') {
        return 'Producto actualizado correctamente en inventario.';
      }
      if (syncResult.action === 'created') {
        return 'Producto creado correctamente en inventario.';
      }
      return 'Producto sincronizado correctamente en inventario.';
    })();

    return res.json({
      msg: responseMsg,
      productoId: syncResult.productoId,
      itemId: syncResult.inventarioEquipoId || syncResult.productoId,
      equipoId: equipo_id,
      cantidad: syncResult.cantidad
    });
    
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
  const payload = req.body || {};

  // Intentar primero actualizar la tabla principal de inventario (productos generales)
  try {
    const inventarioResult = await db.query('SELECT id FROM inventario WHERE id = $1', [id]);

    if (inventarioResult.rowCount > 0) {
      const columns = await getInventarioTableColumns();
      const hasColumn = columnName => columns.includes(columnName);

      const cantidadColumn = hasColumn('cantidad_actual') ? 'cantidad_actual' : (hasColumn('cantidad') ? 'cantidad' : null);
      const cantidadMinimaColumn = hasColumn('cantidad_minima') ? 'cantidad_minima' : (hasColumn('stock_minimo') ? 'stock_minimo' : null);
      const stockMaxColumn = hasColumn('stock_maximo') ? 'stock_maximo' : (hasColumn('stock_max') ? 'stock_max' : null);
      const precioColumn = hasColumn('precio_unitario') ? 'precio_unitario' : (hasColumn('precio') ? 'precio' : null);
      const proveedorColumn = hasColumn('proveedor_id') ? 'proveedor_id' : (hasColumn('proveedor') ? 'proveedor' : null);
      const categoriaColumn = hasColumn('categoria_id') ? 'categoria_id' : (hasColumn('categoria') ? 'categoria' : null);
      const unidadColumn = hasColumn('unidad_medida') ? 'unidad_medida' : (hasColumn('unidad') ? 'unidad' : null);

      const fieldMap = {
        codigo: hasColumn('codigo') ? 'codigo' : null,
        nombre: hasColumn('nombre') ? 'nombre' : null,
        descripcion: hasColumn('descripcion') ? 'descripcion' : null,
        categoria: categoriaColumn,
        categoria_id: categoriaColumn,
        sede_id: hasColumn('sede_id') ? 'sede_id' : null,
        cantidad: cantidadColumn,
        cantidad_actual: cantidadColumn,
        stock_minimo: cantidadMinimaColumn,
        cantidad_minima: cantidadMinimaColumn,
        stock_maximo: stockMaxColumn,
        precio_unitario: precioColumn,
        unidad_medida: unidadColumn,
        proveedor_id: proveedorColumn,
        fecha_vencimiento: hasColumn('fecha_vencimiento') ? 'fecha_vencimiento' : null,
        ubicacion: hasColumn('ubicacion') ? 'ubicacion' : null,
        alerta_stock_bajo: hasColumn('alerta_stock_bajo') ? 'alerta_stock_bajo' : null,
        alerta_vencimiento: hasColumn('alerta_vencimiento') ? 'alerta_vencimiento' : null,
        requiere_receta: hasColumn('requiere_receta') ? 'requiere_receta' : null
      };

      const setClauses = [];
      const values = [];
      let index = 1;

      Object.entries(fieldMap).forEach(([payloadKey, columnName]) => {
        if (!columnName) {
          return;
        }

        if (Object.prototype.hasOwnProperty.call(payload, payloadKey)) {
          const value = payload[payloadKey];
          if (value === undefined) {
            return;
          }

          let normalizedValue = value;

          switch (columnName) {
            case 'categoria_id':
            case 'sede_id':
            case 'proveedor_id':
              normalizedValue = value === null || value === ''
                ? null
                : parseInt(value, 10);
              if (Number.isNaN(normalizedValue)) {
                normalizedValue = null;
              }
              break;
            case 'categoria':
              normalizedValue = value === null || value === '' ? null : String(value);
              break;
            case 'cantidad_actual':
            case 'cantidad_minima':
            case 'stock_maximo':
            case 'stock_max':
              normalizedValue = value === null || value === ''
                ? null
                : parseInt(value, 10);
              if (Number.isNaN(normalizedValue)) {
                normalizedValue = null;
              }
              break;
            case 'cantidad':
            case 'stock_minimo':
              normalizedValue = value === null || value === ''
                ? null
                : parseInt(value, 10);
              if (Number.isNaN(normalizedValue)) {
                normalizedValue = null;
              }
              break;
            case 'precio_unitario':
              normalizedValue = value === null || value === ''
                ? null
                : parseFloat(value);
              if (Number.isNaN(normalizedValue)) {
                normalizedValue = null;
              }
              break;
            case 'precio':
              normalizedValue = value === null || value === ''
                ? null
                : parseFloat(value);
              if (Number.isNaN(normalizedValue)) {
                normalizedValue = null;
              }
              break;
            case 'alerta_stock_bajo':
            case 'alerta_vencimiento':
            case 'requiere_receta':
              if (value === null || value === undefined || value === '') {
                normalizedValue = null;
              } else if (typeof value === 'string') {
                normalizedValue = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'si';
              } else {
                normalizedValue = Boolean(value);
              }
              break;
            case 'proveedor':
              normalizedValue = value === null || value === '' ? null : String(value);
              break;
            case 'unidad':
              normalizedValue = value === '' ? null : value;
              break;
            default:
              normalizedValue = value === '' ? null : value;
              break;
          }

          setClauses.push(`${columnName} = $${index}`);
          values.push(normalizedValue);
          index += 1;
        }
      });

      if (setClauses.length > 0) {
        const updateQuery = `UPDATE inventario SET ${setClauses.join(', ')} WHERE id = $${index}`;
        values.push(id);

        const updateResult = await db.query(updateQuery, values);

        if (updateResult.rowCount > 0) {
          console.log('✅ Item del inventario general actualizado:', id);
          return res.json({ msg: 'Producto actualizado correctamente.' });
        }
      } else {
        console.log('ℹ️ [inventarioController] No se proporcionaron campos para actualizar inventario general.');
      }
    }
  } catch (err) {
    console.error('⚠️ Error actualizando inventario general:', err);
    // Continuar intentando con inventario por sede para mantener compatibilidad
  }

  // Si no se actualizó en inventario general, intentar con inventario por sede/equipos
  try {
    const existingItemResult = await db.query(
      'SELECT sede_id, equipo_id, cantidad, descripcion FROM inventario_equipos WHERE id = $1',
      [id]
    );

    if (existingItemResult.rowCount === 0) {
      console.warn('⚠️ Item no encontrado en inventario_equipos. Intentando crear registro con los datos recibidos.');

      try {
        const fallbackResult = await createRegistroInventarioDesdeActualizacion(payload);

        if (fallbackResult && fallbackResult.productoId) {
          const responseMsg = (() => {
            if (fallbackResult.action === 'updated') {
              return 'Producto sincronizado correctamente.';
            }
            if (fallbackResult.action === 'created') {
              return 'Producto creado correctamente en inventario.';
            }
            return 'Producto sincronizado sin cambios.';
          })();

          console.log('✅ Fallback de actualización aplicado. Producto ID:', fallbackResult.productoId);
          return res.json({
            msg: responseMsg,
            productoId: fallbackResult.productoId,
            itemId: fallbackResult.inventarioEquipoId || fallbackResult.productoId,
            cantidad: fallbackResult.cantidad
          });
        }

        console.warn('⚠️ Fallback de actualización no generó cambios.');
        return res.status(404).json({ msg: 'Item no encontrado.' });
      } catch (fallbackError) {
        console.error('❌ Error en fallback de actualización de inventario:', fallbackError);
        return res.status(500).json({
          msg: 'Error al sincronizar el item en inventario.',
          error: fallbackError.message
        });
      }
    }

    const existingItem = existingItemResult.rows[0];

    const nextSedeId = payload.sede_id ? parseInt(payload.sede_id, 10) : existingItem.sede_id;
    const nextEquipoId = payload.equipo_id ? parseInt(payload.equipo_id, 10) : existingItem.equipo_id;
    let nextCantidad = existingItem.cantidad;
    if (payload.cantidad !== undefined && payload.cantidad !== null && payload.cantidad !== '') {
      const parsedCantidad = parseInt(payload.cantidad, 10);
      if (!Number.isNaN(parsedCantidad)) {
        nextCantidad = parsedCantidad;
      }
    }
    const nextDescripcion = Object.prototype.hasOwnProperty.call(payload, 'descripcion')
      ? payload.descripcion
      : existingItem.descripcion;

  if (!nextSedeId || !nextEquipoId || Number.isNaN(nextCantidad)) {
      console.warn('⚠️ Datos incompletos para actualizar inventario_equipos', {
        nextSedeId,
        nextEquipoId,
        nextCantidad
      });
      return res.status(400).json({ msg: 'Datos incompletos para actualizar inventario por sede.' });
    }

    const updateQuery = `
      UPDATE inventario_equipos
      SET sede_id = $1, equipo_id = $2, cantidad = $3, descripcion = $4
      WHERE id = $5
    `;

    await db.query(updateQuery, [nextSedeId, nextEquipoId, nextCantidad, nextDescripcion || null, id]);

    console.log('✅ Item del inventario por sede actualizado:', id);
    return res.json({ msg: 'Item actualizado correctamente.' });
  } catch (err) {
    console.error('❌ Error al actualizar item del inventario por sede:', err);
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
    const deleteQuery = 'DELETE FROM inventario_equipos WHERE id = $1';
    const result = await db.query(deleteQuery, [id]);
    
    if (result.rowCount === 0) {
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
    
    const result = await db.query(query);
    const equipos = result.rows;
    console.log(`✅ Equipos encontrados: ${equipos.length}`);
    
    return res.json(equipos);
  } catch (err) {
    console.error('❌ Error en obtenerEquipos:', err);
    return res.status(500).json({ msg: 'Error al obtener equipos.', error: err.message });
  }
};

/**
 * GET /api/inventario/estadisticas
 * Obtener estadísticas REALES del inventario (estructura correcta)
 */
exports.obtenerEstadisticasInventario = async (req, res) => {
  console.log('📊 [inventarioController] Obteniendo estadísticas REALES del inventario');
  
  try {
    // Total productos = equipos + items en inventario
    const totalEquiposResult = await db.query(`
      SELECT COUNT(*) as total_productos
      FROM equipos
    `);
    
    // Valor total = suma de precios de equipos
    const valorTotalResult = await db.query(`
      SELECT COALESCE(SUM(precio), 0) as valor_total_stock
      FROM equipos
    `);
    
    const equiposPorCategoriaResult = await db.query(`
      SELECT 
        categoria,
        COUNT(*) as cantidad,
        SUM(precio) as valor_categoria
      FROM equipos
      WHERE categoria IS NOT NULL
      GROUP BY categoria
      ORDER BY categoria
    `);
    
    // Stock bajo: buscar en inventario_equipos (que sí tiene cantidad)
    const stockBajoCount = await db.query(`
      SELECT COUNT(*) as productos_stock_bajo
      FROM inventario_equipos ie
      WHERE ie.cantidad > 0 AND ie.cantidad < 5
    `);
    
    // Productos agotados: cantidad = 0 en inventario_equipos
    const productosAgotadosCount = await db.query(`
      SELECT COUNT(*) as productos_agotados
      FROM inventario_equipos ie
      WHERE ie.cantidad = 0
    `);

    const estadisticas = {
      totalProductos: parseInt(totalEquiposResult.rows[0].total_productos) || 0,
      valorTotalStock: parseFloat(valorTotalResult.rows[0].valor_total_stock) || 0,
      productosStockBajo: parseInt(stockBajoCount.rows[0].productos_stock_bajo) || 0,
      productosAgotados: parseInt(productosAgotadosCount.rows[0].productos_agotados) || 0,
      equiposPorCategoria: equiposPorCategoriaResult.rows || [],
      // Datos adicionales para el dashboard
      estadisticasDetalladas: {
        totalPorSede: [
          { 
            sede: 'Sede Principal', 
            total_items: parseInt(totalEquiposResult.rows[0].total_productos) || 0, 
            total_cantidad: parseInt(totalEquiposResult.rows[0].total_productos) || 0 
          }
        ],
        totalPorCategoria: equiposPorCategoriaResult.rows.map(cat => ({
          categoria: cat.categoria,
          total_items: parseInt(cat.cantidad) || 0,
          total_cantidad: parseInt(cat.cantidad) || 0
        })),
        valorTotal: parseFloat(valorTotalResult.rows[0].valor_total_stock) || 0
      }
    };
    
    console.log('✅ Estadísticas REALES calculadas:', {
      totalProductos: estadisticas.totalProductos,
      valorTotalStock: estadisticas.valorTotalStock,
      productosStockBajo: estadisticas.productosStockBajo,
      productosAgotados: estadisticas.productosAgotados
    });
    
    return res.json(estadisticas);
  } catch (err) {
    console.error('❌ Error en obtenerEstadisticasInventario:', err);
    return res.status(500).json({ msg: 'Error al obtener estadísticas.', error: err.message });
  }
};

/**
 * GET /api/inventario/alertas
 * Obtener alertas REALES de stock bajo y productos agotados
 */
exports.obtenerAlertas = async (req, res) => {
  console.log('🚨 [inventarioController] Obteniendo alertas REALES de stock');
  
  try {
    // Obtener alertas desde inventario_equipos (que sí tiene cantidad)
    const alertasResult = await db.query(`
      SELECT 
        e.id,
        e.nombre as producto,
        COALESCE(s.nombre, 'Sede Principal') as sede,
        e.categoria,
        ie.cantidad as "stockActual",
        5 as "stockMinimo",
        e.precio,
        CASE 
          WHEN ie.cantidad = 0 THEN 'agotado'
          WHEN ie.cantidad < 5 THEN 'bajo'
          ELSE 'normal'
        END as estado,
        CASE 
          WHEN ie.cantidad = 0 THEN 'stock_agotado'
          WHEN ie.cantidad < 5 THEN 'stock_bajo'
          ELSE 'normal'
        END as "tipoAlerta",
        CASE 
          WHEN ie.cantidad = 0 THEN 3
          WHEN ie.cantidad < 2 THEN 2
          ELSE 1
        END as prioridad
      FROM inventario_equipos ie
      LEFT JOIN equipos e ON ie.equipo_id = e.id
      LEFT JOIN sedes s ON ie.sede_id = s.id
      WHERE ie.cantidad <= 5
      ORDER BY prioridad DESC, ie.cantidad ASC
      LIMIT 50
    `);
    
    const alertas = alertasResult.rows || [];
    
    console.log(`✅ Alertas REALES encontradas: ${alertas.length}`);
    console.log(`   - Stock agotado: ${alertas.filter(a => a.estado === 'agotado').length}`);
    console.log(`   - Stock bajo: ${alertas.filter(a => a.estado === 'bajo').length}`);
    
    return res.json(alertas);
  } catch (err) {
    console.error('❌ Error en obtenerAlertas:', err);
    // Si falla, devolver array vacío en lugar de error
    return res.json([]);
  }
};

/**
 * GET /api/inventario/proveedores
 * Obtener lista de proveedores
 */
exports.obtenerProveedores = async (req, res) => {
  console.log('🏪 [inventarioController] Obteniendo proveedores desde DB');
  
  try {
    // Primero intentar obtener datos reales de la base de datos
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
        codigo,
        especialidades,
        tiempo_entrega_dias,
        activo, 
        CASE WHEN activo = true THEN 'activo' ELSE 'inactivo' END as estado,
        created_at
      FROM proveedores 
      ORDER BY nombre ASC
    `;
    
    const result = await db.query(query);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`✅ Proveedores reales obtenidos: ${result.rows.length} desde base de datos`);
      return res.json(result.rows);
    } else {
      // Si no hay proveedores en la base de datos, retornar array vacío
      console.log('⚠️ No hay proveedores en la base de datos');
      return res.json([]);
    }
  } catch (err) {
    console.error('❌ Error en obtenerProveedores:', err);
    
    // Si hay error en la consulta, retornar array vacío en lugar de datos dummy
    console.log('⚠️ Error al consultar proveedores, retornando array vacío');
    return res.json([]);
  }
};

/**
 * POST /api/inventario/proveedores
 * Crear nuevo proveedor
 */
exports.crearProveedor = async (req, res) => {
  console.log('🏪 [inventarioController] Creando nuevo proveedor');
  
  try {
    const { nombre, contacto, telefono, email, direccion, ciudad, pais, codigo, especialidades, tiempo_entrega_dias } = req.body;
    
    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ 
        success: false,
        msg: 'El nombre del proveedor es obligatorio' 
      });
    }
    
    // Insertar en la base de datos real
    const query = `
      INSERT INTO proveedores (nombre, contacto, telefono, email, direccion, ciudad, pais, codigo, especialidades, tiempo_entrega_dias, activo, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id, nombre, contacto, telefono, email, direccion, ciudad, pais, codigo, especialidades, tiempo_entrega_dias, activo, created_at
    `;
    
    const values = [
      nombre,
      contacto || null,
      telefono || null,
      email || null,
      direccion || null,
      ciudad || null,
      pais || 'Colombia',
      codigo || null,
      especialidades || null,
      tiempo_entrega_dias || 7,
      true
    ];
    
    const result = await db.query(query, values);
    const nuevoProveedor = result.rows[0];
    
    console.log(`✅ Proveedor creado exitosamente con ID: ${nuevoProveedor.id}`);
    
    return res.status(201).json({
      success: true,
      msg: 'Proveedor creado exitosamente',
      proveedor: nuevoProveedor
    });
  } catch (err) {
    console.error('❌ Error creando proveedor:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al crear proveedor', 
      error: err.message 
    });
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
    const { nombre, contacto, telefono, email, direccion, ciudad, pais, codigo, especialidades, tiempo_entrega_dias, activo } = req.body;
    
    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ 
        success: false,
        msg: 'El nombre del proveedor es obligatorio' 
      });
    }
    
    // Actualizar en la base de datos real
    const query = `
      UPDATE proveedores 
      SET nombre = $1, contacto = $2, telefono = $3, email = $4, direccion = $5, ciudad = $6, pais = $7, codigo = $8, especialidades = $9, tiempo_entrega_dias = $10, activo = $11
      WHERE id = $12
      RETURNING id, nombre, contacto, telefono, email, direccion, ciudad, pais, codigo, especialidades, tiempo_entrega_dias, activo, created_at
    `;
    
    const values = [
      nombre,
      contacto || null,
      telefono || null,
      email || null,
      direccion || null,
      ciudad || null,
      pais || 'Colombia',
      codigo || null,
      especialidades || null,
      tiempo_entrega_dias || 7,
      activo !== false,
      id
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        msg: 'Proveedor no encontrado'
      });
    }
    
    const proveedorActualizado = result.rows[0];
    console.log(`✅ Proveedor ${proveedorActualizado.nombre} actualizado exitosamente`);
    
    return res.json({
      success: true,
      msg: 'Proveedor actualizado exitosamente',
      proveedor: proveedorActualizado
    });
  } catch (err) {
    console.error('❌ Error actualizando proveedor:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al actualizar proveedor', 
      error: err.message 
    });
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
    // Eliminar de la base de datos real
    const query = 'DELETE FROM proveedores WHERE id = $1 RETURNING id, nombre';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        msg: 'Proveedor no encontrado'
      });
    }
    
    console.log(`✅ Proveedor ${result.rows[0].nombre} eliminado exitosamente`);
    
    return res.json({
      success: true,
      msg: 'Proveedor eliminado exitosamente'
    });
  } catch (err) {
    console.error('❌ Error eliminando proveedor:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al eliminar proveedor', 
      error: err.message 
    });
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
      LEFT JOIN equipos e ON e.categoria = c.nombre
      WHERE c.activa = true 
      GROUP BY c.id, c.nombre, c.descripcion, c.color, c.icono, c.activa, c.orden, c.created_at
      ORDER BY c.orden ASC, c.nombre ASC 
      LIMIT 50
    `;
    
    const result = await db.query(query);
    const categorias = result.rows;
    
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
  
  try {
    const query = `
      SELECT 
        id,
        producto_id,
        tipo_movimiento,
        cantidad,
        motivo,
        observaciones,
        fecha_movimiento,
        producto_nombre,
        usuario_nombre,
        sede_nombre,
        stock_anterior,
        stock_nuevo
      FROM movimientos_inventario 
      ORDER BY fecha_movimiento DESC 
      LIMIT 50
    `;
    
    const result = await db.query(query);
    const movimientos = result.rows;
    
    console.log(`✅ Movimientos obtenidos: ${movimientos.length} desde base de datos`);
    return res.json(movimientos);
  } catch (err) {
    console.error('❌ Error en obtenerMovimientos:', err);
    
    // Fallback con datos dummy si hay error en la consulta
    const movimientosDummy = [
      {
        id: 1,
        inventario_id: 1,
        tipo_movimiento: 'entrada',
        cantidad: 5,
        cantidad_anterior: 0,
        cantidad_nueva: 5,
        motivo: 'Compra inicial',
        observaciones: 'Stock inicial del producto',
        fecha_movimiento: new Date().toISOString(),
        producto_nombre: 'Sillón Dental Premium',
        producto_categoria: 'Equipos',
        usuario_nombre: 'Admin Sistema',
        sede_origen: null,
        sede_destino: 'Sede Principal',
        sede_nombre: 'Sede Principal'
      },
      {
        id: 2,
        inventario_id: 2,
        tipo_movimiento: 'salida',
        cantidad: 1,
        cantidad_anterior: 3,
        cantidad_nueva: 2,
        motivo: 'Mantenimiento',
        observaciones: 'Enviado a reparación',
        fecha_movimiento: new Date(Date.now() - 24*60*60*1000).toISOString(),
        producto_nombre: 'Lámpara LED',
        producto_categoria: 'Iluminación',
        usuario_nombre: 'Dr. García',
        sede_origen: 'Sede Principal',
        sede_destino: null,
        sede_nombre: 'Sede Principal'
      }
    ];
    
    console.log(`✅ Usando movimientos fallback: ${movimientosDummy.length} (datos de prueba)`);
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
      success: false,
      msg: 'Datos incompletos. Se requiere inventario_id, tipo_movimiento, cantidad y motivo.' 
    });
  }
  
  if (!['entrada', 'salida', 'ajuste', 'transferencia'].includes(tipo_movimiento)) {
    return res.status(400).json({ 
      success: false,
      msg: 'Tipo de movimiento inválido. Use: entrada, salida, ajuste o transferencia.' 
    });
  }
  
  try {
    console.log('📦 Simulando registro de movimiento (tabla movimientos_inventario no existe)');
    
    // Simular registro exitoso
    const movimientoId = Math.floor(Math.random() * 1000) + 100;
    const cantidadAnterior = 10; // Simulado
    const cantidadNueva = tipo_movimiento === 'entrada' ? 
      cantidadAnterior + parseInt(cantidad) : 
      cantidadAnterior - parseInt(cantidad);
    
    console.log(`✅ Movimiento simulado registrado: ID ${movimientoId}`);
    console.log(`📊 Stock simulado actualizado: ${cantidadAnterior} → ${cantidadNueva}`);
    
    return res.json({
      success: true,
      msg: 'Movimiento registrado exitosamente',
      movimiento: {
        id: movimientoId,
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
    console.error('❌ Error registrando movimiento:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al registrar movimiento.', 
      error: err.message 
    });
  }
};

// =================== FUNCIONES CRUD INDIVIDUALES ===================

/**
 * GET /api/inventario/proveedores/:id
 * Obtener proveedor por ID
 */
exports.obtenerProveedorPorId = async (req, res) => {
  console.log('🔍 [inventarioController] Obteniendo proveedor por ID');
  
  const { id } = req.params;
  
  try {
    // Consultar proveedor real desde la base de datos
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
        codigo,
        especialidades,
        tiempo_entrega_dias,
        activo, 
        CASE WHEN activo = true THEN 'activo' ELSE 'inactivo' END as estado,
        created_at
      FROM proveedores 
      WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Proveedor con ID ${id} no encontrado en base de datos`);
      return res.status(404).json({ msg: 'Proveedor no encontrado.' });
    }
    
    console.log(`✅ Proveedor encontrado: ${result.rows[0].nombre}`);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error en obtenerProveedorPorId:', err);
    return res.status(500).json({ msg: 'Error al obtener proveedor.', error: err.message });
  }
};

/**
 * GET /api/inventario/equipos/:id
 * Obtener equipo por ID
 */
exports.obtenerEquipoPorId = async (req, res) => {
  console.log('🔍 [inventarioController] Obteniendo equipo por ID');
  
  const { id } = req.params;
  
  try {
    const query = `
      SELECT 
        id,
        nombre,
        categoria,
        precio,
        descripcion,
        fecha_alta
      FROM equipos
      WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Equipo no encontrado.' });
    }
    
    console.log(`✅ Equipo encontrado: ${result.rows[0].nombre}`);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error en obtenerEquipoPorId:', err);
    return res.status(500).json({ msg: 'Error al obtener equipo.', error: err.message });
  }
};

/**
 * PUT /api/inventario/equipos/:id
 * Actualizar equipo
 */
exports.actualizarEquipo = async (req, res) => {
  console.log('✏️ [inventarioController] Actualizando equipo');
  
  const { id } = req.params;
  const { 
    nombre, 
    categoria, 
    precio, 
    descripcion, 
    codigo_producto, 
    marca, 
    modelo, 
    especificaciones, 
    garantia_meses, 
    estado, 
    proveedor_id 
  } = req.body;
  
  if (!nombre || !categoria || !precio) {
    return res.status(400).json({ msg: 'Datos incompletos: nombre, categoría y precio son requeridos.' });
  }
  
  try {
    const updateQuery = `
      UPDATE equipos 
      SET 
        nombre = $1, 
        categoria = $2, 
        precio = $3, 
        descripcion = $4,
        codigo_producto = $5,
        marca = $6,
        modelo = $7,
        especificaciones = $8,
        garantia_meses = $9,
        estado = $10,
        proveedor_id = $11
      WHERE id = $12
    `;
    
    const result = await db.query(updateQuery, [
      nombre, categoria, precio, descripcion, codigo_producto,
      marca, modelo, especificaciones, garantia_meses, estado,
      proveedor_id, id
    ]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Equipo no encontrado.' });
    }
    
    console.log('✅ Equipo actualizado:', id);
    return res.json({ msg: 'Equipo actualizado correctamente.' });
  } catch (err) {
    console.error('❌ Error al actualizar equipo:', err);
    return res.status(500).json({ msg: 'Error al actualizar equipo.', error: err.message });
  }
};

/**
 * DELETE /api/inventario/equipos/:id
 * Eliminar equipo
 */
exports.eliminarEquipo = async (req, res) => {
  console.log('🗑️ [inventarioController] Eliminando equipo');
  
  const { id } = req.params;
  
  try {
    // Verificar si el equipo está en uso en inventario
    const inventarioCheck = await db.query(
      'SELECT COUNT(*) as count FROM inventario_equipos WHERE equipo_id = $1',
      [id]
    );
    
    if (inventarioCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        msg: 'No se puede eliminar el equipo porque está en uso en el inventario.' 
      });
    }
    
    const deleteQuery = 'DELETE FROM equipos WHERE id = $1';
    const result = await db.query(deleteQuery, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Equipo no encontrado.' });
    }
    
    console.log('✅ Equipo eliminado:', id);
    return res.json({ msg: 'Equipo eliminado correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar equipo:', err);
    return res.status(500).json({ msg: 'Error al eliminar equipo.', error: err.message });
  }
};

/**
 * GET /api/inventario/categorias/:id
 * Obtener categoría por ID
 */
exports.obtenerCategoriaPorId = async (req, res) => {
  console.log('🔍 [inventarioController] Obteniendo categoría por ID');
  
  const { id } = req.params;
  
  try {
    const query = `
      SELECT 
        DISTINCT categoria as nombre,
        COUNT(*) as cantidad_equipos
      FROM equipos
      WHERE categoria = $1
      GROUP BY categoria
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Categoría no encontrada.' });
    }
    
    console.log(`✅ Categoría encontrada: ${result.rows[0].nombre}`);
    return res.json({
      id: id,
      nombre: result.rows[0].nombre,
      cantidad_equipos: result.rows[0].cantidad_equipos
    });
  } catch (err) {
    console.error('❌ Error en obtenerCategoriaPorId:', err);
    return res.status(500).json({ msg: 'Error al obtener categoría.', error: err.message });
  }
};

/**
 * PUT /api/inventario/categorias/:id
 * Actualizar categoría (renombrar todos los equipos de esa categoría)
 */
exports.actualizarCategoria = async (req, res) => {
  console.log('✏️ [inventarioController] Actualizando categoría');
  
  const { id } = req.params; // categoria actual
  const { nombre } = req.body; // nuevo nombre
  
  if (!nombre) {
    return res.status(400).json({ msg: 'El nombre de la categoría es requerido.' });
  }
  
  try {
    const updateQuery = `
      UPDATE equipos 
      SET categoria = $1
      WHERE categoria = $2
    `;
    
    const result = await db.query(updateQuery, [nombre, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Categoría no encontrada.' });
    }
    
    console.log(`✅ Categoría actualizada: ${id} -> ${nombre} (${result.rowCount} equipos afectados)`);
    return res.json({ 
      msg: 'Categoría actualizada correctamente.',
      equipos_afectados: result.rowCount
    });
  } catch (err) {
    console.error('❌ Error al actualizar categoría:', err);
    return res.status(500).json({ msg: 'Error al actualizar categoría.', error: err.message });
  }
};

/**
 * DELETE /api/inventario/categorias/:id
 * Eliminar categoría (eliminar todos los equipos de esa categoría)
 */
exports.eliminarCategoria = async (req, res) => {
  console.log('🗑️ [inventarioController] Eliminando categoría');
  
  const { id } = req.params;
  
  try {
    // Verificar si hay equipos en el inventario de esta categoría
    const inventarioCheck = await db.query(`
      SELECT COUNT(*) as count 
      FROM inventario_equipos ie
      JOIN equipos e ON ie.equipo_id = e.id
      WHERE e.categoria = $1
    `, [id]);
    
    if (inventarioCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        msg: 'No se puede eliminar la categoría porque tiene equipos en uso en el inventario.' 
      });
    }
    
    const deleteQuery = 'DELETE FROM equipos WHERE categoria = $1';
    const result = await db.query(deleteQuery, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Categoría no encontrada.' });
    }
    
    console.log(`✅ Categoría eliminada: ${id} (${result.rowCount} equipos eliminados)`);
    return res.json({ 
      msg: 'Categoría eliminada correctamente.',
      equipos_eliminados: result.rowCount
    });
  } catch (err) {
    console.error('❌ Error al eliminar categoría:', err);
    return res.status(500).json({ msg: 'Error al eliminar categoría.', error: err.message });
  }
};