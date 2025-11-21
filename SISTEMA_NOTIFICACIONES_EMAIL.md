# 📧 Sistema de Notificaciones por Correo Electrónico - Clinikdent

## 📋 Descripción General

El sistema de notificaciones por correo electrónico envía mensajes automáticos a los pacientes en los siguientes casos:

1. **Confirmación inmediata**: Al agendar una cita
2. **Recordatorio 24h antes**: Un día antes de la cita programada
3. **Cancelación**: Cuando se cancela una cita

## ✅ Características Implementadas

### 1. Envío de Confirmación al Agendar Cita
- Se envía automáticamente cuando un paciente agenda una cita
- Incluye todos los detalles: fecha, hora, odontólogo, motivo
- Solo se envía a usuarios con correo electrónico registrado

### 2. Recordatorio Automático 24h Antes
- Se ejecuta automáticamente cada hora mediante un proceso programado
- Busca citas para el día siguiente
- Solo envía recordatorios que no se hayan enviado previamente
- Solo para citas en estado "programada"

### 3. Notificación de Cancelación
- Se envía cuando un paciente o administrador cancela una cita
- Confirma la cancelación con todos los detalles

### 4. Seguridad y Validaciones
- ✅ Solo envía a usuarios registrados con correo válido
- ✅ No permite respuestas automáticas (correo noreply)
- ✅ Registra cada notificación enviada en la base de datos
- ✅ No duplica recordatorios (verifica antes de enviar)

## 🛠️ Configuración Inicial

### Paso 1: Crear la tabla de notificaciones

Ejecuta el siguiente script SQL en tu base de datos PostgreSQL:

```bash
# Desde PowerShell en la carpeta del proyecto
psql $env:DATABASE_URL -f crear_tabla_notificaciones.sql
```

O ejecuta manualmente el contenido de `crear_tabla_notificaciones.sql` en tu consola de Supabase.

### Paso 2: Configurar Variables de Entorno

**¡IMPORTANTE!** El sistema usa las **mismas credenciales** que ya tienes configuradas:

```env
# Configuración de Email (ya configurado)
EMAIL_USER=mariacamilafontalvolopez@gmail.com
EMAIL_PASS=tu-password-de-aplicacion-actual
```

**✅ No necesitas configurar nada nuevo** si ya tienes estos valores en tu `.env`.

El sistema de notificaciones de citas usa las mismas credenciales que:
- Recuperación de contraseñas
- Emails de bienvenida
- Confirmaciones PQRS

#### Si necesitas verificar que estén configuradas:

1. Abre tu archivo `.env`
2. Verifica que existan `EMAIL_USER` y `EMAIL_PASS`
3. Si ya envías correos de recuperación, ¡ya está listo!

### Paso 3: Verificar instalación de dependencias

```bash
npm install nodemailer
```

### Paso 4: Reiniciar el servidor

```bash
node app.js
```

## 🔄 Sistema de Recordatorios Automáticos

### Opción 1: Ejecutar manualmente (para pruebas)

```bash
node run-recordatorios.js
```

### Opción 2: Programar con Tarea de Windows (Producción)

1. Abre **Programador de Tareas** de Windows
2. Crear Tarea Básica:
   - Nombre: "Clinikdent - Recordatorios de Citas"
   - Descripción: "Envía recordatorios por email 24h antes de las citas"
3. Desencadenador: **Diariamente** cada hora
4. Acción: **Iniciar un programa**
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `run-recordatorios.js`
   - Iniciar en: `C:\Users\CAMILA\Desktop\Clinikdent_supabase_1.0`
5. Configurar para ejecutarse aunque el usuario no haya iniciado sesión

### Opción 3: Usar node-cron (Recomendado)

Instalar node-cron:

```bash
npm install node-cron
```

Añadir al final de `app.js`:

```javascript
const cron = require('node-cron');
const { procesarRecordatorios } = require('./services/email-service');

// Ejecutar recordatorios cada hora
cron.schedule('0 * * * *', async () => {
    console.log('🔄 Ejecutando proceso de recordatorios programado...');
    await procesarRecordatorios();
});

console.log('✅ Sistema de recordatorios programado cada hora');
```

## 📊 Estructura de la Base de Datos

### Tabla: `notificaciones_citas`

```sql
CREATE TABLE notificaciones_citas (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER REFERENCES citas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'confirmacion', 'recordatorio', 'cancelacion'
    enviado BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP DEFAULT NOW(),
    detalles JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_notificacion UNIQUE(cita_id, tipo)
);
```

Esta tabla registra:
- Qué notificaciones se han enviado
- Cuándo se enviaron
- Detalles del envío (messageId, errores, etc.)
- Evita duplicados con la restricción UNIQUE

## 🧪 Pruebas

### Probar envío de confirmación

