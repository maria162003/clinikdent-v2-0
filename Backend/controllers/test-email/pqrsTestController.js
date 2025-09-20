const emailService = require('../../services/emailService');

// VERSION DE PRUEBA - NO AFECTA LA BD ORIGINAL
// Controlador de PQRS con sistema de emails automáticos

// Procesar PQRS de prueba (solo emails, sin BD)
const crearPQRSTest = async (req, res) => {
  try {
    console.log('🧪 [TEST] Procesando PQRS de prueba:', req.body);
    
    const { 
      nombre_completo, 
      correo, 
      telefono, 
      numero_documento, 
      tipo, 
      asunto, 
      resumen, 
      descripcion, 
      servicio_relacionado 
    } = req.body;

    // Validaciones básicas
    if (!nombre_completo || !correo || !tipo || !asunto || !resumen || !descripcion) {
      return res.status(400).json({
        msg: 'Los campos nombre_completo, correo, tipo, asunto, resumen y descripcion son obligatorios'
      });
    }

    // Validar tipo de PQRS
    const tiposValidos = ['Petición', 'Queja', 'Reclamo', 'Sugerencia'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        msg: 'Tipo de PQRS no válido'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        msg: 'El formato del correo electrónico no es válido'
      });
    }

    // Generar número de radicado único
    const timestamp = Date.now().toString().slice(-6);
    const numeroRadicado = `PQRS-TEST-2025-${timestamp}`;

    console.log('🧪 [TEST] Número de radicado generado:', numeroRadicado);

    // Preparar datos para los emails
    const userData = {
      nombre_completo,
      correo,
      telefono: telefono || 'No proporcionado',
      numero_documento: numero_documento || 'No proporcionado',
      tipo,
      asunto,
      resumen,
      descripcion,
      servicio_relacionado: servicio_relacionado || null
    };

    console.log('🧪 [TEST] Enviando email de confirmación al usuario...');
    const confirmacionResult = await emailService.sendPQRSConfirmation(userData, numeroRadicado);
    
    console.log('🧪 [TEST] Notificando al equipo de soporte...');
    const notificacionResult = await emailService.notifySupport(userData, numeroRadicado);

    console.log('🧪 [TEST] PQRS procesado (SOLO EMAILS - NO BD):', numeroRadicado);

    res.status(201).json({
      success: true,
      msg: '[PRUEBA] Su solicitud ha sido enviada exitosamente. Revise su correo electrónico para la confirmación.',
      numero_radicado: numeroRadicado,
      modo: 'TEST - No se guarda en base de datos',
      data: {
        tipo,
        asunto,
        fecha: new Date().toISOString(),
        email_enviado: confirmacionResult.success,
        soporte_notificado: notificacionResult.success
      }
    });

  } catch (error) {
    console.error('🧪 [TEST] Error al procesar PQRS:', error);
    res.status(500).json({
      msg: '[PRUEBA] Error interno del servidor al procesar su solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

module.exports = {
  crearPQRSTest
};
