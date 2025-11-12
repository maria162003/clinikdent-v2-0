# 📧 Sistema de Notificaciones por Email - Citas

## ✅ Implementación Completa

Se han implementado notificaciones automáticas por correo electrónico para los siguientes eventos:

### 1. **Cita Cancelada** ❌
- **Trigger**: Cuando se cancela una cita mediante `DELETE /api/citas/:id_cita`
- **Destinatario**: Paciente afectado
- **Contenido del Email**:
  - Información de la cita cancelada (fecha, hora, motivo)
  - Razón de cancelación (si se proporciona)
  - Diseño profesional con colores y formato HTML
  - Marca visual de ClinikDent

### 2. **Cita Reprogramada** 🔄
- **Trigger**: Cuando se modifica la fecha u hora de una cita mediante `PUT /api/citas/:id_cita`
- **Destinatario**: Paciente afectado
- **Contenido del Email**:
  - Comparación visual entre cita anterior y nueva cita
  - Fecha y hora anterior (tachado en rojo)
  - Nueva fecha y hora (resaltado en verde)
  - Motivo de la cita
  - Recordatorio de asistir en la nueva fecha

---

## 📁 Archivos Modificados

### 1. `Backend/services/emailService.js`
**Nuevos métodos agregados:**
- `sendCitaCanceladaEmail(to, datosCita)` - Envía notificación de cancelación
- `sendCitaReprogramadaEmail(to, datosCita)` - Envía notificación de reprogramación

**Parámetros de `datosCita` para cancelación:**
```javascript
{
  paciente_nombre: "Juan Pérez",
  fecha: Date,
  hora: "10:00",
  motivo: "Limpieza dental",
  motivo_cancelacion: "Emergencia médica"
}
```

**Parámetros de `datosCita` para reprogramación:**
```javascript
{
  paciente_nombre: "María González",
  fecha_anterior: Date,
  hora_anterior: "14:00",
  fecha_nueva: Date,
  hora_nueva: "16:00",
  motivo: "Control de ortodoncia"
}
```

### 2. `Backend/controllers/citaController.js`
**Funciones modificadas:**

#### `exports.cancelarCita`
- Ahora incluye JOIN con tabla `usuarios` para obtener datos del paciente
- Envía email automáticamente al paciente cuando se cancela la cita
- Acepta parámetro opcional `motivo_cancelacion` en el body
- Manejo de errores: no falla la operación si el email falla

#### `exports.reagendarCita`
- Ahora incluye JOIN con tabla `usuarios` para obtener datos del paciente
- Detecta si hubo cambio de fecha u hora
- Envía email solo si la fecha o hora cambiaron
- Guarda fecha/hora anterior para comparación en el email
- Manejo de errores: no falla la operación si el email falla

---

## 🎨 Diseño de los Emails

### Características del diseño:
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Profesional**: Gradientes, colores corporativos, iconos
- **Claro**: Información estructurada en bloques
- **Marca**: Logo y colores de ClinikDent
- **Accesible**: Alto contraste, fuentes legibles

### Estructura visual:
1. **Header**: Gradiente morado con icono y título
2. **Body**: Fondo claro con tarjetas de información
3. **Footer**: Información de copyright y aviso de email automático

---

## 🧪 Testing

**Script de prueba creado:** `scripts/test_email_notifications.js`

**Ejecutar pruebas:**
```bash
node scripts/test_email_notifications.js
```

**Resultados de las pruebas:**
```
✅ Email enviado a test@example.com: <7bef485d-a607-3d45-b637-b9c726e46a5b@gmail.com>
✅ Email enviado a test@example.com: <73bee439-7c4d-02e8-c69a-efb3603db783@gmail.com>
✅ Pruebas completadas exitosamente!
```

---

## 📋 Endpoints Afectados

### 1. `DELETE /api/citas/:id_cita` - Cancelar Cita
**Request Body (opcional):**
```json
{
  "motivo_cancelacion": "Emergencia médica"
}
```

