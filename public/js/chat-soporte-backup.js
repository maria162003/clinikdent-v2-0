// Chat de Soporte con Bot Inteligente
class ChatSoporte {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.sessionId = null; // Se generará cuando sea necesario
        this.responses = this.getResponses();
        
        // Verificar si los elementos ya existen
        this.initializeChatElements();
        this.setupEventListeners();
        
        // Mensaje de bienvenida
        setTimeout(() => {
            this.addBotMessage("¡Hola! 👋 Bienvenido a Clinik Dent. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?");
        }, 1000);
    }

    initializeChatElements() {
        // Los elementos ya existen en el HTML, solo necesitamos verificar
        const floatButton = document.getElementById('chatFloatButton');
        const chatWindow = document.getElementById('chatWindow');
        
        if (!floatButton || !chatWindow) {
            console.error('❌ Elementos del chat no encontrados en el DOM');
            return;
        }
        
        console.log('✅ Elementos del chat encontrados y listos');
    }

    setupEventListeners() {
        // Manejar cambios de tamaño de ventana
        window.addEventListener('resize', () => {
            if (this.isOpen && window.innerWidth <= 768) {
                document.body.classList.add('chat-open');
            } else {
                document.body.classList.remove('chat-open');
            }
        });

        // Evento de click fuera del chat (solo en desktop)
        document.addEventListener('click', (e) => {
            const chatWindow = document.getElementById('chatWindow');
            const chatButton = document.getElementById('chatFloatButton');
            
            // En móviles no cerrar automáticamente al hacer click fuera
            if (this.isOpen && window.innerWidth > 768 && 
                !chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
                // Opcionalmente cerrar en desktop
                // this.closeChat();
            }
        });

        // Event listeners para el chat
        const floatButton = document.getElementById('chatFloatButton');
        const closeButton = document.getElementById('chatClose');
        const sendButton = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');

        if (floatButton) {
            floatButton.addEventListener('click', () => this.toggleChat());
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeChat());
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSendMessage();
                }
            });
        }

        // Event listeners para opciones rápidas
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-option')) {
                const message = e.target.textContent;
                this.sendMessage(message);
            }
        });
    }

    getResponses() {
        // Asignar botResponses como propiedad de la clase
        this.botResponses = {
            // Saludos
            saludos: [
                "hola", "buenas", "buenos días", "buenas tardes", "buenas noches",
                "hi", "hello", "hey", "saludos"
            ],
            
            // Servicios
            servicios: [
                "servicios", "tratamientos", "que ofrecen", "especialidades",
                "limpiezas", "blanqueamiento", "ortodoncia", "implantes"
            ],
            
            // Horarios
            horarios: [
                "horarios", "horario", "abren", "cierran", "atienden",
                "hora", "cuando", "abierto"
            ],
            
            // Citas
            citas: [
                "cita", "citas", "agendar", "reservar", "turno", "consulta",
                "appointment", "programar"
            ],
            
            // Ubicación
            ubicacion: [
                "ubicación", "dirección", "donde", "encuentran", "sede",
                "sedes", "ubicado", "address"
            ],
            
            // Precios
            precios: [
                "precio", "precios", "costo", "costos", "cuanto", "tarifa",
                "value", "cost"
            ],
            
            // Contacto
            contacto: [
                "contacto", "teléfono", "telefono", "email", "correo",
                "whatsapp", "contact"
            ],
            
            // Emergencias
            emergencia: [
                "emergencia", "urgencia", "dolor", "duele", "sangra", "hinchado",
                "inflamado", "roto", "quebrado", "fracturado", "golpe", "accidente",
                "emergency", "urgent", "pain"
            ]
        };
        
        this.responses = {
            saludo: [
                "¡Hola! 😊 Bienvenido a Clinik Dent. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
                "¡Hola! 👋 Me da mucho gusto saludarte. Soy el bot de Clinik Dent, ¿cómo puedo asistirte?",
                "¡Buenos días! ☀️ Gracias por contactar a Clinik Dent. ¿En qué puedo ayudarte?"
            ],
            
            servicios: [
                "En Clinik Dent ofrecemos estos servicios:\n\n🦷 **Odontología General**\n• Consultas y diagnósticos\n• Tratamientos preventivos\n• Obturaciones (resinas)\n\n🔬 **Endodoncia**\n• Tratamientos de conducto\n• Pulpotomías\n\n✨ **Estética Dental**\n• Blanqueamiento profesional\n• Carillas de porcelana\n• Diseño de sonrisa\n\n🔧 **Ortodoncia**\n• Brackets tradicionales\n• Ortodoncia invisible\n• Retenedores\n\n🦴 **Implantología**\n• Implantes dentales\n• Coronas sobre implantes\n• Rehabilitación oral\n\n🧽 **Periodoncia**\n• Limpiezas profundas\n• Tratamiento de encías\n\n¿Te interesa información específica sobre algún tratamiento?",
                "Nuestros principales servicios incluyen:\n\n**🏥 Servicios Preventivos:**\n• Limpiezas dentales\n• Aplicación de flúor\n• Sellantes de fosas y fisuras\n\n**🔧 Servicios Restaurativos:**\n• Obturaciones estéticas\n• Coronas y puentes\n• Prótesis dentales\n\n**✨ Servicios Estéticos:**\n• Blanqueamiento dental\n• Carillas\n• Contorneado dental\n\n**🦴 Servicios Especializados:**\n• Cirugía oral\n• Implantes dentales\n• Tratamientos de conducto\n\n¿Sobre cuál te gustaría saber más detalles y precios?"
            ],
            
            horarios: [
                "Nuestros horarios de atención son:\n\n📅 **Lunes a Viernes:** 8:00 AM - 6:00 PM\n📅 **Sábados:** 9:00 AM - 2:00 PM\n📅 **Domingos:** Cerrado\n\n🚨 **Emergencias:** Contamos con servicio de urgencias 24/7\n📱 WhatsApp: (555) 999-8888 (solo emergencias)\n\n¿Te gustaría agendar una cita en alguno de estos horarios? 😊",
                "Horarios de todas nuestras sedes:\n\n**🏢 Sede Centro:**\n🕘 L-V: 8:00 AM - 6:00 PM\n🕘 Sáb: 9:00 AM - 2:00 PM\n\n**🏢 Sede Norte:**\n🕘 L-V: 9:00 AM - 7:00 PM\n🕘 Sáb: 8:00 AM - 1:00 PM\n\n**🏢 Sede Plaza:**\n🕘 L-V: 7:00 AM - 5:00 PM\n🕘 Sáb: 10:00 AM - 3:00 PM\n\n💡 **Tip:** Los sábados por la mañana hay menos espera."
            ],
            
            citas: [
                "¡Perfecto! 📅 Para agendar tu cita tienes varias opciones:\n\n**🌐 En línea:** \n• Regístrate en nuestra página web\n• Selecciona el servicio que necesitas\n• Elige fecha, hora y sede de tu preferencia\n• ¡Confirma y listo!\n\n**📞 Por teléfono:**\n• Sede Centro: (555) 123-4567\n• Sede Norte: (555) 234-5678\n• Sede Plaza: (555) 345-6789\n\n**📱 WhatsApp:** (555) 999-7777\n\n**🏥 Presencial:** Visita cualquiera de nuestras sedes\n\n¿Qué tipo de consulta necesitas? Te puedo ayudar a elegir el especialista adecuado.",
                "Agendar una cita es súper fácil:\n\n**📋 ¿Qué necesitas?**\n1️⃣ Consulta general\n2️⃣ Limpieza dental\n3️⃣ Urgencia o dolor\n4️⃣ Consulta especializada\n5️⃣ Control post-tratamiento\n\n**⏰ Horarios disponibles:**\n• Mañanas: 8:00 AM - 12:00 PM\n• Tardes: 2:00 PM - 6:00 PM\n• Sábados: 9:00 AM - 2:00 PM\n\n**💳 Formas de pago:**\n• Efectivo, tarjetas débito/crédito\n• Planes de financiamiento\n• Seguros médicos\n\n¿Para cuándo necesitas la cita?"
            ],
            
            ubicacion: [
                "Nos encontramos en 3 sedes estratégicas:\n\n**🏢 Sede Centro** (Principal)\n📍 Calle Principal #123, Centro\n🅿️ Parqueadero gratuito\n� Transporte público: Rutas 15, 23, 40\n📞 (555) 123-4567\n\n**🏢 Sede Norte**\n�📍 Av. Salud #456, Norte\n🅿️ Parqueadero cubierto\n� Metro: Estación Salud (2 cuadras)\n📞 (555) 234-5678\n\n**🏢 Sede Plaza**\n�📍 Plaza Dental, Local 789\n🛍️ Dentro del centro comercial\n🅿️ Parqueadero del centro comercial\n📞 (555) 345-6789\n\n¿Cuál te queda más cerca? Te puedo dar indicaciones específicas.",
                "**📍 Nuestras ubicaciones:**\n\n**Sede Centro** - La más completa\n• Todos los servicios disponibles\n• Laboratorio propio\n• Rayos X digitales\n• Fácil acceso en transporte público\n\n**Sede Norte** - La más moderna\n• Equipos de última generación\n• Salas de cirugía especializadas\n• Ambiente familiar\n• Amplio parqueadero\n\n**Sede Plaza** - La más conveniente\n• Horarios extendidos\n• Servicios express\n• Zona comercial\n• Fácil parqueo\n\n¿Te gustaría conocer los servicios específicos de cada sede?"
            ],
            
            precios: [
                "Nuestros precios son competitivos y accesibles:\n\n**💰 Servicios Básicos:**\n• Consulta General: $50,000\n• Limpieza Dental: $80,000\n• Obturación (resina): $120,000\n• Extracción simple: $100,000\n\n**💰 Servicios Especializados:**\n• Blanqueamiento: $300,000\n• Endodoncia: $450,000 - $650,000\n• Corona porcelana: $800,000\n• Implante dental: $1,800,000\n\n**💰 Ortodoncia:**\n• Brackets tradicionales: Desde $1,200,000\n• Ortodoncia invisible: Desde $2,500,000\n\n**💳 Financiación:**\n• Hasta 12 meses sin intereses\n• Planes personalizados\n• Descuentos por pronto pago\n\n¿Qué tratamiento te interesa para darte una cotización exacta?",
                "**💎 Planes y Promociones Disponibles:**\n\n**🎯 Plan Preventivo** ($150,000/año)\n• 2 limpiezas dentales\n• 2 consultas de control\n• Rayos X incluidos\n• 20% descuento en tratamientos\n\n**👨‍👩‍👧‍👦 Plan Familiar** (Desde $400,000/año)\n• Cobertura hasta 5 personas\n• Servicios preventivos incluidos\n• Urgencias 24/7\n• Descuentos especiales\n\n**✨ Promociones Vigentes:**\n• Blanqueamiento + Limpieza: $350,000\n• Primera consulta GRATIS\n• 15% descuento estudiantes\n\n¿Te interesa algún plan específico?"
            ],
            
            contacto: [
                "**📞 Contáctanos por múltiples canales:**\n\n**☎️ Teléfonos por sede:**\n• Centro: (555) 123-4567\n• Norte: (555) 234-5678\n• Plaza: (555) 345-6789\n\n**📧 Correos electrónicos:**\n• General: info@clinikdent.com\n• Citas: citas@clinikdent.com\n• Emergencias: urgencias@clinikdent.com\n\n**📱 Redes sociales:**\n• WhatsApp: (555) 999-7777\n• Instagram: @clinikdent_oficial\n• Facebook: Clinik Dent Colombia\n\n**🌐 Web:** www.clinikdent.com\n\n**⏰ Horario de atención telefónica:**\nL-V: 7:00 AM - 7:00 PM | Sáb: 8:00 AM - 3:00 PM\n\n¿Por cuál canal prefieres que te contactemos?",
                "**🤝 Estamos aquí para ayudarte:**\n\n**📞 Línea directa:** (555) 100-DENT\n**📱 WhatsApp Business:** (555) 999-7777\n• Respuesta inmediata\n• Envío de documentos\n• Recordatorios de citas\n\n**💬 Chat en vivo:** Disponible en nuestra web\n**📧 Email 24/7:** info@clinikdent.com\n\n**🏥 Visítanos:**\nNuestras 3 sedes te reciben con cita previa o por llegada\n\n**🚨 Emergencias:**\n• 24 horas: (555) 911-DENT\n• WhatsApp urgencias: (555) 999-8888\n\n¿Necesitas contacto inmediato o puedes agendar una cita?"
            ],
            
            emergencia: [
                "🚨 **EMERGENCIAS DENTALES** 🚨\n\n**📞 Llama inmediatamente:**\n• Línea de urgencias: (555) 911-DENT\n• WhatsApp emergencias: (555) 999-8888\n\n**🏥 Atención inmediata para:**\n• Dolor dental severo\n• Traumatismos dentales\n• Sangrado que no para\n• Infecciones faciales\n• Dientes fracturados o avulsionados\n\n**⏰ Disponible 24/7**\n• Dentista de guardia siempre disponible\n• Atención en sede Centro\n• Medicamentos de emergencia\n\n**💡 Mientras llegas:**\n• Aplica frío en la zona (por fuera)\n• No uses calor\n• Puedes tomar analgésicos comunes\n• Mantén la calma\n\n¿Es una emergencia lo que tienes ahora?"
            ],
            
            default: [
                "Hmm, no estoy seguro de cómo ayudarte con eso específicamente. 🤔\n\n**¿Te refieres a alguno de estos temas?**\n\n🦷 **'servicios'** → Tratamientos disponibles\n📅 **'citas'** → Agendar consulta\n🕐 **'horarios'** → Horarios de atención\n📍 **'ubicación'** → Nuestras sedes\n💰 **'precios'** → Costos y financiación\n📞 **'contacto'** → Información de contacto\n🚨 **'emergencia'** → Urgencias dentales\n\n**O puedes preguntarme sobre:**\n• Tipos de tratamientos\n• Preparación para citas\n• Cuidados post-tratamiento\n• Seguros médicos\n• Promociones vigentes\n\n¿En qué específicamente te puedo ayudar?",
                "¡Ups! No pude entender exactamente qué necesitas. 😅\n\n**Soy experto en estos temas:**\n\n🎯 **Servicios dentales** → limpiezas, blanqueamiento, ortodoncia\n📋 **Proceso de citas** → cómo agendar, qué llevar, preparación\n🏥 **Nuestras sedes** → ubicaciones, horarios, servicios\n💳 **Costos y pagos** → precios, financiación, seguros\n📞 **Contacto** → teléfonos, WhatsApp, emergencias\n\n**💬 Consejos para mejor ayuda:**\n• Sé específico con tu pregunta\n• Usa palabras clave como las de arriba\n• Si tienes dolor, dime '🚨emergencia'\n\n¿Puedes contarme más detalles sobre lo que necesitas?"
            ]
        };
        
        // Retornar las respuestas para asignar a this.responses
        return {
            saludos: [
                "¡Hola! 😊 Bienvenido a Clinik Dent. Soy tu asistente virtual especializado en salud dental. ¿En qué puedo ayudarte hoy?",
                "¡Qué gusto saludarte! 🦷 Estoy aquí para resolver todas tus dudas sobre nuestros servicios dentales. ¿Hay algo específico que te interese?"
            ],
            
            servicios: [
            return;
        }
        
        this.createChatElements();
        this.setupEventListeners();
        console.log('💬 Chat de soporte inicializado');
    }

    createChatElements() {
        // Crear botón flotante
        const floatButton = document.createElement('div');
        floatButton.className = 'chat-float-button';
        floatButton.id = 'chatFloatButton';
        floatButton.innerHTML = '<i class="fas fa-comments"></i>';
        
        // Crear ventana de chat
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.id = 'chatWindow';
        
        chatWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-info">
                    <div class="chat-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div>
                        <div class="chat-title">Asistente Clinik Dent</div>
                        <div class="chat-status">En línea</div>
                    </div>
                </div>
                <button class="chat-close" id="chatClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <!-- Mensajes aparecerán aquí -->
            </div>
            
            <div class="typing-indicator" id="typingIndicator">
                El asistente está escribiendo<span class="typing-dots">...</span>
            </div>
            
            <div class="quick-options" id="quickOptions">
                <div class="quick-option" data-message="Servicios">🦷 Servicios</div>
                <div class="quick-option" data-message="Agendar cita">📅 Citas</div>
                <div class="quick-option" data-message="Horarios">🕐 Horarios</div>
                <div class="quick-option" data-message="Ubicación">📍 Ubicación</div>
                <div class="quick-option" data-message="Precios">💰 Precios</div>
                <div class="quick-option" data-message="Emergencia" style="background: #dc3545; color: white; border-color: #dc3545;">🚨 Urgencia</div>
            </div>
            
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Escribe tu mensaje..." autocomplete="off">
                <button class="chat-send-btn" id="chatSendBtn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        
        // Agregar elementos al DOM
        document.body.appendChild(floatButton);
        document.body.appendChild(chatWindow);
    }

    setupEventListeners() {
        // Botón flotante
        document.getElementById('chatFloatButton').addEventListener('click', () => {
            this.toggleChat();
        });
        
        // Botón cerrar
        document.getElementById('chatClose').addEventListener('click', () => {
            this.closeChat();
        });
        
        // Input de mensaje
        const chatInput = document.getElementById('chatInput');
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Botón enviar
        document.getElementById('chatSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Opciones rápidas
        document.querySelectorAll('.quick-option').forEach(option => {
            option.addEventListener('click', () => {
                const message = option.dataset.message;
                this.sendMessage(message);
            });
        });
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            const chatWindow = document.getElementById('chatWindow');
            const chatButton = document.getElementById('chatFloatButton');
            
            if (this.isOpen && !chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
                // No cerrar automáticamente para mejor UX
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        const chatWindow = document.getElementById('chatWindow');
        const floatButton = document.getElementById('chatFloatButton');
        
        chatWindow.classList.add('show');
        floatButton.innerHTML = '<i class="fas fa-times"></i>';
        this.isOpen = true;
        
        // En móviles, prevenir scroll del body
        if (window.innerWidth <= 768) {
            document.body.classList.add('chat-open');
        }
        
        // Hacer scroll al último mensaje
        this.scrollToBottom();
        
        // Focus en input solo en desktop para evitar problemas de teclado en móviles
        if (window.innerWidth > 768) {
            setTimeout(() => {
                document.getElementById('chatInput').focus();
            }, 300);
        }
    }

    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        const floatButton = document.getElementById('chatFloatButton');
        
        chatWindow.classList.remove('show');
        floatButton.innerHTML = '<i class="fas fa-comments"></i>';
        this.isOpen = false;
        
        // Restaurar scroll del body
        document.body.classList.remove('chat-open');
    }

    handleSendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.sendMessage(message);
        }
    }

    sendMessage(customMessage = null) {
        const input = document.getElementById('chatInput');
        const message = customMessage || input.value.trim();
        
        if (!message) return;
        
        // Agregar mensaje del usuario
        this.addUserMessage(message);
        
        // Limpiar input si no es mensaje personalizado
        if (!customMessage) {
            input.value = '';
        }
        
        // Mostrar indicador de escritura
        this.showTyping();
        
        // Respuesta del bot después de un delay
        setTimeout(async () => {
            const response = this.getBotResponse(message);
            this.hideTyping();
            this.addBotMessage(response);
            
            // Guardar interacción en la base de datos
            await this.saveInteraction(message, response);
        }, 1000 + Math.random() * 1000);
    }

    async saveInteraction(userMessage, botResponse) {
        try {
            // Generar ID de sesión único si no existe
            if (!this.sessionId) {
                this.sessionId = this.generateSessionId();
            }

            const interactionData = {
                sesion_id: this.sessionId,
                mensaje_usuario: userMessage,
                respuesta_bot: botResponse,
                ip_address: await this.getClientIP()
            };

            const response = await fetch('/api/chat/bot/interaccion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(interactionData)
            });

            if (response.ok) {
                console.log('✅ Interacción guardada exitosamente');
            }
        } catch (error) {
            console.log('⚠️ No se pudo guardar la interacción:', error.message);
            // No mostrar error al usuario para no interrumpir la experiencia
        }
    }

    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    addUserMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-user';
        
        const currentTime = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${message}
                <div class="message-time">${currentTime}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-bot';
        
        const currentTime = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${message.replace(/\n/g, '<br>')}
                <div class="message-time">${currentTime}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Detectar intención
        for (const [category, keywords] of Object.entries(this.botResponses)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    const responses = this.responses[category] || this.responses.default;
                    return responses[Math.floor(Math.random() * responses.length)];
                }
            }
        }
        
        // Respuesta por defecto
        const defaultResponses = this.responses.default;
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    showTyping() {
        document.getElementById('typingIndicator').classList.add('show');
        this.scrollToBottom();
    }

    hideTyping() {
        document.getElementById('typingIndicator').classList.remove('show');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Variable global para controlar la inicialización
window.chatSoporteInitialized = window.chatSoporteInitialized || false;

// Función de inicialización única
function initializeChatSoporte() {
    if (window.chatSoporteInitialized) {
        console.log('💬 Chat ya inicializado globalmente');
        return;
    }
    
    // Solo inicializar en la página principal
    const isMainPage = window.location.pathname === '/' || 
                      window.location.pathname.includes('index.html') || 
                      window.location.pathname === '';
    
    if (isMainPage) {
        const chatInstance = new ChatSoporte();
        window.chatSoporteInstance = chatInstance; // Guardar referencia global
        window.chatSoporteInitialized = true;
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatSoporte);
} else {
    initializeChatSoporte();
}
