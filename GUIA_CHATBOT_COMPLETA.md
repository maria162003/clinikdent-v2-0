# 🚀 GUÍA COMPLETA: CHATBOT REAL WEB Y WHATSAPP

## ✅ ARCHIVOS CREADOS

### **Backend:**
1. ✅ `Backend/controllers/whatsappController.js` - Controlador WhatsApp
2. ✅ `Backend/routes/whatsappRoutes.js` - Rutas WhatsApp
3. ✅ `Backend/scripts/create_chatbot_tables.sql` - Tablas DB

### **Frontend:**
1. ✅ `public/js/chatbot-widget.js` - Widget flotante universal

### **Configuración:**
1. ✅ `package.json` - Dependencia Twilio agregada
2. ✅ `app.js` - Rutas WhatsApp registradas
3. ✅ `.env` - Variables Twilio agregadas

---

## 📋 PASOS PARA IMPLEMENTACIÓN

### **PASO 1: Instalar Dependencias**

```bash
cd C:\Users\Daniel\Desktop\Clinikdent_supabase_1.0\Clinikdent_supabase_1.0
npm install twilio
```

---

### **PASO 2: Configurar Groq AI (OBLIGATORIO)**

#### **2.1 Obtener API Key:**
1. Ve a: https://console.groq.com/
2. Crea una cuenta gratuita
3. Navega a **"API Keys"**
4. Click en **"Create API Key"**
5. Copia la key (empieza con `gsk_`)

#### **2.2 Agregar al .env:**
```env
GROQ_API_KEY=gsk_tu_key_real_aqui
```

---

### **PASO 3: Configurar Twilio WhatsApp**

#### **3.1 Crear Cuenta Twilio:**
1. Ve a: https://www.twilio.com/try-twilio
2. Regístrate gratis (dan $15 USD de crédito)
3. Verifica tu número de teléfono

#### **3.2 Configurar WhatsApp Sandbox:**
1. En Twilio Console: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Sigue las instrucciones para activar el Sandbox
3. Envía el código de activación desde tu WhatsApp personal

#### **3.3 Obtener Credenciales:**
En Twilio Console:
- **Account SID**: En el dashboard principal
- **Auth Token**: Click en "Show" en el dashboard
- **WhatsApp Number**: En WhatsApp Sandbox settings (formato: `whatsapp:+14155238886`)

#### **3.4 Configurar Webhook:**
1. En Twilio → **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. En **"WHEN A MESSAGE COMES IN"**:
   ```
   https://tu-dominio.com/api/whatsapp/webhook
   ```
   (Para desarrollo local, usa ngrok - ver paso 5)

#### **3.5 Agregar al .env:**
```env
# WhatsApp Configuration - Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

### **PASO 4: Crear Tablas en Base de Datos**

#### **Opción A: PostgreSQL (Supabase)**
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Abre `Backend/scripts/create_chatbot_tables.sql`
5. Copia el contenido y conviértelo a PostgreSQL:

```sql
-- Sesiones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    nombre_usuario VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_telefono ON whatsapp_sessions(telefono);
CREATE INDEX idx_session ON whatsapp_sessions(session_id);

