# 🦷 ClinikDent - Sistema de Gestión Clínica Odontológica

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://clinikdent.pages.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Wrangler](https://img.shields.io/badge/Wrangler-CLI-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/wrangler/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-purple.svg)](CODE_OF_CONDUCT.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](SECURITY.md)

Sistema completo de gestión clínica odontológica con arquitectura serverless moderna. Desplegado en **Cloudflare Pages** con funciones serverless y base de datos **Supabase PostgreSQL**.

🌐 **Producción**: [https://clinikdent.pages.dev](https://clinikdent.pages.dev)

> **⚠️ Nota**: Este es un proyecto en desarrollo activo. Revisa la [guía de contribución](CONTRIBUTING.md) para participar.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución Local](#-ejecución-local)
- [Despliegue a Producción](#-despliegue-a-producción)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Variables de Entorno](#-variables-de-entorno)
- [Solución de Problemas](#-solución-de-problemas)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## ✨ Características

### 🏥 Gestión de Pacientes
- Registro y administración completa de pacientes
- Historial clínico digital
- Documentos e información personal
- Tratamientos y citas

### 📅 Sistema de Citas
- Agenda visual e intuitiva
- Recordatorios automáticos
- Gestión de disponibilidad de odontólogos
- Confirmación y cancelación de citas

### 👨‍⚕️ Gestión de Odontólogos
- Perfiles profesionales
- Horarios de atención
- Especialidades
- Dashboard personalizado

### 💰 Facturación y Pagos
- Generación de facturas
- Historial de pagos
- Estados de cuenta
- Reportes financieros

### 📊 Reportes y Estadísticas
- Dashboard administrativo
- Reportes de ingresos
- Estadísticas de pacientes
- Análisis de tratamientos

### 💬 Chat de Soporte
- Asistente virtual 24/7
- Respuestas automáticas
- Gestión de consultas frecuentes

### 🔐 Seguridad
- Autenticación con Supabase Auth
- Recuperación de contraseña segura (Magic Links)
- Roles y permisos (Paciente, Odontólogo, Administrador)
- Validación de contraseñas robustas

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FRONTEND (Static)                      │   │
│  │  • HTML, CSS, JavaScript                            │   │
│  │  • Bootstrap 5.3.2                                  │   │
│  │  • jQuery 3.7.1                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       CLOUDFLARE FUNCTIONS (Serverless)             │   │
│  │  • /api/auth/*        - Autenticación               │   │
│  │  • /api/citas/*       - Gestión de citas            │   │
│  │  • /api/usuarios/*    - Gestión de usuarios         │   │
│  │  • /api/faqs/*        - FAQs dinámicas              │   │
│  │  • /api/configuracion/* - Configuración             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database                         │   │
│  │  • usuarios                                         │   │
│  │  • pacientes                                        │   │
│  │  • citas                                            │   │
│  │  • tratamientos                                     │   │
│  │  • historial_clinico                                │   │
│  │  • configuracion_sistema                            │   │
│  │  • faqs                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Supabase Auth                               │   │
│  │  • Magic Links (recuperación password)              │   │
│  │  • JWT Tokens                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos personalizados
- **JavaScript ES6+** - Lógica del cliente
- **Bootstrap 5.3.2** - Framework UI responsivo
- **jQuery 3.7.1** - Manipulación del DOM
- **Font Awesome** - Iconografía

### Backend (Serverless)
- **Cloudflare Functions** - Funciones serverless
- **Node.js** - Runtime de JavaScript
- **@supabase/supabase-js ^2.39.0** - Cliente de Supabase
- **bcryptjs ^2.4.3** - Hash de contraseñas

### Base de Datos
- **Supabase PostgreSQL** - Base de datos relacional
- **Supabase Auth** - Autenticación y autorización

### DevOps
- **Wrangler 4.53.0** - CLI de Cloudflare
- **Git** - Control de versiones
- **GitHub** - Repositorio remoto

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** >= 2.30.0
- **Wrangler CLI** >= 4.0.0

### Instalación de Wrangler CLI

```bash
npm install -g wrangler@latest
```

### Verificar versiones

```bash
node --version
npm --version
git --version
wrangler --version
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/maria162003/clinikdent-v2-0.git
cd clinikdent-v2-0
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Instalar Dependencias de Functions

```bash
cd public/functions
npm install
cd ../..
```

---

## ⚙️ Configuración

### 1. Crear archivo `.env`

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

### 2. Configurar Variables de Entorno

Edita el archivo `.env` con tus credenciales de Supabase:

```env
# Supabase Configuration
SUPABASE_URL=https://xzlugnkzfdurczwwwimv.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui

# Cloudflare (opcional para desarrollo local)
NODE_ENV=development
```

### 3. Autenticarse en Cloudflare

```bash
wrangler login
```

Esto abrirá tu navegador para autorizar Wrangler con tu cuenta de Cloudflare.

### 4. Configurar Secrets en Cloudflare (Producción)

```bash
# Configurar SUPABASE_URL
echo "https://xzlugnkzfdurczwwwimv.supabase.co" | wrangler pages secret put SUPABASE_URL --project-name=clinikdent

# Configurar SUPABASE_ANON_KEY
echo "tu_supabase_anon_key_aqui" | wrangler pages secret put SUPABASE_ANON_KEY --project-name=clinikdent
```

### 5. Verificar Secrets

```bash
wrangler pages secret list --project-name=clinikdent
```

---

## 💻 Ejecución Local

### Opción 1: Desarrollo Local con Wrangler

```bash
# Desde el directorio raíz del proyecto
wrangler pages dev public --port 8080
```

Abre tu navegador en: `http://localhost:8080`

### Opción 2: Servidor HTTP Simple (Solo Frontend)

```bash
# Usando Python
python -m http.server 8000

# O usando Node.js
npx http-server public -p 8000
```

**Nota**: Esta opción solo sirve para ver el frontend. Las funciones serverless NO funcionarán.

### Probar Endpoints de la API Localmente

```bash
# Health Check
curl http://localhost:8080/api/health

# Configuración Pública
curl http://localhost:8080/api/configuracion/publica
```

---

## 🌐 Despliegue a Producción

### Despliegue Manual

#### 1. Asegúrate de estar en la rama correcta

```bash
git checkout master
git pull origin master
```

#### 2. Despliega a Cloudflare Pages

```bash
wrangler pages deploy public --project-name=clinikdent --branch=master
```

#### 3. Verifica el despliegue

El comando mostrará una URL de deployment. Ejemplo:

```
✨ Deployment complete! Take a peek over at https://abc123.clinikdent.pages.dev
```

La URL principal de producción es: **https://clinikdent.pages.dev**

### Despliegue Automático (Recomendado)

1. **Conecta tu repositorio de GitHub con Cloudflare Pages**:
   - Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Pages → Crear proyecto → Conectar a Git
   - Selecciona tu repositorio `maria162003/clinikdent-v2-0`

2. **Configuración del build**:
   - Framework preset: `None`
   - Build command: _(dejar vacío)_
   - Build output directory: `public`
   - Branch de producción: `master`

3. **Variables de entorno en Cloudflare**:
   - Agrega `SUPABASE_URL` y `SUPABASE_ANON_KEY` en la sección de Environment Variables

4. **Despliegue automático**:
   - Cada push a `master` desplegará automáticamente a producción
   - Cada push a otras ramas creará un Preview Deployment

---

## 📁 Estructura del Proyecto

```
Clinikdent_supabase_1.0/
│
├── public/                          # Frontend (se despliega a Cloudflare Pages)
│   ├── index.html                   # Página principal
│   ├── dashboard-admin.html         # Dashboard administrativo
│   ├── dashboard-odontologo.html    # Dashboard de odontólogos
│   ├── dashboard-paciente.html      # Dashboard de pacientes
│   ├── citas.html                   # Gestión de citas
│   ├── registro.html                # Registro de usuarios
│   ├── recuperar.html               # Recuperación de contraseña
│   │
│   ├── css/                         # Estilos CSS
│   │   ├── styles.css
│   │   ├── dashboard-admin.css
│   │   ├── chat-soporte.css
│   │   └── ...
│   │
│   ├── js/                          # JavaScript del cliente
│   │   ├── index.js
│   │   ├── login.js
│   │   ├── registro.js
│   │   ├── dashboard-admin.js
│   │   ├── chat-soporte.js
│   │   ├── security-system.js
│   │   └── ...
│   │
│   ├── images/                      # Imágenes y assets
│   │   ├── logo.jpg
│   │   ├── hero1.jpg
│   │   └── ...
│   │
│   ├── functions/                   # Cloudflare Functions (Serverless Backend)
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login.js         # Login de usuarios
│   │   │   │   └── register.js      # Registro de usuarios
│   │   │   │
│   │   │   ├── citas/
│   │   │   │   └── [[id]].js        # CRUD de citas
│   │   │   │
│   │   │   ├── usuarios/
│   │   │   │   └── [[id]].js        # CRUD de usuarios
│   │   │   │
│   │   │   ├── configuracion/
│   │   │   │   └── publica.js       # Config pública
│   │   │   │
│   │   │   ├── faqs/
│   │   │   │   └── index.js         # FAQs dinámicas
│   │   │   │
│   │   │   ├── site-content.js      # Contenido dinámico
│   │   │   └── health.js            # Health check
│   │   │
│   │   └── package.json             # Dependencias de Functions
│   │
│   └── _routes.json                 # Routing de Cloudflare Functions
│
├── Backend/                         # Backend Express (NO SE DEPLOYA - Solo referencia)
│   ├── serverSecure.js
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   └── services/
│
├── scripts/                         # Scripts de utilidad
│   ├── consultar_admin.sql
│   ├── crear_tablas_whatsapp.sql
│   └── ...
│
├── .env                             # Variables de entorno (NO COMMITEAR)
├── .env.example                     # Ejemplo de variables de entorno
├── .gitignore                       # Archivos ignorados por Git
├── .cfignore                        # Archivos ignorados por Cloudflare
├── wrangler.toml                    # Configuración de Wrangler
├── package.json                     # Dependencias del proyecto
└── README.md                        # Este archivo
```

---

## 🔌 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login de usuario (devuelve token JWT) |
| `POST` | `/api/auth/register` | Registro de nuevo paciente |

**Ejemplo Login:**
```bash
curl -X POST https://clinikdent.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "paciente@example.com",
    "password": "miPassword123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 123,
    "nombre": "Juan",
    "rol": "paciente"
  },
  "redirect": "/dashboard-paciente.html"
}
```

### Gestión de Citas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/citas` | Obtener todas las citas |
| `GET` | `/api/citas/:id` | Obtener cita por ID |
| `POST` | `/api/citas` | Crear nueva cita |
| `PUT` | `/api/citas/:id` | Actualizar cita |
| `DELETE` | `/api/citas/:id` | Eliminar cita |

### Gestión de Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/usuarios` | Obtener todos los usuarios |
| `GET` | `/api/usuarios/:id` | Obtener usuario por ID |
| `PUT` | `/api/usuarios/:id` | Actualizar usuario |
| `DELETE` | `/api/usuarios/:id` | Eliminar usuario |

### Configuración y Contenido

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/configuracion/publica` | Configuración pública (horarios, contacto) |
| `GET` | `/api/faqs` | FAQs dinámicas |
| `GET` | `/api/site-content` | Contenido dinámico del sitio |
| `GET` | `/api/health` | Health check del API |

**Ejemplo Health Check:**
```bash
curl https://clinikdent.pages.dev/api/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T02:21:26.176Z",
  "service": "ClinikDent API",
  "version": "1.9.0",
  "environment": "production"
}
```

---

## 🔐 Variables de Entorno

### Desarrollo Local (`.env`)

```env
# Supabase
SUPABASE_URL=https://xzlugnkzfdurczwwwimv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Entorno
NODE_ENV=development
```

### Producción (Cloudflare Secrets)

Las variables de producción se configuran como **secrets** en Cloudflare:

```bash
# Listar secrets
wrangler pages secret list --project-name=clinikdent

# Agregar/Actualizar secret
echo "valor_secreto" | wrangler pages secret put NOMBRE_VARIABLE --project-name=clinikdent

# Eliminar secret
wrangler pages secret delete NOMBRE_VARIABLE --project-name=clinikdent
```

**⚠️ Importante**: Los secrets solo están disponibles en el ambiente de **Producción** (rama `master`). Los Preview Deployments (otras ramas) NO tienen acceso a los secrets por seguridad.

---

## 🐛 Solución de Problemas

### Error: "column configuracion_sistema.es_publica does not exist"

**Solución**: El endpoint `/api/configuracion/publica` ya está corregido en la última versión. Si ves este error, asegúrate de tener la última versión del código:

```bash
git pull origin master
wrangler pages deploy public --project-name=clinikdent --branch=master
```

### Functions retornan HTML en lugar de JSON

**Causa**: Estás accediendo a un Preview Deployment que no tiene los secrets configurados.

**Solución**: Usa siempre la URL de producción: `https://clinikdent.pages.dev`

### Error: "Missing env vars - URL: false, KEY: false"

**Causa**: Las variables de entorno no están configuradas correctamente.

**Solución**:
1. Verifica que los secrets estén configurados:
   ```bash
   wrangler pages secret list --project-name=clinikdent
   ```

2. Si no existen, agrégalos:
   ```bash
   echo "https://xzlugnkzfdurczwwwimv.supabase.co" | wrangler pages secret put SUPABASE_URL --project-name=clinikdent
   echo "tu_supabase_anon_key" | wrangler pages secret put SUPABASE_ANON_KEY --project-name=clinikdent
   ```

### Deployment falla con "Worker size exceeded"

**Causa**: El bundle de Functions es demasiado grande.

**Solución**: Verifica que `.cfignore` esté configurado correctamente para excluir archivos innecesarios:

```
# .cfignore
Backend/
node_modules/
ReactNativeDemo.rar
.git/
.env
*.md
```

### Wrangler no está autenticado

**Error**: `Not logged in`

**Solución**:
```bash
wrangler logout
wrangler login
```

---

## 🤝 Contribución

### Workflow de Contribución

1. **Fork el proyecto**
2. **Crea una rama para tu feature**:
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```
3. **Realiza tus cambios y commitea**:
   ```bash
   git add .
   git commit -m "feat: Agregar nueva funcionalidad X"
   ```
4. **Push a tu fork**:
   ```bash
   git push origin feature/mi-nueva-funcionalidad
   ```
5. **Abre un Pull Request** en GitHub

### Convenciones de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan lógica)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

### Estándares de Código

- **JavaScript**: ES6+ con módulos ESM
- **CSS**: BEM naming convention
- **HTML**: Semántico y accesible (ARIA)
- **Indentación**: 2 espacios

---

## 📄 Licencia

Este proyecto es privado y pertenece a **ClinikDent**. Todos los derechos reservados.

---

## 👥 Autores

- **Maria162003** - [GitHub](https://github.com/maria162003)

---

## 📞 Soporte

- **Email**: info@clinikdent.com
- **WhatsApp**: +57 320 977 3983
- **Chat en Vivo**: Disponible en [clinikdent.pages.dev](https://clinikdent.pages.dev)

---

## 🎯 Roadmap

### ✅ Completado
- [x] Sistema de autenticación con Supabase
- [x] Dashboard para pacientes, odontólogos y administradores
- [x] Gestión de citas
- [x] Chat de soporte con asistente virtual
- [x] Recuperación de contraseña con Magic Links
- [x] Despliegue en Cloudflare Pages
- [x] API serverless con Cloudflare Functions

### 🚧 En Desarrollo
- [ ] Notificaciones por email
- [ ] Integración con WhatsApp Business
- [ ] Sistema de recordatorios automáticos
- [ ] Reportes avanzados con gráficos

### 📋 Planeado
- [ ] App móvil con React Native
- [ ] Integración con pasarelas de pago
- [ ] Sistema de facturación electrónica
- [ ] Telemedicina con videollamadas

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor lee nuestra [Guía de Contribución](CONTRIBUTING.md) para conocer el proceso.

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Por favor revisa:
- [Código de Conducta](CODE_OF_CONDUCT.md)
- [Política de Seguridad](SECURITY.md)
- [Licencia MIT](LICENSE)

---

## 🙏 Agradecimientos

- [Cloudflare](https://www.cloudflare.com/) por la infraestructura serverless
- [Supabase](https://supabase.com/) por la base de datos PostgreSQL y autenticación
- [Bootstrap](https://getbootstrap.com/) por el framework UI
- Todos los contribuidores del proyecto

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**Hecho con ❤️ para mejorar la gestión de clínicas odontológicas**

**[⬆ Volver arriba](#-clinikdent---sistema-de-gestión-clínica-odontológica)**

Hecho con ❤️ por el equipo de ClinikDent

</div>
