# ✅ SOLUCIÓN IMPLEMENTADA - Recuperación de Contraseña

## 🎯 PROBLEMA IDENTIFICADO

**Los usuarios NO están registrados en Supabase Auth**, solo en PostgreSQL.

Supabase Auth `resetPasswordForEmail()` **requiere** que el usuario exista en su sistema de autenticación para enviar emails. Como los usuarios solo están en PostgreSQL, el método nunca enviaba emails.

---

## ✅ SOLUCIÓN IMPLEMENTADA

**Sistema propio de recuperación con tokens y Nodemailer**

### Componentes Nuevos:

1. **Backend/controllers/recuperacionController.js** - Controlador con lógica de tokens
2. **Backend/scripts/add_reset_token_columns.sql** - Migración SQL
3. **Backend/scripts/migracion_reset_token.js** - Script de migración
4. **Rutas actualizadas** en seguridadRoutes.js
5. **Frontend actualizado** en reset-password.html

---

## 🔧 PASOS PARA ACTIVAR LA SOLUCIÓN

### 1️⃣ Ejecutar la Migración de Base de Datos

```bash
node Backend/scripts/migracion_reset_token.js
```

Esto agregará las columnas:
- `reset_token` (VARCHAR 255)
- `reset_token_expiry` (TIMESTAMP)

### 2️⃣ Verificar Variables de Entorno

Asegúrate de tener configurado en `.env`:

```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_gmail_aqui
FRONTEND_URL=http://localhost:3001
```

**Obtener contraseña de aplicación de Gmail:**
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Correo" > "Otro (personalizado)"
3. Nombra: "Clinikdent"
4. Copia la contraseña de 16 caracteres
5. Pégala en `EMAIL_PASS` del .env

### 3️⃣ Reiniciar el Servidor

```bash
# Detener el servidor actual (Ctrl+C)
node app.js
```

### 4️⃣ Probar la Recuperación

1. Ir a: http://localhost:3001/recuperar.html
2. Ingresar email y documento válidos
3. Click en "Enviar Instrucciones"
4. Revisar email (incluyendo spam)
5. Click en el link del email
6. Ingresar nueva contraseña

---

## 📊 FLUJO COMPLETO

```
1. Usuario → recuperar.html
   ↓
2. POST /api/seguridad/recuperar-password-supabase
   {correo, numero_documento}
   ↓
3. Backend valida usuario en PostgreSQL
   ↓
4. Genera token único (crypto.randomBytes)
   Token original: abcd1234...
   Token hash (SHA-256): guardado en BD
   ↓
5. Guarda en BD:
   - reset_token: hash del token
   - reset_token_expiry: NOW() + 60 minutos
   ↓
6. Envía email con Nodemailer
   URL: http://localhost:3001/reset-password.html?token=abcd1234...
   ↓
7. Usuario hace click → reset-password.html
   ↓
8. POST /api/seguridad/reset-password-token
   {token, nueva_password}
   ↓
9. Backend valida:
   - Hash del token coincide
   - Token no ha expirado
   ↓
10. Actualiza contraseña en BD
    Limpia reset_token y reset_token_expiry
    ↓
11. Usuario redirigido a /index.html
```

---

## 🔐 SEGURIDAD

### Características de Seguridad:

✅ **Token único de un solo uso**
- Generado con `crypto.randomBytes(32)` (256 bits)
- Almacenado como hash SHA-256
- Se elimina después de usarlo

✅ **Expiración automática**
- Tokens válidos por 60 minutos
- Verificación en BD antes de aceptar

✅ **Validación de usuario**
- Requiere correo + número de documento
- Previene ataques de enumeración

✅ **Rate limiting**
- Sistema de bloqueos de SeguridadService
- Previene ataques de fuerza bruta

✅ **Logging completo**
- Registro de todos los intentos
- Auditoría de seguridad

---

## 🧪 PRUEBAS

### Test Manual:

1. **Probar con usuario válido:**
   ```
   Email: camila@example.com
   Documento: 12345678
   ```

2. **Probar con usuario inválido:**
   ```
   Email: noexiste@example.com
   Documento: 00000000
   ```
   Debe retornar: "Usuario o documento no encontrado"

