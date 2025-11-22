# 📊 Sistema de Reportes y Estadísticas - Clinik Dent

## 🎯 Características Implementadas

### 1. **Validación de Campos Requeridos**
- ✅ El botón "Descargar Excel" se activa **solo cuando todos los campos requeridos están completos**
- ✅ Validación en tiempo real de fechas
- ✅ Verificación de que la fecha fin sea mayor a la fecha inicio
- ✅ Indicadores visuales de campos inválidos (bordes rojos y mensajes de error)

### 2. **Tipos de Reportes Disponibles**

#### 💰 Reporte Financiero
**Campos:**
- Fecha Inicio* (requerido)
- Fecha Fin* (requerido)
- Método de Pago (opcional: Todos, Efectivo, Tarjeta, Transferencia)

**Información Generada:**
- Total de ingresos
- Total de transacciones
- Ticket promedio
- Detalle: Fecha, Concepto, Paciente, Método de Pago, Monto, Estado

#### 📋 Citas Agendadas
**Campos:**
- Fecha Inicio* (requerido)
- Fecha Fin* (requerido)
- Estado (opcional: Todos, Programada, Completada, Confirmada)
- Odontólogo (opcional: selector dinámico con todos los odontólogos)

**Información Generada:**
- Total de citas
- Citas completadas
- Citas programadas
- Detalle: Fecha, Hora, Paciente, Odontólogo, Tratamiento, Estado

#### ❌ Análisis de Cancelaciones
**Campos:**
- Fecha Inicio* (requerido)
- Fecha Fin* (requerido)
- Motivo (opcional: Todos, Por Paciente, Por Clínica, Emergencia, Otro)

**Información Generada:**
- Total de cancelaciones
- Cancelaciones por paciente
- Cancelaciones por clínica
- Detalle: Fecha Cita, Fecha Cancelación, Paciente, Tratamiento, Motivo, Observaciones

#### 👥 Actividad de Usuarios
**Campos:**
- Fecha Inicio* (requerido)
- Fecha Fin* (requerido)
- Usuario (opcional: selector dinámico con todos los usuarios)
- Tipo de Acción (opcional: Todas, Login, Crear, Editar, Eliminar)

**Información Generada:**
- Total de acciones
- Usuarios activos
- Promedio diario de actividad
- Detalle: Fecha y Hora, Usuario, Rol, Acción, Módulo, Detalles

#### 🦷 Seguimiento de Tratamientos
**Campos:**
- Fecha Inicio* (requerido)
- Fecha Fin* (requerido)
- Estado (opcional: Todos, En Progreso, Completado, Pausado, Cancelado)
- Tipo de Tratamiento (opcional: Todos, Limpieza, Ortodoncia, Endodoncia, Implantes, Estética)

**Información Generada:**
- Total de tratamientos
- Tratamientos completados
- Tratamientos en progreso
- Tasa de éxito
- Detalle: Paciente, Tipo, Fecha Inicio, Fecha Estimada Fin, Progreso %, Estado, Odontólogo

### 3. **Exportación a Excel**

Cada reporte puede ser exportado a Excel con:
- ✅ **Formato profesional** con encabezados en color
- ✅ **Información del período** seleccionado
- ✅ **Columnas ajustadas** automáticamente
- ✅ **Nombre de archivo** descriptivo: `reporte_[tipo]_[fecha].xlsx`
- ✅ **Totales y resúmenes** incluidos

## 🚀 Cómo Usar el Sistema

### Paso 1: Configuración de Base de Datos
```bash
# Ejecutar el script SQL para crear/verificar tablas necesarias
cd Backend
mysql -u root -p clinikdent < ../scripts/verificar_tablas_reportes.sql
```

### Paso 2: Verificar Instalación de Dependencias
```bash
# Asegurarse de que ExcelJS está instalado
npm install exceljs
```

### Paso 3: Acceder al Sistema
1. Iniciar el servidor: `npm start`
2. Navegar a: `http://localhost:3000/reportes.html`
3. Seleccionar el tipo de reporte deseado usando las pestañas

### Paso 4: Generar Reporte
1. **Completar campos requeridos** (marcados con *)
2. Seleccionar filtros opcionales según necesidad
3. Hacer clic en **"📊 Generar Reporte"**
4. Esperar a que se carguen los resultados

