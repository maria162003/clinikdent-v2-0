# 🚀 MIGRACIÓN DE USUARIOS A SUPABASE AUTH

## 📋 PASOS PARA MIGRAR USUARIOS EXISTENTES

### 1️⃣ Obtener el Service Role Key de Supabase

1. Ve a: https://supabase.com/dashboard/project/xzlugnkzfdurczwwwimv/settings/api
2. Busca la sección **"Project API keys"**
3. Copia el **"service_role" key** (el secret, NO el anon key)
   - Es un token largo que empieza con `eyJ...`
   - ⚠️ IMPORTANTE: Este key tiene permisos de admin, mantenlo seguro

### 2️⃣ Agregar el Service Role Key al .env

Abre el archivo `.env` y agrega esta línea:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...  (tu key completo)
```

### 3️⃣ Ejecutar el script de migración

```bash
node Backend/scripts/migrar_usuarios_supabase_v2.js
```

---

## 🔧 QUÉ HACE EL SCRIPT

1. **Lee todos los usuarios** de PostgreSQL
2. **Crea cada usuario en Supabase Auth** con:
   - Email confirmado automáticamente
   - Contraseña temporal segura
   - Metadata (nombre, apellido, documento)
3. **Vincula** el `supabase_user_id` en PostgreSQL
4. **Muestra contraseñas temporales** (opcional: enviar emails)

---

## 📊 RESULTADO ESPERADO

```
🔄 Procesando: usuario@example.com (ID: 1)
   ✅ Creado en Supabase Auth (a1b2c3d4-...)
   ✅ Vinculado en PostgreSQL
   🔑 Contraseña temporal: TempXyz123!

📊 RESUMEN:
✅ Usuarios creados: 15
ℹ️  Ya existían: 2
❌ Errores: 0
📋 Total: 17
```

---

## ⚠️ IMPORTANTE DESPUÉS DE LA MIGRACIÓN

Los usuarios migrados tendrán **contraseñas temporales**.

### Opción 1: Forzar cambio de contraseña (RECOMENDADO)

Después de migrar, ejecuta:

```bash
node Backend/scripts/enviar_emails_reseteo_masivo.js
```

Esto enviará un email de "Restablecer contraseña" a todos los usuarios migrados.

### Opción 2: Informar a los usuarios

Envía un email manual diciendo:
```
"Hemos actualizado nuestro sistema de seguridad.
Por favor, usa 'Olvidé mi contraseña' en el login
para establecer una nueva contraseña."
```

---

## 🔍 VERIFICAR LA MIGRACIÓN

### En Supabase Dashboard:

1. Ve a: https://supabase.com/dashboard/project/xzlugnkzfdurczwwwimv/auth/users
2. Deberías ver todos tus usuarios listados

### En PostgreSQL:

```sql
SELECT 
    id, 
    correo, 
    nombre, 
    apellido,
    supabase_user_id,
    CASE 
        WHEN supabase_user_id IS NOT NULL THEN '✅ Migrado'
        ELSE '❌ Pendiente'
    END as estado
FROM usuarios
ORDER BY id;
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: "Failed to create user: User already registered"

**Causa:** El email ya existe en Supabase Auth

**Solución:** El script detecta esto automáticamente y vincula el usuario existente

### Error: "Invalid API key"

**Causa:** SUPABASE_SERVICE_ROLE_KEY incorrecto o faltante

**Solución:**
1. Verifica que copiaste el **service_role** key (no el anon key)
2. Verifica que no tenga espacios al inicio/final
3. Reinicia el script

### Error: "Rate limit exceeded"

**Causa:** Demasiadas solicitudes muy rápido

**Solución:** El script ya incluye pausas de 100ms entre usuarios. Si aún falla, aumenta el delay.

---

## 🔄 SI ALGO SALE MAL

El script es **seguro** y puede ejecutarse múltiples veces:
- No duplica usuarios
- Detecta usuarios ya migrados
- Salta usuarios con errores y continúa

Para reintentar:
```bash
node Backend/scripts/migrar_usuarios_supabase_v2.js
```

---

## 📞 NECESITAS AYUDA?

Si tienes problemas:

1. Verifica los logs del script
2. Verifica el dashboard de Supabase
3. Verifica la BD PostgreSQL
4. Contacta soporte si el error persiste
