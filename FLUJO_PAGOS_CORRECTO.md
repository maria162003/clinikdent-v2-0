# 💰 FLUJO DE PAGOS CORRECTO - CLINIKDENT

## 🎯 OBJETIVO
Asegurar que TODAS las citas generen factura y el pago sea obligatorio ANTES o en el momento de la atención.

---

## 📋 FLUJO COMPLETO PROPUESTO

### ETAPA 1: CATÁLOGO DE SERVICIOS Y PRECIOS

```sql
-- Nueva tabla: catalogo_servicios
CREATE TABLE catalogo_servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100), -- 'consulta', 'tratamiento', 'cirugia', etc.
  precio_base DECIMAL(10,2) NOT NULL,
  duracion_minutos INT,
  requiere_autorizacion BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Ejemplos:
INSERT INTO catalogo_servicios (nombre, categoria, precio_base, duracion_minutos) VALUES
('Consulta General', 'consulta', 50000, 30),
('Limpieza Dental', 'prevencion', 80000, 45),
('Extracción Simple', 'cirugia', 120000, 60),
('Ortodoncia - Control', 'ortodoncia', 100000, 30),
('Blanqueamiento Dental', 'estetica', 350000, 90);
```

**Frontend: Página Pública de Servicios**
- `/servicios.html` - Lista completa con precios
- Paciente VE PRECIOS antes de agendar

---

### ETAPA 2: AGENDAMIENTO CON PRESUPUESTO

```
┌─────────────────────────────────────────────────────────┐
│ PACIENTE AGENDA CITA                                    │
├─────────────────────────────────────────────────────────┤
│ 1. Selecciona fecha y hora                             │
│ 2. Selecciona servicio del catálogo                    │
│    → Sistema muestra PRECIO automáticamente            │
│ 3. Odontólogo asignado (automático o manual)           │
│ 4. SE CREA FACTURA automáticamente:                    │
│                                                         │
│    INSERT INTO facturas (                              │
│      paciente_id, odontologo_id, cita_id,             │
│      total, estado, fecha_emision                     │
│    ) VALUES (                                          │
│      [paciente], [odontologo], [cita_id],            │
│      [precio_servicio], 'PENDIENTE', NOW()           │
│    )                                                   │
│                                                         │
│ 5. Estado de cita: 'pendiente_pago'                   │
│ 6. Paciente recibe notificación:                       │
│    "Tu cita está agendada. Paga antes del [fecha]     │
│     o será cancelada automáticamente"                  │
└─────────────────────────────────────────────────────────┘
```

**Nueva tabla mejorada: `facturas`**
```sql
CREATE TABLE facturas (
  id SERIAL PRIMARY KEY,
  numero_factura VARCHAR(50) UNIQUE, -- FAC-2025-0001
  paciente_id INT REFERENCES usuarios(id),
  odontologo_id INT REFERENCES usuarios(id),
  cita_id INT REFERENCES citas(id),
  
  -- Desglose de servicios
  servicios JSONB, -- [{ servicio_id, nombre, cantidad, precio_unitario, subtotal }]
  
  subtotal DECIMAL(10,2),
  descuento DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  estado VARCHAR(20) DEFAULT 'PENDIENTE', 
  -- Estados: PENDIENTE, PAGADA, VENCIDA, CANCELADA
  
  fecha_emision TIMESTAMP DEFAULT NOW(),
  fecha_vencimiento TIMESTAMP, -- 2-3 días antes de la cita
  fecha_pago TIMESTAMP,
  
  metodo_pago VARCHAR(50), -- mercadopago, efectivo, transferencia
  transaccion_id INT REFERENCES transacciones_mercadopago(id),
  
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para generar número de factura
CREATE OR REPLACE FUNCTION generar_numero_factura()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_factura := 'FAC-' || 
    TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(CAST(NEW.id AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_numero_factura
  AFTER INSERT ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION generar_numero_factura();
```

---

### ETAPA 3: MÚLTIPLES OPCIONES DE PAGO

