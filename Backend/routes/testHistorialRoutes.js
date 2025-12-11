const express = require('express');
const router = express.Router();

// Endpoint de prueba para historial general - versión simplificada
router.get('/test-historial', async (req, res) => {
  console.log('🧪 [TEST] Probando endpoint de historial general');
  
  try {
    // Primero intentar una consulta muy simple
    const db = require('../config/db');
    
    console.log('🔍 [TEST] Verificando conexión a base de datos...');
    const testQuery = 'SELECT COUNT(*) as total FROM citas';
    const [result] = await db.query(testQuery);
    
    console.log('✅ [TEST] Conexión exitosa, total citas:', result[0].total);
    
    // Ahora intentar la consulta del historial paso a paso
    console.log('🔍 [TEST] Probando consulta de historial...');
    
    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        c.notas,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        o.nombre as odontologo_nombre,
        o.apellido as odontologo_apellido
      FROM citas c
      LEFT JOIN usuarios p ON c.paciente_id = p.id
      LEFT JOIN usuarios o ON c.odontologo_id = o.id
      WHERE c.notas IS NOT NULL AND c.notas != ''
      LIMIT 5
    `;
    
    const [citas] = await db.query(query);
    console.log('✅ [TEST] Consulta exitosa, citas encontradas:', citas.length);
    
    // Procesar una cita de ejemplo
    if (citas.length > 0) {
      const cita = citas[0];
      console.log('📋 [TEST] Procesando cita ejemplo:', {
        id: cita.id,
        fecha: cita.fecha,
        notas: cita.notas ? cita.notas.substring(0, 100) + '...' : 'Sin notas'
      });
      
      const notas = cita.notas || '';
      const cambios = notas.split('\n').filter(linea => 
        linea.includes('Reasignación:') || 
        linea.includes('Estado cambiado:') ||
        linea.includes('Reprogramación:')
      );
      
      console.log('🔍 [TEST] Cambios encontrados:', cambios.length);
    }
    
    return res.json({
      success: true,
      message: 'Test exitoso',
      debug: {
        total_citas: result[0].total,
        citas_con_notas: citas.length,
        primera_cita: citas.length > 0 ? {
          id: citas[0].id,
          tiene_notas: !!citas[0].notas
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ [TEST] Error en prueba de historial:', error);
    console.error('❌ [TEST] Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Error en test de historial',
      error: {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        detail: error.detail
      }
    });
  }
});

module.exports = router;