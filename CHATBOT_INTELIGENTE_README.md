# 🤖 CHATBOT INTELIGENTE CON IA GROQ - CLINIKDENT

## ✅ IMPLEMENTACIÓN COMPLETADA

Sistema de chatbot inteligente integrado con Groq AI para reconocimiento de intenciones y procesamiento de lenguaje natural.

---

## 📦 ARCHIVOS CREADOS/MODIFICADOS

### **Nuevos Archivos:**
1. ✅ `Backend/controllers/chatInteligentController.js` - Controlador principal del chatbot con IA
2. ✅ `Backend/routes/chatInteligentRoutes.js` - Rutas del chatbot
3. ✅ `public/test-chatbot.html` - Página de pruebas interactiva

### **Archivos Modificados:**
1. ✅ `app.js` - Registro de rutas del chatbot
2. ✅ `package.json` - Dependencias (groq-sdk, resend)
3. ✅ `public/js/chat-soporte.js` - Frontend actualizado
4. ✅ `.env` - Variables de entorno para IA

---

## 🔧 CONFIGURACIÓN REQUERIDA

### **1. Obtener API Key de Groq**
```
🔗 https://console.groq.com/
```
- Crea una cuenta gratuita
- Ve a "API Keys"
- Genera una nueva key
- Copia la key

### **2. Configurar .env**
Edita el archivo `.env` y agrega:
```env
# IA Configuration - Groq
GROQ_API_KEY=gsk-tu-api-key-aqui

# Email Configuration - Resend (Opcional)
RESEND_API_KEY=re_tu-api-key-aqui
```

---

## 🚀 FUNCIONALIDADES IMPLEMENTADAS

### **1. Reconocimiento de Intenciones con IA**
- ✅ Agendar citas
- ✅ Cancelar citas
- ✅ Reagendar citas
- ✅ Consultar disponibilidad
- ✅ Consultar mis citas
- ✅ Información de servicios
- ✅ Consultar precios
- ✅ Información de contacto
- ✅ Emergencias dentales
- ✅ Conversación general

### **2. Base de Datos Integrada**
- Consulta de horarios disponibles desde PostgreSQL
- Registro de interacciones del chatbot
- Historial de conversaciones

### **3. Sistema de Emergencias**
- Detección automática de urgencias
- Respuestas prioritarias
- Información de contacto inmediata

---

## 🧪 CÓMO PROBAR EL CHATBOT

### **Opción 1: Página de Pruebas (Recomendado)**
```
http://localhost:3001/test-chatbot.html
```
- Interfaz interactiva
- Botones de prueba rápida
- Estadísticas en tiempo real

### **Opción 2: Chat de Soporte**
```
http://localhost:3001/chat-soporte.html
```
- Interfaz de chat normal
- Integración completa

### **Opción 3: API Directa (cURL)**
```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/chat/intelligent" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Quiero agendar una cita","userId":1}'

# Test básico
Invoke-RestMethod -Uri "http://localhost:3001/api/chat/test" -Method GET
```

---

## 📊 EJEMPLOS DE USO

### **1. Agendar Cita**
**Usuario:** "Quiero agendar una cita para el viernes a las 3pm"

**Respuesta:**
```json
{
  "success": true,
  "intencion": "agendar_cita",
  "response": "Para agendar tu cita necesito algunos datos...",
  "data": {
    "fecha_sugerida": "2025-01-24",
    "hora_sugerida": "15:00"
  }
}
```

### **2. Consultar Horarios**
**Usuario:** "¿Qué horarios tienen disponibles mañana?"

**Respuesta:**
```json
{
  "success": true,
  "intencion": "consultar_disponibilidad",
  "response": "Estos son los horarios disponibles...",
  "data": {
    "horarios": [
      { "fecha": "2025-01-20", "hora": "09:00", "odontologo": "Dr. García" },
      { "fecha": "2025-01-20", "hora": "14:00", "odontologo": "Dra. López" }
    ]
  }
}
```

### **3. Emergencia Dental**
**Usuario:** "Tengo un dolor de muela muy fuerte, es urgente"

