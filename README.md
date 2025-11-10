# 🦷 Clinikdent v2.0 - Sistema de Gestión Odontológica

[![Estado](https://img.shields.io/badge/Estado-✅%20FUNCIONANDO-brightgreen.svg)](https://github.com/maria162003/clinikdent-v2-0)
[![Versión](https://img.shields.io/badge/Versión-2.0.0-blue.svg)](https://github.com/maria162003/clinikdent-v2-0)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-orange.svg)](https://supabase.com/)

Sistema completo de gestión para clínicas odontológicas con múltiples sedes, desarrollado con Node.js, Express y Supabase (PostgreSQL).

## ✨ ESTADO ACTUAL: TOTALMENTE OPERATIVO

- ✅ **Backend funcional** con Node.js + Express + PostgreSQL/Supabase
- ✅ **Frontend responsive** con Bootstrap 5 y JavaScript moderno
- ✅ **Base de datos** Supabase con tablas optimizadas
- ✅ **Sistema de inventario** completamente reparado (25 equipos)
- ✅ **Sistema de categorías** funcionando correctamente (17 categorías)
- ✅ **Sistema de proveedores** recién implementado (CRUD completo)
- ✅ **Dashboard administrativo** completo y operativo
- ✅ **Sistema de seguridad** con reCAPTCHA y autenticación robusta
- ✅ **Integración MercadoPago** para pagos en línea

---

## 🚀 Características Principales

### 🔐 Sistema de Seguridad Avanzado
- **reCAPTCHA v2**: Protección contra bots en registro y login
- **Bloqueo Progresivo**: Sistema inteligente de protección contra ataques de fuerza bruta
- **Validación de Contraseñas**: Requisitos estrictos con feedback visual en tiempo real
- **Alertas Modernas**: Sistema de notificaciones profesional con animaciones
- **Recuperación Segura**: Sistema de recuperación de contraseña con tokens de un solo uso

### 👥 Gestión Multi-Rol
- **Administradores**: Control total del sistema y sedes
- **Odontólogos**: Gestión de pacientes, citas y tratamientos
- **Pacientes**: Portal personalizado con historial y pagos

### 📅 Sistema de Citas
- Calendario interactivo con vista mensual/semanal/diaria
- Asignación automática de odontólogos
- Recordatorios automáticos por email
- Estados personalizables (Programada, Confirmada, En proceso, Completada, Cancelada)

### 💳 Pagos y Facturación
- Integración con MercadoPago (Colombia)
- Generación automática de facturas
- Seguimiento de pagos pendientes
- Reportes financieros

### 📊 Dashboard Personalizado
- Estadísticas en tiempo real
- Gráficos interactivos
- Reportes exportables
- Vista optimizada por rol

### 🏥 Gestión Clínica
- Historias clínicas digitales
- Planes de tratamiento
- Inventario de equipos y medicamentos (25 equipos registrados)
- Gestión de sedes
- Sistema de categorías (17 categorías activas)
- Sistema de proveedores (CRUD completo - NUEVO)

---

## 🛠️ Tecnologías

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (Supabase)
- **Nodemailer** para emails
- **bcryptjs** para encriptación
- **express-rate-limit** para protección

### Frontend
- **Bootstrap 5.3**
- **Bootstrap Icons**
- **Vanilla JavaScript** (ES6+)
- **CSS3** con animaciones modernas

### Seguridad
- **reCAPTCHA v2** de Google
- Tokens JWT
- Encriptación de contraseñas
- Protección CSRF
- Rate limiting

---

## 📋 Requisitos Previos

- Node.js v18 o superior
- PostgreSQL (o cuenta Supabase)
- Cuenta de Gmail (para envío de emails)
- Credenciales de MercadoPago Colombia
- Claves de reCAPTCHA de Google

---

## ⚙️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/maria162003/clinikdent-v2-0.git
cd clinikdent-v2-0
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Completar con tus credenciales:

```env
# PostgreSQL/Supabase
PGHOST=aws-1-sa-east-1.pooler.supabase.com
PGUSER=postgres.xzlugnkzfdurczwwwimv
PGPASSWORD=tu-password-supabase
PGDATABASE=postgres
PGPORT=5432

# Supabase
SUPABASE_URL=https://xzlugnkzfdurczwwwimv.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_PROJECT_ID=xzlugnkzfdurczwwwimv

# Email (Gmail)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-de-aplicacion
SUPPORT_EMAIL=tu-email-soporte@gmail.com

# JWT
JWT_SECRET=genera-un-secret-aleatorio-y-seguro

# MercadoPago Colombia
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
MERCADOPAGO_PUBLIC_KEY=tu-public-key
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret
MERCADOPAGO_BASE_URL=https://api.mercadopago.com
MERCADOPAGO_SANDBOX=false

# Servidor
PORT=3001
FRONTEND_URL=http://localhost:3001
NODE_ENV=development
```

### 4. Configurar Base de Datos

Ejecutar los scripts SQL en orden en Supabase SQL Editor:

1. `supabase_schema.sql`
2. `supabase_init_data.sql`
3. `supabase_tablas_adicionales.sql`
4. `supabase_mercadopago_tables.sql`

### 5. Configurar reCAPTCHA

1. Obtener claves en [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Agregar dominio autorizado (localhost para desarrollo)
3. Actualizar claves en `public/index.html` y `public/registro.html`

Buscar y reemplazar:
```javascript
// Site Key (Frontend)
grecaptcha.render('recaptcha-container', {
    sitekey: 'TU_SITE_KEY_AQUI'
});

// Secret Key (Backend - verificar en Backend/routes/authRoutes.js)
const SECRET_KEY = 'TU_SECRET_KEY_AQUI';
```

### 6. Iniciar el servidor

```bash
npm start
```

O en Windows:
```bash
.\ARRANCAR_CLINIKDENT.bat
```

El servidor estará disponible en: `http://localhost:3001`

---

## 🎯 Uso

### Credenciales de Prueba

```
Administrador:
Email: admin@clinikdent.com
Password: Admin123!

Odontólogo:
Email: odontologo@clinikdent.com
Password: Odon123!

Paciente:
Email: paciente@clinikdent.com
Password: Paciente123!
```

### Flujo de Trabajo

1. **Registro**: Los pacientes se registran desde la página principal
2. **Login**: Acceso según rol con reCAPTCHA
3. **Dashboard**: Vista personalizada según permisos
4. **Gestión**: CRUD completo de todas las entidades
5. **Reportes**: Generación y exportación de estadísticas

---

## 📁 Estructura del Proyecto

```
clinikdent-v2-0/
├── Backend/
│   ├── controllers/       # Lógica de negocio
│   ├── routes/           # Rutas de API
│   ├── middleware/       # Autenticación y seguridad
│   ├── services/         # Servicios (email, pagos)
│   └── scripts/          # Scripts SQL
├── public/
│   ├── css/              # Estilos
│   ├── js/               # Frontend JavaScript
│   ├── images/           # Recursos gráficos
│   └── *.html            # Páginas
├── routes/               # Rutas adicionales
├── app.js                # Servidor principal
├── package.json          # Dependencias
└── .env                  # Variables de entorno (no incluido)
```

---

## 🔒 Seguridad

### Características Implementadas

- ✅ Encriptación bcrypt para contraseñas
- ✅ Tokens JWT con expiración
- ✅ reCAPTCHA v2 en formularios críticos
- ✅ Rate limiting por IP
- ✅ Bloqueo progresivo de cuentas (3, 5, 10 intentos)
- ✅ Validación de entrada en backend
- ✅ Prevención de SQL Injection
- ✅ Headers de seguridad
- ✅ Sesiones seguras

### Requisitos de Contraseña

- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial (@$!%*?&#)

---

## 📧 Configuración de Email

Para Gmail, necesitas una "Contraseña de aplicación":

1. Habilitar verificación en 2 pasos en tu cuenta Google
2. Ir a: https://myaccount.google.com/apppasswords
3. Crear contraseña para "Correo"
4. Usar esa contraseña en `EMAIL_PASS`

---

## 💳 Configuración de MercadoPago

1. Crear cuenta en [MercadoPago Colombia](https://www.mercadopago.com.co)
2. Ir al [Dashboard de Desarrolladores](https://www.mercadopago.com.co/developers/)
3. Obtener credenciales de producción
4. Configurar webhook para notificaciones de pago

---

## 🐛 Solución de Problemas

### Error de conexión a base de datos
```bash
# Verificar conexión
node check_usuarios_table.js
```

### Puerto 3001 en uso
```bash
# Matar proceso en Windows
node kill_server.js
```

### Email no se envía
- Verificar credenciales de Gmail
- Confirmar que la contraseña sea de aplicación
- Revisar logs del servidor

### reCAPTCHA no funciona
- Verificar que las claves sean correctas
- Confirmar que el dominio esté autorizado
- Revisar consola del navegador

---

## 📝 Scripts Disponibles

```bash
npm start              # Iniciar servidor
node kill_server.js    # Detener servidor
node create_admin.js   # Crear usuario admin
node check_*.js        # Verificar estructuras DB
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto es privado y propiedad de Clinikdent.

---

## 👨‍💻 Autor

**Maria Camila**
- GitHub: [@maria162003](https://github.com/maria162003)
- Email: mariacamilafontalvolopez@gmail.com

---

## 🎉 Agradecimientos

- Bootstrap Team por el framework UI
- Supabase por el backend PostgreSQL
- MercadoPago por la pasarela de pagos
- Google por reCAPTCHA

---

## 📚 Documentación Adicional

- [Sistema de Seguridad](SISTEMA_SEGURIDAD_COMPLETO.md)
- [Alertas Mejoradas](ALERTAS_MEJORADAS_README.md)
- [Configuración reCAPTCHA](CONFIGURAR_RECAPTCHA_REAL.md)
- [Migración Supabase](MIGRACION_SUPABASE.md)
- [Instrucciones de Arranque](INSTRUCCIONES_ARRANQUE.md)
- [README Rama Clinikdent-Total](README_RAMA_CLINIKDENT_TOTAL.md)

---

## 🔄 Historial de Versiones

### v2.0.0 (2025-11-05)
- ✨ Corrección de errores SMTP Gmail y PostgreSQL Supabase
- ✨ Sistema de seguridad completo con reCAPTCHA
- ✨ Modal de registro profesional mejorado
- ✨ Validación de contraseñas en tiempo real
- ✨ Sistema de alertas modernas
- ✨ Bloqueo progresivo de cuentas
- ✨ Integración completa con notificaciones backend
- ✨ Configuración actualizada de credenciales
- 🐛 Correcciones de bugs varios
- 📝 Documentación mejorada

### v1.0.0
- 🎉 Versión inicial con funcionalidades básicas

---

**⚡ Desarrollado con pasión para revolucionar la gestión odontológica ⚡**

*Última actualización: 5 de Noviembre de 2025*
