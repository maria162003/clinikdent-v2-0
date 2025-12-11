# ClinikDent v2.0

Sistema de gestión integral para clínicas dentales desarrollado con Node.js y Supabase.

## 📋 Descripción

ClinikDent es una plataforma completa para la gestión de clínicas dentales que incluye:

- **Gestión de Pacientes**: Registro completo y seguimiento de pacientes
- **Sistema de Citas**: Agenda y programación de citas médicas
- **Historial Clínico**: Registro detallado de tratamientos y diagnósticos
- **Facturación**: Sistema completo de pagos y facturación
- **Inventario**: Control de equipos y materiales
- **Reportes**: Análisis y estadísticas de la clínica
- **Chat de Soporte**: Comunicación entre usuarios del sistema

## 🚀 Tecnologías

- **Backend**: Node.js + Express
- **Base de Datos**: Supabase (PostgreSQL)
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Autenticación**: Sistema seguro con JWT y Supabase Auth

## 📁 Estructura del Proyecto

```
├── Backend/
│   ├── controllers/     # Lógica de negocio
│   ├── routes/         # Definición de rutas API
│   ├── middleware/     # Middlewares de autenticación y validación
│   ├── services/       # Servicios auxiliares (email, etc.)
│   └── config/         # Configuración de base de datos
├── public/             # Frontend de la aplicación
│   ├── js/            # Scripts JavaScript
│   ├── css/           # Estilos
│   └── *.html         # Páginas HTML
└── scripts/           # Scripts de utilidad y migración

```

## 🔧 Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/maria162003/clinikdent-v2-0.git
cd clinikdent-v2-0
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
- Crear archivo `.env` con las credenciales de Supabase
- Configurar SMTP para envío de emails

4. Iniciar la aplicación
```bash
npm start
```

## 👥 Roles de Usuario

- **Administrador**: Gestión completa del sistema
- **Odontólogo**: Acceso a pacientes y tratamientos
- **Maestro/Doctor**: Supervisión y gestión avanzada
- **Paciente**: Visualización de citas e historial

## 📝 Licencia

Proyecto privado - Todos los derechos reservados

## 👨‍💻 Desarrollo

Desarrollado por el equipo de ClinikDent
