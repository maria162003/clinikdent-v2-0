const db = require('../config/db');

// GET /api/configuracion/sistema
exports.obtenerConfiguracionSistema = async (req, res) => {
  try {
    console.log('⚙️ Obteniendo configuración del sistema...');
    
    // Datos dummy para la configuración
    const configuracion = {
      clinica: {
        nombre: 'Clinikdent',
        direccion: 'Calle 10 #20-30, Bogotá',
        telefono: '+57 1 234 5678',
        email: 'info@clinikdent.com',
        nit: '900123456-7'
      },
      horarios: {
        lunes_viernes: { inicio: '08:00', fin: '18:00' },
        sabados: { inicio: '08:00', fin: '14:00' },
        domingos: { activo: false }
      },
      citas: {
        duracion_por_defecto: 30,
        anticipacion_minima: 2,
        recordatorios_activos: true,
        recordatorio_horas: 24
      },
      facturacion: {
        consecutivo_actual: 1001,
        prefijo: 'CLIK',
        iva_porcentaje: 19
      },
      notificaciones: {
        email_activo: true,
        sms_activo: false,
        whatsapp_activo: true
      }
    };
    
    console.log('✅ Configuración del sistema obtenida');
    return res.json(configuracion);
  } catch (err) {
    console.error('❌ Error obteniendo configuración:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener configuración del sistema',
      error: err.message 
    });
  }
};

// POST /api/configuracion/sistema
exports.actualizarConfiguracionSistema = async (req, res) => {
  try {
    console.log('⚙️ Actualizando configuración del sistema...');
    
    const configuracion = req.body;
    
    // Simular actualización exitosa
    console.log('✅ Configuración actualizada exitosamente');
    
    return res.json({
      success: true,
      msg: 'Configuración actualizada exitosamente',
      configuracion
    });
  } catch (err) {
    console.error('❌ Error actualizando configuración:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al actualizar configuración del sistema',
      error: err.message 
    });
  }
};

// GET /api/configuracion/email
exports.obtenerConfiguracionEmail = async (req, res) => {
  try {
    console.log('📧 Obteniendo configuración de email...');
    
    // Datos dummy para la configuración de email
    const configuracionEmail = {
      smtp: {
        servidor: 'smtp.gmail.com',
        puerto: 587,
        seguridad: 'TLS',
        usuario: 'clinikdent@gmail.com',
        password: '****' // Ocultar password
      },
      plantillas: {
        recordatorio_cita: {
          activa: true,
          asunto: 'Recordatorio de Cita - Clinikdent',
          plantilla: 'recordatorio_cita.html'
        },
        confirmacion_cita: {
          activa: true,
          asunto: 'Confirmación de Cita - Clinikdent',
          plantilla: 'confirmacion_cita.html'
        },
        recuperacion_password: {
          activa: true,
          asunto: 'Recuperación de Contraseña - Clinikdent',
          plantilla: 'recuperacion_password.html'
        }
      }
    };
    
    console.log('✅ Configuración de email obtenida');
    return res.json(configuracionEmail);
  } catch (err) {
    console.error('❌ Error obteniendo configuración de email:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al obtener configuración de email',
      error: err.message 
    });
  }
};

// POST /api/configuracion/email
exports.actualizarConfiguracionEmail = async (req, res) => {
  try {
    console.log('📧 Actualizando configuración de email...');
    
    const configuracion = req.body;
    
    // Simular actualización exitosa
    console.log('✅ Configuración de email actualizada exitosamente');
    
    return res.json({
      success: true,
      msg: 'Configuración de email actualizada exitosamente',
      configuracion
    });
  } catch (err) {
    console.error('❌ Error actualizando configuración de email:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al actualizar configuración de email',
      error: err.message 
    });
  }
};

// POST /api/configuracion/email/test
exports.probarConfiguracionEmail = async (req, res) => {
  try {
    console.log('📧 Probando configuración de email...');
    
    const { email_destino } = req.body;
    
    // Simular envío de prueba exitoso
    console.log(`✅ Email de prueba enviado a: ${email_destino}`);
    
    return res.json({
      success: true,
      msg: `Email de prueba enviado exitosamente a ${email_destino}`
    });
  } catch (err) {
    console.error('❌ Error probando email:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Error al probar configuración de email',
      error: err.message 
    });
  }
};

module.exports = exports;
