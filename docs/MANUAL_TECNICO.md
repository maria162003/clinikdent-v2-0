# 🔧 Manual Técnico - Clinikdent v2.0

## 🏗️ Documentación Técnica Completa del Sistema

**Versión:** 2.0.0  
**Fecha:** Agosto 2025  
**Audiencia:** Desarrolladores, Administradores de Sistema, DevOps

---

## 📖 **TABLA DE CONTENIDOS**

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Requisitos Técnicos](#requisitos-técnicos)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Base de Datos](#base-de-datos)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Seguridad](#seguridad)
8. [Deployment](#deployment)
9. [Monitoreo y Logs](#monitoreo-y-logs)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Patrón Arquitectónico:**
- **Tipo:** MVC (Model-View-Controller)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js + Express.js
- **Base de Datos:** MySQL 8.0+
- **Autenticación:** JWT (JSON Web Tokens)

### **Diagrama de Arquitectura:**
```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐    SQL    ┌─────────────────┐
│                 │    Requests      │                 │ Queries   │                 │
│  Frontend (SPA) │ ◄─────────────► │ Backend (API)   │ ◄────────►│ MySQL Database │
│  HTML/CSS/JS    │                  │ Node.js/Express │           │                 │
└─────────────────┘                  └─────────────────┘           └─────────────────┘
         │                                     │                            │
         │                                     │                            │
         ▼                                     ▼                            ▼
┌─────────────────┐                  ┌─────────────────┐           ┌─────────────────┐
│ Static Files    │                  │ Middleware      │           │ Data Storage    │
│ • Images        │                  │ • Security      │           │ • Users         │
│ • Styles        │                  │ • Auth          │           │ • Patients      │
│ • Scripts       │                  │ • Validation    │           │ • Appointments  │
└─────────────────┘                  └─────────────────┘           └─────────────────┘
```

### **Stack Tecnológico:**

#### **Backend:**
- **Node.js v18+:** Runtime de JavaScript
- **Express.js v5:** Framework web
- **MySQL2:** Driver de base de datos
- **JWT:** Autenticación y autorización
- **Bcrypt:** Hash de contraseñas
- **Helmet:** Headers de seguridad
- **Express-validator:** Validación de entrada
- **Express-rate-limit:** Limitación de requests

#### **Frontend:**
- **HTML5:** Estructura semántica
- **CSS3:** Estilos y responsive design
- **JavaScript ES6+:** Lógica del cliente
- **Fetch API:** Comunicación con backend
- **Local Storage:** Persistencia local

#### **Base de Datos:**
- **MySQL 8.0+:** Sistema de gestión de BD
- **InnoDB:** Motor de almacenamiento
- **UTF8MB4:** Codificación de caracteres

---

## 💻 **REQUISITOS TÉCNICOS**

### **Requisitos del Servidor:**

#### **Mínimos:**
- **CPU:** 2 cores, 2.0 GHz
- **RAM:** 4 GB
- **Disco:** 20 GB SSD
- **Ancho de Banda:** 10 Mbps
- **SO:** Ubuntu 20.04 LTS / CentOS 8 / Windows Server 2019

#### **Recomendados:**
- **CPU:** 4 cores, 3.0 GHz
- **RAM:** 8 GB
- **Disco:** 50 GB SSD
- **Ancho de Banda:** 100 Mbps
- **SO:** Ubuntu 22.04 LTS

### **Software Requerido:**

#### **Runtime:**
```bash
# Node.js (versión 18 o superior)
node --version  # v18.17.0+

# NPM (gestor de paquetes)
npm --version   # 9.0.0+

# MySQL (versión 8.0 o superior)
mysql --version # 8.0.32+
```

#### **Herramientas de Desarrollo:**
```bash
# Git para control de versiones
git --version

# PM2 para gestión de procesos
npm install -g pm2

# Herramientas de monitoreo
npm install -g nodemon
```

### **Navegadores Compatibles:**
- **Chrome:** 90+
- **Firefox:** 88+
- **Safari:** 14+
- **Edge:** 90+

---

## 🚀 **INSTALACIÓN Y CONFIGURACIÓN**

### **1. Clonar Repositorio:**
```bash
# Clonar desde GitHub
git clone https://github.com/maria162003/clinikdent-v2-0.git
cd clinikdent-v2-0

# Verificar rama actual
git branch
```

### **2. Instalación de Dependencias:**
```bash
# Instalar dependencias de producción
npm install --production

# Para desarrollo (incluye devDependencies)
npm install
```

### **3. Configuración de Variables de Entorno:**
```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env
```

#### **Archivo .env:**
```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinikdent_v2
DB_USER=clinikdent_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-key-here
JWT_EXPIRES_IN=8h

# Servidor
PORT=3000
NODE_ENV=production

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000/api

# Seguridad
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **4. Configuración de Base de Datos:**

#### **Crear Usuario y Base de Datos:**
```sql
-- Conectar como root
mysql -u root -p

-- Crear base de datos
CREATE DATABASE clinikdent_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario
CREATE USER 'clinikdent_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON clinikdent_v2.* TO 'clinikdent_user'@'localhost';
FLUSH PRIVILEGES;
```

#### **Importar Esquema de Base de Datos:**
```bash
# Importar estructura de tablas
mysql -u clinikdent_user -p clinikdent_v2 < database/schema.sql

# Importar datos de ejemplo (opcional)
mysql -u clinikdent_user -p clinikdent_v2 < database/sample_data.sql
```

### **5. Iniciar la Aplicación:**

#### **Modo Desarrollo:**
```bash
npm run dev
```

#### **Modo Producción:**
```bash
# Iniciar con PM2
npm start

# O manualmente
node app.js
```

### **6. Verificar Instalación:**
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/api/health

# Respuesta esperada:
# {"status":"OK","timestamp":"2025-08-27T10:00:00.000Z"}
```

---

## 📁 **ESTRUCTURA DEL PROYECTO**

### **Organización de Archivos:**
```
clinikdent-v2-0/
├── 📁 Backend/
│   ├── 📁 config/
│   │   └── db.js                 # Configuración de base de datos
│   ├── 📁 controllers/           # Controladores (lógica de negocio)
│   │   ├── authControllerNew.js  # Autenticación y autorización
│   │   ├── usuarioController.js  # Gestión de usuarios
│   │   ├── citaController.js     # Gestión de citas
│   │   ├── tratamientoController.js # Gestión de tratamientos
│   │   ├── inventarioController.js  # Control de inventario
│   │   └── pagoController.js     # Gestión de pagos
│   ├── 📁 middleware/            # Middlewares personalizados
│   │   ├── authMiddleware.js     # Autenticación JWT
│   │   └── securityMiddleware.js # Seguridad y validación
│   ├── 📁 routes/                # Definición de rutas
│   │   ├── authRoutes.js         # Rutas de autenticación
│   │   ├── usuarioRoutes.js      # Rutas de usuarios
│   │   ├── citaRoutes.js         # Rutas de citas
│   │   └── [otros-routes].js
│   ├── 📁 services/              # Servicios externos
│   │   └── emailService.js       # Servicio de email
│   └── 📁 scripts/               # Scripts de utilidad
├── 📁 public/                    # Archivos estáticos del frontend
│   ├── 📁 css/
│   ├── 📁 js/
│   ├── 📁 images/
│   └── *.html                    # Páginas HTML
├── 📁 tests/                     # Suite de pruebas
│   ├── 📁 unit/                  # Pruebas unitarias
│   ├── 📁 integration/           # Pruebas de integración
│   ├── 📁 api/                   # Pruebas de API
│   ├── 📁 security/              # Pruebas de seguridad
│   └── setup.js                  # Configuración de pruebas
├── 📁 docs/                      # Documentación
│   ├── MANUAL_USUARIO.md
│   ├── MANUAL_TECNICO.md
│   ├── API_DOCUMENTATION.md
│   └── REPORTE_CORRECCIONES_SEGURIDAD.md
├── 📁 database/                  # Scripts de base de datos
│   ├── schema.sql               # Estructura de tablas
│   └── sample_data.sql          # Datos de ejemplo
├── .env                         # Variables de entorno
├── .gitignore                   # Archivos ignorados por Git
├── app.js                       # Archivo principal del servidor
├── package.json                 # Dependencias y scripts
└── README.md                    # Documentación básica
```

### **Explicación de Componentes:**

#### **Backend/config/db.js:**
- Configuración de conexión MySQL
- Pool de conexiones para optimizar rendimiento
- Manejo de errores de conexión

#### **Backend/controllers/:**
- **Responsabilidad:** Lógica de negocio
- **Patrón:** Un controlador por entidad principal
- **Funciones:** CRUD operations, validaciones, transformaciones

#### **Backend/middleware/:**
- **authMiddleware.js:** Validación de JWT, autorización
- **securityMiddleware.js:** Headers de seguridad, rate limiting, sanitización

#### **Backend/routes/:**
- **Responsabilidad:** Definición de endpoints
- **Estructura:** RESTful API design
- **Middleware:** Aplicación de validaciones y autenticación

---

## 🗄️ **BASE DE DATOS**

### **Esquema de Base de Datos:**

#### **Tabla: usuarios**
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    rol ENUM('administrador', 'odontologo', 'recepcionista', 'paciente') NOT NULL,
    fecha_nacimiento DATE,
    contraseña_hash VARCHAR(255) NOT NULL,
    tipo_documento ENUM('CC', 'CE', 'TI', 'PAS') DEFAULT 'CC',
    numero_documento VARCHAR(20),
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_correo (correo),
    INDEX idx_documento (numero_documento),
    INDEX idx_rol (rol)
);
```

#### **Tabla: citas**
```sql
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    odontologo_id INT NOT NULL,
    fecha_cita DATETIME NOT NULL,
    duracion_minutos INT DEFAULT 30,
    tipo_consulta VARCHAR(100),
    estado ENUM('programada', 'confirmada', 'en_proceso', 'completada', 'cancelada') DEFAULT 'programada',
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_fecha (fecha_cita),
    INDEX idx_paciente (paciente_id),
    INDEX idx_odontologo (odontologo_id)
);
```

#### **Tabla: tratamientos**
```sql
CREATE TABLE tratamientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    odontologo_id INT NOT NULL,
    cita_id INT,
    tipo_tratamiento VARCHAR(100) NOT NULL,
    descripcion TEXT,
    costo DECIMAL(10,2),
    estado ENUM('planificado', 'en_progreso', 'completado', 'cancelado') DEFAULT 'planificado',
    fecha_inicio DATE,
    fecha_finalizacion DATE,
    notas_clinicas TEXT,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL
);
```

#### **Tabla: inventario**
```sql
CREATE TABLE inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(200) NOT NULL,
    categoria VARCHAR(100),
    descripcion TEXT,
    stock_actual INT DEFAULT 0,
    stock_minimo INT DEFAULT 10,
    precio_unitario DECIMAL(10,2),
    proveedor_id INT,
    fecha_vencimiento DATE,
    ubicacion VARCHAR(100),
    estado ENUM('disponible', 'agotado', 'vencido') DEFAULT 'disponible',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_stock (stock_actual),
    INDEX idx_vencimiento (fecha_vencimiento)
);
```

### **Relaciones Principales:**
```
usuarios (1) ──────── (N) citas
usuarios (1) ──────── (N) tratamientos  
citas (1) ──────── (N) tratamientos
inventario (1) ──── (N) movimientos_inventario
```

### **Índices de Rendimiento:**
```sql
-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_citas_fecha_estado ON citas(fecha_cita, estado);
CREATE INDEX idx_usuarios_rol_estado ON usuarios(rol, estado);
CREATE INDEX idx_tratamientos_paciente_fecha ON tratamientos(paciente_id, fecha_inicio);
```

---

## 🔌 **APIs Y ENDPOINTS**

### **Estructura de API REST:**
Base URL: `http://localhost:3000/api`

