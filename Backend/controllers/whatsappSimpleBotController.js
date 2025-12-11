/**
 * Bot de WhatsApp CON IA - Llama 3.2 via Groq
 * Conversación natural + detección inteligente de intenciones
 */

const db = require('../config/databaseSecure');
const llamaService = require('../services/llama-service');

/**
 * Genera respuesta automática basada en el mensaje del usuario
 */
function generarRespuestaAutomatica(mensaje) {
    const mensajeLower = mensaje.toLowerCase();

    // MENÚ PRINCIPAL
    if (mensajeLower.includes('hola') || mensajeLower.includes('menu') || mensajeLower.includes('inicio')) {
        return {
            texto: `¡Bienvenido a Clinikdent! 🦷

Soy tu asistente virtual. Escribe el número de la opción:

1️⃣ REGISTRO - Registrarte como paciente
2️⃣ CITA - Agendar una cita
3️⃣ CONSULTAR - Ver tus citas agendadas
4️⃣ SERVICIOS - Conocer nuestros servicios
5️⃣ SOPORTE - Hablar con un asesor

También puedes escribir directamente lo que necesitas.`,
            accion: 'menu_principal'
        };
    }

    // OPCIÓN 1: REGISTRO
    if (mensajeLower.match(/^1$|registro|registrar|registrarse/)) {
        return {
            texto: `📋 *Registro de Paciente*

Para registrarte, por favor envíanos:

📝 Nombre completo
🆔 Número de cédula
📧 Correo electrónico
📱 Teléfono
📅 Fecha de nacimiento (DD/MM/AAAA)
📍 Dirección

Ejemplo:
"Juan Pérez, 123456789, juan@email.com, 3001234567, 01/01/1990, Calle 123 #45-67"

O puedes llamarnos al 📞 302-529-5978`,
            accion: 'solicitar_registro'
        };
    }

    // OPCIÓN 2: AGENDAR CITA
    if (mensajeLower.match(/^2$|cita|agendar|reservar|turno/)) {
        return {
            texto: `📅 *Agendar Cita*

Nuestros servicios disponibles:

🦷 Limpieza Dental
🦷 Ortodoncia
🦷 Endodoncia (tratamiento de conducto)
🦷 Implantes Dentales
🦷 Blanqueamiento
🦷 Extracciones
🦷 Prótesis
🦷 Odontopediatría

Para agendar, dinos:
- ¿Qué servicio necesitas?
- ¿Qué día prefieres? (DD/MM/AAAA)
- ¿Qué horario? (mañana/tarde)

O llámanos al 📞 302-529-5978`,
            accion: 'solicitar_cita'
        };
    }

    // OPCIÓN 3: CONSULTAR CITAS
    if (mensajeLower.match(/^3$|consultar|mis citas|ver citas/)) {
        return {
            texto: `🔍 *Consultar Citas*

Para consultar tus citas agendadas, por favor envíanos tu número de cédula.

Ejemplo: "Consultar 123456789"

O llámanos al 📞 302-529-5978`,
            accion: 'consultar_citas'
        };
    }

    // OPCIÓN 4: SERVICIOS
    if (mensajeLower.match(/^4$|servicio|tratamiento|precio|costo/)) {
        return {
            texto: `🦷 *Nuestros Servicios*

✅ Odontología General
• Limpieza dental
• Evaluación y diagnóstico
• Empastes y calzas

✅ Ortodoncia
• Brackets metálicos
• Brackets estéticos
• Invisalign

✅ Endodoncia
• Tratamiento de conducto
• Re-tratamiento de conducto

✅ Implantología
• Implantes dentales
• Corona sobre implante

✅ Estética Dental
• Blanqueamiento dental
• Carillas de porcelana
• Diseño de sonrisa

✅ Cirugía Oral
• Extracciones simples y complejas
• Cirugía de cordales

✅ Odontopediatría
• Atención especializada para niños

📞 Para más información: 302-529-5978
📧 Email: info@clinikdent.com`,
            accion: 'mostrar_servicios'
        };
    }

    // OPCIÓN 5: SOPORTE
    if (mensajeLower.match(/^5$|soporte|ayuda|asesor|hablar|problema|queja/)) {
        return {
            texto: `💬 *Soporte al Cliente*

Estamos aquí para ayudarte. Por favor describe tu consulta, queja o sugerencia y un asesor te contactará pronto.

También puedes comunicarte directamente:
📞 Teléfono: 302-529-5978
📧 Email: info@clinikdent.com
📍 Dirección: [Tu dirección]

Horario de atención:
🕐 Lunes a Viernes: 8:00 AM - 6:00 PM
🕐 Sábados: 9:00 AM - 1:00 PM`,
            accion: 'soporte'
        };
    }

    // HORARIOS
    if (mensajeLower.includes('horario') || mensajeLower.includes('hora')) {
        return {
            texto: `🕐 *Horarios de Atención*

📅 Lunes a Viernes: 8:00 AM - 6:00 PM
📅 Sábados: 9:00 AM - 1:00 PM
📅 Domingos y festivos: Cerrado

Para agendar cita, escribe "2" o "CITA"`,
            accion: 'horarios'
        };
    }

    // UBICACIÓN
    if (mensajeLower.includes('ubicacion') || mensajeLower.includes('direccion') || mensajeLower.includes('donde')) {
        return {
            texto: `📍 *Ubicación*

Nos encontramos en:
[Tu dirección completa aquí]

📞 Teléfono: 302-529-5978
📧 Email: info@clinikdent.com

Puedes llegar en:
🚌 Transporte público: [Rutas]
🚗 Parqueadero disponible

¿Necesitas ayuda para llegar? Escríbenos.`,
            accion: 'ubicacion'
        };
    }

    // RESPUESTA GENÉRICA
    return {
        texto: `Gracias por tu mensaje. 

Para ayudarte mejor, escribe:
• "MENU" para ver todas las opciones
• "CITA" para agendar
• "SERVICIOS" para conocer nuestros tratamientos
• "SOPORTE" para hablar con un asesor

O llámanos al 📞 302-529-5978`,
        accion: 'respuesta_generica'
    };
}