```
┌─────────────────────────────────────────────────────────┐
│ PACIENTE VE SU FACTURA                                  │
├─────────────────────────────────────────────────────────┤
│ Dashboard Paciente → "Mis Facturas"                     │
│                                                         │
│ ╔═══════════════════════════════════════════╗          │
│ ║ FACTURA #FAC-2025-0001        🔴 PENDIENTE ║          │
│ ║                                            ║          │
│ ║ Paciente: Juan Pérez                      ║          │
│ ║ Servicio: Consulta General                ║          │
│ ║ Fecha Cita: 26/Nov/2025 10:00 AM         ║          │
│ ║ Odontólogo: Dr. Carlos Rodríguez         ║          │
│ ║                                            ║          │
│ ║ Subtotal:        $50.000                  ║          │
│ ║ Descuento:           $0                   ║          │
│ ║ ─────────────────────────────────         ║          │
│ ║ TOTAL:           $50.000                  ║          │
│ ║                                            ║          │
│ ║ Vence: 25/Nov/2025 11:59 PM              ║          │
│ ║                                            ║          │
│ ║ [💳 Pagar con MercadoPago]                ║          │
│ ║ [💵 Registrar Pago Manual]                ║          │
│ ║ [📄 Descargar PDF]                        ║          │
│ ╚═══════════════════════════════════════════╝          │
└─────────────────────────────────────────────────────────┘
```

**Opciones de pago:**

#### Opción A: Pago Online (MercadoPago)
```javascript
// 1. Paciente hace clic en "Pagar con MercadoPago"
POST /api/facturas/:id/crear-pago-mercadopago
{
  factura_id: 123
}

// 2. Sistema crea preferencia
// 3. Paciente paga en MercadoPago
// 4. Webhook actualiza:
UPDATE facturas SET estado = 'PAGADA', fecha_pago = NOW() WHERE id = 123;
UPDATE citas SET estado = 'confirmada', estado_pago = 'pagado' WHERE id = 456;

// 5. Notificaciones automáticas:
→ Email a paciente: "Pago recibido - Factura #FAC-2025-0001"
→ Email a odontólogo: "Tu paciente [X] pagó su consulta del [fecha]"
→ Notificación en dashboard admin: "Nuevo pago recibido"
```

#### Opción B: Pago Manual (Efectivo/Transferencia)
```javascript
// 1. Paciente paga en recepción o hace transferencia
// 2. Admin registra el pago:
POST /api/facturas/:id/registrar-pago-manual
{
  factura_id: 123,
  metodo_pago: 'efectivo', // o 'transferencia'
  monto: 50000,
  comprobante: 'archivo.pdf', // opcional
  notas: 'Pagado en efectivo en recepción'
}

// 3. Sistema actualiza igual que pago online
```

---

### ETAPA 4: DASHBOARD ADMINISTRADOR

```
┌─────────────────────────────────────────────────────────┐
│ PANEL ADMIN - GESTIÓN DE FACTURAS Y PAGOS              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 RESUMEN FINANCIERO                                   │
│ ┌────────────────┬────────────────┬────────────────┐   │
│ │ 💰 PENDIENTE   │ ✅ PAGADO      │ ⏰ VENCIDO    │   │
│ │ $2.450.000     │ $15.320.000    │ $180.000      │   │
│ │ 15 facturas    │ 102 facturas   │ 3 facturas    │   │
│ └────────────────┴────────────────┴────────────────┘   │
│                                                         │
│ 🔍 FILTROS:                                             │
│ [ Estado ▼ ] [ Odontólogo ▼ ] [ Rango Fechas ]        │
│                                                         │
│ 📋 FACTURAS:                                            │
│ ┌────────────────────────────────────────────────┐     │
│ │ #     Paciente    Servicio   Total   Estado   │     │
│ ├────────────────────────────────────────────────┤     │
│ │ 0001  Juan P.     Consulta   $50k   🔴 PEND.  │     │
│ │ 0002  María G.    Limpieza   $80k   ✅ PAGADA │     │
│ │ 0003  Carlos S.   Extracción $120k  ⏰ VENC.  │     │
│ └────────────────────────────────────────────────┘     │
│                                                         │
│ Acciones por factura:                                  │
│ - Ver detalle                                          │
│ - Registrar pago manual                                │
│ - Enviar recordatorio                                  │
│ - Cancelar/anular                                      │
│ - Descargar PDF                                        │
└─────────────────────────────────────────────────────────┘
```

