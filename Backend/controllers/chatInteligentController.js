const Groq = require('groq-sdk');
const supabase = require('../config/supabase');
const db = require('../config/db');
const emailService = require('../services/emailService');

// Inicializar Groq con la API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// System prompt para Groq
const SYSTEM_PROMPT = `
Eres el chatbot oficial de ClinikDent, una clínica odontológica moderna en Colombia.
Tu tarea es analizar los mensajes del usuario y devolver SIEMPRE un JSON válido con la intención y los parámetros.

NO realices citas, NO confirmes nada por tu cuenta. 
Tu función es únicamente identificar la intención del usuario y extraer parámetros.

FORMATO DE RESPUESTA (SIEMPRE JSON):
{
  "intencion": "",
  "parametros": {},
  "mensaje_usuario": ""
}

INTENCIONES VÁLIDAS:
- "agendar_cita" - cuando quieren programar una nueva cita
- "cancelar_cita" - cuando quieren cancelar una cita existente
- "reagendar_cita" - cuando quieren cambiar fecha/hora de una cita
- "consultar_disponibilidad" - cuando preguntan por horarios disponibles
- "consultar_mis_citas" - cuando quieren ver sus citas programadas
- "consultar_servicios" - cuando preguntan por tratamientos/servicios
- "consultar_precios" - cuando preguntan por costos
- "consultar_ubicacion" - cuando preguntan por direcciones/sedes
- "consultar_horarios" - cuando preguntan horarios de atención
- "emergencia_dental" - cuando reportan una urgencia
- "saludo" - saludos iniciales
- "despedida" - cuando se despiden
- "informacion_general" - preguntas generales sobre la clínica
- "error" - cuando no entiendes o falta información

REGLAS IMPORTANTES:
1. Nunca inventes datos que no tienes.
2. Convierte fechas naturales a formato ISO (YYYY-MM-DD).
3. Convierte horas naturales a formato 24h (HH:MM).
4. Si falta información crítica, usa intención "error" y especifica qué falta.
5. Extrae nombres de doctores, pacientes, fechas y horas cuando estén disponibles.
6. Responde ÚNICAMENTE con el JSON, sin texto adicional.

EJEMPLOS:

Usuario: "Quiero agendar una cita con el Dr. García para mañana a las 3 pm"
{
  "intencion": "agendar_cita",
  "parametros": {
    "doctor": "Dr. García",
    "fecha": "2025-11-20",
    "hora": "15:00",
    "paciente": ""
  },
  "mensaje_usuario": "Necesito el nombre del paciente para completar el agendamiento"
}

Usuario: "¿Cuánto cuesta una limpieza dental?"
{
  "intencion": "consultar_precios",
  "parametros": {
    "servicio": "limpieza dental"
  },
  "mensaje_usuario": "Consultando precio de limpieza dental"
}

Usuario: "Tengo un dolor fuerte en el diente"
{
  "intencion": "emergencia_dental",
  "parametros": {
    "tipo_emergencia": "dolor dental fuerte"
  },
  "mensaje_usuario": "Emergencia dental detectada - dolor fuerte"
}
`;

/**
 * POST /api/chat/intelligent
 * Endpoint principal del chatbot inteligente
 */
