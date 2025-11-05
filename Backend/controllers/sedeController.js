// Backend/controllers/sedeController.js
const db = require('../config/db');

/**
 * GET /api/sedes
 * Obtiene todas las sedes
 */
exports.obtenerSedes = async (req, res) => {
  console.log('🏢 [sedeController] Obteniendo todas las sedes');
  
  try {
    const query = `
      SELECT 
        id,
        nombre,
        direccion,
        telefono,
        ciudad,
        activa
      FROM sedes
      ORDER BY nombre ASC
    `;
    
    const result = await db.query(query);
    const sedes = result.rows || result;
    console.log(`✅ Sedes encontradas: ${sedes.length}`);
    
    return res.json(sedes);
  } catch (err) {
    console.error('❌ Error en obtenerSedes:', err);
    return res.status(500).json({ msg: 'Error al obtener sedes.', error: err.message });
  }
};

/**
 * POST /api/sedes
 * Crear nueva sede
 */
exports.crearSede = async (req, res) => {
  console.log('🆕 [sedeController] Creando nueva sede');
  console.log('📋 Body recibido:', req.body);
  
  const { nombre, direccion, telefono, ciudad } = req.body;
  
  if (!nombre || !direccion || !ciudad) {
    return res.status(400).json({ msg: 'Datos incompletos. Se requiere nombre, dirección y ciudad.' });
  }
  
  try {
    const insertQuery = `
      INSERT INTO sedes (nombre, direccion, telefono, ciudad, estado)
      VALUES ($1, $2, $3, $4, 'activa')
      RETURNING id
    `;
    
    const result = await db.query(insertQuery, [nombre, direccion, telefono || null, ciudad]);
    const insertedSede = result.rows[0];
    console.log('✅ Sede creada con ID:', insertedSede.id);
    
    return res.json({ 
      msg: 'Sede creada correctamente.',
      sedeId: insertedSede.id
    });
  } catch (err) {
    console.error('❌ Error al crear sede:', err);
    return res.status(500).json({ msg: 'Error al crear sede.', error: err.message });
  }
};

/**
 * PUT /api/sedes/:id
 * Actualizar sede
 */
exports.actualizarSede = async (req, res) => {
  console.log('🔄 [sedeController] Actualizando sede');
  
  const { id } = req.params;
  const { nombre, direccion, telefono, ciudad, estado } = req.body;
  
  if (!nombre || !direccion || !ciudad) {
    return res.status(400).json({ msg: 'Datos incompletos.' });
  }
  
  try {
    const updateQuery = `
      UPDATE sedes 
      SET nombre = $1, direccion = $2, telefono = $3, ciudad = $4, estado = $5
      WHERE id = $6
    `;
    
    const result = await db.query(updateQuery, [nombre, direccion, telefono, ciudad, estado || 'activa', id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Sede no encontrada.' });
    }
    
    console.log('✅ Sede actualizada:', id);
    return res.json({ msg: 'Sede actualizada correctamente.' });
  } catch (err) {
    console.error('❌ Error al actualizar sede:', err);
    return res.status(500).json({ msg: 'Error al actualizar sede.', error: err.message });
  }
};

/**
 * DELETE /api/sedes/:id
 * Eliminar sede
 */
exports.eliminarSede = async (req, res) => {
  console.log('🗑️ [sedeController] Eliminando sede');
  
  const { id } = req.params;
  
  try {
    // Verificar si la sede tiene inventario asociado
    const inventarioResult = await db.query('SELECT COUNT(*) as total FROM inventario_equipos WHERE sede_id = $1', [id]);
    const inventario = inventarioResult.rows || inventarioResult;
    
    if (inventario[0] && inventario[0].total > 0) {
      return res.status(400).json({ 
        msg: 'No se puede eliminar la sede porque tiene inventario asociado.' 
      });
    }
    
    const deleteQuery = 'DELETE FROM sedes WHERE id = $1';
    const result = await db.query(deleteQuery, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Sede no encontrada.' });
    }
    
    console.log('✅ Sede eliminada:', id);
    return res.json({ msg: 'Sede eliminada correctamente.' });
  } catch (err) {
    console.error('❌ Error al eliminar sede:', err);
    return res.status(500).json({ msg: 'Error al eliminar sede.', error: err.message });
  }
};

/**
 * GET /api/sedes/:id
 * Obtener sede por ID
 */
exports.obtenerSedePorId = async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = 'SELECT * FROM sedes WHERE id = $1';
    const result = await db.query(query, [id]);
    const sedes = result.rows || result;
    
    if (sedes.length === 0) {
      return res.status(404).json({ msg: 'Sede no encontrada.' });
    }
    
    return res.json(sedes[0]);
  } catch (err) {
    console.error('❌ Error al obtener sede:', err);
    return res.status(500).json({ msg: 'Error al obtener sede.', error: err.message });
  }
};