3. **Probar token expirado:**
   - Solicitar recuperación
   - Esperar 61 minutos
   - Intentar usar el link
   Debe retornar: "Token inválido o expirado"

4. **Probar reutilización de token:**
   - Cambiar contraseña exitosamente
   - Intentar usar el mismo link otra vez
   Debe retornar: "Token inválido o expirado"

### Script de Prueba Automatizado:

```javascript
// Ejecutar en consola del navegador
async function testRecuperacion() {
    const response = await fetch('/api/seguridad/recuperar-password-supabase', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            correo: 'test@example.com',
            numero_documento: '12345678'
        })
    });
    const data = await response.json();
    console.log('Resultado:', data);
}

testRecuperacion();
```

---

## 📧 TEMPLATE DEL EMAIL

El email enviado incluye:
- ✅ Diseño profesional con colores corporativos
- ✅ Botón CTA prominente
- ✅ Link alternativo (texto)
- ✅ Advertencia de expiración (60 minutos)
- ✅ Nota de seguridad
- ✅ Footer corporativo

---

## ❌ POSIBLES ERRORES Y SOLUCIONES

### Error: "Error al enviar email"

**Causa:** Configuración SMTP incorrecta

**Solución:**
```bash
# Verificar .env
echo $EMAIL_USER
echo $EMAIL_PASS

# Probar manualmente
node -e "require('nodemailer').createTransporter({service:'gmail',auth:{user:process.env.EMAIL_USER,pass:process.env.EMAIL_PASS}}).verify().then(console.log).catch(console.error)"
```

### Error: "Token inválido o expirado"

**Causas posibles:**
1. Token ya fue usado
2. Pasaron más de 60 minutos
3. Token incorrecto en la URL

**Solución:** Solicitar un nuevo link

### Error: "Usuario o documento no encontrado"

**Causa:** Datos incorrectos

**Solución:** Verificar email y documento en la BD

### Email va a SPAM

**Solución:**
1. Verificar que `EMAIL_USER` esté verificado en Gmail
2. Agregar remitente a contactos
3. Marcar como "No es spam"
4. Considerar usar servicio profesional (SendGrid, AWS SES)

---

## 📋 CHECKLIST POST-IMPLEMENTACIÓN

- [ ] Ejecutar migración de BD
- [ ] Configurar EMAIL_USER y EMAIL_PASS en .env
- [ ] Reiniciar servidor
- [ ] Probar con usuario real
- [ ] Verificar que llegue el email
- [ ] Probar cambio de contraseña
- [ ] Verificar que token se elimine después de uso
- [ ] Probar expiración de token (esperar 61 min)
- [ ] Revisar logs del backend

---

## 🎉 VENTAJAS DE ESTA SOLUCIÓN

✅ **Independiente de Supabase Auth**
- No requiere migrar usuarios a Supabase
- Control total del flujo
- Más flexible

✅ **Más Seguro**
- Tokens únicos de un solo uso
- Hash SHA-256
- Expiración automática

✅ **Mejor UX**
- Emails personalizados
- Diseño corporativo
- Mensajes claros

✅ **Fácil de Mantener**
- Código claro y documentado
- Todo en tu BD
- Logs completos

---

## 📞 DEBUGGING

### Ver logs del servidor:
```bash
node app.js

# Buscar:
✅ Usuario verificado: email@example.com
🔑 Token de recuperación generado y guardado
✅ Email de recuperación enviado exitosamente a: email@example.com
```

### Verificar en la BD:
```sql
SELECT 
    correo, 
    reset_token, 
    reset_token_expiry,
    CASE 
        WHEN reset_token_expiry > NOW() THEN 'Válido'
        ELSE 'Expirado'
    END as estado
FROM usuarios 
WHERE reset_token IS NOT NULL;
```

### Ver emails enviados (Gmail):
1. Ir a Gmail
2. Enviados
3. Buscar: "Recuperación de Contraseña - Clinikdent"

---

**Fecha de implementación:** 11 de noviembre de 2025
**Estado:** ✅ Listo para probar (después de ejecutar migración)
**Próximo paso:** Ejecutar `node Backend/scripts/migracion_reset_token.js`
