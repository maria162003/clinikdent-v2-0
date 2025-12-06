# 🦷 Clinikdent Mobile

Aplicación móvil de prueba para el sistema de gestión odontológica Clinikdent. Esta app se conecta a la base de datos de Supabase del proyecto principal y replica las funcionalidades principales.

## 📱 Características

- **Dashboard**: Vista general con estadísticas de pacientes, citas y tratamientos
- **Gestión de Pacientes**: Lista, búsqueda, creación y edición de pacientes
- **Gestión de Citas**: Programación, filtrado por estado, envío de recordatorios
- **Reportes PDF**: Generación de reportes descargables de pacientes, citas y tratamientos

## 🛠️ Requisitos Previos

- Node.js 18.x o superior
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go (aplicación en tu dispositivo móvil)

## 📦 Instalación

1. **Navegar al directorio de la app móvil:**
   ```bash
   cd mobile-app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   - Copia `.env.example` a `.env`
   - Las credenciales de Supabase ya están configuradas
   ```bash
   cp .env.example .env
   ```

## 🚀 Ejecución

### Usando Expo Go (Recomendado para desarrollo)

```bash
# Iniciar servidor de desarrollo
npm start
# o
expo start
```

Luego escanea el código QR con:
- **iOS**: Cámara del iPhone
- **Android**: Expo Go app

### Ejecutar en simulador/emulador

```bash
# iOS (requiere Mac con Xcode)
npm run ios

# Android (requiere Android Studio)
npm run android
```

### Ejecutar en navegador web

```bash
npm run web
```

## 📁 Estructura del Proyecto

```
mobile-app/
├── app/                          # Pantallas (Expo Router)
│   ├── (tabs)/                   # Navegación por pestañas
│   │   ├── _layout.tsx           # Configuración de tabs
│   │   ├── index.tsx             # Dashboard principal
│   │   ├── pacientes.tsx         # Gestión de pacientes
│   │   ├── citas.tsx             # Gestión de citas
│   │   └── reportes.tsx          # Generación de reportes
│   ├── _layout.tsx               # Layout raíz
│   └── +not-found.tsx            # Página 404
├── components/                   # Componentes reutilizables
│   ├── navigation/
│   │   └── TabBarIcon.tsx        # Iconos de navegación
│   ├── ui/
│   │   ├── Button.tsx            # Botón personalizado
│   │   ├── Card.tsx              # Tarjeta de contenido
│   │   └── Input.tsx             # Campo de entrada
│   └── ThemedText.tsx            # Texto con tema
├── services/                     # Servicios de datos
│   ├── supabase.service.ts       # Cliente de Supabase
│   ├── database.service.ts       # Operaciones CRUD
│   ├── email.service.ts          # Envío de emails
│   └── report.service.ts         # Generación de PDFs
├── constants/
│   └── Colors.ts                 # Paleta de colores
├── hooks/
│   └── useColorScheme.ts         # Hook de tema
├── .env                          # Variables de entorno
├── .env.example                  # Ejemplo de variables
├── app.json                      # Configuración de Expo
├── package.json                  # Dependencias
└── tsconfig.json                 # Configuración TypeScript
```

## 🔗 Conexión a Supabase

La aplicación se conecta a la misma base de datos Supabase del proyecto web principal. Las tablas utilizadas son:

- `usuarios` - Información de usuarios (pacientes, odontólogos, admin)
- `citas` - Registro de citas médicas
- `tratamientos` - Catálogo de tratamientos disponibles
- `paciente_tratamientos` - Tratamientos asignados a pacientes

### Configuración de credenciales

Las credenciales de Supabase se configuran en el archivo `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xzlugnkzfdurczwwwimv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

⚠️ **Importante**: Solo se usa la `ANON_KEY` (clave pública) en la aplicación móvil. Nunca incluyas la `SERVICE_ROLE_KEY` en el cliente.

## 📧 Servicio de Email

El envío de correos electrónicos (recordatorios de citas) se realiza a través del backend del proyecto principal. La app móvil hace llamadas a la API REST.

## 📄 Generación de Reportes

Los reportes se generan en formato PDF usando:
- `expo-print` - Para crear el PDF
- `expo-sharing` - Para compartir/descargar

Los reportes disponibles son:
1. **Reporte de Pacientes**: Lista completa con datos de contacto
2. **Reporte de Citas**: Historial con filtros de fecha
3. **Reporte de Tratamientos**: Catálogo con precios

## 🎨 Temas

La aplicación soporta tema claro y oscuro, detectando automáticamente la preferencia del sistema operativo.

## 📱 Capturas de Pantalla

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Pacientes
![Pacientes](./screenshots/pacientes.png)

### Citas
![Citas](./screenshots/citas.png)

### Reportes
![Reportes](./screenshots/reportes.png)

*(Las capturas de pantalla se agregarán después de las pruebas)*

## ⚠️ Notas Importantes

- Esta es una **aplicación de PRUEBA**
- Está completamente **aislada** del proyecto web principal
- Todos los archivos están contenidos en la carpeta `mobile-app/`
- **NO modifica** ningún archivo del proyecto web existente
- Usa las mismas credenciales de Supabase para acceder a los datos

## 🔧 Solución de Problemas

### Error de conexión a Supabase
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el proyecto de Supabase esté activo

### El código QR no funciona
- Asegúrate de estar en la misma red WiFi
- Intenta usar el túnel: `expo start --tunnel`

### Errores de tipos TypeScript
- Ejecuta: `npx tsc --noEmit` para verificar tipos
- Reinstala dependencias: `rm -rf node_modules && npm install`

## 📞 Soporte

Para problemas o sugerencias, contactar al equipo de desarrollo de Clinikdent.

## 📄 Licencia

Este proyecto es de uso interno para Clinikdent.

---

**Clinikdent Mobile** - Sistema de Gestión Odontológica