exports.chatInteligente = async (req, res) => {
  console.log('🤖 [Chatbot Inteligente] Procesando mensaje...');
  
  try {
    const { message, userId } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mensaje vacío'
      });
    }
    
    console.log('📝 Mensaje del usuario:', message);
    console.log('👤 Usuario ID:', userId || 'Anónimo');
    
    // 1. Enviar mensaje a Groq para análisis de intención
    console.log('🧠 Enviando a Groq para análisis...');
    
    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user", 
          content: message
        }
      ],
      temperature: 0.1, // Baja temperatura para respuestas más consistentes
      max_tokens: 500
    });
    
    console.log('✅ Respuesta de Groq recibida');
    
    // 2. Parsear respuesta JSON de Groq
    let groqData;
    try {
      const groqContent = groqResponse.choices[0].message.content;
      console.log('🔍 Contenido de Groq:', groqContent);
      
      groqData = JSON.parse(groqContent);
    } catch (parseError) {
      console.error('❌ Error parseando JSON de Groq:', parseError);
      return res.json({
        success: true,
        response: "Lo siento, hubo un problema procesando tu mensaje. ¿Podrías repetirlo de otra manera?",
        fallback: true
      });
    }
    
    console.log('🎯 Intención detectada:', groqData.intencion);
    console.log('📋 Parámetros extraídos:', groqData.parametros);
    
    // 3. Procesar la intención identificada
    const result = await procesarIntencion(groqData, userId);
    
    // 4. Guardar interacción en base de datos
    try {
      await guardarInteraccionChat(userId || 'anonimo', message, result.response, groqData.intencion);
    } catch (dbError) {
      console.error('⚠️ Error guardando en BD (no crítico):', dbError.message);
    }
    
    return res.json({
      success: true,
      response: result.response,
      intencion: groqData.intencion,
      parametros: groqData.parametros,
      data: result.data || null
    });
    
  } catch (error) {
    console.error('❌ Error en chatbot inteligente:', error);
    
    // Respuesta de fallback
    return res.json({
      success: true,
      response: "Disculpa, estoy teniendo dificultades técnicas. ¿Podrías contactarnos directamente al (555) 123-4567?",
      fallback: true
    });
  }
};

/**
 * Procesar la intención identificada por Groq
 */
async function procesarIntencion(groqData, userId) {
  const { intencion, parametros } = groqData;
  
  console.log(`🎯 Procesando intención: ${intencion}`);
  
  switch (intencion) {
    case 'agendar_cita':
      return await manejarAgendarCita(parametros, userId);
      
    case 'cancelar_cita':
      return await manejarCancelarCita(parametros, userId);
      
    case 'reagendar_cita':
      return await manejarReagendarCita(parametros, userId);
      
    case 'consultar_disponibilidad':
      return await manejarConsultarDisponibilidad(parametros);
      
    case 'consultar_mis_citas':
      return await manejarConsultarMisCitas(parametros, userId);
      
    case 'consultar_servicios':
      return await manejarConsultarServicios(parametros);
      
    case 'consultar_precios':
      return await manejarConsultarPrecios(parametros);
      
    case 'consultar_ubicacion':
      return await manejarConsultarUbicacion(parametros);
      
    case 'consultar_horarios':
      return await manejarConsultarHorarios(parametros);
      
    case 'emergencia_dental':
      return await manejarEmergencia(parametros);
      
    case 'saludo':
      return {
        response: "¡Hola! 😊 Bienvenido a ClinikDent. Soy tu asistente virtual inteligente. Puedo ayudarte a agendar citas, consultar disponibilidad, informarte sobre servicios y mucho más. ¿En qué puedo asistirte hoy?"
      };
      
    case 'despedida':
      return {
        response: "¡Gracias por contactar ClinikDent! 🦷 Espero haberte ayudado. Si necesitas algo más, estaré aquí. ¡Que tengas un excelente día y cuida tu sonrisa! 😊"
      };
      
    case 'error':
      return {
        response: groqData.mensaje_usuario || "No pude entender completamente tu solicitud. ¿Podrías proporcionar más detalles o reformular tu pregunta?"
      };
      
    default:
      return await manejarInformacionGeneral(parametros);
  }
}

// =================== MANEJADORES DE INTENCIONES ===================

