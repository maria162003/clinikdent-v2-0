/**
 * 🟢 WHATSAPP CONTROLLER - CLINIKDENT
 * Integración con Twilio WhatsApp Business API
 * Maneja mensajes entrantes y salientes de WhatsApp
 */

const twilio = require('twilio');
const db = require('../config/db');

// Configuración de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER; // formato: whatsapp:+14155238886

let twilioClient = null;

// Inicializar cliente de Twilio solo si hay credenciales válidas
if (accountSid && authToken && accountSid.startsWith('AC')) {
    try {
        twilioClient = twilio(accountSid, authToken);
        console.log('✅ Cliente de Twilio WhatsApp inicializado');
    } catch (error) {
        console.log('⚠️ Error inicializando Twilio:', error.message);
        twilioClient = null;
    }
} else {
    console.log('⚠️ Twilio no configurado (faltan credenciales válidas en .env)');
    console.log('💡 Para habilitar WhatsApp, configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_NUMBER');
}

// Importar el chatbot inteligente
const { chatInteligente } = require('./chatInteligentController');

/**
 * Webhook para recibir mensajes de WhatsApp
 * Twilio llamará a este endpoint cuando llegue un mensaje
 */
const receiveWhatsAppMessage = async (req, res) => {
    try {
        const { From, Body, ProfileName, MessageSid } = req.body;
        
        console.log('📱 WhatsApp entrante:', {
            from: From,
            nombre: ProfileName,
            mensaje: Body,
            sid: MessageSid
        });

        // Extraer número de teléfono (quitar 'whatsapp:')
        const phoneNumber = From.replace('whatsapp:', '');

        // Buscar o crear sesión del usuario
        const session = await getOrCreateWhatsAppSession(phoneNumber, ProfileName);

        // Procesar mensaje con el chatbot inteligente
        const chatbotResponse = await processWhatsAppWithChatbot({
            message: Body,
            phoneNumber,
            sessionId: session.id,
            userName: ProfileName
        });

        // Guardar interacción en base de datos
        await saveWhatsAppInteraction({
            sessionId: session.id,
            phoneNumber,
            userMessage: Body,
            botResponse: chatbotResponse.response,
            intention: chatbotResponse.intencion,
            messageSid: MessageSid
        });

        // Responder por WhatsApp usando Twilio
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(chatbotResponse.response);

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());

    } catch (error) {
        console.error('❌ Error procesando WhatsApp:', error);
        
        // Respuesta de error
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message('Disculpa, estoy teniendo problemas técnicos. Por favor intenta más tarde o llama al (601) 123-4567.');
        
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    }
};

/**
 * Enviar mensaje proactivo por WhatsApp
 * Útil para recordatorios, confirmaciones, etc.
 */
const sendWhatsAppMessage = async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere phoneNumber y message'
            });
        }

        if (!twilioClient) {
            return res.status(503).json({
                success: false,
                error: 'Servicio de WhatsApp no configurado'
            });
        }

        // Formatear número de teléfono
        const formattedNumber = phoneNumber.startsWith('whatsapp:') 
            ? phoneNumber 
            : `whatsapp:${phoneNumber}`;

        // Enviar mensaje
        const messageResponse = await twilioClient.messages.create({
            body: message,
            from: whatsappNumber,
            to: formattedNumber
        });

        console.log('✅ Mensaje WhatsApp enviado:', {
            to: formattedNumber,
            sid: messageResponse.sid
        });

        res.json({
            success: true,
            messageSid: messageResponse.sid,
            status: messageResponse.status
        });

    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Enviar recordatorio de cita por WhatsApp
 */