#### **1. Autenticación (`/api/auth`):**

```javascript
// POST /api/auth/login - Iniciar sesión
Request:
{
    "correo": "admin@clinikdent.com",
    "password": "admin123",
    "rol": "administrador"
}

Response (200):
{
    "success": true,
    "msg": "Login exitoso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "nombre": "Admin",
        "apellido": "Principal",
        "correo": "admin@clinikdent.com",
        "rol": "administrador"
    }
}

// POST /api/auth/recuperar - Recuperar contraseña
Request:
{
    "correo": "usuario@clinikdent.com",
    "numero_documento": "12345678"
}

Response (200):
{
    "msg": "Se enviaron las instrucciones de recuperación a tu correo electrónico.",
    "success": true
}
```

#### **2. Usuarios (`/api/usuarios`):**

```javascript
// GET /api/usuarios - Listar usuarios
Headers: { "Authorization": "Bearer <token>" }
Response (200):
[
    {
        "id": 1,
        "nombre": "Admin",
        "apellido": "Principal",
        "correo": "admin@clinikdent.com",
        "rol": "administrador",
        "estado": "activo"
    }
]

// POST /api/usuarios - Crear usuario
Request:
{
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@email.com",
    "password": "Password123!",
    "rol": "paciente",
    "telefono": "3001234567"
}

Response (201):
{
    "success": true,
    "msg": "Usuario creado exitosamente.",
    "id": 15
}

// PUT /api/usuarios/:id - Actualizar usuario
// DELETE /api/usuarios/:id - Eliminar usuario
```

