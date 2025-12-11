# 📊 FLUJO DE PAGOS ACTUAL - CLINIKDENT

## 🔄 FLUJO COMPLETO DE PAGOS

### 1️⃣ PACIENTE REALIZA EL PAGO

```
┌─────────────────────────────────────────────────────────┐
│ PACIENTE                                                │
├─────────────────────────────────────────────────────────┤
│ 1. Accede a sección de pagos                          │
│ 2. Selecciona cita/tratamiento a pagar                │
│ 3. Hace clic en "Pagar con MercadoPago"              │
│ 4. Se crea preferencia de pago                        │
│    - POST /api/mercadopago/crear-pago-paciente       │
│    - Se registra en tabla: transacciones_mercadopago │
│    - Estado inicial: "pending"                        │
│ 5. Es redirigido a pasarela de MercadoPago           │
│ 6. Completa el pago (tarjeta/efectivo/etc)           │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ MERCADOPAGO (Webhook Automático)                       │
├─────────────────────────────────────────────────────────┤
│ 7. MercadoPago procesa el pago                         │
│ 8. Envía notificación webhook                          │
│    - POST /api/mercadopago/webhook                    │
│ 9. Sistema actualiza transacción:                     │
│    - Estado: "approved" ✅                            │
│    - payment_id: ID de MercadoPago                    │
│    - Actualiza estado_pago de cita a "pagado"        │
└─────────────────────────────────────────────────────────┘
```

**TABLA: `transacciones_mercadopago`**
```sql
Campos importantes:
- id: ID interno
- payment_id: ID de MercadoPago
- preference_id: Preferencia creada
- external_reference: Referencia única
- tipo: 'pago_paciente' | 'pago_odontologo' | 'pago_proveedor'
- usuario_id: ID del paciente
- cita_id: ID de la cita asociada
- monto: Monto total
- estado: 'pending' | 'approved' | 'rejected' | 'cancelled'
- fecha_creacion: Timestamp
- datos_pago: JSON con info completa de MercadoPago
```

---

### 2️⃣ ADMINISTRADOR VE EL PAGO

```
┌─────────────────────────────────────────────────────────┐
│ PANEL ADMINISTRADOR                                     │
├─────────────────────────────────────────────────────────┤
│ 📊 Vista de Transacciones:                             │
│                                                         │
│ GET /api/mercadopago/transacciones?tipo=pago_paciente │
│                                                         │
│ Muestra lista con:                                     │
│ - ID de transacción                                    │
│ - Paciente (nombre)                                    │
│ - Concepto/Descripción                                 │
│ - Monto                                                │
│ - Estado (pending/approved/rejected)                   │
│ - Fecha                                                │
│ - Cita asociada                                        │
│                                                         │
│ ✅ Estados de pago del paciente son SOLO LECTURA      │
│    (No se pueden modificar manualmente)                │
└─────────────────────────────────────────────────────────┘
```

---

### 3️⃣ ADMINISTRADOR PAGA A ODONTÓLOGO

```
┌─────────────────────────────────────────────────────────┐
│ PANEL ADMINISTRADOR - Sección Honorarios               │
├─────────────────────────────────────────────────────────┤
│ 1. Ve lista de odontólogos                             │
│ 2. Calcula honorarios del periodo                      │
│    - Basado en citas completadas                       │
│    - Puede aplicar % de comisión                       │
│ 3. Hace clic en "Pagar Honorarios"                     │
│                                                         │
│ POST /api/mercadopago/pagar-odontologo                 │
│ {                                                       │
│   odontologo_id: 5,                                    │
│   monto: 5000000,                                      │
│   descripcion: "Honorarios Noviembre 2025",           │
│   periodo: "2025-11"                                   │
│ }                                                       │
│                                                         │
│ Se registra nueva transacción:                         │
│ - tipo: 'pago_odontologo'                             │
│ - estado: 'pending' → Se cambia a 'approved'          │
│    cuando admin confirma el pago                       │
└─────────────────────────────────────────────────────────┘
```

**PROCESO ACTUAL:**
- No hay automatización de cálculo de honorarios
- Admin debe calcular manualmente según:
  * Número de consultas/tratamientos
  * Porcentaje acordado con odontólogo
  * Deducciones (si aplica)

---

### 4️⃣ ODONTÓLOGO VE SUS PAGOS