-- Interacciones WhatsApp
CREATE TABLE IF NOT EXISTS chat_whatsapp_interacciones (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    telefono VARCHAR(20) NOT NULL,
    mensaje_usuario TEXT NOT NULL,
    respuesta_bot TEXT NOT NULL,
    intencion VARCHAR(50),
    mensaje_sid VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_whatsapp_session ON chat_whatsapp_interacciones(session_id);
CREATE INDEX idx_whatsapp_telefono ON chat_whatsapp_interacciones(telefono);

-- Notificaciones WhatsApp
CREATE TABLE IF NOT EXISTS notificaciones_whatsapp (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER,
    telefono VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    mensaje_sid VARCHAR(50),
    tipo VARCHAR(20) DEFAULT 'general',
    estado VARCHAR(20) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL
);

-- Interacciones Web
CREATE TABLE IF NOT EXISTS chat_web_interacciones (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(100),
    user_id INTEGER,
    mensaje_usuario TEXT NOT NULL,
    respuesta_bot TEXT NOT NULL,
    intencion VARCHAR(50),
    datos_adicionales JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Opción B: MySQL Local**
Ejecuta directamente:
```bash
mysql -u root -p clinikdent < Backend/scripts/create_chatbot_tables.sql
```

---

### **PASO 5: Exponer Servidor Local (ngrok)**

Para que Twilio pueda enviar mensajes a tu servidor local:

#### **5.1 Instalar ngrok:**
```bash
# Windows
choco install ngrok

# O descargar de: https://ngrok.com/download
```

#### **5.2 Crear cuenta:**
1. Ve a: https://dashboard.ngrok.com/signup
2. Obtén tu authtoken

#### **5.3 Configurar:**
```bash
ngrok config add-authtoken tu_authtoken_aqui
```

#### **5.4 Exponer puerto 3001:**
```bash
ngrok http 3001
```

Obtendrás una URL como: `https://abc123.ngrok.io`

#### **5.5 Configurar Webhook en Twilio:**
```
https://abc123.ngrok.io/api/whatsapp/webhook
```

---

### **PASO 6: Agregar Widget a las Páginas Web**

En TODAS las páginas HTML del sistema, agrega antes de `</body>`:

```html
<!-- Chatbot Widget -->
<script src="/js/chatbot-widget.js"></script>
```

#### **Páginas a modificar:**
- ✅ `public/index.html`
- ✅ `public/dashboard-paciente.html`
- ✅ `public/dashboard-odontologo.html`
- ✅ `public/dashboard-admin.html`
- ✅ `public/citas.html`
- ✅ `public/servicios.html`
- ✅ ... (todas las demás)

---

### **PASO 7: Iniciar el Servidor**

```bash
cd C:\Users\Daniel\Desktop\Clinikdent_supabase_1.0\Clinikdent_supabase_1.0
node app.js
```

Verás:
```
✅ Rutas de WhatsApp registradas exitosamente
✅ Servidor corriendo en: http://localhost:3001
```

---

## 🧪 PRUEBAS

### **A. Probar Widget Web**

1. Abre cualquier página: `http://localhost:3001/index.html`
2. Verás el botón flotante en la esquina inferior derecha
3. Click para abrir el chat
4. Escribe: **"Quiero agendar una cita"**
5. Deberías recibir respuesta del chatbot

### **B. Probar WhatsApp**

1. Asegúrate de tener ngrok corriendo
2. Configura el webhook en Twilio con tu URL de ngrok
3. Desde tu WhatsApp, envía mensaje al número sandbox
4. Escribe: **"Hola"**
5. Deberías recibir respuesta automática

### **C. Test de Conectividad**

```bash
# Test Chatbot
Invoke-RestMethod http://localhost:3001/api/chat/test

# Test WhatsApp
Invoke-RestMethod http://localhost:3001/api/whatsapp/test
```

---

## 📊 FUNCIONALIDADES IMPLEMENTADAS

### **🌐 CHATBOT WEB**
- ✅ Widget flotante en todas las páginas
- ✅ Diseño moderno y responsive
- ✅ Historial de conversación persistente
- ✅ Respuestas rápidas predefinidas
- ✅ Indicador de escritura
- ✅ Notificaciones cuando está cerrado
- ✅ Integración completa con Groq AI

### **💬 CHATBOT WHATSAPP**
- ✅ Recepción automática de mensajes
- ✅ Procesamiento con IA Groq
- ✅ Respuestas contextuales
- ✅ Sistema de sesiones por teléfono
- ✅ Historial de conversaciones
- ✅ Envío de recordatorios de citas
- ✅ Confirmación/cancelación de citas

### **🎯 INTENCIONES DETECTADAS**
- 📅 Agendar citas
- ❌ Cancelar citas
- 🔄 Reagendar citas
- 🕐 Consultar disponibilidad
- 📋 Ver mis citas
- 🦷 Información de servicios
- 💰 Consultar precios
- 📍 Ubicación y contacto
- 🚨 Emergencias dentales

---

## 🔐 SEGURIDAD

```javascript
// Rate limiting ya implementado en app.js
// Previene abuso del chatbot

// Sanitización de mensajes
// Previene inyección de código

// Validación de webhooks Twilio
// Verifica que los mensajes vengan de Twilio
```

---

## 📈 ANALYTICS Y MONITOREO

### **Ver Estadísticas:**
```sql
-- Total de conversaciones por canal
SELECT 
    canal,
    COUNT(*) as total_interacciones,
    COUNT(DISTINCT CASE WHEN canal='web' THEN conversation_id ELSE telefono END) as usuarios_unicos
FROM (
    SELECT 'web' as canal, conversation_id, NULL as telefono FROM chat_web_interacciones
    UNION ALL
    SELECT 'whatsapp' as canal, NULL, telefono FROM chat_whatsapp_interacciones
) t
GROUP BY canal;

-- Intenciones más comunes
SELECT intencion, COUNT(*) as total
FROM chat_web_interacciones
GROUP BY intencion
ORDER BY total DESC;
```

---

## 💰 COSTOS ESTIMADOS

### **Groq AI:**
- ✅ **GRATIS** hasta 14,400 requests/día
- 🎯 Perfecto para empezar

### **Twilio WhatsApp:**
- ✅ **$15 USD** de crédito gratis al registrarse
- 💵 **$0.0079 USD** por mensaje después
- 📊 Aprox. 1,900 mensajes gratis con el crédito inicial

### **ngrok (Desarrollo):**
- ✅ **GRATIS** para desarrollo
- 💵 **$8/mes** para dominio personalizado (opcional)

---

## 🚨 TROUBLESHOOTING

### **1. Error: "Groq API Key missing"**
**Solución:**
```bash
# Verifica que .env tenga:
GROQ_API_KEY=gsk_tu_key_real_aqui

# Reinicia el servidor
```

### **2. WhatsApp no responde**
**Checklist:**
- ✅ ngrok está corriendo?
- ✅ Webhook configurado en Twilio?
- ✅ URL del webhook correcta?
- ✅ Credenciales en .env correctas?

**Test:**
```bash
# Ver logs del servidor
# Deberías ver: "📱 WhatsApp entrante..."
```

### **3. Widget no aparece**
**Solución:**
```html
<!-- Asegúrate de tener en la página: -->
<script src="/js/chatbot-widget.js"></script>

<!-- Antes de </body> -->
```

### **4. Error de conexión a DB**
**Solución:**
```bash
# Ejecuta el script SQL:
psql -U postgres -d clinikdent -f Backend/scripts/create_chatbot_tables.sql
```

---

## 📱 EJEMPLOS DE USO REAL

### **Ejemplo 1: Usuario agenda cita por WhatsApp**

**Usuario (WhatsApp):** "Hola, necesito una cita para el jueves"

**Bot:** "¡Claro! Te ayudo a agendar tu cita para el jueves. ¿A qué hora prefieres?"

**Usuario:** "3pm"

**Bot:** "Perfecto. Te confirmo tu cita:
📅 Jueves 21 de noviembre
🕐 3:00 PM
👨‍⚕️ Dr. García
¿Confirmas?"

**Usuario:** "Sí"

**Bot:** "✅ ¡Cita confirmada! Te enviaré un recordatorio el día anterior."

### **Ejemplo 2: Recordatorio automático**

```javascript
// Enviar recordatorios 24h antes
// POST /api/whatsapp/reminder
{
    "citaId": 123
}

// El paciente recibe:
```

**Bot → Paciente:**
```
🦷 ClinikDent - Recordatorio de Cita

Hola Juan,

Te recordamos tu cita programada:

📅 Fecha: Jueves, 21 de noviembre de 2025
🕐 Hora: 15:00
👨‍⚕️ Odontólogo: Dr. García
📍 Sede: Norte

Responde:
✅ "CONFIRMAR" para confirmar
❌ "CANCELAR" para cancelar
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Producción:**
   - [ ] Dominio propio para webhook
   - [ ] Certificado SSL
   - [ ] Cuenta Twilio de producción

2. **Mejoras:**
   - [ ] Análisis de sentimientos
   - [ ] Respuestas con imágenes/videos
   - [ ] Integración con calendario
   - [ ] Dashboard de analytics

3. **Escalabilidad:**
   - [ ] Redis para cache de sesiones
   - [ ] Queue para mensajes masivos
   - [ ] Load balancer

---

## ✅ CHECKLIST FINAL

### **Configuración:**
- [ ] Groq API Key configurada
- [ ] Twilio cuenta creada
- [ ] Twilio credenciales en .env
- [ ] Webhook configurado en Twilio
- [ ] Tablas de BD creadas
- [ ] Dependencia Twilio instalada
- [ ] Widget agregado a páginas HTML
- [ ] ngrok configurado (desarrollo)

### **Pruebas:**
- [ ] Widget web funciona
- [ ] Chatbot responde correctamente
- [ ] WhatsApp recibe mensajes
- [ ] WhatsApp envía respuestas
- [ ] Recordatorios funcionan
- [ ] Historial se guarda en BD

---

## 📞 SOPORTE

- **Email:** mariacamilafontalvolopez@gmail.com
- **Groq Docs:** https://console.groq.com/docs
- **Twilio Docs:** https://www.twilio.com/docs/whatsapp
- **ngrok Docs:** https://ngrok.com/docs

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Una vez completados todos los pasos, tendrás:
- ✅ Chatbot inteligente en tu sitio web
- ✅ Bot de WhatsApp 24/7
- ✅ Recordatorios automáticos
- ✅ Analytics completos
- ✅ Sistema escalable

**¡Tu clínica estará al nivel de las grandes empresas tecnológicas!** 🚀

---

*Desarrollado con ❤️ para ClinikDent*
*Powered by Groq AI 🧠 + Twilio 💬*
