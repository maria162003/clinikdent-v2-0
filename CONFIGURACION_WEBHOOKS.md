# 📋 Configuración de Webhooks de MercadoPago - Clinikdent

## 🎯 Descripción
Los webhooks permiten recibir notificaciones automáticas cuando ocurren eventos de pago en MercadoPago, manteniendo sincronizado el estado de las transacciones en tiempo real.

## 🔧 Configuración en MercadoPago

### 1. Acceder al Panel de Desarrolladores
- Entra a: https://www.mercadopago.com.co/developers/
- Ve a **"Tus integraciones"** → **"Clinikdent"**
- Haz clic en **"Configuración de Webhooks"**

### 2. Configurar la URL de Notificación
- **URL del Webhook:** `https://tu-dominio.com/api/mercadopago/webhook`
- **Para desarrollo local:** `https://tu-ngrok-url.ngrok.io/api/mercadopago/webhook`

### 3. Eventos a Suscribir
Selecciona estos eventos importantes:
- ✅ **payment** - Eventos de pagos (crear, actualizar, aprobar, rechazar)
- ✅ **plan** - Eventos de planes de suscripción
- ✅ **subscription** - Eventos de suscripciones
- ✅ **invoice** - Eventos de facturas

### 4. Configuración de Seguridad
- **Versión de API:** v1
- **Modo:** Ambos (sandbox y production)

## 🌐 URLs de Retorno Configuradas

### Éxito
- **URL:** `/pagos/exito.html`
- **Descripción:** Página mostrada cuando el pago es aprobado
- **Parámetros:** `payment_id`, `status`, `external_reference`

### Error
- **URL:** `/pagos/error.html`
- **Descripción:** Página mostrada cuando el pago es rechazado
- **Parámetros:** `payment_id`, `status`, `status_detail`

### Pendiente
- **URL:** `/pagos/pendiente.html`
- **Descripción:** Página mostrada cuando el pago está siendo procesado
- **Parámetros:** `payment_id`, `status`, `payment_type_id`

## 🔄 Flujo de Webhook

### 1. MercadoPago envía notificación
```json
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2025-01-09T10:00:00.000Z",
  "live_mode": false
}
```

### 2. Clinikdent procesa la notificación
- Valida que venga de MercadoPago
- Obtiene información detallada del pago
- Actualiza el estado en la base de datos
- Envía notificaciones al usuario (opcional)

### 3. Estados de Pago Manejados

#### ✅ approved
- Pago aprobado exitosamente
- Se actualiza el estado de la cita (si aplica)
- Se envía confirmación por email

#### ⏳ pending
- Pago en proceso
- Se mantiene en seguimiento
- Se notifica cuando cambie de estado

#### ❌ rejected
- Pago rechazado
- Se notifica al usuario el motivo
- Se permite reintentar

#### 🚫 cancelled
- Pago cancelado por el usuario
- Se registra en logs

#### 💰 refunded
- Pago reembolsado
- Se actualiza el estado correspondiente

## 🛠️ Endpoints Implementados

### POST /api/mercadopago/webhook
- **Descripción:** Recibe notificaciones de MercadoPago
- **Seguridad:** Valida origen y firma
- **Procesamiento:** Asíncrono para respuesta rápida

### GET /api/mercadopago/pago/:payment_id
- **Descripción:** Consulta estado de un pago específico
- **Uso:** Verificación manual o desde páginas de resultado
- **Respuesta:** Estado completo y detallado

### POST /api/mercadopago/crear-preferencia
- **Descripción:** Crea nueva preferencia de pago
- **Incluye:** URL de webhook automáticamente
- **Retorna:** Enlaces de pago y datos de prueba

## 🧪 Testing Local

### 1. Usar ngrok para exposición local
```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3001
ngrok http 3001
```

### 2. Actualizar URL en MercadoPago
- Usar la URL https generada por ngrok
- Ejemplo: `https://abc123.ngrok.io/api/mercadopago/webhook`

### 3. Probar con Cuentas de Prueba
- **Vendedor:** TESTUSER8312 / FONanTMAuV
- **Comprador:** TESTUSER4549 / viuWGfcPEp

## 📊 Monitoreo y Logs

### Base de Datos
- **Tabla:** `webhook_logs`
- **Registra:** Todos los webhooks recibidos
- **Errores:** Se loggean automáticamente

### Console Logs
```
🔔 Webhook MercadoPago recibido
💳 Procesando evento de pago - ID: 1234567890
✅ Transacción actualizada exitosamente
📧 Enviando confirmación de pago
```

### Verificación de Estado
- Dashboard del paciente se actualiza automáticamente
- Verificación manual disponible en páginas de resultado
- API endpoint para consultas programáticas

## 🚨 Troubleshooting

### Webhook no llega
1. Verificar URL pública (ngrok para local)
2. Confirmar configuración en MercadoPago
3. Revisar logs del servidor
4. Verificar que el puerto esté abierto

### Pago no se actualiza
1. Verificar webhook_logs en la base de datos
2. Confirmar que el external_reference coincida
3. Revisar estado en MercadoPago dashboard
4. Usar endpoint de consulta manual

### Errores de autenticación
1. Verificar credenciales en .env
2. Confirmar que esté en modo correcto (sandbox/production)
3. Verificar que la aplicación esté aprobada en MercadoPago

## 📱 Configuración para Producción

### 1. Variables de Entorno
```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-token-real
MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key
MERCADOPAGO_SANDBOX=false
FRONTEND_URL=https://tu-dominio.com
```

### 2. SSL/HTTPS Requerido
- MercadoPago requiere HTTPS para webhooks
- Configurar certificado SSL válido
- Verificar que la URL sea accesible públicamente

### 3. Firewall y Seguridad
- Permitir tráfico entrante al puerto de la aplicación
- Configurar rate limiting si es necesario
- Implementar logging robusto

## ✅ Checklist Final

- [ ] Webhook URL configurada en MercadoPago
- [ ] Eventos seleccionados correctamente
- [ ] Credenciales de producción configuradas
- [ ] URLs de retorno probadas
- [ ] Sistema de logs funcionando
- [ ] Notificaciones por email configuradas (opcional)
- [ ] Testing completo realizado
- [ ] Monitoreo implementado

---

## 🆘 Soporte

Si necesitas ayuda:
1. Revisar logs en `webhook_logs` table
2. Verificar configuración en MercadoPago Developer Dashboard
3. Consultar documentación oficial: https://www.mercadopago.com.co/developers/es/docs/webhooks
4. Testing con herramientas como Postman o curl

**¡El sistema de webhooks está completamente configurado y listo para producción! 🚀**