/**
 * Endpoint principal CON IA (Llama 3.2)
 * Responde naturalmente y detecta intenciones automáticamente
 */
async function recibirMensaje(req, res) {
    try {
        const { telefono, nombre, mensaje } = req.body;

        console.log('📱 [WhatsApp Bot IA] Mensaje recibido:', { telefono, nombre, mensaje: mensaje?.substring(0, 50) });

        // Validar datos requeridos
        if (!telefono || !mensaje) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos requeridos (telefono, mensaje)'
            });
        }

        // 1. Registrar contacto en base de datos
        const queryContacto = `
            INSERT INTO contactos_whatsapp (telefono, nombre_contacto, ultimo_mensaje, mensaje_inicial, contador_mensajes, updated_at)
            VALUES ($1, $2, $3, $4, 1, NOW())
            ON CONFLICT (telefono) 
            DO UPDATE SET 
                ultimo_mensaje = $3,
                contador_mensajes = contactos_whatsapp.contador_mensajes + 1,
                updated_at = NOW()
            RETURNING id
        `;

        const resultContacto = await db.secureQuery(queryContacto, [
            telefono,
            nombre || 'Usuario WhatsApp',
            mensaje,
            mensaje
        ]);

        console.log('✅ Contacto registrado/actualizado, ID:', resultContacto.rows[0].id);

        // 2. Primero intentar respuesta rápida (para saludos simples)
        const respuestaRapida = llamaService.respuestaRapida(mensaje);
        if (respuestaRapida) {
            console.log('⚡ Respuesta rápida sin IA:', respuestaRapida.substring(0, 80));
            return res.json({
                success: true,
                respuesta: respuestaRapida,
                tipo: 'rapida',
                telefono: telefono,
                contacto_id: resultContacto.rows[0].id
            });
        }

        // 3. Si no hay respuesta rápida, usar IA (Llama 3.2)
        console.log('🤖 Usando Llama 3.2 para generar respuesta...');
        const resultado = await llamaService.analizarMensaje(mensaje, {
            telefono,
            nombre
        });

        console.log('✅ IA respondió:', {
            intencion: resultado.intencion,
            confianza: resultado.confianza,
            respuesta: resultado.respuesta.substring(0, 80) + '...'
        });

        // 4. Si detecta intención de agendar cita con datos completos, guardar
        if (resultado.intencion === 'agendar_cita' && 
            resultado.datosExtraidos && 
            !resultado.requiereMasInfo &&
            resultado.datosExtraidos.esperandoConfirmacion !== true) {
            
            const { cedula, servicio, fechaTexto } = resultado.datosExtraidos;
            
            console.log('📅 Intención de cita detectada:', { cedula, servicio, fechaTexto });

            // Registrar en tabla PQR para seguimiento
            await db.secureQuery(`
                INSERT INTO pqr_soporte (telefono, nombre_contacto, tipo, mensaje, estado)
                VALUES ($1, $2, 'consulta', $3, 'pendiente')
            `, [
                telefono, 
                nombre || resultado.datosExtraidos.nombre || 'Usuario',
                `Solicitud de cita: ${servicio || 'Servicio a definir'} - ${fechaTexto || 'Fecha a coordinar'}`
            ]);

            console.log('✅ Solicitud de cita guardada en PQR');
        }

        // 5. Retornar respuesta de la IA
        return res.json({
            success: true,
            respuesta: resultado.respuesta,
            intencion: resultado.intencion,
            confianza: resultado.confianza,
            tipo: 'ia',
            telefono: telefono,
            contacto_id: resultContacto.rows[0].id,
            datos_extraidos: resultado.datosExtraidos || null
        });

    } catch (error) {
        console.error('❌ Error procesando mensaje con IA:', error);
        console.error('❌ Stack completo:', error.stack);
        console.error('❌ Tipo de error:', error.constructor.name);
        
        // Fallback: usar respuestas por palabras clave si la IA falla
        try {
            const respuestaFallback = generarRespuestaAutomatica(req.body.mensaje || '');
            console.log('⚠️ Usando respuesta fallback (sin IA)');
            console.log('⚠️ Razón del fallback:', error.message);
            
            return res.status(200).json({
                success: true,
                respuesta: respuestaFallback.texto,
                tipo: 'fallback',
                nota: 'IA temporalmente no disponible',
                debug_error: error.message
            });
        } catch (fallbackError) {
            console.error('❌ Error en fallback también:', fallbackError);
            return res.status(500).json({
                success: false,
                error: 'Error procesando mensaje',
                respuesta: 'Disculpa, tengo problemas técnicos. Por favor llama al 302-529-5978'
            });
        }
    }
}

/**
 * Webhook para registrar nuevo contacto
 */
async function registrarContacto(req, res) {
    try {
        const { telefono, nombre, mensaje } = req.body;

        const query = `
            INSERT INTO contactos_whatsapp (telefono, nombre_contacto, mensaje_inicial)
            VALUES ($1, $2, $3)
            ON CONFLICT (telefono) 
            DO UPDATE SET contador_mensajes = contactos_whatsapp.contador_mensajes + 1
            RETURNING *
        `;

        const result = await db.secureQuery(query, [telefono, nombre, mensaje]);

        return res.json({
            success: true,
            contacto: result.rows[0],
            respuesta: generarRespuestaAutomatica(mensaje || 'hola').texto
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    recibirMensaje,
    registrarContacto,
    generarRespuestaAutomatica
};
