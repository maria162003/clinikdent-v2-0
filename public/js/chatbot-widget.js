/**
 * 🤖 CHATBOT WIDGET FLOTANTE - CLINIKDENT
 * Widget universal que se puede agregar a cualquier página
 * 
 * USO:
 * <script src="/js/chatbot-widget.js"></script>
 */

class ChatbotWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.userId = this.getUserId();
        this.conversationId = this.generateConversationId();
        this.init();
    }

    init() {
        this.injectStyles();
        this.createWidget();
        this.attachEventListeners();
        this.loadConversationHistory();
    }

    getUserId() {
        // Intenta obtener el ID del usuario logueado
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id || null;
    }

    generateConversationId() {
        // Genera o recupera un ID único de conversación
        let convId = sessionStorage.getItem('chatbot_conversation_id');
        if (!convId) {
            convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('chatbot_conversation_id', convId);
        }
        return convId;
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* CHATBOT WIDGET STYLES */
            .chatbot-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .chatbot-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                position: relative;
            }

            .chatbot-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            }

            .chatbot-toggle svg {
                width: 30px;
                height: 30px;
                fill: white;
            }

            .chatbot-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .chatbot-window {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 380px;
                height: 600px;
                background: white;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: none;
                flex-direction: column;
                overflow: hidden;
                animation: slideUp 0.3s ease;
            }

            .chatbot-window.open {
                display: flex;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .chatbot-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .chatbot-header-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .chatbot-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }

            .chatbot-title h3 {
                margin: 0;
                font-size: 16px;
            }

            .chatbot-title p {
                margin: 0;
                font-size: 12px;
                opacity: 0.9;
            }

            .chatbot-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s ease;
            }

            .chatbot-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .chatbot-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #f8f9fa;
            }

            .chatbot-message {
                margin-bottom: 15px;
                display: flex;
                gap: 10px;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .chatbot-message.user {
                flex-direction: row-reverse;
            }

            .chatbot-message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .chatbot-message.bot .chatbot-message-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .chatbot-message.user .chatbot-message-avatar {
                background: #007bff;
                color: white;
            }

            .chatbot-message-content {
                max-width: 70%;
                padding: 12px 16px;
                border-radius: 18px;
                line-height: 1.4;
                font-size: 14px;
            }

            .chatbot-message.bot .chatbot-message-content {
                background: white;
                color: #333;
                border-bottom-left-radius: 4px;
            }

            .chatbot-message.user .chatbot-message-content {
                background: #007bff;
                color: white;
                border-bottom-right-radius: 4px;
            }

            .chatbot-typing {
                display: none;
                padding: 12px 16px;
                background: white;
                border-radius: 18px;
                max-width: 60px;
            }

            .chatbot-typing.show {
                display: block;
            }

            .chatbot-typing span {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #999;
                margin: 0 2px;
                animation: typing 1.4s infinite;
            }

            .chatbot-typing span:nth-child(2) {
                animation-delay: 0.2s;
            }

            .chatbot-typing span:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }

            .chatbot-quick-replies {
                padding: 10px 20px;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }

            .chatbot-quick-reply {
                background: white;
                border: 1px solid #dee2e6;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .chatbot-quick-reply:hover {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }

            .chatbot-input-container {
                padding: 15px 20px;
                background: white;
                border-top: 1px solid #e9ecef;
                display: flex;
                gap: 10px;
            }

            .chatbot-input {
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #dee2e6;
                border-radius: 25px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.3s ease;
            }

            .chatbot-input:focus {
                border-color: #667eea;
            }

            .chatbot-send {
                width: 45px;
                height: 45px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .chatbot-send:hover {
                transform: scale(1.1);
            }

            .chatbot-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .chatbot-status {
                font-size: 11px;
                color: #6c757d;
                padding: 5px 20px;
                background: #f8f9fa;
                text-align: center;
            }

            /* RESPONSIVE */
            @media (max-width: 480px) {
                .chatbot-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 100px);
                    bottom: 80px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.className = 'chatbot-widget';
        widget.innerHTML = `
            <button class="chatbot-toggle" id="chatbotToggle">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    <circle cx="9" cy="10" r="1"/>
                    <circle cx="15" cy="10" r="1"/>
                    <path d="M12 14c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/>
                </svg>
                <div class="chatbot-badge" id="chatbotBadge" style="display: none;">1</div>
            </button>

            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">🤖</div>
                        <div class="chatbot-title">
                            <h3>Asistente ClinikDent</h3>
                            <p id="chatbotStatus">En línea</p>
                        </div>
                    </div>
                    <button class="chatbot-close" id="chatbotClose">×</button>
                </div>

                <div class="chatbot-messages" id="chatbotMessages">
                    <!-- Mensajes aquí -->
                </div>

                <div class="chatbot-quick-replies" id="chatbotQuickReplies">
                    <button class="chatbot-quick-reply" data-message="Quiero agendar una cita">📅 Agendar cita</button>
                    <button class="chatbot-quick-reply" data-message="¿Qué servicios ofrecen?">🦷 Servicios</button>
                    <button class="chatbot-quick-reply" data-message="Necesito ayuda urgente">🚨 Urgencia</button>
                </div>

                <div class="chatbot-input-container">
                    <input 
                        type="text" 
                        class="chatbot-input" 
                        id="chatbotInput" 
                        placeholder="Escribe tu mensaje..."
                        autocomplete="off"
                    />
                    <button class="chatbot-send" id="chatbotSend">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);
        
        // Mostrar mensaje de bienvenida
        setTimeout(() => {
            this.addBotMessage("¡Hola! 👋 Soy el asistente virtual de ClinikDent. ¿En qué puedo ayudarte hoy?");
        }, 500);
    }

    attachEventListeners() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const send = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');
        const quickReplies = document.querySelectorAll('.chatbot-quick-reply');

        toggle.addEventListener('click', () => this.toggleWidget());
        close.addEventListener('click', () => this.toggleWidget());
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        quickReplies.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                this.sendMessage(message);
            });
        });
    }

    toggleWidget() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('chatbotWindow');
        const badge = document.getElementById('chatbotBadge');
        
        if (this.isOpen) {
            window.classList.add('open');
            badge.style.display = 'none';
            this.scrollToBottom();
        } else {
            window.classList.remove('open');
        }
    }

    async sendMessage(customMessage = null) {
        const input = document.getElementById('chatbotInput');
        const message = customMessage || input.value.trim();
        
        if (!message) return;

        // Limpiar input
        if (!customMessage) {
            input.value = '';
        }

        // Agregar mensaje del usuario
        this.addUserMessage(message);

        // Mostrar typing
        this.showTyping();

        try {
            const response = await fetch('/api/chat/intelligent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    userId: this.userId,
                    conversationId: this.conversationId
                })
            });

            const data = await response.json();
            
            this.hideTyping();

            if (data.success) {
                this.addBotMessage(data.response);
                
                // Log para debug
                console.log('🤖 Chatbot Response:', {
                    intencion: data.intencion,
                    response: data.response
                });
            } else {
                this.addBotMessage('Lo siento, hubo un problema. ¿Podrías intentar de nuevo?');
            }

        } catch (error) {
            console.error('❌ Error en chatbot:', error);
            this.hideTyping();
            this.addBotMessage('Disculpa, estoy teniendo problemas de conexión. Por favor intenta más tarde.');
        }
    }

    addUserMessage(text) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message user';
        messageDiv.innerHTML = `
            <div class="chatbot-message-avatar">👤</div>
            <div class="chatbot-message-content">${this.escapeHtml(text)}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        this.saveMessage('user', text);
    }

    addBotMessage(text) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot';
        messageDiv.innerHTML = `
            <div class="chatbot-message-avatar">🤖</div>
            <div class="chatbot-message-content">${this.formatBotMessage(text)}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        this.saveMessage('bot', text);

        // Mostrar badge si el widget está cerrado
        if (!this.isOpen) {
            const badge = document.getElementById('chatbotBadge');
            badge.style.display = 'flex';
        }
    }

    showTyping() {
        const messagesContainer = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'chatbotTypingIndicator';
        typingDiv.className = 'chatbot-message bot';
        typingDiv.innerHTML = `
            <div class="chatbot-message-avatar">🤖</div>
            <div class="chatbot-typing show">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typingIndicator = document.getElementById('chatbotTypingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbotMessages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    formatBotMessage(text) {
        // Formato básico para hacer el mensaje más legible
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveMessage(sender, text) {
        // Guardar en sessionStorage para persistencia
        const history = JSON.parse(sessionStorage.getItem('chatbot_history') || '[]');
        history.push({
            sender,
            text,
            timestamp: new Date().toISOString()
        });
        sessionStorage.setItem('chatbot_history', JSON.stringify(history));
    }

    loadConversationHistory() {
        // Cargar historial del sessionStorage
        const history = JSON.parse(sessionStorage.getItem('chatbot_history') || '[]');
        // Solo cargar los últimos 10 mensajes
        const recentHistory = history.slice(-10);
        
        recentHistory.forEach(msg => {
            if (msg.sender === 'user') {
                this.addUserMessage(msg.text);
            } else {
                this.addBotMessage(msg.text);
            }
        });
    }
}

// Inicializar el widget cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatbotWidget = new ChatbotWidget();
    });
} else {
    window.chatbotWidget = new ChatbotWidget();
}