### Paso 5: Descargar Excel
1. Una vez generado el reporte, el botón **"📥 Descargar Excel"** se activará
2. Hacer clic para descargar el archivo Excel
3. El archivo se guardará con nombre descriptivo

## 📋 Endpoints API

### POST `/api/reportes-basicos/financiero`
```json
{
  "fechaInicio": "2025-11-01",
  "fechaFin": "2025-11-30",
  "metodoPago": "efectivo"
}
```

### POST `/api/reportes-basicos/citas-agendadas`
```json
{
  "fechaInicio": "2025-11-01",
  "fechaFin": "2025-11-30",
  "estado": "completada",
  "odontologoId": "5"
}
```

### POST `/api/reportes-basicos/cancelaciones`
```json
{
  "fechaInicio": "2025-11-01",
  "fechaFin": "2025-11-30",
  "motivo": "paciente"
}
```

### POST `/api/reportes-basicos/actividad-usuarios`
```json
{
  "fechaInicio": "2025-11-01",
  "fechaFin": "2025-11-30",
  "usuarioId": "3",
  "tipoAccion": "login"
}
```

### POST `/api/reportes-basicos/seguimiento-tratamientos`
```json
{
  "fechaInicio": "2025-11-01",
  "fechaFin": "2025-11-30",
  "estado": "en_progreso",
  "tipo": "ortodoncia"
}
```

### POST `/api/reportes-basicos/exportar-excel/:tipo`
```json
{
  "data": { /* datos del reporte */ },
  "filtros": { /* filtros aplicados */ }
}
```

## 🎨 Características de la Interfaz

### Validación Visual
- ✅ Campos inválidos con **borde rojo**
- ✅ Mensajes de error descriptivos
- ✅ Validación en tiempo real al cambiar campos
- ✅ Botón de descarga **deshabilitado** hasta que:
  - Todos los campos requeridos estén completos
  - Los datos del reporte se hayan generado

### Diseño Responsivo
- ✅ Grid adaptable para diferentes tamaños de pantalla
- ✅ Tarjetas de estadísticas con gradientes visuales
- ✅ Tablas scrolleables en dispositivos móviles

### Feedback al Usuario
- ✅ Indicador de carga mientras se genera el reporte
- ✅ Alertas de éxito/error
- ✅ Confirmación de descarga

## 🔧 Estructura de Archivos

```
Clinikdent_supabase_1.0/
├── public/
│   ├── reportes.html              # Interfaz principal con pestañas
│   └── js/
│       └── reportes.js            # Lógica de validación y generación
├── Backend/
│   ├── controllers/
│   │   └── reportesController.js # Lógica de negocio y exportación Excel
│   └── routes/
│       └── reportesRoutes.js     # Endpoints de la API
└── scripts/
    └── verificar_tablas_reportes.sql # Script de base de datos
```

## 📊 Tablas de Base de Datos Requeridas

1. **registro_actividad** - Registros de actividad de usuarios
2. **pagos** - Transacciones financieras
3. **citas** - Citas médicas (con campos de cancelación)
4. **tratamientos** - Tratamientos odontológicos (con progreso)
5. **pacientes** - Información de pacientes
6. **usuarios** - Usuarios del sistema

## 🔐 Seguridad

- Validación de datos en frontend y backend
- Parametrización de queries SQL para prevenir inyección
- Validación de fechas y rangos
- Control de acceso basado en roles (preparado para implementación)

## 📈 Próximas Mejoras Sugeridas

1. **Gráficos visuales** usando Chart.js
2. **Exportación a PDF** además de Excel
3. **Programación de reportes** automáticos por email
4. **Comparativas** entre períodos
5. **Dashboards** interactivos con métricas en tiempo real

## 🐛 Solución de Problemas

### El botón de descarga no se activa
- Verificar que todos los campos con * estén completos
- Asegurar que se haya generado el reporte primero

### Error al generar reporte
- Verificar conexión a base de datos
- Comprobar que las tablas existen ejecutando el script SQL
- Revisar logs del servidor en consola

### Excel descargado vacío
- Verificar que hay datos en el rango de fechas seleccionado
- Comprobar que ExcelJS está instalado: `npm list exceljs`

## 📞 Soporte

Para problemas o sugerencias, contactar al equipo de desarrollo.

---

**Versión:** 1.0  
**Fecha:** Noviembre 2025  
**Desarrollado por:** Clinik Dent Team