#### **3. Citas (`/api/citas`):**

```javascript
// GET /api/citas - Listar citas
Query params: ?fecha=2025-08-27&odontologo_id=2
Response (200):
[
    {
        "id": 1,
        "paciente": "María González",
        "odontologo": "Dr. Carlos Rodríguez",
        "fecha_cita": "2025-08-27T09:00:00.000Z",
        "tipo_consulta": "Limpieza dental",
        "estado": "programada"
    }
]

// POST /api/citas - Crear nueva cita
Request:
{
    "paciente_id": 3,
    "odontologo_id": 2,
    "fecha_cita": "2025-08-28T10:00:00.000Z",
    "tipo_consulta": "Consulta general",
    "duracion_minutos": 30
}
```

#### **4. Tratamientos (`/api/tratamientos`):**

```javascript
// GET /api/tratamientos/paciente/:id - Tratamientos por paciente
Response (200):
[
    {
        "id": 1,
        "tipo_tratamiento": "Endodoncia",
        "descripcion": "Tratamiento de conducto en molar superior",
        "costo": 250000,
        "estado": "en_progreso",
        "odontologo": "Dr. Carlos Rodríguez"
    }
]

// POST /api/tratamientos - Crear plan de tratamiento
Request:
{
    "paciente_id": 3,
    "odontologo_id": 2,
    "tipo_tratamiento": "Ortodoncia",
    "descripcion": "Brackets metálicos",
    "costo": 1200000
}
```

