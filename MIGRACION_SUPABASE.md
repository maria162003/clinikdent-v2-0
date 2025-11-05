# Guía de Migración a Supabase para Clinikdent

## ✅ Paso 1: Configuración de la Base de Datos
1. Ve a tu proyecto Supabase: https://xzlugnkzfdurczwwwimv.supabase.co
2. Abre el SQL Editor
3. Ejecuta primero `supabase_schema.sql` (estructura de tablas)
4. Ejecuta después `supabase_init_data.sql` (datos iniciales)

## ✅ Paso 2: Configuración del Backend
La configuración ya está lista en `.env` con tus datos de Supabase:
- Host: db.xzlugnkzfdurczwwwimv.supabase.co
- Usuario: postgres
- Contraseña: 12345
- Base de datos: postgres

## ✅ Paso 3: Archivos Actualizados
Los siguientes archivos ya están adaptados para PostgreSQL:
- ✅ `Backend/config/db.js` - Conexión a PostgreSQL
- ✅ `Backend/controllers/authControllerNew.js` - Login/Registro
- ✅ `Backend/controllers/usuarioController.js` - Gestión de usuarios (parcial)
- ✅ `Backend/controllers/citaController.js` - Gestión de citas (inicio)
- ✅ `.env` - Variables de entorno configuradas

## 🔄 Paso 4: Pendientes por Actualizar
Los siguientes controladores necesitan ser actualizados de MySQL a PostgreSQL:

### Controladores que requieren actualización:
1. `Backend/controllers/citaController.js` (resto de funciones)
2. `Backend/controllers/inventarioController.js`
3. `Backend/controllers/pagoController.js`
4. `Backend/controllers/evaluacionesController.js`
5. `Backend/controllers/estadisticasController.js`
6. `Backend/controllers/historialController.js`
7. `Backend/controllers/notificacionController.js`
8. `Backend/controllers/pqrsController.js`
9. Otros controladores según sea necesario

## 🚀 Paso 5: Probar la Aplicación
1. Instala dependencias: `npm install`
2. Inicia el servidor: `npm start`
3. Prueba login con usuario admin:
   - Email: admin@clinikdent.com
   - Contraseña: admin123
   - Rol: administrador

## 📝 Notas Importantes
- La contraseña del usuario admin por defecto es: `admin123`
- Los datos de prueba fueron eliminados como solicitaste
- El frontend no necesita cambios, solo el backend
- Todas las rutas y endpoints siguen igual para el frontend

## 🔧 Cambios Técnicos Realizados
- MySQL → PostgreSQL
- `mysql2/promise` → `pg`
- `?` parámetros → `$1, $2, $3...`
- `[rows]` → `{rows}`
- `result.insertId` → `result[0].id` con `RETURNING id`
- `result.affectedRows` → `rowCount`

## ⚡ Usuario de Prueba
- **Email:** admin@clinikdent.com
- **Contraseña:** admin123
- **Rol:** administrador
