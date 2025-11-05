# 🔧 Solución Error Gmail SMTP

## ❌ Error Actual:
```
Error verificando conexión SMTP: Invalid login: 535-5.7.8 Username and Password not accepted
```

## 🎯 Causa:
La **Contraseña de Aplicación de Gmail está incorrecta, expirada o revocada**.

---

## ✅ SOLUCIÓN PASO A PASO:

### 1. **Generar Nueva Contraseña de Aplicación**

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Haz clic en **"Seguridad"** en el menú lateral
3. Busca **"Verificación en dos pasos"** (debe estar ACTIVADA)
   - Si no está activada, actívala primero
4. Desplázate hacia abajo hasta **"Contraseñas de aplicaciones"**
5. Haz clic en **"Contraseñas de aplicaciones"**
6. Selecciona:
   - **App:** Correo
   - **Dispositivo:** Windows Computer (o el que uses)
7. Haz clic en **"Generar"**
8. **Copia la contraseña de 16 caracteres** (sin espacios)
   - Ejemplo: `abcd efgh ijkl mnop` → Copiar como: `abcdefghijklmnop`

---

### 2. **Actualizar el archivo `.env`**

Abre el archivo `.env` en la raíz del proyecto y actualiza:

```env
EMAIL_USER=mariacamilafontalvolopez@gmail.com
EMAIL_PASS=TU_NUEVA_CONTRASEÑA_DE_16_DIGITOS_AQUI
SUPPORT_EMAIL=mariacamilafontalvolopez@gmail.com
```

**Importante:** 
- La contraseña debe ser DE 16 CARACTERES sin espacios
- NO uses tu contraseña normal de Gmail
- Usa la contraseña de aplicación generada en el paso 1

---

### 3. **Reiniciar el Servidor**

Después de actualizar el `.env`:

1. Detén el servidor si está corriendo (Ctrl + C)
2. Ejecuta de nuevo:
   ```bash
   node app.js
   ```

---

## 🔍 Verificar que Funciona:

Deberías ver:
```
✅ Conexión SMTP verificada exitosamente
📧 Email configurado para: mariacamilafontalvolopez@gmail.com
```

En lugar de:
```
❌ Error verificando conexión SMTP
🔄 Cambiando a modo DEMO
```

---

## 🆘 Si Sigue Fallando:

### Opción A: Verificar que la verificación en dos pasos esté activa
```
https://myaccount.google.com/security
```

### Opción B: Usar otro correo
Si no puedes activar contraseñas de aplicación:
1. Crea una nueva cuenta de Gmail
2. Activa la verificación en dos pasos
3. Genera contraseña de aplicación
4. Actualiza `EMAIL_USER` y `EMAIL_PASS` en `.env`

### Opción C: Modo DEMO (temporal)
El sistema ya tiene un modo DEMO que se activa automáticamente si falla SMTP.
Los códigos se mostrarán en la consola en lugar de enviarse por email.

---

## ✅ Resumen de Archivos Corregidos:

1. ✅ **Backend/.env** - Sincronizado con configuración Supabase
2. ⏳ **EMAIL_PASS** - Pendiente: Necesitas generar nueva contraseña de aplicación

---

## 📝 Notas:

- **No compartas tu contraseña de aplicación**
- La contraseña actual `ngan twfv wcbl gjig` está siendo rechazada por Gmail
- Probablemente fue revocada o expiró
- Genera una nueva siguiendo los pasos de arriba
