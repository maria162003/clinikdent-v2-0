const Groq = require('groq-sdk');
const config = require('../config/groq.config');

const groq = new Groq({
    apiKey: config.apiKey
});

// Contexto del sistema para Clinikdent
const SYSTEM_PROMPT = `Eres el asistente virtual de Clinikdent, una clínica dental profesional en Bogotá, Colombia.

TU PERSONALIDAD:
- Amable, profesional y servicial
- Hablas español colombiano natural
- Usas emojis ocasionalmente (🦷 😊 📅)
- Eres conciso pero completo

TU TRABAJO PRINCIPAL:
1. Conversar naturalmente con pacientes por WhatsApp/Instagram
2. Detectar cuando quieren agendar citas
3. Extraer información necesaria: nombre, cédula, servicio, fecha/hora preferida
4. Confirmar citas antes de guardarlas
5. Responder preguntas sobre servicios, horarios, ubicación, precios

SERVICIOS DISPONIBLES:
- Limpieza dental ($80.000)
- Ortodoncia (desde $150.000/mes)
- Endodoncia ($250.000)
- Implantes dentales ($1.200.000)
- Blanqueamiento ($200.000)
- Urgencias odontológicas
- Diseño de sonrisa
- Periodoncia

INFORMACIÓN DE LA CLÍNICA:
📍 Ubicación: Cra. 15 #93-30, Bogotá
📞 Teléfono: 601 234 5678
📧 Email: contacto@clinikdent.com

🕐 HORARIOS:
- Lunes a Viernes: 7:00 AM - 5:00 PM
- Sábados: 9:00 AM - 1:00 PM
- Domingos: Cerrado

REGLAS IMPORTANTES:
1. SIEMPRE pide cédula para agendar citas (obligatorio)
2. Si detectas intención de agendar, pregunta datos faltantes uno por uno
3. Confirma TODA la información antes de decir "cita agendada"
4. Si preguntan por un servicio no listado, di que consultarás con el equipo
5. Para urgencias, di que llamen directo al 601 234 5678
6. Si no entiendes algo, pide que lo repitan de otra forma
7. Nunca inventes información que no tengas

FORMATO DE RESPUESTAS:
- Saludo inicial siempre incluye presentación: "¡Hola! Soy el asistente de Clinikdent 🦷"
- Preguntas claras y directas
- Confirmaciones explícitas antes de agendar
- Despedidas amables

EJEMPLOS DE CONVERSACIÓN:

Usuario: "Hola"
Tú: "¡Hola! Soy el asistente virtual de Clinikdent 🦷 ¿En qué puedo ayudarte hoy?"

Usuario: "Necesito una limpieza"
Tú: "¡Perfecto! Una limpieza dental cuesta $80.000. ¿Qué día te gustaría agendar?"

Usuario: "El viernes"
Tú: "El viernes 29 de noviembre. ¿Prefieres en la mañana (8-12) o tarde (2-5)?"

Usuario: "En la mañana"
Tú: "Excelente. Para confirmar tu cita necesito tu nombre completo y número de cédula."

Usuario: "Daniel Muñoz, cédula 123456789"
Tú: "Perfecto Daniel. ¿Confirmo tu cita así?
📋 Limpieza dental
📅 Viernes 29/11/2024
🕐 10:00 AM
💰 $80.000
¿Está bien?"

Usuario: "Sí"
Tú: "✅ ¡Listo! Cita confirmada para Daniel Muñoz.
Te enviaremos un recordatorio 24h antes.
¿Algo más en lo que pueda ayudarte?"`;

/**
 * Analiza un mensaje usando Llama 3.2 y detecta intenciones
 * @param {string} mensaje - Mensaje del usuario
 * @param {Object} contexto - Contexto de la conversación (historial, datos previos)
 * @returns {Promise<Object>} {respuesta, intencion, datosExtraidos, confianza}
 */
async function analizarMensaje(mensaje, contexto = {}) {
    try {
        console.log('🤖 [Llama] Analizando mensaje:', mensaje);

        // Construir mensajes con contexto si existe
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            }
        ];

        // Agregar historial si existe
        if (contexto.historial && Array.isArray(contexto.historial)) {
            messages.push(...contexto.historial);
        }

        // Agregar mensaje actual
        messages.push({
            role: 'user',
            content: mensaje
        });

        // Llamar a Groq API
        const completion = await groq.chat.completions.create({
            messages: messages,
            model: config.model,
            temperature: config.temperature,
            max_tokens: config.maxTokens
        });

        const respuesta = completion.choices[0]?.message?.content || 
                         'Lo siento, no pude procesar tu mensaje. ¿Podrías repetirlo?';

        console.log('✅ [Llama] Respuesta generada:', respuesta.substring(0, 100) + '...');

        // Analizar la intención del mensaje
        const analisis = analizarIntencion(mensaje, respuesta);

        return {
            respuesta: respuesta,
            intencion: analisis.intencion,
            datosExtraidos: analisis.datos,
            confianza: analisis.confianza,
            requiereMasInfo: analisis.requiereMasInfo
        };

    } catch (error) {
        console.error('❌ [Llama] Error en análisis:', error.message);
        
        // Error específico de API key
        if (error.message.includes('API key')) {
            return {
                respuesta: '⚠️ Error de configuración. Por favor contacta al administrador.',
                intencion: 'error_config',
                datosExtraidos: null,
                confianza: 0
            };
        }

        // Error genérico
        return {
            respuesta: 'Disculpa, tengo un problema técnico momentáneo. ¿Puedes intentar de nuevo en un momento?',
            intencion: 'error',
            datosExtraidos: null,
            confianza: 0
        };
    }
}