**Endpoints necesarios:**
```javascript
GET  /api/admin/facturas/resumen
GET  /api/admin/facturas?estado=PENDIENTE&odontologo_id=5
POST /api/admin/facturas/:id/registrar-pago
POST /api/admin/facturas/:id/enviar-recordatorio
PUT  /api/admin/facturas/:id/cancelar
```

---

### ETAPA 5: DASHBOARD ODONTÓLOGO

```
┌─────────────────────────────────────────────────────────┐
│ PANEL ODONTÓLOGO - MIS CITAS Y PAGOS                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📅 MIS CITAS DE HOY                                     │
│ ┌────────────────────────────────────────────────┐     │
│ │ 10:00 AM - Juan Pérez - Consulta              │     │
│ │ Estado Pago: ✅ PAGADO ($50.000)              │     │
│ │ [Iniciar Consulta] [Ver Historia]             │     │
│ ├────────────────────────────────────────────────┤     │
│ │ 11:00 AM - María González - Limpieza          │     │
│ │ Estado Pago: 🔴 PENDIENTE ($80.000)           │     │
│ │ ⚠️ Cliente debe pagar antes de atención       │     │
│ │ [Contactar Paciente]                           │     │
│ ├────────────────────────────────────────────────┤     │
│ │ 12:00 PM - Carlos Silva - Extracción          │     │
│ │ Estado Pago: ✅ PAGADO ($120.000)             │     │
│ │ [Iniciar Consulta] [Ver Historia]             │     │
│ └────────────────────────────────────────────────┘     │
│                                                         │
│ 💰 MIS INGRESOS GENERADOS                               │
│ ┌────────────────────────────────────────────────┐     │
│ │ Este mes:                                      │     │
│ │ - Total facturado: $8.500.000                 │     │
│ │ - Pagos confirmados: $7.200.000 (85%)         │     │
│ │ - Pendientes cobro: $1.300.000 (15%)          │     │
│ │                                                │     │
│ │ Mi comisión (60%): $4.320.000                 │     │
│ │ Estado pago admin: 🔴 PENDIENTE               │     │
│ │                                                │     │
│ │ [Ver Detalle por Cita]                         │     │
│ └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

**Vista de "Mis Ingresos" mejorada:**
```javascript
GET /api/odontologo/ingresos/detallado

Response:
{
  resumen_mes: {
    total_facturado: 8500000,
    pagos_confirmados: 7200000,
    pendientes_cobro: 1300000,
    porcentaje_cobrado: 85,
    mi_comision_porcentaje: 60,
    mi_comision_total: 4320000,
    estado_pago_clinica: 'PENDIENTE'
  },
  facturas: [
    {
      fecha: '2025-11-20',
      paciente: 'Juan Pérez',
      servicio: 'Consulta General',
      monto_total: 50000,
      mi_comision: 30000,
      estado_pago_paciente: 'PAGADA',
      pagado_por_clinica: false
    },
    // ...
  ]
}
```

---

### ETAPA 6: DISTRIBUCIÓN AUTOMÁTICA A ODONTÓLOGOS

```sql
-- Nueva tabla: distribucion_ingresos
CREATE TABLE distribucion_ingresos (
  id SERIAL PRIMARY KEY,
  factura_id INT REFERENCES facturas(id),
  odontologo_id INT REFERENCES usuarios(id),
  
  monto_total DECIMAL(10,2), -- Total de la factura
  porcentaje_odontologo DECIMAL(5,2), -- Ej: 60.00
  monto_odontologo DECIMAL(10,2), -- Lo que le corresponde
  porcentaje_clinica DECIMAL(5,2), -- Ej: 40.00
  monto_clinica DECIMAL(10,2), -- Lo que queda para la clínica
  
  estado VARCHAR(20) DEFAULT 'PENDIENTE_PAGO',
  -- PENDIENTE_PAGO: Paciente pagó, clínica debe pagar a odontólogo
  -- PAGADO: Clínica ya pagó al odontólogo
  
  fecha_calculo TIMESTAMP DEFAULT NOW(),
  fecha_pago_clinica TIMESTAMP,
  transaccion_pago_id INT REFERENCES transacciones_mercadopago(id),
  
  notas TEXT
);

