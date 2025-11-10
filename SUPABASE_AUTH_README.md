# 🔐 Recuperación de Contraseña con Supabase Auth

## 📝 Descripción
Sistema de recuperación de contraseña implementado con **Supabase Auth**, reemplazando el sistema anterior de códigos numéricos por **magic links** (enlaces mágicos).

---

## ✨ Características

- ✅ **Magic Links**: Enlaces seguros con JWT en lugar de códigos de 6 dígitos
- ✅ **Mayor Seguridad**: Tokens firmados criptográficamente por Supabase
- ✅ **UX Mejorada**: Usuario elige su propia contraseña
- ✅ **Automático**: Expiración y limpieza manejada por Supabase
- ✅ **Sin columnas extra**: No requiere campos adicionales en la base de datos

---

## 📦 Dependencias

```json
{
  "@supabase/supabase-js": "^2.x.x"
}
```

**Instalación:**
```bash
npm install @supabase/supabase-js
```

---

## ⚙️ Configuración

### 1. Variables de Entorno (`.env`)

```env
# Supabase
SUPABASE_URL=https://xzlugnkzfdurczwwwimv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=http://localhost:3001
```

### 2. Supabase Dashboard

**⚠️ IMPORTANTE**: Configurar en https://supabase.com/dashboard

1. Ir a tu proyecto → **Authentication** → **URL Configuration**
2. Configurar:
   ```
   Site URL: http://localhost:3001
   
   Redirect URLs:
   - http://localhost:3001/nueva-password-supabase.html
   - http://localhost:3001/reset-password.html
   ```

---

## 🚀 Cómo Funciona

### Flujo Completo:

```
1. Usuario solicita recuperación
   ↓
2. Sistema valida correo + documento
   ↓
3. Supabase envía email con magic link
   ↓
4. Usuario hace clic en el link
   ↓
5. Se abre página para nueva contraseña
   ↓
6. Usuario ingresa su nueva contraseña
   ↓
7. Sistema actualiza en Supabase Auth
```

### Endpoints API:

#### POST `/api/seguridad/solicitar-recuperacion`
Solicita recuperación de contraseña.

**Body:**
```json
{
  "correo": "usuario@email.com",
  "numero_documento": "1234567890"
}
```

**Response exitosa:**
```json
{
  "msg": "Se ha enviado un enlace de recuperación a su correo electrónico.",
  "success": true,
  "metodo": "magic_link"
}
```

#### POST `/api/seguridad/actualizar-password`
Actualiza la contraseña con el token recibido.

**Body:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nueva_password": "NuevaContraseña123!"
}
```

**Response exitosa:**
```json
{
  "msg": "Contraseña actualizada exitosamente.",
  "success": true
}
```

---

## 📄 Archivos del Sistema

### Backend

**`Backend/config/supabase.js`**
```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
```

**`Backend/controllers/supabaseAuthController.js`**
- `solicitarRecuperacion()`: Envía magic link via Supabase
- `actualizarPassword()`: Actualiza contraseña con token

**`Backend/routes/seguridadRoutes.js`**
Rutas actualizadas para usar el nuevo controller.

### Frontend

**`public/recuperar-password-supabase.html`**
Página para solicitar recuperación (Paso 1).

**`public/nueva-password-supabase.html`**
Página donde el usuario cambia su contraseña (Paso 2).

**`public/index.html`** (Modal actualizado)
Modal de recuperación en la página principal.

---

## 🧪 Pruebas

### 1. Probar Solicitud de Recuperación

```bash
curl -X POST http://localhost:3001/api/seguridad/solicitar-recuperacion \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test@example.com",
    "numero_documento": "1234567890"
  }'
```

### 2. Probar desde el Frontend

```
1. Ir a: http://localhost:3001
2. Clic "Iniciar Sesión" → "Olvidé mi contraseña"
3. Ingresar correo + documento
4. Revisar email de Supabase
5. Hacer clic en el link
6. Ingresar nueva contraseña
```

---

## 📊 Comparación: Antes vs Después

| Característica | Sistema Antiguo | Supabase Auth |
|----------------|----------------|---------------|
| **Método** | Código 6 dígitos | Magic Link (JWT) |
| **Almacenamiento** | 2 columnas en DB | Supabase interno |
| **Seguridad** | Media | Alta ✅ |
| **Expiración** | Manual (60 min) | Automática |
| **Email** | nodemailer | Supabase SMTP |
| **Código** | ~300 líneas | ~150 líneas |
| **Mantenimiento** | Alto | Bajo ✅ |
| **UX** | 3 pasos | 2 pasos ✅ |

---

## 🗑️ Archivos Eliminados

- `Backend/controllers/recuperacionSeguridadController.js` (obsoleto)
- Columnas `reset_token` y `reset_token_expires` de tabla `usuarios`

---

## 🔮 Futuro: Mejoras Posibles

1. **Personalizar template de email** en Supabase Dashboard
2. **Agregar 2FA** (autenticación de dos factores)
3. **Migrar login completo** a Supabase Auth
4. **Login social** (Google, GitHub, etc.)

---

## 📞 Soporte

Si el email no llega:
1. Verificar configuración de Redirect URLs en Supabase
2. Revisar spam/correo no deseado
3. Verificar logs del servidor
4. Confirmar que `SUPABASE_URL` y `SUPABASE_ANON_KEY` son correctos

---

**Versión**: 2.0  
**Fecha**: Noviembre 2025  
**Estado**: ✅ Producción Ready