#### **5. Inventario (`/api/inventario`):**

```javascript
// GET /api/inventario - Listar productos
Response (200):
[
    {
        "id": 1,
        "nombre_producto": "Resina compuesta",
        "categoria": "Materiales de restauración",
        "stock_actual": 25,
        "stock_minimo": 10,
        "precio_unitario": 45000,
        "estado": "disponible"
    }
]

// POST /api/inventario/movimiento - Registrar movimiento
Request:
{
    "producto_id": 1,
    "tipo_movimiento": "salida",
    "cantidad": 2,
    "motivo": "Uso en tratamiento",
    "paciente_id": 3
}
```

### **Headers Requeridos:**
```javascript
// Para endpoints protegidos
{
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json"
}
```

### **Códigos de Estado HTTP:**
- **200 OK:** Solicitud exitosa
- **201 Created:** Recurso creado exitosamente
- **400 Bad Request:** Datos de entrada inválidos
- **401 Unauthorized:** Token faltante o inválido
- **403 Forbidden:** Permisos insuficientes
- **404 Not Found:** Recurso no encontrado
- **429 Too Many Requests:** Rate limit excedido
- **500 Internal Server Error:** Error del servidor

---

## 🔒 **SEGURIDAD**

### **Implementaciones de Seguridad:**

