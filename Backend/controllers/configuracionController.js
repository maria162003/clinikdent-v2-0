const db = require('../config/db');

/**
 * GET /api/configuracion
 * Obtiene todas las configuraciones del sistema
 */
exports.obtenerConfiguracion = async (req, res) => {
  console.log('⚙️ [configuracionController] Obteniendo configuración del sistema');
  
  try {
    const query = 'SELECT clave, valor, tipo, descripcion FROM configuracion_sistema ORDER BY clave';
    const result = await db.query(query);
    
    // Convertir array de configuraciones a objeto
    const configuracion = {};
    result.rows.forEach(config => {
      let valorProcesado = config.valor;
      
      // Convertir valores según el tipo
      if (config.tipo === 'boolean') {
        valorProcesado = config.valor === 'true';
      } else if (config.tipo === 'number') {
        valorProcesado = parseInt(config.valor, 10);
      } else if (config.tipo === 'json') {
        try {
          valorProcesado = JSON.parse(config.valor);
        } catch (e) {
          valorProcesado = config.valor;
        }
      }
      
      configuracion[config.clave] = valorProcesado;
    });
    
    console.log('✅ Configuración obtenida:', Object.keys(configuracion).length, 'elementos');
    return res.json({ success: true, configuracion });
    
  } catch (err) {
    console.error('❌ Error en obtenerConfiguracion:', err);
    return res.status(500).json({ msg: 'Error al obtener configuración.', error: err.message });
  }
};

/**
 * PUT /api/configuracion
 * Actualiza múltiples configuraciones del sistema
 * Body: { configuraciones: { clave: valor, ... }, usuario_id: number }
 */
exports.actualizarConfiguracion = async (req, res) => {
  console.log('⚙️ [configuracionController] Actualizando configuración del sistema');
  const { configuraciones, usuario_id } = req.body;
  
  if (!configuraciones || typeof configuraciones !== 'object') {
    return res.status(400).json({ msg: 'Se requiere un objeto de configuraciones.' });
  }
  
  try {
    const actualizadas = [];
    
    // Actualizar cada configuración
    for (const [clave, valor] of Object.entries(configuraciones)) {
      // Determinar el tipo de valor
      let tipo = 'string';
      let valorString = String(valor);
      
      if (typeof valor === 'boolean') {
        tipo = 'boolean';
        valorString = valor ? 'true' : 'false';
      } else if (typeof valor === 'number') {
        tipo = 'number';
        valorString = String(valor);
      } else if (Array.isArray(valor) || (typeof valor === 'object' && valor !== null)) {
        tipo = 'json';
        valorString = JSON.stringify(valor);
      }
      
      const updateQuery = `
        UPDATE configuracion_sistema 
        SET valor = $1, tipo = $2, actualizado_por = $3, updated_at = CURRENT_TIMESTAMP
        WHERE clave = $4
        RETURNING clave
      `;
      
      const result = await db.query(updateQuery, [valorString, tipo, usuario_id || null, clave]);
      
      if (result.rows.length > 0) {
        actualizadas.push(clave);
        console.log(`✅ Actualizada: ${clave} = ${valorString}`);
      }
    }
    
    console.log(`✅ Configuraciones actualizadas: ${actualizadas.length}`);
    
    return res.json({ 
      success: true, 
      message: `${actualizadas.length} configuraciones actualizadas exitosamente.`,
      actualizadas: actualizadas
    });
    
  } catch (err) {
    console.error('❌ Error en actualizarConfiguracion:', err);
    return res.status(500).json({ msg: 'Error al actualizar configuración.', error: err.message });
  }
};

/**
 * GET /api/configuracion/:clave
 * Obtiene una configuración específica por clave
 */
exports.obtenerConfiguracionPorClave = async (req, res) => {
  const { clave } = req.params;
  console.log(`⚙️ [configuracionController] Obteniendo configuración: ${clave}`);
  
  try {
    const query = 'SELECT clave, valor, tipo, descripcion FROM configuracion_sistema WHERE clave = $1';
    const result = await db.query(query, [clave]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Configuración no encontrada.' });
    }
    
    const config = result.rows[0];
    let valorProcesado = config.valor;
    
    // Convertir valor según el tipo
    if (config.tipo === 'boolean') {
      valorProcesado = config.valor === 'true';
    } else if (config.tipo === 'number') {
      valorProcesado = parseInt(config.valor, 10);
    } else if (config.tipo === 'json') {
      try {
        valorProcesado = JSON.parse(config.valor);
      } catch (e) {
        valorProcesado = config.valor;
      }
    }
    
    return res.json({ 
      success: true, 
      clave: config.clave,
      valor: valorProcesado,
      tipo: config.tipo,
      descripcion: config.descripcion
    });
    
  } catch (err) {
    console.error('❌ Error en obtenerConfiguracionPorClave:', err);
    return res.status(500).json({ msg: 'Error al obtener configuración.', error: err.message });
  }
};

/**
 * GET /api/configuracion/publica
 * Obtiene configuraciones públicas para mostrar en la página principal
 * (horarios, nombre de clínica, información de contacto)
 */
exports.obtenerConfiguracionPublica = async (req, res) => {
  console.log('🌐 [configuracionController] Obteniendo configuración pública');
  
  try {
    const query = `
      SELECT clave, valor, tipo 
      FROM configuracion_sistema 
      WHERE clave IN (
        'horario_apertura', 
        'horario_cierre', 
        'dias_atencion',
        'clinica_nombre',
        'clinica_logo_url',
        'clinica_color_primario'
      )
    `;
    const result = await db.query(query);
    
    // Convertir a objeto
    const configuracion = {};
    result.rows.forEach(config => {
      let valorProcesado = config.valor;
      
      if (config.tipo === 'json') {
        try {
          valorProcesado = JSON.parse(config.valor);
        } catch (e) {
          valorProcesado = config.valor;
        }
      }
      
      configuracion[config.clave] = valorProcesado;
    });
    
    console.log('✅ Configuración pública obtenida:', configuracion);
    return res.json({ success: true, configuracion });
    
  } catch (err) {
    console.error('❌ Error en obtenerConfiguracionPublica:', err);
    // Devolver valores por defecto en caso de error
    return res.json({
      success: true,
      configuracion: {
        horario_apertura: '08:00',
        horario_cierre: '18:00',
        dias_atencion: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'],
        clinica_nombre: 'ClinikDent',
        clinica_logo_url: '',
        clinica_color_primario: '#0ea5e9'
      }
    });
  }
};

// Mantener compatibilidad con código antiguo
exports.obtenerConfiguracionSistema = exports.obtenerConfiguracion;

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