1. Inicia sesión como paciente
2. Agenda una nueva cita
3. Verifica tu correo electrónico
4. Deberías recibir un correo con el título "✅ Confirmación de Cita - [fecha]"

### Probar recordatorio 24h antes

1. Crea una cita para mañana en la base de datos:
```sql
INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, estado, motivo)
VALUES (1, 2, CURRENT_DATE + 1, '10:00', 'programada', 'Control');
```

2. Ejecuta manualmente:
```bash
node run-recordatorios.js
```

3. Verifica tu correo

### Probar cancelación

1. Desde el dashboard del paciente, cancela una cita existente
2. Verifica tu correo
3. Deberías recibir "❌ Cancelación de Cita - [fecha]"

## 📧 Plantillas de Correo

### Confirmación de Cita
- **Asunto**: ✅ Confirmación de Cita - [fecha]
- **Contenido**: Detalles completos de la cita + recordatorio de que recibirá otro email 24h antes

### Recordatorio de Cita
- **Asunto**: ⏰ Recordatorio: Cita Mañana - [fecha]
- **Contenido**: Recordatorio urgente con detalles y recomendaciones

### Cancelación de Cita
- **Asunto**: ❌ Cancelación de Cita - [fecha]
- **Contenido**: Confirmación de cancelación + invitación a reagendar

## 🔍 Monitoreo y Logs

El sistema genera logs detallados:

```
📧 Confirmación de cita enviada: { to: 'paciente@email.com', fecha: '2025-11-10', messageId: '...' }
📧 Recordatorio de cita enviado: { to: 'paciente@email.com', fecha: '2025-11-10', messageId: '...' }
⚠️ No se puede enviar confirmación: usuario sin correo registrado
❌ Error enviando email de confirmación: [error details]
```

### Ver notificaciones enviadas

```sql
SELECT 
    nc.id,
    nc.tipo,
    nc.enviado,
    nc.fecha_envio,
    c.fecha as fecha_cita,
    c.hora,
    p.nombre || ' ' || p.apellido as paciente,
    p.correo
FROM notificaciones_citas nc
JOIN citas c ON nc.cita_id = c.id
JOIN usuarios p ON c.paciente_id = p.id
ORDER BY nc.fecha_envio DESC
LIMIT 20;
```

## ⚠️ Solución de Problemas

### El correo no se envía

1. **Verificar credenciales SMTP**:
   - ¿El correo y contraseña son correctos en `.env`?
   - ¿Usaste una contraseña de aplicación (no tu contraseña normal)?

2. **Verificar logs**:
   ```
   ⚠️ Servicio de email temporalmente deshabilitado
   ```
   Esto significa que las variables SMTP no están configuradas.

3. **Modo simulación**:
   Si no hay credenciales, el sistema simula el envío en consola:
   ```
   📧 SIMULACIÓN - Confirmación de cita: { to: '...', fecha: '...', hora: '...' }
   ```

### El paciente no recibe correos

1. **Verificar que el paciente tenga correo registrado**:
   ```sql
   SELECT id, nombre, apellido, correo FROM usuarios WHERE id = [paciente_id];
   ```

2. **Revisar carpeta de spam** del paciente

3. **Verificar tabla de notificaciones**:
   ```sql
   SELECT * FROM notificaciones_citas WHERE cita_id = [cita_id];
   ```

### Los recordatorios no se envían automáticamente

1. **Verificar que el proceso programado esté corriendo**:
   - Revisa el Programador de Tareas de Windows
   - O verifica que node-cron esté configurado en `app.js`

2. **Ejecutar manualmente para probar**:
   ```bash
   node run-recordatorios.js
   ```

3. **Verificar que existan citas para mañana**:
   ```sql
   SELECT * FROM citas 
   WHERE fecha = CURRENT_DATE + 1 
   AND estado = 'programada';
   ```

## 🚀 Mejoras Futuras (Opcionales)

- [ ] Integrar con WhatsApp Business API
- [ ] Añadir SMS como alternativa
- [ ] Plantillas personalizables desde el admin
- [ ] Estadísticas de apertura de emails
- [ ] Confirmación de asistencia mediante link en el email
- [ ] Recordatorio adicional 2 horas antes de la cita

## 📝 Notas Importantes

- **Solo usuarios registrados**: El sistema NO envía correos a direcciones no registradas
- **Sin respuestas automáticas**: Los correos son informativos, no se pueden responder
- **Privacidad**: Los datos de los correos están protegidos y solo se usan para notificaciones
- **Registro completo**: Todas las notificaciones se registran en la BD para auditoría

## 📞 Soporte

Si tienes problemas con la configuración, revisa:
1. Los logs del servidor
2. La tabla `notificaciones_citas`
3. Las credenciales SMTP en `.env`

---

**Sistema de Notificaciones v1.0** - Clinikdent 2025