#### **1. Autenticación JWT:**
```javascript
// Generación de token
const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h',
    issuer: 'clinikdent-v2',
    audience: 'clinikdent-users'
});

// Validación de token
const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'clinikdent-v2',
    audience: 'clinikdent-users'
});
```

#### **2. Hash de Contraseñas:**
```javascript
// Hash con bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verificación
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### **3. Protección SQL Injection:**
```javascript
// CORRECTO: Prepared statements
const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);

// INCORRECTO: Concatenación directa
// const query = `SELECT * FROM usuarios WHERE correo = '${correo}'`; // ❌ VULNERABLE
```

#### **4. Sanitización XSS:**
```javascript
// Middleware de sanitización
const sanitizeInput = (req, res, next) => {
    for (let key in req.body) {
        if (typeof req.body[key] === 'string') {
            req.body[key] = sanitizeHtml(req.body[key], {
                allowedTags: [],
                allowedAttributes: {},
                disallowedTagsMode: 'discard'
            });
        }
    }
    next();
};
```

#### **5. Rate Limiting:**
```javascript
// Limitación general
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: 'Demasiadas solicitudes desde esta IP'
});

// Limitación para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5 // Solo 5 intentos de login
});
```

#### **6. Headers de Seguridad:**
```javascript
// Configuración con Helmet
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});
```

### **Configuración de Seguridad en Producción:**

#### **Variables de Entorno Críticas:**
```env
# JWT Secret - DEBE ser aleatorio y seguro
JWT_SECRET=tu-clave-jwt-super-secreta-de-al-menos-256-bits

# Database Password - DEBE ser compleja
DB_PASSWORD=tu-contraseña-mysql-muy-segura

# Configuración HTTPS
HTTPS_PORT=443
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

#### **Configuración de Firewall:**
```bash
# Permitir solo puertos necesarios
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3306  # MySQL (solo desde localhost)
ufw --force enable
```

---

## 🚢 **DEPLOYMENT**

### **Deployment con PM2:**

#### **1. Archivo ecosystem.config.js:**
```javascript
module.exports = {
    apps: [{
        name: 'clinikdent-v2',
        script: 'app.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        max_memory_restart: '1G',
        restart_delay: 4000
    }]
};
```

#### **2. Comandos de Deployment:**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Monitorear aplicación
pm2 monit

# Guardar configuración para auto-start
pm2 save
pm2 startup

# Logs
pm2 logs clinikdent-v2

# Restart sin downtime
pm2 reload clinikdent-v2
```

### **Deployment con Docker:**

#### **Dockerfile:**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S clinikdent -u 1001

WORKDIR /app

# Copiar dependencias
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=clinikdent:nodejs . .

USER clinikdent

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "app.js"]
```

#### **docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: clinikdent_v2
      MYSQL_USER: clinikdent_user
      MYSQL_PASSWORD: secure_password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
```

### **Configuración de Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # API endpoints
    location /api/ {
        proxy_pass http://app:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location / {
        proxy_pass http://app:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 **MONITOREO Y LOGS**

### **Configuración de Logs:**

#### **1. Winston Logger:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'clinikdent-v2' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});
```

#### **2. Estructura de Logs:**
```bash
logs/
├── error.log          # Solo errores
├── combined.log       # Todos los logs
├── access.log         # Logs de acceso HTTP
└── security.log       # Logs de seguridad
```

### **Métricas de Monitoreo:**