const sendAppointmentReminder = async (req, res) => {
    try {
        const { citaId } = req.body;

        // Obtener datos de la cita
        const [citas] = await db.query(`
            SELECT 
                c.id,
                c.fecha_cita,
                c.hora_cita,
                p.nombre as paciente_nombre,
                p.telefono,
                o.nombre as odontologo_nombre,
                s.nombre as sede_nombre
            FROM citas c
            INNER JOIN pacientes p ON c.paciente_id = p.id
            INNER JOIN odontologos o ON c.odontologo_id = o.id
            INNER JOIN sedes s ON c.sede_id = s.id
            WHERE c.id = ?
        `, [citaId]);

        if (citas.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }

        const cita = citas[0];

        // Formatear fecha y hora
        const fecha = new Date(cita.fecha_cita);
        const fechaFormateada = fecha.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Crear mensaje de recordatorio
        const mensaje = `
🦷 *ClinikDent - Recordatorio de Cita*

Hola ${cita.paciente_nombre},

Te recordamos tu cita programada:

📅 *Fecha:* ${fechaFormateada}
🕐 *Hora:* ${cita.hora_cita}
👨‍⚕️ *Odontólogo:* ${cita.odontologo_nombre}
📍 *Sede:* ${cita.sede_nombre}

Por favor confirma tu asistencia respondiendo:
✅ "CONFIRMAR" para confirmar
❌ "CANCELAR" para cancelar

¿Necesitas ayuda? ¡Estoy aquí para asistirte!
        `.trim();

        // Enviar por WhatsApp
        if (!twilioClient) {
            return res.status(503).json({
                success: false,
                error: 'Servicio de WhatsApp no configurado'
            });
        }

        const messageResponse = await twilioClient.messages.create({
            body: mensaje,
            from: whatsappNumber,
            to: `whatsapp:${cita.telefono}`
        });

        // Registrar envío
        await db.query(`
            INSERT INTO notificaciones_whatsapp 
            (cita_id, telefono, mensaje, mensaje_sid, tipo, estado)
            VALUES (?, ?, ?, ?, 'recordatorio', 'enviado')
        `, [citaId, cita.telefono, mensaje, messageResponse.sid]);

        res.json({
            success: true,
            messageSid: messageResponse.sid,
            message: 'Recordatorio enviado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error enviando recordatorio:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Obtener o crear sesión de WhatsApp para un usuario
 */
async function getOrCreateWhatsAppSession(phoneNumber, userName) {
    try {
        // Buscar sesión activa (últimas 24 horas)
        const [sessions] = await db.query(`
            SELECT * FROM whatsapp_sessions
            WHERE telefono = ?
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC
            LIMIT 1
        `, [phoneNumber]);

        if (sessions.length > 0) {
            return sessions[0];
        }

        // Crear nueva sesión
        const sessionId = 'whatsapp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        await db.query(`
            INSERT INTO whatsapp_sessions (session_id, telefono, nombre_usuario, created_at)
            VALUES (?, ?, ?, NOW())
        `, [sessionId, phoneNumber, userName]);

        return {
            id: sessionId,
            telefono: phoneNumber,
            nombre_usuario: userName
        };

    } catch (error) {
        console.error('Error en sesión WhatsApp:', error);
        // Devolver sesión temporal si falla
        return {
            id: 'temp_' + Date.now(),
            telefono: phoneNumber,
            nombre_usuario: userName
        };
    }
}

/**
 * Procesar mensaje de WhatsApp con el chatbot
 */
async function processWhatsAppWithChatbot({ message, phoneNumber, sessionId, userName }) {
    try {
        // Simular request/response para reutilizar lógica del chatbot
        const mockReq = {
            body: {
                message,
                userId: null, // WhatsApp users no tienen userId
                conversationId: sessionId,
                channel: 'whatsapp',
                metadata: {
                    phoneNumber,
                    userName
                }
            }
        };

        let capturedResponse = null;
        const mockRes = {
            json: (data) => {
                capturedResponse = data;
            },
            status: (code) => ({
                json: (data) => {
                    capturedResponse = data;
                }
            })
        };

        // Llamar al chatbot inteligente
        await chatInteligente(mockReq, mockRes);

        // Si no hay respuesta, usar fallback
        if (!capturedResponse || !capturedResponse.success) {
            return {
                response: 'Disculpa, no pude procesar tu mensaje. ¿Podrías reformularlo?',
                intencion: 'error'
            };
        }

        return capturedResponse;

    } catch (error) {
        console.error('Error en chatbot WhatsApp:', error);
        return {
            response: 'Lo siento, estoy teniendo problemas técnicos. Por favor intenta más tarde.',
            intencion: 'error'
        };
    }
}

/**
 * Guardar interacción de WhatsApp en base de datos
 */
async function saveWhatsAppInteraction({ sessionId, phoneNumber, userMessage, botResponse, intention, messageSid }) {
    try {
        await db.query(`
            INSERT INTO chat_whatsapp_interacciones 
            (session_id, telefono, mensaje_usuario, respuesta_bot, intencion, mensaje_sid, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [sessionId, phoneNumber, userMessage, botResponse, intention, messageSid]);
    } catch (error) {
        console.error('Error guardando interacción WhatsApp:', error);
    }
}

/**
 * Obtener historial de conversación de WhatsApp
 */
const getWhatsAppHistory = async (req, res) => {
    try {
        const { phoneNumber, limit = 50 } = req.query;

        const [history] = await db.query(`
            SELECT * FROM chat_whatsapp_interacciones
            WHERE telefono = ?
            ORDER BY created_at DESC
            LIMIT ?
        `, [phoneNumber, parseInt(limit)]);

        res.json({
            success: true,
            count: history.length,
            history: history.reverse() // Orden cronológico
        });

    } catch (error) {
        console.error('Error obteniendo historial WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Test de conectividad con Twilio
 */
const testWhatsApp = async (req, res) => {
    try {
        if (!twilioClient) {
            return res.status(503).json({
                success: false,
                message: 'Twilio WhatsApp no configurado',
                config: {
                    hasSid: !!accountSid,
                    hasToken: !!authToken,
                    hasNumber: !!whatsappNumber
                }
            });
        }

        // Verificar cuenta
        const account = await twilioClient.api.accounts(accountSid).fetch();

        res.json({
            success: true,
            message: 'Twilio WhatsApp configurado correctamente',
            account: {
                sid: account.sid,
                name: account.friendlyName,
                status: account.status
            },
            whatsappNumber
        });

    } catch (error) {
        console.error('Error en test WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    receiveWhatsAppMessage,
    sendWhatsAppMessage,
    sendAppointmentReminder,
    getWhatsAppHistory,
    testWhatsApp
};
