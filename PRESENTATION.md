# Clinikdent v2.0 – Resumen Ejecutivo de Presentación

> Plataforma integral para gestión odontológica (usuarios, citas, tratamientos, inventario, pagos y seguridad avanzada) desarrollada en Node.js + Express + PostgreSQL/Supabase.

## 1. Objetivo
Centralizar la operación diaria de una clínica odontológica: administración de usuarios y roles, programación y seguimiento de citas, historial clínico, gestión de inventario y proveedores, pagos (MercadoPago) y reportes, bajo un modelo seguro y escalable.

## 2. Módulos Clave
- **Autenticación & Roles**: Admin, Odontólogo, Paciente (JWT, bloqueo progresivo, recuperación segura).
- **Citas**: Creación, estados, reprogramaciones, historial de cambios y verificación anti-duplicación.
- **Tratamientos & Planes**: Registro y asociación a pacientes y citas.
- **Inventario**: Equipos dentales, categorías, proveedores (CRUD completo + alertas básicas).
- **Pagos**: Integración preliminar con MercadoPago para transacciones y verificación (requiere credenciales reales).
- **Reportes & Estadísticas**: Panel con métricas (citas, usuarios, rendimiento básico).
- **Seguridad Avanzada**: Rate limiting, bloqueo, auditoría parcial y rutas de notificaciones simuladas.

## 3. Arquitectura General
- **Frontend**: Archivos estáticos en `public/` (HTML, CSS, JS vanilla + Bootstrap + Icons).
- **Backend**: Servidor Express (`app.js`) monta routers en `Backend/routes/*` y servicios auxiliares.
- **Base de Datos**: PostgreSQL (Supabase). Algunos scripts iniciales para estructura y datos de prueba.
- **Configuración**: Variables en `.env` (no versionadas). Ejemplos: `.env.example`, `.env.secure`.
- **Seguridad**: Uso de `express-rate-limit`, hashing con bcrypt, validaciones y manejo de errores centralizado.

## 4. Flujo de Uso Típico
1. Registro / carga de datos iniciales (o uso de cuentas demo).  
2. Login (rol determina vistas y permisos).  
3. Dashboard (estadísticas + accesos rápidos).  
4. Operaciones: gestionar citas, pacientes, tratamientos, inventario y pagos.  
5. Consulta de historial y reportes.  
6. Acciones de seguridad (cambios de contraseña, recuperación).  

## 5. Requisitos Técnicos
- **Node.js**: v18+ (recomendado).  
- **Base de Datos**: Supabase/PostgreSQL accesible con credenciales válidas.  
- **Puerto**: 3001 (por defecto en `app.js`).  
- **Dependencias**: Instalar con `npm install`.  

## 6. Credenciales de Demo (ejemplo / pueden variar)
- **Administrador**: `admin@clinikdent.com` / `Admin123!`  
- **Odontólogo**: `odontologo@clinikdent.com` / `Odon123!`  
- **Paciente**: `paciente@clinikdent.com` / `Paciente123!`  

## 7. Diferenciadores
- Sistema multi-rol adaptable.  
- Historial avanzado de cambios en citas (auditoría funcional).  
- Módulo de inventario y proveedores integrados.  
- Seguridad mejorada: bloqueo progresivo, recuperación controlada, rate limiting.  
- Preparado para expansión (IA, analítica avanzada, multi-sede).  

## 8. Estado Actual y Limitaciones
| Aspecto | Estado |
|---------|--------|
| Servidor Express | Operativo |
| Autenticación Básica | Funcional (requiere DB) |
| Conexión a Supabase | Necesita credenciales locales válidas |
| MercadoPago | Integración parcial (requiere tokens reales) |
| Email SMTP | Simulado (credenciales ausentes por seguridad) |
| Rutas de prueba | Presentes (pueden limpiarse para producción) |

## 9. Inicio Rápido (Desarrollo)
```bash
npm install
npm start   # o: node app.js
# Abrir: http://localhost:3001
```
Asegurarse de tener `.env` con las variables PostgreSQL (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT). Si no, la conexión fallará (ECONNREFUSED).

## 10. Seguridad (Resumen)
- Hash de contraseñas (bcrypt).  
- Rate limiting en rutas sensibles.  
- Bloqueo por intentos fallidos sucesivos.  
- Tokens JWT para sesiones (access/refresh).  
- Endpoints de cambio y recuperación de contraseña con verificación.  

## 11. Uso en Demo / Presentación (Sugerido)
1. Login como Admin → mostrar dashboard y métricas.  
2. Ir a módulo de citas → crear/modificar una cita y revisar historial.  
3. Inventario → listar equipos y proveedores.  
4. Mostrar una ruta de seguridad (p.ej. intento de login fallido y feedback).  
5. Mostrar endpoints de pagos (respuesta simulada si no hay tokens).  

## 12. Roadmap Breve (Potencial Futuro)
- Integración real de mailing y notificaciones push.  
- IA para apoyo a diagnósticos (módulo en exploración).  
- Panel de analítica ampliado (segmentación por sede, profesional).  
- App móvil / PWA completa.  
- Auditoría completa con logs persistentes y firma digital.  

## 13. Mantenimiento & Mejores Prácticas
- Mantener secretos fuera del repositorio (`.env` en gitignore).  
- Revisar vulnerabilidades con `npm audit`.  
- Limpiar archivos de prueba antes de despliegues productivos.  
- Añadir monitoreo de salud (endpoints /health y métricas).  

## 14. Contacto / Autoría
Proyecto privado orientado a gestión odontológica.  
Autor principal: María Camila (GitHub: `maria162003`).  

---
**Clinikdent v2.0** – Preparado para demostraciones funcionales y expansión futura.
