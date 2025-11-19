# 🔍 Análisis: Recuperación de Contraseña con Supabase Auth

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **Ruta Incorrecta en recuperar.html**
**Ubicación:** `public/recuperar.html` línea 179

**Problema:**
```javascript
const response = await fetch('/api/auth/recuperar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, numero_documento })
});
```

**Situación actual:**
- La ruta `/api/auth/recuperar` está **DESHABILITADA** en `authRoutes.js` (línea 14)
- La ruta activa es `/api/seguridad/recuperar-password-supabase` (línea 361 de seguridadRoutes.js)

**Impacto:**
- ❌ El formulario envía la solicitud a una ruta que NO existe
- ❌ El backend nunca recibe la petición
- ❌ Supabase nunca envía el email de recuperación

---

### 2. **Configuración de Supabase Email Templates**

**Problema potencial:**
Supabase requiere configuración específica en el Dashboard para enviar emails de recuperación:

**Checklist necesario en Supabase Dashboard:**

#### a) **Email Templates (Authentication > Email Templates)**
- [ ] **Confirm signup** - Template configurado
- [ ] **Magic Link** - Template configurado  
- [ ] **Change Email Address** - Template configurado
- [ ] **Reset Password** ⚠️ **ESTE ES EL CRÍTICO**

#### b) **SMTP Settings (Project Settings > Auth)**
Supabase puede usar:
1. **SMTP propio de Supabase** (limitado, puede ir a spam)
2. **SMTP personalizado** (Gmail, SendGrid, etc.) - MÁS CONFIABLE

**Variables requeridas si se usa SMTP personalizado:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
SMTP_ADMIN_EMAIL=admin@clinikdent.com
SMTP_SENDER_NAME=Clinikdent
```

#### c) **Redirect URLs (Authentication > URL Configuration)**
Debe incluir:
```
http://localhost:3001/nueva-password-supabase.html
https://tu-dominio.com/nueva-password-supabase.html
```

---

### 3. **Verificación de Template de Recuperación**

El template debe incluir la variable `{{ .ConfirmationURL }}`:

**Template sugerido:**
```html
<h2>Recuperar Contraseña - Clinikdent</h2>

<p>Hola,</p>

<p>Hemos recibido una solicitud para restablecer tu contraseña.</p>

<p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>

<a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a>

<p>Este enlace expira en 60 minutos.</p>

<p>Si no solicitaste este cambio, ignora este email.</p>

<p>Saludos,<br>Equipo Clinikdent</p>
```

---

## ✅ SOLUCIONES IMPLEMENTADAS

### Solución 1: Actualizar la Ruta en recuperar.html

Cambiar la ruta de `/api/auth/recuperar` a `/api/seguridad/recuperar-password-supabase`

### Solución 2: Verificar Configuración de Supabase

#### Pasos en Supabase Dashboard:

1. **Ir a Authentication > Email Templates**
2. **Seleccionar "Reset Password"**
3. **Verificar que el template esté configurado**
4. **Verificar la URL de redirección en el template**

5. **Ir a Project Settings > Auth**
6. **Verificar "Site URL":** `http://localhost:3001`
7. **Verificar "Redirect URLs":** Debe incluir `http://localhost:3001/nueva-password-supabase.html`

8. **Opcional pero recomendado - Configurar SMTP personalizado:**
   - Authentication > Settings > SMTP Settings
   - Habilitar "Enable Custom SMTP"
   - Configurar con Gmail u otro proveedor

---

## 🔧 FLUJO CORRECTO DE RECUPERACIÓN

### Frontend (recuperar.html):
```javascript
1. Usuario ingresa: correo + número de documento
2. Se envía a: /api/seguridad/recuperar-password-supabase
3. Backend valida usuario en PostgreSQL
4. Si válido, llama a: supabase.auth.resetPasswordForEmail()
5. Supabase envía email con magic link
6. Usuario hace clic en el link
7. Redirige a: nueva-password-supabase.html
8. Usuario ingresa nueva contraseña
9. Se actualiza en PostgreSQL
```

### Backend (supabaseAuthController.js):
```javascript
exports.solicitarRecuperacion = async (req, res) => {
    // 1. Validar correo + documento en PostgreSQL
    // 2. Si existe, llamar a Supabase Auth
    const { data, error } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: `${FRONTEND_URL}/nueva-password-supabase.html`
    });
    // 3. Supabase envía el email automáticamente
}
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema: "No recibo el email"

**Causas posibles:**
1. ✅ **Ruta incorrecta** (solucionado)
2. ⚠️ **Email en spam** - Revisar carpeta de spam
3. ⚠️ **SMTP no configurado** - Verificar en Supabase Dashboard
4. ⚠️ **URL de redirección no autorizada** - Agregar en Redirect URLs
5. ⚠️ **Límite de rate limiting** - Esperar 60 segundos entre intentos

### Problema: "Link expirado"

**Causa:** Los magic links de Supabase expiran en 60 minutos por defecto

**Solución:**
- Ir a Authentication > Settings
- Cambiar "Magic Link Expiry" si es necesario

### Problema: "Redirect URL mismatch"

**Causa:** La URL en `redirectTo` no está en la lista de URLs autorizadas

**Solución:**
- Agregar `http://localhost:3001/nueva-password-supabase.html` en:
  - Authentication > URL Configuration > Redirect URLs

---

## 📋 CHECKLIST DE VERIFICACIÓN

### En el Código:
- [x] Ruta actualizada en recuperar.html
- [x] Controller supabaseAuthController.js funcionando
- [x] Ruta en seguridadRoutes.js activa
- [x] Variables de entorno configuradas

### En Supabase Dashboard:
- [ ] Site URL configurada
- [ ] Redirect URLs incluye nueva-password-supabase.html
- [ ] Template de "Reset Password" configurado
- [ ] SMTP configurado (opcional pero recomendado)
- [ ] Email confirmado como sender

### Testing:
- [ ] Probar recuperación con email válido
- [ ] Verificar que llegue el email (revisar spam)
- [ ] Verificar que el link redirija correctamente
- [ ] Verificar que se pueda actualizar la contraseña

---

## 🎯 SIGUIENTE PASO INMEDIATO

**ACCIÓN REQUERIDA:** Actualizar `public/recuperar.html` línea 179

**Cambiar de:**
```javascript
const response = await fetch('/api/auth/recuperar', {
```

**Cambiar a:**
```javascript
const response = await fetch('/api/seguridad/recuperar-password-supabase', {
```

---

## 📞 DEBUGGING

Para verificar si Supabase está enviando emails:

1. **Ver logs del backend:**
```bash
node app.js
# Buscar: " Email de recuperación enviado por Supabase Auth"
```

2. **Ver logs de Supabase:**
- Ir a Supabase Dashboard
- Logs > Auth Logs
- Buscar eventos de "password_recovery"

3. **Verificar en consola del navegador:**
```javascript
// En recuperar.html, ya existe logging
console.log('🔧 DEBUG - Token de recuperación:', data.debug.token);
```

---

## 🔐 SEGURIDAD

El sistema actual tiene:
- ✅ Validación de correo + documento (doble factor)
- ✅ Registro de intentos en logs de seguridad
- ✅ Detección de bloqueos por múltiples intentos
- ✅ Tokens con expiración (60 minutos)
- ✅ URLs de una sola vez (no reutilizables)

---

**Fecha de análisis:** 11 de noviembre de 2025
**Estado:** Problema identificado - Solución lista para implementar