-- Trigger automático cuando factura es pagada
CREATE OR REPLACE FUNCTION crear_distribucion_ingreso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'PAGADA' AND OLD.estado != 'PAGADA' THEN
    
    -- Obtener % de comisión del odontólogo (configuración)
    DECLARE
      porcentaje DECIMAL(5,2) := 60.00; -- Por defecto 60%
    BEGIN
      
      INSERT INTO distribucion_ingresos (
        factura_id, odontologo_id, monto_total,
        porcentaje_odontologo, monto_odontologo,
        porcentaje_clinica, monto_clinica
      ) VALUES (
        NEW.id, NEW.odontologo_id, NEW.total,
        porcentaje, (NEW.total * porcentaje / 100),
        (100 - porcentaje), (NEW.total * (100 - porcentaje) / 100)
      );
      
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_distribucion_ingreso
  AFTER UPDATE ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION crear_distribucion_ingreso();
```

**Proceso automático:**
```
1. Paciente paga factura
   ↓
2. Factura.estado = 'PAGADA'
   ↓
3. Se crea automáticamente registro en distribucion_ingresos
   - monto_total: $50.000
   - monto_odontologo: $30.000 (60%)
   - monto_clinica: $20.000 (40%)
   - estado: 'PENDIENTE_PAGO'
   ↓
4. Dashboard admin muestra: "Pendiente pagar a odontólogos: $30.000"
   ↓
5. Admin paga al odontólogo (fin de semana/mes)
   ↓
6. Se actualiza: estado = 'PAGADO', fecha_pago_clinica = NOW()
```

---

## 🔄 SISTEMA DE RECORDATORIOS AUTOMÁTICOS

```javascript
// Cron Job diario (ejecutar a las 8:00 AM)
async function recordatoriosPagosPendientes() {
  
  // 1. Facturas que vencen hoy
  const facturasVencenHoy = await db.query(`
    SELECT f.*, u.correo, u.nombre 
    FROM facturas f
    JOIN usuarios u ON f.paciente_id = u.id
    WHERE f.estado = 'PENDIENTE'
      AND DATE(f.fecha_vencimiento) = CURRENT_DATE
  `);
  
  // Enviar email: "Tu factura vence HOY"
  
  // 2. Facturas vencidas
  const facturasVencidas = await db.query(`
    UPDATE facturas 
    SET estado = 'VENCIDA'
    WHERE estado = 'PENDIENTE'
      AND fecha_vencimiento < NOW()
    RETURNING id, paciente_id
  `);
  
  // Enviar email: "Tu factura está VENCIDA - Cita en riesgo de cancelación"
  
  // 3. Cancelar citas con facturas vencidas > 24h
  await db.query(`
    UPDATE citas c
    SET estado = 'cancelada', 
        motivo_cancelacion = 'Factura no pagada'
    FROM facturas f
    WHERE c.id = f.cita_id
      AND f.estado = 'VENCIDA'
      AND f.fecha_vencimiento < NOW() - INTERVAL '24 hours'
  `);
  
  // Enviar email: "Tu cita fue cancelada por falta de pago"
}
```

---

## 📊 REPORTES Y ESTADÍSTICAS

### Dashboard Administrador - Vista Financiera Completa

```javascript
GET /api/admin/dashboard-financiero

