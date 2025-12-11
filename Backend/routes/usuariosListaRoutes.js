const express = require('express');
const router = express.Router();
const db = require('../config/databaseSecure');

/**
 * GET /api/pacientes
 * Devuelve lista de pacientes (usuarios con rol paciente) para la demo
 */
router.get('/', async (req, res) => {
  try {
    // Query simplificada - trae todos los usuarios ordenados por ID
    const query = `
      SELECT id, nombre, apellido, correo, telefono, numero_documento
      FROM usuarios
      ORDER BY id DESC
      LIMIT 50
    `;
    
    const result = await db.secureQuery(query);
    
    return res.json({
      success: true,
      pacientes: result.rows
    });
  } catch (error) {
    console.error('❌ Error obteniendo lista de pacientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener pacientes',
      error: error.message
    });
  }
});

module.exports = router;