async function manejarAgendarCita(parametros, userId) {
  try {
    const { doctor, fecha, hora, paciente } = parametros;
    
    // Validar parámetros requeridos
    if (!doctor || !fecha || !hora) {
      return {
        response: "Para agendar tu cita necesito:\n• Nombre del doctor\n• Fecha preferida\n• Hora preferida\n\n¿Podrías proporcionar esta información?"
      };
    }
    
    // Buscar doctor en la base de datos
    const doctorQuery = await db.query(
      "SELECT id, nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = 'odontologo' AND (u.nombre ILIKE $1 OR u.apellido ILIKE $1)",
      [`%${doctor.replace('Dr. ', '').replace('Dra. ', '')}%`]
    );
    
    if (!doctorQuery.rows.length) {
      return {
        response: `No encontré al doctor "${doctor}". Nuestros odontólogos disponibles son:\n• Dr. García\n• Dra. Martínez\n• Dr. López\n\n¿Con cuál te gustaría agendar?`
      };
    }
    
    const doctorData = doctorQuery.rows[0];
    
    // Verificar disponibilidad en esa fecha y hora
    const citaExistente = await db.query(
      "SELECT id FROM citas WHERE odontologo_id = $1 AND fecha = $2 AND hora = $3 AND estado != 'cancelada'",
      [doctorData.id, fecha, hora]
    );
    
    if (citaExistente.rows.length > 0) {
      return {
        response: `El ${doctorData.nombre} ya tiene una cita agendada el ${fecha} a las ${hora}. Te sugiero:\n\n• Otra hora el mismo día\n• Otro día con el mismo doctor\n• Otro doctor disponible\n\n¿Qué prefieres?`
      };
    }
    
    // Si no hay userId, solicitar datos del paciente
    if (!userId) {
      return {
        response: "Perfecto, el horario está disponible. Para completar tu cita necesito que te registres o inicies sesión en nuestro sistema. ¿Podrías ir a la página de login?"
      };
    }
    
    // Crear la cita
    const nuevaCita = await db.query(
      `INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, motivo, estado, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
      [userId, doctorData.id, fecha, hora, 'Consulta general', 'programada']
    );
    
    // Obtener datos del paciente para email
    const pacienteData = await db.query(
      "SELECT nombre, apellido, correo FROM usuarios WHERE id = $1",
      [userId]
    );
    
    if (pacienteData.rows.length && pacienteData.rows[0].correo) {
      // Enviar email de confirmación
      try {
        await emailService.sendEmail(
          pacienteData.rows[0].correo,
          '✅ Cita Confirmada - ClinikDent',
          `
            <h2>¡Tu cita ha sido confirmada!</h2>
            <p><strong>Paciente:</strong> ${pacienteData.rows[0].nombre} ${pacienteData.rows[0].apellido}</p>
            <p><strong>Doctor:</strong> ${doctorData.nombre}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${hora}</p>
            <p><strong>ID de Cita:</strong> ${nuevaCita.rows[0].id}</p>
            
            <hr>
            <p>Te esperamos en ClinikDent. Si necesitas cancelar o reagendar, contáctanos con anticipación.</p>
          `
        );
      } catch (emailError) {
        console.error('⚠️ Error enviando email de confirmación:', emailError);
      }
    }
    
    return {
      response: `🎉 ¡Excelente! Tu cita ha sido agendada:\n\n📅 **Fecha:** ${fecha}\n⏰ **Hora:** ${hora}\n👨‍⚕️ **Doctor:** ${doctorData.nombre}\n🆔 **ID Cita:** ${nuevaCita.rows[0].id}\n\n✅ Hemos enviado la confirmación a tu correo. ¡Te esperamos!`,
      data: {
        citaId: nuevaCita.rows[0].id,
        fecha,
        hora,
        doctor: doctorData.nombre
      }
    };
    
  } catch (error) {
    console.error('❌ Error en manejarAgendarCita:', error);
    return {
      response: "Hubo un error procesando tu solicitud de cita. Por favor, intenta contactarnos directamente al (555) 123-4567."
    };
  }
}

async function manejarConsultarDisponibilidad(parametros) {
  try {
    const { doctor, fecha } = parametros;
    
    if (!fecha) {
      return {
        response: "Para consultar disponibilidad necesito saber la fecha. ¿Para qué día necesitas la cita?"
      };
    }
    
    let whereClause = "WHERE fecha = $1 AND estado != 'cancelada'";
    let queryParams = [fecha];
    
    if (doctor) {
      // Buscar doctor específico
      const doctorQuery = await db.query(
        "SELECT id, nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = 'odontologo' AND (u.nombre ILIKE $1 OR u.apellido ILIKE $1)",
        [`%${doctor.replace('Dr. ', '').replace('Dra. ', '')}%`]
      );
      
      if (!doctorQuery.rows.length) {
        return {
          response: `No encontré al doctor "${doctor}". ¿Podrías verificar el nombre o consultar disponibilidad general para ${fecha}?`
        };
      }
      
      whereClause += " AND odontologo_id = $2";
      queryParams.push(doctorQuery.rows[0].id);
    }
    
    const citasOcupadas = await db.query(
      `SELECT hora, u.nombre as doctor_nombre 
       FROM citas c 
       JOIN usuarios u ON c.odontologo_id = u.id 
       ${whereClause} 
       ORDER BY hora`,
      queryParams
    );
    
    const horariosDisponibles = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
      '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', 
      '16:00', '16:30', '17:00', '17:30'
    ];
    
    const horasOcupadas = citasOcupadas.rows.map(cita => cita.hora);
    const horasLibres = horariosDisponibles.filter(hora => !horasOcupadas.includes(hora));
    
    if (horasLibres.length === 0) {
      return {
        response: `😔 No hay horarios disponibles ${doctor ? `con ${doctor}` : ''} el ${fecha}. Te sugerimos:\n\n• Otro día\n• Otro doctor\n• Lista de espera para cancelaciones\n\n¿Te interesa alguna opción?`
      };
    }
    
    return {
      response: `📅 Disponibilidad para ${fecha}${doctor ? ` con ${doctor}` : ''}:\n\n⏰ **Horarios libres:**\n${horasLibres.map(hora => `• ${hora}`).join('\n')}\n\n¿Te interesa alguno de estos horarios?`,
      data: {
        fecha,
        doctor,
        horasDisponibles: horasLibres,
        horasOcupadas: horasOcupadas
      }
    };
    
  } catch (error) {
    console.error('❌ Error consultando disponibilidad:', error);
    return {
      response: "Error consultando disponibilidad. Intenta contactarnos directamente."
    };
  }
}

async function manejarConsultarServicios(parametros) {
  const servicios = `🦷 **Nuestros Servicios en ClinikDent:**

**🏥 Odontología General:**
• Consultas y diagnósticos
• Limpiezas dentales profesionales
• Obturaciones (resinas estéticas)
• Extracciones simples

**✨ Estética Dental:**
• Blanqueamiento profesional
• Carillas de porcelana
• Diseño de sonrisa
• Contorneado dental

**🔬 Especialidades:**
• Endodoncia (tratamientos de conducto)
• Periodoncia (tratamiento de encías)
• Implantología (implantes dentales)
• Cirugía oral

**🔧 Ortodoncia:**
• Brackets tradicionales
• Ortodoncia invisible (Invisalign)
• Retenedores

**👶 Odontopediatría:**
• Atención especializada para niños
• Sellantes de fosas y fisuras
• Educación en higiene oral

¿Te interesa información específica sobre algún tratamiento?`;

  return { response: servicios };
}

async function manejarConsultarPrecios(parametros) {
  const { servicio } = parametros;
  
  const precios = `💰 **Precios ClinikDent:**

**🏥 Servicios Básicos:**
• Consulta General: $50,000
• Limpieza Dental: $80,000
• Obturación (resina): $120,000
• Extracción simple: $100,000

**✨ Estética Dental:**
• Blanqueamiento profesional: $300,000
• Carillas de porcelana: $800,000
• Diseño de sonrisa: Desde $2,500,000

**🔬 Especialidades:**
• Endodoncia: $450,000 - $650,000
• Implante dental: $1,800,000
• Corona sobre implante: $800,000

**🔧 Ortodoncia:**
• Brackets tradicionales: Desde $1,200,000
• Ortodoncia invisible: Desde $2,500,000

**💳 Financiación disponible:**
• Hasta 12 meses sin intereses
• Planes personalizados
• Primera consulta GRATIS

¿Necesitas cotización para algún tratamiento específico?`;

  return { response: precios };
}

async function manejarConsultarUbicacion(parametros) {
  const ubicaciones = `📍 **Nuestras Sedes ClinikDent:**

**🏢 Sede Centro** (Principal)
📍 Calle Principal #123, Centro
📞 (555) 123-4567
🅿️ Parqueadero gratuito
🚌 Transporte: Rutas 15, 23, 40

**🏢 Sede Norte**
📍 Av. Salud #456, Norte  
📞 (555) 234-5678
🅿️ Parqueadero cubierto
🚇 Metro: Estación Salud (2 cuadras)

**🏢 Sede Plaza**
📍 Plaza Dental, Local 789
📞 (555) 345-6789
🛍️ Dentro del centro comercial
🅿️ Parqueadero del centro comercial

🌐 **Contacto General:**
• WhatsApp: (555) 999-7777
• Email: info@clinikdent.com
• Web: www.clinikdent.com

¿Cuál sede te queda más cerca?`;

  return { response: ubicaciones };
}

async function manejarConsultarHorarios(parametros) {
  const horarios = `🕐 **Horarios de Atención ClinikDent:**

**📅 Lunes a Viernes:**
• 8:00 AM - 6:00 PM

**📅 Sábados:**
• 9:00 AM - 2:00 PM

**📅 Domingos:**
• Cerrado (solo emergencias)

**🚨 Emergencias 24/7:**
• Línea directa: (555) 911-DENT
• WhatsApp urgencias: (555) 999-8888

**📞 Atención telefónica:**
• L-V: 7:00 AM - 7:00 PM
• Sáb: 8:00 AM - 3:00 PM

¿Te gustaría agendar en algún horario específico?`;

  return { response: horarios };
}

async function manejarEmergencia(parametros) {
  const emergencia = `🚨 **EMERGENCIA DENTAL - ATENCIÓN INMEDIATA**

**📞 Contacta AHORA:**
• Urgencias 24/7: (555) 911-DENT
• WhatsApp emergencias: (555) 999-8888

**🏥 Atención inmediata en:**
• Sede Centro: Calle Principal #123
• Disponible las 24 horas

**💡 Mientras llegas:**
• Aplica frío en la zona afectada (por fuera)
• Toma analgésicos comunes si tienes
• NO uses calor
• NO te automediques
• Mantén la calma

**🚨 Ve al hospital si hay:**
• Sangrado que no para
• Inflamación facial severa
• Dificultad para respirar o tragar

¿Puedes describir brevemente qué tipo de emergencia tienes?`;

  return { response: emergencia };
}

async function manejarInformacionGeneral(parametros) {
  return {
    response: "Estoy aquí para ayudarte con ClinikDent. Puedo asistirte con:\n\n📅 Agendar, cancelar o reagendar citas\n🦷 Información sobre servicios y precios\n📍 Ubicaciones y horarios\n🚨 Emergencias dentales\n💬 Consultas generales\n\n¿En qué específicamente puedo ayudarte?"
  };
}

// =================== FUNCIONES AUXILIARES ===================

async function guardarInteraccionChat(userId, mensaje, respuesta, intencion) {
  try {
    await db.query(
      `INSERT INTO chat_soporte (remitente_id, destinatario_id, mensaje, fecha_envio, leido, intencion) 
       VALUES ($1, $2, $3, NOW(), FALSE, $4)`,
      [userId, 'bot-inteligente', mensaje, intencion]
    );
    
    await db.query(
      `INSERT INTO chat_soporte (remitente_id, destinatario_id, mensaje, fecha_envio, leido, intencion) 
       VALUES ($1, $2, $3, NOW(), FALSE, $4)`,
      ['bot-inteligente', userId, respuesta, `respuesta_${intencion}`]
    );
  } catch (error) {
    console.error('Error guardando interacción:', error);
  }
}

// Test endpoint
const testChat = async (req, res) => {
  res.json({
    success: true,
    message: '🤖 Chatbot inteligente funcionando correctamente',
    version: '1.0.0',
    features: [
      'Reconocimiento de intenciones con IA',
      'Gestión de citas inteligente',
      'Información de servicios',
      'Manejo de emergencias'
    ]
  });
};

module.exports = {
  testChat,
  chatInteligente: exports.chatInteligente
};