// Chat de Soporte con Bot Inteligente
class ChatSoporte {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.responses = this.getResponses();
        
        // Inicializar cuando DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    initializeChatElements() {
        // Verificar si los elementos ya existen, si no, crearlos
        let floatButton = document.getElementById('chatFloatButton');
        let chatWindow = document.getElementById('chatWindow');
        
        if (!floatButton || !chatWindow) {
            console.log('💬 Creando elementos del chat...');
            this.createChatElements();
        } else {
            console.log('✅ Elementos del chat encontrados y listos');
        }
    }

    setupEventListeners() {
        // Esperar a que los elementos estén creados
        setTimeout(() => {
            // Manejar cambios de tamaño de ventana
            window.addEventListener('resize', () => {
                if (this.isOpen && window.innerWidth <= 768) {
                    document.body.classList.add('chat-open');
                } else {
                    document.body.classList.remove('chat-open');
                }
            });

            // Event listeners para el chat
            const floatButton = document.getElementById('chatFloatButton');
            const closeButton = document.getElementById('chatClose');
            const sendButton = document.getElementById('chatSendBtn');
            const chatInput = document.getElementById('chatInput');

            if (floatButton) {
                floatButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleChat();
                });
            }

            if (closeButton) {
                closeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeChat();
                });
            }

            if (sendButton) {
                sendButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleSendMessage();
                });
            }

            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleSendMessage();
                    }
                });
            }

            // Event listeners para opciones rápidas
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('quick-option')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const message = e.target.getAttribute('data-message') || e.target.textContent;
                    this.sendMessage(message);
                }
            });

            // Evento de click fuera del chat (solo en desktop)
            document.addEventListener('click', (e) => {
                const chatWindow = document.getElementById('chatWindow');
                const chatButton = document.getElementById('chatFloatButton');
                
                // En móviles no cerrar automáticamente al hacer click fuera
                if (this.isOpen && window.innerWidth > 768 && 
                    chatWindow && chatButton &&
                    !chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
                    // Opcionalmente cerrar en desktop
                    // this.closeChat();
                }
            });
        }, 100);
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
                "En Clinik Dent ofrecemos estos servicios:\n\n🦷 **Odontología General**\n• Consultas y diagnósticos\n• Tratamientos preventivos\n• Obturaciones (resinas)\n\n🔬 **Endodoncia**\n• Tratamientos de conducto\n• Pulpotomías\n\n✨ **Estética Dental**\n• Blanqueamiento profesional\n• Carillas de porcelana\n• Diseño de sonrisa\n\n🔧 **Ortodoncia**\n• Brackets tradicionales\n• Ortodoncia invisible\n• Retenedores\n\n🦴 **Implantología**\n• Implantes dentales\n• Coronas sobre implantes\n• Rehabilitación oral\n\n🧽 **Periodoncia**\n• Limpiezas profundas\n• Tratamiento de encías\n\n¿Te interesa información específica sobre algún tratamiento?"
            ],
            
            horarios: [
                "Nuestros horarios de atención son:\n\n📅 **Lunes a Viernes:** 8:00 AM - 6:00 PM\n📅 **Sábados:** 9:00 AM - 2:00 PM\n📅 **Domingos:** Cerrado\n\n🚨 **Emergencias:** Contamos con servicio de urgencias 24/7\n📱 WhatsApp: (555) 999-8888 (solo emergencias)\n\n¿Te gustaría agendar una cita en alguno de estos horarios? 😊"
            ],
            
            citas: [
                "¡Perfecto! 📅 Para agendar tu cita tienes varias opciones:\n\n**🌐 En línea:** \n• Regístrate en nuestra página web\n• Selecciona el servicio que necesitas\n• Elige fecha, hora y sede de tu preferencia\n• ¡Confirma y listo!\n\n**📞 Por teléfono:**\n• Sede Centro: (555) 123-4567\n• Sede Norte: (555) 234-5678\n• Sede Plaza: (555) 345-6789\n\n**📱 WhatsApp:** (555) 999-7777\n\n**🏥 Presencial:** Visita cualquiera de nuestras sedes\n\n¿Qué tipo de consulta necesitas? Te puedo ayudar a elegir el especialista adecuado."
            ],
            
            ubicacion: [
                "Nos encontramos en 3 sedes estratégicas:\n\n**🏢 Sede Centro** (Principal)\n📍 Calle Principal #123, Centro\n🅿️ Parqueadero gratuito\n🚌 Transporte público: Rutas 15, 23, 40\n📞 (555) 123-4567\n\n**🏢 Sede Norte**\n📍 Av. Salud #456, Norte\n🅿️ Parqueadero cubierto\n🚇 Metro: Estación Salud (2 cuadras)\n📞 (555) 234-5678\n\n**🏢 Sede Plaza**\n📍 Plaza Dental, Local 789\n🛍️ Dentro del centro comercial\n🅿️ Parqueadero del centro comercial\n📞 (555) 345-6789\n\n¿Cuál te queda más cerca? Te puedo dar indicaciones específicas."
            ],
            
            precios: [
                "Nuestros precios son competitivos y accesibles:\n\n**💰 Servicios Básicos:**\n• Consulta General: $50,000\n• Limpieza Dental: $80,000\n• Obturación (resina): $120,000\n• Extracción simple: $100,000\n\n**💰 Servicios Especializados:**\n• Blanqueamiento: $300,000\n• Endodoncia: $450,000 - $650,000\n• Corona porcelana: $800,000\n• Implante dental: $1,800,000\n\n**💰 Ortodoncia:**\n• Brackets tradicionales: Desde $1,200,000\n• Ortodoncia invisible: Desde $2,500,000\n\n**💳 Financiación:**\n• Hasta 12 meses sin intereses\n• Planes personalizados\n• Descuentos por pronto pago\n\n¿Qué tratamiento te interesa para darte una cotización exacta?"
            ],
            
            contacto: [
                "**📞 Contáctanos por múltiples canales:**\n\n**☎️ Teléfonos por sede:**\n• Centro: (555) 123-4567\n• Norte: (555) 234-5678\n• Plaza: (555) 345-6789\n\n**📧 Correos electrónicos:**\n• General: info@clinikdent.com\n• Citas: citas@clinikdent.com\n• Emergencias: urgencias@clinikdent.com\n\n**📱 Redes sociales:**\n• WhatsApp: (555) 999-7777\n• Instagram: @clinikdent_oficial\n• Facebook: Clinik Dent Colombia\n\n**🌐 Web:** www.clinikdent.com\n\n**⏰ Horario de atención telefónica:**\nL-V: 7:00 AM - 7:00 PM | Sáb: 8:00 AM - 3:00 PM\n\n¿Por cuál canal prefieres que te contactemos?"
            ],
            
            emergencia: [
                "🚨 **EMERGENCIAS DENTALES** 🚨\n\n**📞 Llama inmediatamente:**\n• Línea de urgencias: (555) 911-DENT\n• WhatsApp emergencias: (555) 999-8888\n\n**🏥 Atención inmediata para:**\n• Dolor dental severo\n• Traumatismos dentales\n• Sangrado que no para\n• Infecciones faciales\n• Dientes fracturados o avulsionados\n\n**⏰ Disponible 24/7**\n• Dentista de guardia siempre disponible\n• Atención en sede Centro\n• Medicamentos de emergencia\n\n**💡 Mientras llegas:**\n• Aplica frío en la zona (por fuera)\n• No uses calor\n• Puedes tomar analgésicos comunes\n• Mantén la calma\n\n¿Es una emergencia lo que tienes ahora?"
            ],
            
            default: [
                "Hmm, no estoy seguro de cómo ayudarte con eso específicamente. 🤔\n\n**¿Te refieres a alguno de estos temas?**\n\n🦷 **'servicios'** → Tratamientos disponibles\n📅 **'citas'** → Agendar consulta\n🕐 **'horarios'** → Horarios de atención\n📍 **'ubicación'** → Nuestras sedes\n💰 **'precios'** → Costos y financiación\n📞 **'contacto'** → Información de contacto\n🚨 **'emergencia'** → Urgencias dentales\n\n**O puedes preguntarme sobre:**\n• Tipos de tratamientos\n• Preparación para citas\n• Cuidados post-tratamiento\n• Seguros médicos\n• Promociones vigentes\n\n¿En qué específicamente te puedo ayudar?",
                "¡Ups! No pude entender exactamente qué necesitas. 😅\n\n**Soy experto en estos temas:**\n\n🎯 **Servicios dentales** → limpiezas, blanqueamiento, ortodoncia\n📋 **Proceso de citas** → cómo agendar, qué llevar, preparación\n🏥 **Nuestras sedes** → ubicaciones, horarios, servicios\n� **Costos y pagos** → precios, financiación, seguros\n📞 **Contacto** → teléfonos, WhatsApp, emergencias\n\n**�💬 Consejos para mejor ayuda:**\n• Sé específico con tu pregunta\n• Usa palabras clave como las de arriba\n• Si tienes dolor, dime '🚨emergencia'\n\n¿Puedes contarme más detalles sobre lo que necesitas?"
            ]
        };
    }

    init() {
        console.log('🚀 Inicializando elementos del chat...');
        
        // Crear elementos del chat si no existen
        if (!document.getElementById('chatFloatButton') || !document.getElementById('chatWindow')) {
            console.log('� Creando elementos del chat...');
            this.createChatElements();
        } else {
            console.log('✅ Elementos del chat ya existen');
        }
        
        // Siempre configurar eventos (puede que no estén configurados)
        console.log('🎯 Configurando eventos del chat...');
        this.setupEventListeners();
        
        // Mensaje de bienvenida automático si no hay mensajes
        setTimeout(() => {
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer && messagesContainer.children.length === 0) {
                this.addBotMessage("¡Hola! 👋 Soy el asistente virtual de Clinik Dent. ¿En qué puedo ayudarte hoy?");
            }
        }, 1000);
        
        console.log('✅ Chat inicializado completamente');
    }

    createChatElements() {
        // Verificar que no existan ya los elementos
        if (document.getElementById('chatFloatButton') || document.getElementById('chatWindow')) {
            console.log('💬 Elementos del chat ya existen, omitiendo creación...');
            return;
        }

        // Crear botón flotante
        const floatButton = document.createElement('div');
        floatButton.className = 'chat-float-button';
        floatButton.id = 'chatFloatButton';
        floatButton.innerHTML = '<i class="fas fa-comments"></i>';
        floatButton.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            background: #007bff !important;
            color: white !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            box-shadow: 0 4px 12px rgba(0,123,255,0.3) !important;
            z-index: 9999 !important;
            transition: all 0.3s ease !important;
            font-size: 24px !important;
            border: none !important;
            outline: none !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // Crear ventana de chat
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.id = 'chatWindow';
        chatWindow.style.cssText = `
            position: fixed !important;
            bottom: 100px !important;
            right: 20px !important;
            width: 350px !important;
            max-width: calc(100vw - 40px) !important;
            height: 500px !important;
            max-height: calc(100vh - 140px) !important;
            background: white !important;
            border: 2px solid #007bff !important;
            border-radius: 15px !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important;
            z-index: 99999 !important;
            transform: translateY(100px) !important;
            opacity: 0 !important;
            visibility: hidden !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            flex-direction: column !important;
        `;
        
        chatWindow.innerHTML = `
            <!-- Header del Chat -->
            <div class="chat-header" style="
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 12px 15px;
                border-radius: 15px 15px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <div class="chat-info" style="display: flex; align-items: center;">
                    <div class="chat-avatar" style="
                        width: 32px;
                        height: 32px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 8px;
                        font-size: 14px;
                    ">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div>
                        <div class="chat-title" style="font-weight: 600; font-size: 13px; line-height: 1.2;">Asistente Clinik Dent</div>
                        <div class="chat-status" style="font-size: 11px; opacity: 0.85;">🟢 En línea</div>
                    </div>
                </div>
                <button class="chat-close" id="chatClose" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 4px;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Área de Mensajes con Scroll -->
            <div class="chat-messages-container" style="
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                background: #f8f9fa;
            ">
                <div class="chat-messages" id="chatMessages" style="
                    flex: 1;
                    padding: 15px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    scroll-behavior: smooth;
                    background: #f8f9fa;
                ">
                    <!-- Mensajes aparecerán aquí -->
                </div>
                
                <!-- Indicador de escritura -->
                <div class="typing-indicator" id="typingIndicator" style="
                    padding: 8px 15px;
                    font-style: italic;
                    color: #666;
                    font-size: 12px;
                    display: none;
                    background: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                ">
                    <i class="fas fa-circle" style="color: #28a745; font-size: 6px; animation: pulse 1.5s infinite;"></i>
                    El asistente está escribiendo...
                </div>
            </div>
            
            <!-- Opciones Rápidas -->
            <div class="quick-options" id="quickOptions" style="
                padding: 12px;
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                border-top: 1px solid #e9ecef;
                background: white;
                max-height: 80px;
                overflow-y: auto;
            ">
                <div class="quick-option" data-message="Servicios" style="background: #e3f2fd; border: 1px solid #2196f3; color: #1976d2; padding: 4px 8px; border-radius: 12px; cursor: pointer; font-size: 11px; transition: all 0.2s; white-space: nowrap;">🦷 Servicios</div>
                <div class="quick-option" data-message="Agendar cita" style="background: #e8f5e8; border: 1px solid #4caf50; color: #388e3c; padding: 4px 8px; border-radius: 12px; cursor: pointer; font-size: 11px; transition: all 0.2s; white-space: nowrap;">📅 Citas</div>
                <div class="quick-option" data-message="Horarios" style="background: #fff3e0; border: 1px solid #ff9800; color: #f57c00; padding: 4px 8px; border-radius: 12px; cursor: pointer; font-size: 11px; transition: all 0.2s; white-space: nowrap;">🕐 Horarios</div>
                <div class="quick-option" data-message="Ubicación" style="background: #fce4ec; border: 1px solid #e91e63; color: #c2185b; padding: 4px 8px; border-radius: 12px; cursor: pointer; font-size: 11px; transition: all 0.2s; white-space: nowrap;">📍 Ubicación</div>
                <div class="quick-option" data-message="Precios" style="background: #f3e5f5; border: 1px solid #9c27b0; color: #7b1fa2; padding: 4px 8px; border-radius: 12px; cursor: pointer; font-size: 11px; transition: all 0.2s; white-space: nowrap;">💰 Precios</div>
                <div class="quick-option" data-message="Emergencia" style="background: #ffebee; border: 1px solid #f44336; color: #d32f2f; padding: 4px 8px; border-radius: 12px; cursor: pointer; font-size: 11px; transition: all 0.2s; white-space: nowrap; font-weight: 500;">🚨 Urgencia</div>
            </div>
            
            <!-- Input de Mensaje -->
            <div class="chat-input" style="
                padding: 12px;
                border-top: 1px solid #e9ecef;
                display: flex;
                gap: 8px;
                background: white;
                border-radius: 0 0 15px 15px;
                flex-shrink: 0;
            ">
                <input type="text" id="chatInput" placeholder="Escribe tu mensaje..." autocomplete="off" style="
                    flex: 1;
                    border: 1px solid #dee2e6;
                    border-radius: 20px;
                    padding: 8px 15px;
                    outline: none;
                    font-size: 14px;
                    transition: border-color 0.2s;
                " onfocus="this.style.borderColor='#007bff'" onblur="this.style.borderColor='#dee2e6'">
                <button class="chat-send-btn" id="chatSendBtn" style="
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 38px;
                    height: 38px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                    font-size: 14px;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        
        // Agregar elementos al DOM
        document.body.appendChild(floatButton);
        document.body.appendChild(chatWindow);
        
        console.log('✅ Elementos del chat creados exitosamente');
        console.log('🔍 Botón flotante:', document.getElementById('chatFloatButton'));
        console.log('🔍 Ventana chat:', document.getElementById('chatWindow'));
    }

    setupEventListeners() {
        console.log('🎯 Configurando eventos del chat...');
        
        // Esperar a que los elementos estén disponibles
        setTimeout(() => {
            const floatButton = document.getElementById('chatFloatButton');
            const closeButton = document.getElementById('chatClose');
            
            if (floatButton) {
                console.log('✅ Configurando evento click en botón flotante');
                // Remover eventos anteriores si existen
                floatButton.replaceWith(floatButton.cloneNode(true));
                const newFloatButton = document.getElementById('chatFloatButton');
                
                newFloatButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Click en botón flotante detectado');
                    this.toggleChat();
                });
            } else {
                console.error('❌ Botón flotante no encontrado para eventos');
            }
            
            if (closeButton) {
                console.log('✅ Configurando evento click en botón cerrar');
                closeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeChat();
                });
            } else {
                console.error('❌ Botón cerrar no encontrado para eventos');
            }
            
            // Input de mensaje
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendMessage();
                    }
                });
            }
            
            // Botón enviar
            const sendBtn = document.getElementById('chatSendBtn');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    this.sendMessage();
                });
            }
            
            // Opciones rápidas
            document.querySelectorAll('.quick-option').forEach(option => {
                option.addEventListener('click', () => {
                    const message = option.dataset.message;
                    this.sendMessage(message);
                });
            });
            
            console.log('✅ Todos los eventos configurados');
        }, 500); // Cerrar setTimeout correctamente
    }

    toggleChat() {
        console.log('🎯 toggleChat ejecutado, isOpen actual:', this.isOpen);
        
        if (this.isOpen) {
            console.log('🔄 Cerrando chat...');
            this.closeChat();
        } else {
            console.log('🔄 Abriendo chat...');
            this.openChat();
        }
    }

    openChat() {
        console.log('🔄 Intentando abrir chat...');
        
        const chatWindow = document.getElementById('chatWindow');
        const floatButton = document.getElementById('chatFloatButton');
        
        console.log('🔍 chatWindow:', chatWindow);
        console.log('🔍 floatButton:', floatButton);
        
        if (!chatWindow || !floatButton) {
            console.error('❌ Elementos del chat no encontrados para abrir');
            console.error('   chatWindow existe:', !!chatWindow);
            console.error('   floatButton existe:', !!floatButton);
            return;
        }
        
        console.log('✅ Elementos encontrados, aplicando estilos...');
        
        // Aplicar diseño bonito y funcional
        chatWindow.setAttribute('style', `
            position: fixed !important;
            bottom: 100px !important;
            right: 20px !important;
            width: 350px !important;
            height: 500px !important;
            background: white !important;
            border-radius: 15px !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2) !important;
            z-index: 99999 !important;
            display: flex !important;
            flex-direction: column !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: translateY(0) !important;
            transition: all 0.3s ease !important;
        `);
        
        console.log('✅ Chat con diseño bonito aplicado');
        console.log('🔍 Posición del chat:', chatWindow.getBoundingClientRect());
        
        // Cambiar icono del botón
        floatButton.innerHTML = '<i class="fas fa-times"></i>';
        this.isOpen = true;
        
        console.log('✅ Chat abierto correctamente, isOpen:', this.isOpen);
        
        // En móviles, prevenir scroll del body
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
            chatWindow.style.width = 'calc(100vw - 20px)';
            chatWindow.style.height = 'calc(100vh - 120px)';
            chatWindow.style.right = '10px';
            chatWindow.style.bottom = '80px';
        }
        
        // Hacer scroll al último mensaje
        setTimeout(() => this.scrollToBottom(), 100);
        
        // Focus en input solo en desktop para evitar problemas de teclado en móviles
        if (window.innerWidth > 768) {
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) chatInput.focus();
            }, 300);
        }
    }

    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        const floatButton = document.getElementById('chatFloatButton');
        
        console.log('🔄 Cerrando chat...');
        
        if (!chatWindow || !floatButton) {
            console.error('❌ Elementos del chat no encontrados para cerrar');
            return;
        }
        
        // Ocultar chat window con animación suave
        chatWindow.style.setProperty('transform', 'translateY(50px)', 'important');
        chatWindow.style.setProperty('opacity', '0', 'important');
        chatWindow.style.setProperty('visibility', 'hidden', 'important');
        
        // Cambiar icono del botón
        floatButton.innerHTML = '<i class="fas fa-comments"></i>';
        this.isOpen = false;
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
        
        console.log('✅ Chat cerrado correctamente');
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
        setTimeout(() => {
            const response = this.getBotResponse(message);
            this.hideTyping();
            this.addBotMessage(response);
            
            // Solo log local, sin guardar en base de datos
            console.log('💬 Chat:', { pregunta: message, respuesta: response });
        }, 1000 + Math.random() * 1000);
    }

    addUserMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        
        if (!messagesContainer) {
            console.error('❌ Contenedor de mensajes no encontrado');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-user';
        
        // Estilos inline para asegurar visualización correcta
        messageDiv.style.cssText = `
            display: flex;
            justify-content: flex-end;
            margin-bottom: 12px;
            animation: slideInMessage 0.3s ease-out;
        `;
        
        const currentTime = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-content" style="
                background: #007bff;
                color: white;
                padding: 10px 15px;
                border-radius: 15px 15px 5px 15px;
                max-width: 80%;
                word-wrap: break-word;
                position: relative;
            ">
                ${message}
                <div class="message-time" style="
                    font-size: 0.75em;
                    opacity: 0.8;
                    margin-top: 4px;
                    text-align: right;
                ">${currentTime}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        
        if (!messagesContainer) {
            console.error('❌ Contenedor de mensajes no encontrado');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-bot';
        
        // Estilos inline para asegurar visualización correcta
        messageDiv.style.cssText = `
            display: flex;
            justify-content: flex-start;
            margin-bottom: 12px;
            animation: slideInMessage 0.3s ease-out;
        `;
        
        const currentTime = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar" style="
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: #6c757d;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
                font-size: 16px;
                flex-shrink: 0;
            ">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content" style="
                background: #f8f9fa;
                color: #333;
                padding: 10px 15px;
                border-radius: 15px 15px 15px 5px;
                max-width: 80%;
                word-wrap: break-word;
                position: relative;
                line-height: 1.4;
            ">
                ${message.replace(/\n/g, '<br>')}
                <div class="message-time" style="
                    font-size: 0.75em;
                    opacity: 0.7;
                    margin-top: 4px;
                    color: #666;
                ">${currentTime}</div>
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
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.classList.add('show');
            this.scrollToBottom();
        }
    }

    hideTyping() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('show');
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
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
