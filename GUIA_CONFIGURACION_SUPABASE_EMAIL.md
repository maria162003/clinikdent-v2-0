# 📧 Guía de Configuración - Email Templates en Supabase

## 🎯 Objetivo
Configurar correctamente los emails de recuperación de contraseña en Supabase Auth.

---

## 📋 Pasos en Supabase Dashboard

### 1️⃣ Acceder al Dashboard
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **xzlugnkzfdurczwwwimv**
3. Ve a **Authentication** (menú lateral)

---

### 2️⃣ Configurar URL de Redirección

**Ubicación:** `Authentication > URL Configuration`

#### Site URL:
```
http://localhost:3001
```

#### Redirect URLs (agregar ambas):
```
http://localhost:3001/nueva-password-supabase.html
http://localhost:3001/*
```

**💡 Nota:** En producción, agrega también tu dominio real:
```
https://tu-dominio.com/nueva-password-supabase.html
https://tu-dominio.com/*
```

---

### 3️⃣ Configurar Template de Email

**Ubicación:** `Authentication > Email Templates`

#### Seleccionar: "Reset Password"

**Template HTML recomendado:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña - Clinikdent</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0077b6, #00a3e1); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Clinikdent</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Recuperación de Contraseña</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hola,</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Clinikdent.
                            </p>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Haz clic en el siguiente botón para crear una nueva contraseña:
                            </p>
                            
                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{{ .ConfirmationURL }}" 
                                           style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #0077b6, #00a3e1); color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                                            Restablecer Contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                            </p>
                            
                            <p style="color: #0077b6; font-size: 14px; word-break: break-all; text-align: center; margin: 0 0 30px 0;">
                                {{ .ConfirmationURL }}
                            </p>
                            
                            <!-- Info Box -->
                            <table width="100%" cellpadding="15" cellspacing="0" border="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0;">
                                <tr>
                                    <td>
                                        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                                            ⚠️ <strong>Importante:</strong> Este enlace expirará en <strong>60 minutos</strong> por seguridad.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña no cambiará hasta que crees una nueva.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                                © 2025 Clinikdent. Todos los derechos reservados.<br>
                                Este es un correo automático, por favor no respondas a este mensaje.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**⚠️ IMPORTANTE:** La variable `{{ .ConfirmationURL }}` es obligatoria y la genera Supabase automáticamente.

---

### 4️⃣ Configurar SMTP (Recomendado)

**Ubicación:** `Project Settings > Auth > SMTP Settings`

#### Opción A: SMTP de Supabase (Por defecto)
- ✅ Fácil de configurar
- ⚠️ Puede ir a carpeta SPAM
- ⚠️ Limitado a 4 emails/hora en plan gratuito

#### Opción B: SMTP Personalizado (Recomendado) ⭐

**Para Gmail:**

1. **Crear contraseña de aplicación:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Inicia sesión con tu cuenta Gmail
   - Selecciona "Correo" y "Otro (personalizado)"
   - Nombra: "Clinikdent Supabase"
   - Copia la contraseña generada (16 caracteres)

2. **Configurar en Supabase:**
   ```
   Enable Custom SMTP: ✅ Activar
   
   Sender email: tu-email@gmail.com
   Sender name: Clinikdent
   
   Host: smtp.gmail.com
   Port number: 587
   Username: tu-email@gmail.com
   Password: [contraseña de aplicación de 16 dígitos]
   ```

3. **Guardar y probar**

**Para SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [tu API key de SendGrid]
```

---

### 5️⃣ Verificar Rate Limits

**Ubicación:** `Project Settings > Auth > Rate Limits`

**Configuración recomendada:**
```
Email sending rate limit: 4 emails per hour (plan gratuito)
```

**💡 Nota:** Si necesitas más emails, considera:
- Upgrade a plan Pro
- Usar SMTP personalizado (sin límites de Supabase)

---

## 🧪 Probar la Configuración

### Método 1: Desde el Dashboard
1. Ve a `Authentication > Users`
2. Encuentra un usuario de prueba
3. Click en `⋮` (tres puntos)
4. Selecciona "Send password reset email"
5. Verifica que llegue el email

### Método 2: Desde la Aplicación
1. Abre: http://localhost:3001/recuperar.html
2. Ingresa email y documento válidos
3. Click en "Enviar Instrucciones"
4. Revisa tu email (incluyendo SPAM)

### Método 3: Script de Prueba
1. Abre la consola del navegador
2. Ejecuta el script: `public/js/test-recuperacion.js`

---

## 🔍 Verificar Logs

**Ubicación:** `Logs > Auth Logs`

**Buscar eventos:**
- `user.password_recovery.requested` - Solicitud enviada ✅
- `user.password_recovery.sent` - Email enviado ✅
- `user.password_recovery.failed` - Error ❌

**Filtros útiles:**
```
Event: password_recovery
User: email@ejemplo.com
Time range: Last hour
```

---

## ❌ Solución de Problemas

### Problema: "No recibo el email"

**Checklist:**
- [ ] Revisar carpeta de SPAM/Promociones
- [ ] Verificar que el email esté registrado en Supabase Auth
- [ ] Verificar configuración SMTP
- [ ] Revisar Auth Logs en Supabase
- [ ] Verificar límite de rate limit
- [ ] Esperar 1-2 minutos (puede tardar)

**En Auth Logs, buscar:**
```json
{
  "error": "rate_limit_exceeded",
  "msg": "Too many emails sent"
}
```
→ **Solución:** Esperar 1 hora o configurar SMTP personalizado

### Problema: "Invalid redirect URL"

**Checklist:**
- [ ] Verificar Redirect URLs en Supabase
- [ ] Verificar FRONTEND_URL en .env
- [ ] Verificar redirectTo en supabaseAuthController.js

**En Auth Logs, buscar:**
```json
{
  "error": "invalid_redirect_url",
  "url": "http://..."
}
```
→ **Solución:** Agregar la URL a Redirect URLs en Supabase

### Problema: "Link expired"

**Causa:** El link expira en 60 minutos

**Solución:**
- Solicitar un nuevo link
- Cambiar el tiempo de expiración en:
  `Authentication > Settings > Magic Link Expiry`

---

## 📊 Monitoreo

### Métricas a vigilar:
- **Email delivery rate:** >95% exitosos
- **Click-through rate:** % de usuarios que hacen click
- **Time to click:** Tiempo promedio hasta que hacen click
- **Bounce rate:** Emails rechazados

**Ubicación:** `Authentication > Stats`

---

## 🚀 Producción

### Antes de ir a producción:

1. **Actualizar URLs:**
   ```
   Site URL: https://tu-dominio.com
   Redirect URLs: https://tu-dominio.com/nueva-password-supabase.html
   ```

2. **Configurar SMTP personalizado:**
   - Usar servicio profesional (SendGrid, AWS SES, Mailgun)
   - Configurar SPF, DKIM, DMARC
   - Verificar dominio

3. **Personalizar email:**
   - Agregar logo de la empresa
   - Usar colores corporativos
   - Agregar información de contacto

4. **Testing:**
   - Probar desde diferentes proveedores (Gmail, Outlook, Yahoo)
   - Verificar en móvil
   - Verificar que no vaya a SPAM

---

## 📞 Soporte

**Documentación oficial:**
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/auth/auth-smtp

**Community:**
- https://github.com/supabase/supabase/discussions

---

**Última actualización:** 11 de noviembre de 2025
**Versión:** 1.0