/**
 * Analiza la intención del mensaje del usuario
 * @param {string} mensaje - Mensaje original del usuario
 * @param {string} respuestaIA - Respuesta generada por la IA
 * @returns {Object} {intencion, datos, confianza, requiereMasInfo}
 */
function analizarIntencion(mensaje, respuestaIA) {
    const mensajeLower = mensaje.toLowerCase();
    
    // Palabras clave para diferentes intenciones
    const palabrasClave = {
        agendar_cita: ['cita', 'agendar', 'turno', 'reservar', 'programar', 'agenda'],
        consultar_servicios: ['servicio', 'precio', 'costo', 'cuanto', 'cuánto', 'ofrece', 'hace'],
        consultar_horario: ['horario', 'hora', 'abre', 'cierra', 'atiende'],
        consultar_ubicacion: ['ubicacion', 'ubicación', 'direccion', 'dirección', 'donde', 'dónde', 'llegar'],
        urgencia: ['urgencia', 'urgente', 'dolor', 'emergencia', 'ya', 'ahora'],
        saludo: ['hola', 'buenos', 'buenas', 'hey', 'ola'],
        informacion: ['info', 'información', 'saber', 'conocer', 'preguntar']
    };

    let intencionDetectada = 'consulta_general';
    let confianza = 0;
    let datos = {};
    let requiereMasInfo = false;

    // Detectar intención principal
    for (const [intencion, palabras] of Object.entries(palabrasClave)) {
        for (const palabra of palabras) {
            if (mensajeLower.includes(palabra)) {
                intencionDetectada = intencion;
                confianza = 0.8;
                break;
            }
        }
        if (confianza > 0) break;
    }

    // Si es agendar cita, extraer datos
    if (intencionDetectada === 'agendar_cita') {
        datos = extraerDatosCita(mensaje);
        
        // Verificar si necesita más información
        const camposRequeridos = ['nombre', 'cedula', 'servicio', 'fecha'];
        const camposFaltantes = camposRequeridos.filter(campo => !datos[campo]);
        requiereMasInfo = camposFaltantes.length > 0;
        
        if (requiereMasInfo) {
            datos.camposFaltantes = camposFaltantes;
        }
    }

    // Verificar si la IA está pidiendo confirmación
    if (respuestaIA.toLowerCase().includes('¿confirm') || 
        respuestaIA.toLowerCase().includes('¿está bien') ||
        respuestaIA.toLowerCase().includes('¿correcto')) {
        requiereMasInfo = true;
        datos.esperandoConfirmacion = true;
    }

    return {
        intencion: intencionDetectada,
        datos: Object.keys(datos).length > 0 ? datos : null,
        confianza: confianza,
        requiereMasInfo: requiereMasInfo
    };
}

/**
 * Extrae datos de cita del mensaje
 * @param {string} mensaje - Mensaje del usuario
 * @returns {Object} Datos extraídos (nombre, cedula, servicio, fecha, hora)
 */
function extraerDatosCita(mensaje) {
    const datos = {};

    // Extraer cédula (números de 6-10 dígitos)
    const cedulaMatch = mensaje.match(/\b(\d{6,10})\b/);
    if (cedulaMatch) {
        datos.cedula = cedulaMatch[1];
    }

    // Extraer nombre (palabras capitalizadas consecutivas)
    const nombreMatch = mensaje.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)\b/);
    if (nombreMatch) {
        datos.nombre = nombreMatch[1];
    }

    // Extraer servicios mencionados
    const servicios = {
        'limpieza': 'Limpieza dental',
        'ortodoncia': 'Ortodoncia',
        'endodoncia': 'Endodoncia',
        'implante': 'Implantes dentales',
        'blanqueamiento': 'Blanqueamiento',
        'diseño': 'Diseño de sonrisa',
        'urgencia': 'Urgencia odontológica'
    };

    for (const [key, value] of Object.entries(servicios)) {
        if (new RegExp(key, 'i').test(mensaje)) {
            datos.servicio = value;
            break;
        }
    }

    // Extraer fechas
    const fechaPatterns = [
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/,  // DD/MM/YYYY
        /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i,
        /(mañana|hoy|pasado\s*mañana)/i
    ];

    for (const pattern of fechaPatterns) {
        const match = mensaje.match(pattern);
        if (match) {
            datos.fechaTexto = match[0];
            // Aquí podrías convertir a fecha real
            break;
        }
    }

    // Extraer hora
    const horaMatch = mensaje.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/);
    if (horaMatch) {
        datos.hora = horaMatch[0];
    }

    return datos;
}

/**
 * Genera una respuesta rápida sin IA (para casos simples)
 * @param {string} mensaje - Mensaje del usuario
 * @returns {string} Respuesta predefinida
 */
function respuestaRapida(mensaje) {
    const mensajeLower = mensaje.toLowerCase().trim();

    const respuestas = {
        'hola': '¡Hola! Soy el asistente virtual de Clinikdent 🦷 ¿En qué puedo ayudarte hoy?',
        'gracias': '¡Con gusto! Estoy aquí para ayudarte. ¿Necesitas algo más? 😊',
        'horario': '🕐 Horarios:\n- Lunes a Viernes: 7:00 AM - 5:00 PM\n- Sábados: 9:00 AM - 1:00 PM\n- Domingos: Cerrado',
        'ubicacion': '📍 Estamos en: Cra. 15 #93-30, Bogotá\n¿Necesitas indicaciones? 🗺️',
        'telefono': '📞 Teléfono: 601 234 5678\n📧 Email: contacto@clinikdent.com'
    };

    for (const [key, respuesta] of Object.entries(respuestas)) {
        if (mensajeLower.includes(key)) {
            return respuesta;
        }
    }

    return null; // Si no hay respuesta rápida, usar IA
}

module.exports = {
    analizarMensaje,
    extraerDatosCita,
    respuestaRapida
};
