# ClinikDent - Despliegue en la Nube

## 🚀 Arquitectura de Despliegue

```
┌─────────────────────┐
│  Cloudflare Pages   │  ← Frontend (HTML/CSS/JS)
│  (97c40012.pages.dev)│
└──────────┬──────────┘
           │
           │ API Calls
           ▼
┌─────────────────────┐
│   Render / Railway  │  ← Backend (Node.js + Express)
│   (por configurar)  │
└──────────┬──────────┘
           │
           │ Database
           ▼
┌─────────────────────┐
│   Supabase          │  ← PostgreSQL Database
│   (ya configurado)  │
└─────────────────────┘
```

## ✅ Frontend YA DESPLEGADO

🌐 **URL:** https://97c40012.clinikdent.pages.dev

**Servicio:** Cloudflare Pages  
**Carpeta publicada:** `public/`

### Comandos para actualizar frontend:
```bash
cd Clinikdent_supabase_1.0
wrangler pages deploy public --project-name=clinikdent
```

## 📋 BACKEND - Pasos para desplegar en Render

### 1️⃣ Preparar el repositorio

El proyecto ya tiene los archivos necesarios:
- ✅ `package.json` - Dependencias y scripts
- ✅ `render.yaml` - Configuración de Render
- ✅ `.env.example` - Variables de entorno de ejemplo

### 2️⃣ Crear cuenta en Render

1. Ve a https://render.com
2. Regístrate con tu cuenta de GitHub
3. Conecta tu repositorio `clinikdent-v2-0`

### 3️⃣ Crear Web Service

1. En Render Dashboard, click "New +" → "Web Service"
2. Selecciona el repositorio `maria162003/clinikdent-v2-0`
3. Configuración:
   - **Name:** `clinikdent-backend`
   - **Region:** Oregon (US West)
   - **Branch:** `feature/sistema-reportes-postgresql` (o `main`)
   - **Root Directory:** `Clinikdent_supabase_1.0`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 4️⃣ Configurar Variables de Entorno

En Render, añade estas variables de entorno (pestaña "Environment"):

```env
NODE_ENV=production
PORT=3000

# PostgreSQL/Supabase
PGHOST=aws-1-sa-east-1.pooler.supabase.com
PGUSER=postgres.xzlugnkzfdurczwwwimv
PGPASSWORD=<TU_PASSWORD_SUPABASE>
PGDATABASE=postgres
PGPORT=5432

# Variables legacy
DB_HOST=aws-1-sa-east-1.pooler.supabase.com
DB_USER=postgres.xzlugnkzfdurczwwwimv
DB_PASSWORD=<TU_PASSWORD_SUPABASE>
DB_NAME=postgres
DB_PORT=5432

# Supabase
SUPABASE_URL=https://xzlugnkzfdurczwwwimv.supabase.co
SUPABASE_ANON_KEY=<TU_SUPABASE_ANON_KEY>

# Seguridad (Render los genera automáticamente)
JWT_SECRET=<Auto-generado por Render>
SESSION_SECRET=<Auto-generado por Render>
COOKIE_SECRET=<Auto-generado por Render>
```

### 5️⃣ Deploy

Click "Create Web Service" y espera que termine el deploy.

Tu backend estará disponible en: `https://clinikdent-backend.onrender.com`

### 6️⃣ Actualizar Frontend

Una vez que el backend esté desplegado, actualiza los archivos JS del frontend para apuntar a la nueva URL del backend:

**Archivos a modificar en `public/js/`:**
- `auth.js`
- `dashboard.js`
- `citas.js`
- etc.

Cambia:
```javascript
const API_URL = 'http://localhost:3000'; // ❌ Desarrollo
```

Por:
```javascript
const API_URL = 'https://clinikdent-backend.onrender.com'; // ✅ Producción
```

Luego vuelve a desplegar el frontend:
```bash
wrangler pages deploy public --project-name=clinikdent
```

## 🔄 Alternativa: Railway

Si prefieres Railway en lugar de Render:

1. Ve a https://railway.app
2. Conecta tu repositorio GitHub
3. Click "Deploy from GitHub repo"
4. Selecciona `maria162003/clinikdent-v2-0`
5. Configura las mismas variables de entorno
6. Railway detectará automáticamente el `package.json` y desplegará

## 📊 Monitoreo

### Health Check
Tanto Render como Railway revisan automáticamente: `https://tu-backend.com/health`

### Logs
- **Render:** Dashboard → Logs
- **Railway:** Dashboard → Deployments → View Logs
- **Cloudflare Pages:** Dashboard → Analytics

## 🔒 Seguridad en Producción

El archivo `render.yaml` ya configura secretos auto-generados para:
- JWT_SECRET
- SESSION_SECRET  
- COOKIE_SECRET

⚠️ **NUNCA** subas el archivo `.env` con credenciales reales a Git.

## 🎯 Próximos Pasos

1. [ ] Desplegar backend en Render o Railway
2. [ ] Obtener URL del backend desplegado
3. [ ] Actualizar `API_URL` en archivos JS del frontend
4. [ ] Re-desplegar frontend en Cloudflare Pages
5. [ ] Configurar dominio personalizado (opcional)
6. [ ] Configurar CORS en backend para permitir solo tu dominio de Cloudflare

## 📞 Soporte

Si encuentras problemas:
- Revisa los logs del servicio
- Verifica que todas las variables de entorno estén configuradas
- Comprueba que la base de datos Supabase esté accesible