**Response:**
```json
{
  "msg": "Cita cancelada exitosamente.",
  "cita": {
    "id": 123,
    "estado": "cancelada"
  }
}
```

**Efecto secundario:** Email enviado al paciente

---

### 2. `PUT /api/citas/:id_cita` - Reagendar Cita
**Request Body:**
```json
{
  "fecha": "2025-11-20",
  "hora": "16:00",
  "motivo": "Control de ortodoncia",
  "notas": "Reagendado por petición del paciente"
}
```

**Response:**
```json
{
  "msg": "Cita actualizada exitosamente.",
  "cita": {
    "id": 123,
    "fecha": "2025-11-20",
    "hora": "16:00",
    "estado": "programada",
    ...
  }
}
```

**Efecto secundario:** Email enviado al paciente (solo si cambió fecha u hora)

---

## ⚙️ Configuración Requerida

El sistema usa las credenciales SMTP configuradas en `.env`:

```env
EMAIL_USER=mariacamilafontalvolopez@gmail.com
EMAIL_PASS=tu_app_password_aqui
```

**Estado actual:** ✅ SMTP configurado y verificado

---

## 🔄 Flujo de Notificaciones

### Cancelación:
```
1. Usuario cancela cita → DELETE /api/citas/:id
2. Backend valida restricciones (2 horas anticipación)
3. Backend actualiza estado a "cancelada"
4. Backend obtiene correo del paciente
5. Backend envía email de notificación
6. Respuesta al cliente con confirmación
```

### Reprogramación:
```
1. Usuario modifica cita → PUT /api/citas/:id
2. Backend valida datos (no domingos, etc.)
3. Backend compara fecha/hora anterior vs nueva
4. Backend actualiza la cita
5. Si hubo cambio de fecha/hora → envía email
6. Respuesta al cliente con confirmación
```

---

## 📊 Logs del Sistema

### Cancelación exitosa:
```
❌ [citaController] Cancelando cita ID: 123
📧 Enviando notificación de cancelación al paciente...
✅ Email enviado a paciente@example.com: <message-id>
✅ Correo de cancelación enviado exitosamente
✅ Cita cancelada exitosamente
```

### Reprogramación exitosa:
```
🔄 [citaController] Actualizando cita ID: 123
📧 Enviando notificación de reprogramación al paciente...
✅ Email enviado a paciente@example.com: <message-id>
✅ Correo de reprogramación enviado exitosamente
✅ Cita actualizada exitosamente
```

---

## 🛡️ Manejo de Errores

- **Email falla, operación continúa**: Si el envío de email falla, la cita se cancela/reprograma de todas formas
- **Paciente sin correo**: No se intenta enviar email
- **SMTP no configurado**: Sistema entra en modo DEMO (solo logs)

---

## ✨ Características Destacadas

1. **No bloquea operaciones**: Los emails se envían de forma asíncrona
2. **Diseño profesional**: HTML con estilos inline para compatibilidad
3. **Información completa**: Todos los detalles relevantes de la cita
4. **Fácil de probar**: Script de prueba incluido
5. **Logs detallados**: Seguimiento completo del envío
6. **Modo DEMO**: Para desarrollo sin credenciales SMTP

---

## 📝 Notas Importantes

- Los emails NO permiten respuesta automática (como se solicitó)
- Solo se envía al paciente afectado (no a otros usuarios)
- Los emails son transaccionales (no promocionales)
- El diseño es responsive y compatible con la mayoría de clientes de email

---

## 🎯 Conclusión

✅ **Sistema implementado y probado exitosamente**

- Notificaciones de cancelación funcionando
- Notificaciones de reprogramación funcionando
- Emails con diseño profesional
- SMTP configurado y verificado
- Sin respuesta automática (como se requirió)
- Solo para clientes afectados

**Estado:** ✅ PRODUCCIÓN READY
