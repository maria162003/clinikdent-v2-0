/**
 * Configuración automática completa de BotSailor
 * Este script crea el flujo completo del bot de WhatsApp usando la API de BotSailor
 */

const axios = require('axios');

// CONFIGURACIÓN - REEMPLAZA CON TUS DATOS DE BOTSAILOR
const BOTSAILOR_CONFIG = {
    apiKey: 'TU_API_KEY_DE_BOTSAILOR', // Obtener de BotSailor > Settings > API
    pageId: 'TU_PAGE_ID', // ID de tu página de WhatsApp en BotSailor
    baseUrl: 'https://api.botsailor.com/v1'
};

const WEBHOOK_BASE_URL = 'https://francisco-gruffiest-unpatiently.ngrok-free.app/api/whatsapp';

// Cliente API de BotSailor
const botsailorAPI = axios.create({
    baseURL: BOTSAILOR_CONFIG.baseUrl,
    headers: {
        'Authorization': `Bearer ${BOTSAILOR_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
    }
});

async function crearCamposPersonalizados() {
    console.log('📋 Creando campos personalizados...');
    
    const campos = [
        { name: 'nombre_paciente', type: 'text', label: 'Nombre del Paciente' },
        { name: 'cedula', type: 'text', label: 'Cédula' },
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'telefono', type: 'text', label: 'Teléfono' },
        { name: 'fecha_nacimiento', type: 'text', label: 'Fecha de Nacimiento' },
        { name: 'direccion', type: 'text', label: 'Dirección' },
        { name: 'fecha_cita', type: 'text', label: 'Fecha de Cita' },
        { name: 'hora_cita', type: 'text', label: 'Hora de Cita' },
        { name: 'servicio', type: 'text', label: 'Servicio Solicitado' },
        { name: 'mensaje_soporte', type: 'text', label: 'Mensaje de Soporte' }
    ];

    for (const campo of campos) {
        try {
            await botsailorAPI.post('/custom-fields', {
                page_id: BOTSAILOR_CONFIG.pageId,
                ...campo
            });
            console.log(`✅ Campo creado: ${campo.name}`);
        } catch (error) {
            console.log(`⚠️ Campo ${campo.name} ya existe o error: ${error.message}`);
        }
    }
}

async function crearWebhooks() {
    console.log('\n🔗 Configurando webhooks...');
    
    const webhooks = [
        {
            name: 'Nuevo Contacto WhatsApp',
            url: `${WEBHOOK_BASE_URL}/nuevo-contacto`,
            trigger: 'user_message',
            method: 'POST'
        },
        {
            name: 'Registrar Paciente',
            url: `${WEBHOOK_BASE_URL}/registrar-paciente`,
            trigger: 'custom',
            method: 'POST'
        },
        {
            name: 'Agendar Cita',
            url: `${WEBHOOK_BASE_URL}/agendar-cita`,
            trigger: 'custom',
            method: 'POST'
        },
        {
            name: 'Consultar Citas',
            url: `${WEBHOOK_BASE_URL}/consultar-citas`,
            trigger: 'custom',
            method: 'POST'
        },
        {
            name: 'Soporte PQR',
            url: `${WEBHOOK_BASE_URL}/pqr`,
            trigger: 'custom',
            method: 'POST'
        }
    ];

    for (const webhook of webhooks) {
        try {
            await botsailorAPI.post('/webhooks', {
                page_id: BOTSAILOR_CONFIG.pageId,
                ...webhook
            });
            console.log(`✅ Webhook creado: ${webhook.name}`);
        } catch (error) {
            console.log(`⚠️ Webhook ${webhook.name} error: ${error.message}`);
        }
    }
}

async function crearFlujoCompleto() {
    console.log('\n🤖 Creando flujo del bot...');
    
    // Flujo completo en formato JSON de BotSailor
    const flujo = {
        page_id: BOTSAILOR_CONFIG.pageId,
        name: 'Clinikdent - Asistente WhatsApp',
        description: 'Flujo completo para gestión de pacientes y citas',
        nodes: [
            // NODO 1: Mensaje de Bienvenida
            {
                id: 'welcome',
                type: 'message',
                content: {
                    text: '¡Bienvenido a Clinikdent! 🦷\n\nSoy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
                    buttons: [
                        { id: 'btn_registro', text: '📋 Registrarme', next_node: 'registro_inicio' },
                        { id: 'btn_cita', text: '📅 Agendar Cita', next_node: 'agendar_inicio' },
                        { id: 'btn_consultar', text: '🔍 Mis Citas', next_node: 'consultar_inicio' },
                        { id: 'btn_soporte', text: '💬 Soporte', next_node: 'soporte_inicio' }
                    ]
                },
                webhook: {
                    url: `${WEBHOOK_BASE_URL}/nuevo-contacto`,
                    method: 'POST',
                    body: {
                        telefono: '{{phone}}',
                        nombre: '{{name}}',
                        mensaje: '{{message}}'
                    }
                }
            },

            // NODO 2: Inicio de Registro
            {
                id: 'registro_inicio',
                type: 'message',
                content: {
                    text: '📋 *Registro de Paciente*\n\nPor favor, indícame tu nombre completo:'
                },
                next_node: 'registro_nombre'
            },

            // NODO 3: Capturar Nombre
            {
                id: 'registro_nombre',
                type: 'user_input',
                save_to: 'nombre_paciente',
                next_node: 'registro_cedula',
                validation: { required: true }
            },

            // NODO 4: Capturar Cédula
            {
                id: 'registro_cedula',
                type: 'message',
                content: { text: 'Perfecto {{nombre_paciente}}, ahora tu número de cédula:' },
                next_node: 'registro_cedula_input'
            },
            {
                id: 'registro_cedula_input',
                type: 'user_input',
                save_to: 'cedula',
                next_node: 'registro_email',
                validation: { required: true, type: 'number' }
            },

            // NODO 5: Capturar Email
            {
                id: 'registro_email',
                type: 'message',
                content: { text: 'Ahora tu correo electrónico:' },
                next_node: 'registro_email_input'
            },
            {
                id: 'registro_email_input',
                type: 'user_input',
                save_to: 'email',
                next_node: 'registro_fecha_nacimiento',
                validation: { required: true, type: 'email' }
            },

            // NODO 6: Capturar Fecha de Nacimiento
            {
                id: 'registro_fecha_nacimiento',
                type: 'message',
                content: { text: 'Tu fecha de nacimiento (DD/MM/AAAA):' },
                next_node: 'registro_fecha_input'
            },
            {
                id: 'registro_fecha_input',
                type: 'user_input',
                save_to: 'fecha_nacimiento',
                next_node: 'registro_direccion',
                validation: { required: true }
            },

            // NODO 7: Capturar Dirección
            {
                id: 'registro_direccion',
                type: 'message',
                content: { text: 'Por último, tu dirección completa:' },
                next_node: 'registro_direccion_input'
            },
            {
                id: 'registro_direccion_input',
                type: 'user_input',
                save_to: 'direccion',
                next_node: 'registro_webhook',
                validation: { required: true }
            },

            // NODO 8: Enviar datos al webhook
            {
                id: 'registro_webhook',
                type: 'webhook',
                webhook: {
                    url: `${WEBHOOK_BASE_URL}/registrar-paciente`,
                    method: 'POST',
                    body: {
                        nombre: '{{nombre_paciente}}',
                        cedula: '{{cedula}}',
                        email: '{{email}}',
                        telefono: '{{phone}}',
                        fecha_nacimiento: '{{fecha_nacimiento}}',
                        direccion: '{{direccion}}'
                    }
                },
                next_node: 'registro_confirmacion'
            },

            // NODO 9: Confirmación de Registro
            {
                id: 'registro_confirmacion',
                type: 'message',
                content: {
                    text: '✅ ¡Registro exitoso!\n\nYa estás registrado en Clinikdent.\n\n¿Deseas agendar una cita ahora?',
                    buttons: [
                        { id: 'btn_si_cita', text: 'Sí, agendar cita', next_node: 'agendar_inicio' },
                        { id: 'btn_menu', text: 'Volver al menú', next_node: 'welcome' }
                    ]
                }
            },

            // FLUJO DE AGENDAR CITA
            {
                id: 'agendar_inicio',
                type: 'message',
                content: {
                    text: '📅 *Agendar Cita*\n\n¿Para cuál servicio deseas agendar?',
                    buttons: [
                        { id: 'srv_limpieza', text: 'Limpieza dental', value: 'limpieza' },
                        { id: 'srv_ortodoncia', text: 'Ortodoncia', value: 'ortodoncia' },
                        { id: 'srv_endodoncia', text: 'Endodoncia', value: 'endodoncia' },
                        { id: 'srv_implante', text: 'Implantes', value: 'implantes' },
                        { id: 'srv_otro', text: 'Otro servicio', value: 'otro' }
                    ]
                },
                next_node: 'agendar_servicio_input'
            },
            {
                id: 'agendar_servicio_input',
                type: 'button_response',
                save_to: 'servicio',
                next_node: 'agendar_fecha'
            },

            // Capturar fecha
            {
                id: 'agendar_fecha',
                type: 'message',
                content: { text: 'Perfecto. ¿Qué fecha prefieres? (DD/MM/AAAA)' },
                next_node: 'agendar_fecha_input'
            },
            {
                id: 'agendar_fecha_input',
                type: 'user_input',
                save_to: 'fecha_cita',
                next_node: 'agendar_hora',
                validation: { required: true }
            },

            // Capturar hora
            {
                id: 'agendar_hora',
                type: 'message',
                content: {
                    text: '¿En qué horario prefieres?',
                    buttons: [
                        { id: 'h_08', text: '8:00 AM', value: '08:00' },
                        { id: 'h_10', text: '10:00 AM', value: '10:00' },
                        { id: 'h_14', text: '2:00 PM', value: '14:00' },
                        { id: 'h_16', text: '4:00 PM', value: '16:00' }
                    ]
                },
                next_node: 'agendar_hora_input'
            },
            {
                id: 'agendar_hora_input',
                type: 'button_response',
                save_to: 'hora_cita',
                next_node: 'agendar_cedula'
            },

            // Pedir cédula para buscar paciente
            {
                id: 'agendar_cedula',
                type: 'message',
                content: { text: 'Por último, tu número de cédula para confirmar:' },
                next_node: 'agendar_cedula_input'
            },
            {
                id: 'agendar_cedula_input',
                type: 'user_input',
                save_to: 'cedula',
                next_node: 'agendar_webhook',
                validation: { required: true }
            },

            // Enviar al webhook
            {
                id: 'agendar_webhook',
                type: 'webhook',
                webhook: {
                    url: `${WEBHOOK_BASE_URL}/agendar-cita`,
                    method: 'POST',
                    body: {
                        cedula: '{{cedula}}',
                        telefono: '{{phone}}',
                        servicio: '{{servicio}}',
                        fecha: '{{fecha_cita}}',
                        hora: '{{hora_cita}}'
                    }
                },
                next_node: 'agendar_confirmacion'
            },

            // Confirmación
            {
                id: 'agendar_confirmacion',
                type: 'message',
                content: {
                    text: '✅ *Cita Agendada*\n\n📋 Servicio: {{servicio}}\n📅 Fecha: {{fecha_cita}}\n🕐 Hora: {{hora_cita}}\n\nRecibirás un recordatorio 24h antes.',
                    buttons: [
                        { id: 'btn_menu2', text: 'Volver al menú', next_node: 'welcome' }
                    ]
                }
            },

            // FLUJO DE CONSULTAR CITAS
            {
                id: 'consultar_inicio',
                type: 'message',
                content: { text: '🔍 *Consultar Citas*\n\nIndícame tu cédula:' },
                next_node: 'consultar_cedula_input'
            },
            {
                id: 'consultar_cedula_input',
                type: 'user_input',
                save_to: 'cedula',
                next_node: 'consultar_webhook',
                validation: { required: true }
            },
            {
                id: 'consultar_webhook',
                type: 'webhook',
                webhook: {
                    url: `${WEBHOOK_BASE_URL}/consultar-citas`,
                    method: 'POST',
                    body: {
                        cedula: '{{cedula}}',
                        telefono: '{{phone}}'
                    }
                },
                next_node: 'consultar_resultado'
            },
            {
                id: 'consultar_resultado',
                type: 'message',
                content: {
                    text: '{{webhook_response}}',
                    buttons: [
                        { id: 'btn_menu3', text: 'Volver al menú', next_node: 'welcome' }
                    ]
                }
            },

            // FLUJO DE SOPORTE
            {
                id: 'soporte_inicio',
                type: 'message',
                content: {
                    text: '💬 *Soporte*\n\n¿Con qué necesitas ayuda?',
                    buttons: [
                        { id: 'sop_consulta', text: 'Consulta general', value: 'consulta' },
                        { id: 'sop_queja', text: 'Queja', value: 'queja' },
                        { id: 'sop_reclamo', text: 'Reclamo', value: 'reclamo' },
                        { id: 'sop_sugerencia', text: 'Sugerencia', value: 'sugerencia' }
                    ]
                },
                next_node: 'soporte_tipo_input'
            },
            {
                id: 'soporte_tipo_input',
                type: 'button_response',
                save_to: 'tipo_soporte',
                next_node: 'soporte_mensaje'
            },
            {
                id: 'soporte_mensaje',
                type: 'message',
                content: { text: 'Por favor describe tu {{tipo_soporte}}:' },
                next_node: 'soporte_mensaje_input'
            },
            {
                id: 'soporte_mensaje_input',
                type: 'user_input',
                save_to: 'mensaje_soporte',
                next_node: 'soporte_webhook',
                validation: { required: true }
            },
            {
                id: 'soporte_webhook',
                type: 'webhook',
                webhook: {
                    url: `${WEBHOOK_BASE_URL}/pqr`,
                    method: 'POST',
                    body: {
                        telefono: '{{phone}}',
                        nombre: '{{name}}',
                        tipo: '{{tipo_soporte}}',
                        mensaje: '{{mensaje_soporte}}'
                    }
                },
                next_node: 'soporte_confirmacion'
            },
            {
                id: 'soporte_confirmacion',
                type: 'message',
                content: {
                    text: '✅ Tu {{tipo_soporte}} ha sido registrada.\n\nNuestro equipo te contactará pronto.',
                    buttons: [
                        { id: 'btn_menu4', text: 'Volver al menú', next_node: 'welcome' }
                    ]
                }
            }
        ],
        entry_node: 'welcome'
    };

    try {
        const response = await botsailorAPI.post('/flows', flujo);
        console.log('✅ Flujo completo creado:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error creando flujo:', error.response?.data || error.message);
        throw error;
    }
}

async function configurarTodo() {
    console.log('🚀 INICIANDO CONFIGURACIÓN AUTOMÁTICA DE BOTSAILOR\n');
    
    try {
        await crearCamposPersonalizados();
        await crearWebhooks();
        await crearFlujoCompleto();
        
        console.log('\n✅ ¡CONFIGURACIÓN COMPLETA!');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Ve a BotSailor y activa el flujo');
        console.log('2. Prueba enviando un mensaje a tu número de WhatsApp');
        console.log('3. El bot debe responder automáticamente');
        
    } catch (error) {
        console.error('\n❌ Error en la configuración:', error.message);
        process.exit(1);
    }
}

// EJECUCIÓN
configurarTodo();
