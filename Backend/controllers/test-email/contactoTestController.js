const emailService = require('../../services/emailService');

// VERSION DE PRUEBA - NO AFECTA LA BD ORIGINAL
// Controlador de Contacto con sistema de emails automáticos

// Procesar contacto de prueba (solo emails, sin BD)
const crearContactoTest = async (req, res) => {
  try {
    console.log('🧪 [TEST] Procesando contacto de prueba:', req.body);
    
    const { nombre, correo, telefono, servicio_interes, mensaje, tipo, asunto } = req.body;

    // Validaciones básicas
    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({
        msg: 'Los campos nombre, correo y mensaje son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        msg: 'El formato del correo electrónico no es válido'
      });
    }

    // Preparar datos del contacto
    const contactData = {
      nombre,
      email: correo,
      telefono: telefono || 'No proporcionado',
      asunto: asunto || servicio_interes || 'Consulta general',
      mensaje
    };

    console.log('🧪 [TEST] Enviando confirmación de contacto...');
    const confirmacionResult = await emailService.sendContactConfirmation(contactData);

    // Notificar al equipo de soporte
    console.log('🧪 [TEST] Notificando al soporte sobre contacto...');
    const userData = {
      nombre_completo: nombre,
      correo: correo,
      telefono: contactData.telefono,
      numero_documento: 'No proporcionado',
      tipo: 'Contacto',
      asunto: contactData.asunto,
      resumen: mensaje.substring(0, 100) + (mensaje.length > 100 ? '...' : ''),
      descripcion: mensaje,
      servicio_relacionado: servicio_interes || null
    };

    const timestamp = Date.now().toString().slice(-6);
    const numeroRadicado = `CONT-TEST-2025-${timestamp}`;
    
    const notificacionResult = await emailService.notifySupport(userData, numeroRadicado);

    console.log('🧪 [TEST] Contacto procesado (SOLO EMAILS - NO BD):', numeroRadicado);

    res.status(200).json({
      success: true,
      msg: '[PRUEBA] Su mensaje ha sido enviado exitosamente. Revise su correo electrónico para la confirmación.',
      numero_referencia: numeroRadicado,
      modo: 'TEST - No se guarda en base de datos',
      data: {
        nombre,
        correo,
        asunto: contactData.asunto,
        fecha: new Date().toISOString(),
        email_enviado: confirmacionResult.success,
        soporte_notificado: notificacionResult.success
      }
    });

  } catch (error) {
    console.error('🧪 [TEST] Error procesando contacto:', error);
    res.status(500).json({
      msg: '[PRUEBA] Error interno del servidor al procesar su mensaje',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

module.exports = {
  crearContactoTest
};