**Respuesta:**
```json
{
  "success": true,
  "intencion": "emergencia_dental",
  "response": "🚨 Entiendo que es urgente. Por favor contacta inmediatamente...",
  "prioridad": "alta"
}
```

---

## 🛣️ ENDPOINTS DEL CHATBOT

### **1. Test de Conectividad**
```
GET /api/chat/test
```
**Respuesta:**
```json
{
  "success": true,
  "message": "🤖 Chatbot inteligente funcionando correctamente",
  "version": "1.0.0"
}
```

### **2. Chat Inteligente**
```
POST /api/chat/intelligent
```
**Body:**
```json
{
  "message": "Tu mensaje aquí",
  "userId": 123
}
```

**Respuesta:**
```json
{
  "success": true,
  "response": "Respuesta del chatbot",
  "intencion": "agendar_cita",
  "data": { }
}
```

---

## 🔐 SEGURIDAD

- ✅ Rate limiting para prevenir abuso
- ✅ Sanitización de mensajes
- ✅ API keys en variables de entorno
- ✅ CORS configurado
- ✅ Validación de entrada

---

## 📈 MÉTRICAS Y MONITOREO

El sistema registra:
- Total de interacciones
- Intenciones más frecuentes
- Tiempo de respuesta promedio
- Tasa de éxito

Visualización en `test-chatbot.html`:
- 📊 Mensajes enviados
- ✅ Respuestas exitosas
- ⏱️ Tiempo promedio
- 🎯 Intenciones detectadas

---

## 🐛 TROUBLESHOOTING

### **1. Error: "No Groq API Key"**
**Solución:** Agrega `GROQ_API_KEY` en `.env`

### **2. Error: "Cannot find module 'groq-sdk'"**
**Solución:**
```bash
npm install groq-sdk resend
```

### **3. Chatbot no responde**
**Verificar:**
- ✅ Servidor corriendo en puerto 3001
- ✅ GROQ_API_KEY configurado
- ✅ Internet disponible (Groq requiere conexión)

### **4. Error: "Database connection failed"**
**Verificar:** Variables de entorno de PostgreSQL/Supabase

---

## 🎨 PERSONALIZACIÓN

### **Cambiar el System Prompt**
Edita `chatInteligentController.js` línea ~12:
```javascript
const SYSTEM_PROMPT = `
Tu prompt personalizado aquí...
`;
```

### **Agregar Nuevas Intenciones**
1. Actualiza `SYSTEM_PROMPT` con la nueva intención
2. Agrega procesador en el switch de intenciones
3. Reinicia el servidor

---

## 📚 DEPENDENCIAS INSTALADAS

```json
{
  "groq-sdk": "^0.36.0",  // IA de Groq para NLP
  "resend": "^6.5.1"       // Email service (opcional)
}
```

---

## 🌟 PRÓXIMAS MEJORAS

- [ ] Soporte multiidioma
- [ ] Análisis de sentimientos
- [ ] Respuestas con voz
- [ ] Integración con WhatsApp
- [ ] Dashboard de analytics avanzado
- [ ] Entrenamiento con datos históricos

---

## 📞 SOPORTE

- **Email:** mariacamilafontalvolopez@gmail.com
- **Documentación Groq:** https://console.groq.com/docs
- **GitHub Issues:** [Tu repositorio]

---

## ✅ ESTADO ACTUAL

```
🚀 SERVIDOR: FUNCIONANDO ✅
🤖 CHATBOT: ACTIVO ✅
🧠 IA GROQ: INTEGRADA ✅
📊 TEST PAGE: DISPONIBLE ✅
```

---

## 🎯 COMANDOS RÁPIDOS

### **Iniciar servidor:**
```bash
cd C:\Users\Daniel\Desktop\Clinikdent_supabase_1.0\Clinikdent_supabase_1.0
node app.js
```

### **Probar chatbot:**
```
http://localhost:3001/test-chatbot.html
```

### **Ver logs:**
Observa la consola del servidor para ver las intenciones detectadas

---

**¡CHATBOT INTELIGENTE LISTO PARA USAR! 🎉**

*Desarrollado con ❤️ para ClinikDent*
*Powered by Groq AI 🧠*