#### **Health Check Endpoint:**
```javascript
// GET /api/health
app.get('/api/health', async (req, res) => {
    try {
        // Verificar conexión a BD
        await db.query('SELECT 1');
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            error: error.message
        });
    }
});
```

#### **Métricas Importantes:**
- **Uptime:** Tiempo de actividad del servidor
- **Memory Usage:** Uso de memoria RAM
- **CPU Usage:** Utilización de procesador
- **Database Connections:** Conexiones activas a BD
- **Response Time:** Tiempo de respuesta promedio
- **Error Rate:** Porcentaje de errores

### **Alertas Automáticas:**

#### **Condiciones de Alerta:**
```javascript
// Configuración de alertas
const alerts = {
    highCpuUsage: {
        threshold: 80,
        action: 'sendEmail'
    },
    highMemoryUsage: {
        threshold: 85,
        action: 'sendSlackNotification'
    },
    databaseConnectionError: {
        threshold: 1,
        action: 'sendCriticalAlert'
    }
};
```

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comunes:**

#### **1. Error de Conexión a Base de Datos:**
```bash
# Síntoma
Error: connect ECONNREFUSED 127.0.0.1:3306

# Diagnóstico
mysql -u clinikdent_user -p clinikdent_v2

# Solución
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### **2. Error de Autenticación JWT:**
```bash
# Síntoma
UnauthorizedError: jwt malformed

# Diagnóstico
- Verificar JWT_SECRET en .env
- Comprobar formato del token
- Validar expiración

# Solución
# Regenerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### **3. Alto Uso de Memoria:**
```bash
# Diagnóstico
pm2 monit
htop

# Solución
pm2 reload clinikdent-v2  # Restart sin downtime
pm2 set pm2-logrotate:max_size 10M  # Rotación de logs
```

#### **4. Errores de Validación:**
```javascript
// Síntoma
ValidationError: "email" must be a valid email

// Diagnóstico
console.log('Request body:', req.body);

// Solución
// Verificar middleware de parsing
app.use(express.json());
```

### **Comandos de Diagnóstico:**

#### **Sistema:**
```bash
# Estado de servicios
systemctl status mysql
systemctl status nginx

# Uso de recursos
top
df -h
free -m

# Logs del sistema
tail -f /var/log/syslog
journalctl -u mysql
```

#### **Aplicación:**
```bash
# Logs de PM2
pm2 logs clinikdent-v2

# Estado de procesos
pm2 status
pm2 show clinikdent-v2

# Monitoreo en tiempo real
pm2 monit
```

#### **Base de Datos:**
```sql
-- Conexiones activas
SHOW PROCESSLIST;

-- Estado del servidor
SHOW STATUS LIKE 'Threads_connected';

-- Tamaño de bases de datos
SELECT table_schema AS "Database", 
       ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "MB"
FROM information_schema.tables
GROUP BY table_schema;
```

### **Scripts de Mantenimiento:**

#### **backup.sh:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup de base de datos
mysqldump -u clinikdent_user -p clinikdent_v2 > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /path/to/app

# Limpiar backups antiguos (mantener 30 días)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

---

## 🎯 **CONCLUSIÓN**

Este manual técnico proporciona toda la información necesaria para la instalación, configuración, mantenimiento y troubleshooting del sistema Clinikdent v2.0.

### **Recursos Adicionales:**
- 📚 **Documentación API:** `/docs/API_DOCUMENTATION.md`
- 🔒 **Reporte Seguridad:** `/docs/REPORTE_CORRECCIONES_SEGURIDAD.md`
- 👤 **Manual Usuario:** `/docs/MANUAL_USUARIO.md`
- 🧪 **Tests:** `/tests/` (Jest test suites)

### **Soporte Técnico:**
- **Email:** tech-support@clinikdent.com
- **GitHub Issues:** https://github.com/maria162003/clinikdent-v2-0/issues
- **Documentación:** https://docs.clinikdent.com

---

*Manual Técnico Clinikdent v2.0 - Agosto 2025*
*© 2025 Clinikdent Development Team. Todos los derechos reservados.*