Response:
{
  periodo: "Noviembre 2025",
  
  ingresos_pacientes: {
    total_facturado: 18500000,
    total_cobrado: 15200000,
    pendiente_cobro: 2100000,
    vencido: 1200000,
    tasa_cobro: 82.16 // %
  },
  
  distribucion_odontologos: {
    total_generado: 15200000, // Solo lo ya pagado
    porcentaje_promedio: 60,
    monto_para_odontologos: 9120000,
    ya_pagado: 7500000,
    pendiente_pagar: 1620000
  },
  
  margen_clinica: {
    monto: 6080000, // 40% de lo cobrado
    porcentaje: 40
  },
  
  odontologos: [
    {
      nombre: "Dr. Carlos Rodríguez",
      consultas: 28,
      total_generado: 2800000,
      comision: 1680000,
      estado_pago: "PARCIAL", // $1.200.000 pagado, $480.000 pendiente
      pendiente: 480000
    },
    {
      nombre: "Dra. Ana Martínez",
      consultas: 22,
      total_generado: 2200000,
      comision: 1320000,
      estado_pago: "PENDIENTE",
      pendiente: 1320000
    }
  ],
  
  proximos_vencimientos: [
    { paciente: "Juan Pérez", monto: 50000, vence: "2025-11-25" }
  ]
}
```

---

## ✅ BENEFICIOS DEL NUEVO FLUJO

### Para la Clínica:
✅ **Control total** de ingresos y egresos  
✅ **Trazabilidad completa** de cada peso  
✅ **Automatización** de cálculos  
✅ **Reducción de morosidad** con vencimientos  
✅ **Reportes financieros** en tiempo real  

### Para Odontólogos:
✅ **Visibilidad** de cuánto han generado  
✅ **Transparencia** en la distribución  
✅ **Saben qué citas están pagas** antes de atender  
✅ **Pueden hacer seguimiento** a pagos pendientes  

### Para Pacientes:
✅ **Claridad de precios** desde el inicio  
✅ **Múltiples opciones de pago**  
✅ **Recordatorios automáticos**  
✅ **Factura digital descargable**  

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Fundación (1-2 semanas)
- [ ] Crear tabla `catalogo_servicios`
- [ ] Crear tabla `facturas` mejorada
- [ ] Crear tabla `distribucion_ingresos`
- [ ] Modificar flujo de agendamiento para generar factura
- [ ] Endpoint: Crear factura al agendar cita

### Fase 2: Pagos (1 semana)
- [ ] Integrar MercadoPago con facturas
- [ ] Endpoint: Registrar pago manual
- [ ] Vista paciente: "Mis Facturas"
- [ ] Webhook actualiza estado de factura

### Fase 3: Dashboards (1 semana)
- [ ] Dashboard admin: Gestión de facturas
- [ ] Dashboard admin: Resumen financiero
- [ ] Dashboard odontólogo: Estado de pagos de citas
- [ ] Dashboard odontólogo: Mis ingresos detallados

### Fase 4: Automatización (1 semana)
- [ ] Trigger: Crear distribución al pagar
- [ ] Cron: Recordatorios de vencimiento
- [ ] Cron: Marcar facturas vencidas
- [ ] Cron: Cancelar citas impagadas
- [ ] Sistema de notificaciones por email

### Fase 5: Reportes (3-5 días)
- [ ] Reportes PDF de facturas
- [ ] Exportar Excel de ingresos
- [ ] Gráficos de tendencias
- [ ] Reporte de comisiones por odontólogo

---

## ❓ ¿COMENZAMOS LA IMPLEMENTACIÓN?

Te propongo empezar con la **Fase 1** creando:
1. Tabla `catalogo_servicios` con servicios base
2. Tabla `facturas` mejorada
3. Modificar el endpoint de agendamiento para generar factura automáticamente

**¿Arrancamos?** 🚀