```
┌─────────────────────────────────────────────────────────┐
│ PANEL ODONTÓLOGO - "Mis Ingresos"                      │
├─────────────────────────────────────────────────────────┤
│ GET /api/pagos-ext/odontologo/resumen-financiero       │
│                                                         │
│ Muestra:                                                │
│ 💰 Total Ingresos: $X.XXX.XXX                         │
│ 📊 Pacientes Atendidos: XX                             │
│ 📅 Consultas Este Mes: XX                              │
│ 💳 Pagos Recibidos: XX                                 │
│                                                         │
│ Tabla de pagos:                                        │
│ - Fecha                                                │
│ - Concepto/Periodo                                     │
│ - Monto                                                │
│ - Estado                                               │
│ - Método                                               │
│                                                         │
│ Query: SELECT * FROM transacciones_mercadopago        │
│        WHERE usuario_id = [odontologo_id]             │
│          AND tipo = 'pago_odontologo'                 │
│          AND estado = 'approved'                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🚨 PROBLEMAS/LIMITACIONES ACTUALES

### ❌ Falta de Trazabilidad Completa
1. **No hay conexión directa** entre:
   - Pago del paciente → Ingreso del odontólogo
   - No se puede ver qué pagos de pacientes generaron qué honorarios

2. **Cálculo Manual de Honorarios**
   - Admin debe calcular manualmente
   - No hay registro de % de comisión por odontólogo
   - No hay desglose automático de ingresos

3. **Sin Dashboard de Reconciliación**
   - No hay vista que muestre:
     * Total recibido de pacientes
     * Total pagado a odontólogos
     * Margen de la clínica
     * Pagos pendientes por distribuir

4. **Falta de Notificaciones**
   - Odontólogo no recibe alerta cuando le pagan
   - Admin no tiene recordatorios de pagos pendientes

---

## ✅ MEJORAS PROPUESTAS

### 1. Dashboard de Reconciliación Financiera (Admin)

```javascript
GET /api/admin/dashboard-financiero

Respuesta:
{
  periodo: "2025-11",
  ingresos_pacientes: {
    total: 15000000,
    cantidad_pagos: 45,
    promedio: 333333
  },
  egresos_odontologos: {
    total: 9000000,
    cantidad_pagos: 3,
    odontologos_pagados: 3,
    odontologos_pendientes: 2
  },
  margen_clinica: 6000000,
  comision_promedio: 40%, // 60% para odontólogo, 40% clínica
  pendientes_pago: [
    { odontologo_id: 5, nombre: "Dr. Juan", monto_pendiente: 2500000 }
  ]
}
```

### 2. Tabla de Distribución de Pagos

**Nueva tabla: `distribucion_pagos`**
```sql
CREATE TABLE distribucion_pagos (
  id SERIAL PRIMARY KEY,
  transaccion_paciente_id INT REFERENCES transacciones_mercadopago(id),
  odontologo_id INT REFERENCES usuarios(id),
  monto_total DECIMAL(10,2),
  porcentaje_odontologo DECIMAL(5,2) DEFAULT 60.00,
  monto_odontologo DECIMAL(10,2),
  monto_clinica DECIMAL(10,2),
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado
  fecha_calculo TIMESTAMP DEFAULT NOW(),
  fecha_pago TIMESTAMP,
  transaccion_pago_id INT REFERENCES transacciones_mercadopago(id),
  notas TEXT
);
```

**Flujo mejorado:**
```
Pago Paciente (approved) 
  → Se crea registro en distribucion_pagos (estado: pendiente)
  → Admin ve pendientes agrupados por odontólogo
  → Admin paga → Se actualiza estado a 'pagado' + transaccion_pago_id
  → Odontólogo ve el pago con referencia a citas originales
```

### 3. Endpoints Adicionales

```javascript
// Para Admin
POST /api/admin/calcular-honorarios
  - Calcula automáticamente honorarios del periodo
  - Agrupa por odontólogo
  - Aplica % configurado

POST /api/admin/pagar-honorarios-bulk
  - Paga a múltiples odontólogos a la vez
  - Actualiza distribuciones pendientes

GET /api/admin/pagos-pendientes-distribuir
  - Lista pagos de pacientes sin distribuir aún

// Para Odontólogo
GET /api/odontologo/mis-ingresos/detalle
  - Desglose por cita/tratamiento
  - Muestra paciente origen
  - Fecha del pago del paciente vs fecha que le pagaron
```

### 4. Sistema de Notificaciones

```javascript
// Cuando paciente paga
→ Email/Notificación a Admin: "Nuevo pago recibido de [Paciente]"
→ Email a Odontólogo: "Tu paciente [X] pagó su consulta"

// Cuando admin paga a odontólogo
→ Email a Odontólogo: "Recibiste pago de $X por periodo [Y]"
→ Incluir PDF con desglose de consultas/tratamientos
```

---

## 📋 IMPLEMENTACIÓN SUGERIDA

### Prioridad Alta 🔴
1. Crear tabla `distribucion_pagos`
2. Automatizar creación de registros cuando paciente paga
3. Dashboard de reconciliación para admin
4. Vista detallada de ingresos para odontólogo

### Prioridad Media 🟡
5. Cálculo automático de honorarios
6. Sistema de notificaciones por email
7. Reportes descargables (PDF/Excel)

### Prioridad Baja 🟢
8. Gráficos de tendencias
9. Predicción de ingresos
10. Integración con contabilidad

---

## 🔧 ¿Necesitas que implemente alguna de estas mejoras?

Puedo empezar por:
- ✅ Crear la tabla `distribucion_pagos`
- ✅ Endpoint para ver dashboard financiero admin
- ✅ Mejorar vista de ingresos del odontólogo con trazabilidad
- ✅ Sistema de notificaciones automáticas
