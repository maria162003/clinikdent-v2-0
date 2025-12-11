-- ===============================================
-- SISTEMA DE FACTURACIÓN Y PAGOS - MODO DEMO
-- ===============================================
-- Este sistema NO realiza pagos reales
-- Es una simulación para pruebas y demostración
-- ===============================================

-- Eliminar tablas existentes si existen (orden inverso por dependencias)
DROP TABLE IF EXISTS distribucion_ingresos CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS configuracion_comisiones CASCADE;
DROP TABLE IF EXISTS catalogo_servicios CASCADE;

-- Eliminar vistas si existen
DROP VIEW IF EXISTS vista_facturas_completas CASCADE;
DROP VIEW IF EXISTS vista_distribucion_completa CASCADE;

-- 1. CATÁLOGO DE SERVICIOS
CREATE TABLE catalogo_servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100) DEFAULT 'consulta',
  precio_base DECIMAL(10,2) NOT NULL,
  duracion_minutos INT DEFAULT 30,
  requiere_autorizacion BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Insertar servicios básicos
INSERT INTO catalogo_servicios (nombre, descripcion, categoria, precio_base, duracion_minutos) VALUES
('Consulta General', 'Consulta odontológica general', 'consulta', 50000, 30),
('Limpieza Dental', 'Profilaxis y limpieza dental completa', 'prevencion', 80000, 45),
('Extracción Simple', 'Extracción de pieza dental simple', 'cirugia', 120000, 60),
('Extracción Compleja', 'Extracción quirúrgica de pieza dental', 'cirugia', 180000, 90),
('Ortodoncia - Control', 'Control de ortodoncia mensual', 'ortodoncia', 100000, 30),
('Blanqueamiento Dental', 'Blanqueamiento dental completo', 'estetica', 350000, 90),
('Calzas/Resinas', 'Obturación con resina', 'restauracion', 90000, 60),
('Endodoncia', 'Tratamiento de conductos', 'endodoncia', 250000, 120),
('Corona Dental', 'Corona en porcelana o metal-porcelana', 'protesis', 450000, 90),
('Radiografía Panorámica', 'Radiografía panorámica dental', 'diagnostico', 35000, 15)
ON CONFLICT DO NOTHING;

-- 2. TABLA DE FACTURAS
CREATE TABLE facturas (
  id SERIAL PRIMARY KEY,
  numero_factura VARCHAR(50) UNIQUE,
  paciente_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  odontologo_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  cita_id INT REFERENCES citas(id) ON DELETE SET NULL,
  
  -- Desglose de servicios (JSON array)
  servicios JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ servicio_id: 1, nombre: "Consulta", cantidad: 1, precio_unitario: 50000, subtotal: 50000 }]
  
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) DEFAULT 0,
  impuestos DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  -- Estados: PENDIENTE, PAGADA, VENCIDA, CANCELADA, PARCIAL
  
  metodo_pago VARCHAR(50),
  -- mercadopago_demo, efectivo_demo, transferencia_demo, tarjeta_demo
  
  fecha_emision TIMESTAMP DEFAULT NOW(),
  fecha_vencimiento TIMESTAMP,
  fecha_pago TIMESTAMP,
  
  -- Campos de simulación
  es_demo BOOLEAN DEFAULT true,
  transaccion_demo_id VARCHAR(100),
  
  notas TEXT,
  comprobante_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_facturas_paciente ON facturas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_odontologo ON facturas(odontologo_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision ON facturas(fecha_emision);

-- 3. DISTRIBUCIÓN DE INGRESOS (Comisiones)
CREATE TABLE distribucion_ingresos (
  id SERIAL PRIMARY KEY,
  factura_id INT REFERENCES facturas(id) ON DELETE CASCADE,
  odontologo_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  
  monto_total DECIMAL(10,2) NOT NULL,
  porcentaje_odontologo DECIMAL(5,2) DEFAULT 60.00,
  monto_odontologo DECIMAL(10,2) NOT NULL,
  porcentaje_clinica DECIMAL(5,2) DEFAULT 40.00,
  monto_clinica DECIMAL(10,2) NOT NULL,
  
  estado VARCHAR(20) DEFAULT 'PENDIENTE_PAGO',
  -- Estados: PENDIENTE_PAGO, PAGADO, CANCELADO
  
  fecha_calculo TIMESTAMP DEFAULT NOW(),
  fecha_pago_odontologo TIMESTAMP,
  metodo_pago_odontologo VARCHAR(50),
  comprobante_pago TEXT,
  
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_distribucion_factura ON distribucion_ingresos(factura_id);
CREATE INDEX IF NOT EXISTS idx_distribucion_odontologo ON distribucion_ingresos(odontologo_id);
CREATE INDEX IF NOT EXISTS idx_distribucion_estado ON distribucion_ingresos(estado);

-- 4. CONFIGURACIÓN DE COMISIONES POR ODONTÓLOGO
CREATE TABLE configuracion_comisiones (
  id SERIAL PRIMARY KEY,
  odontologo_id INT REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
  porcentaje_odontologo DECIMAL(5,2) DEFAULT 60.00,
  porcentaje_clinica DECIMAL(5,2) DEFAULT 40.00,
  activo BOOLEAN DEFAULT true,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Configuración por defecto para todos los odontólogos
INSERT INTO configuracion_comisiones (odontologo_id, porcentaje_odontologo, porcentaje_clinica)
SELECT u.id, 60.00, 40.00
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
WHERE r.nombre = 'odontologo'
ON CONFLICT (odontologo_id) DO NOTHING;

-- 5. FUNCIÓN PARA GENERAR NÚMERO DE FACTURA
CREATE OR REPLACE FUNCTION generar_numero_factura()
RETURNS TRIGGER AS $$
DECLARE
  anio TEXT;
  correlativo TEXT;
BEGIN
  IF NEW.numero_factura IS NULL THEN
    anio := TO_CHAR(NOW(), 'YYYY');
    correlativo := LPAD(NEW.id::TEXT, 5, '0');
    NEW.numero_factura := 'FAC-' || anio || '-' || correlativo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_generar_numero_factura ON facturas;
CREATE TRIGGER trigger_generar_numero_factura
  BEFORE INSERT ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION generar_numero_factura();

-- 6. FUNCIÓN PARA CREAR DISTRIBUCIÓN AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION crear_distribucion_automatica()
RETURNS TRIGGER AS $$
DECLARE
  v_porcentaje_odon DECIMAL(5,2);
  v_porcentaje_clinica DECIMAL(5,2);
BEGIN
  -- Solo crear distribución cuando factura pasa a PAGADA
  IF NEW.estado = 'PAGADA' AND (OLD.estado IS NULL OR OLD.estado != 'PAGADA') THEN
    
    -- Obtener configuración de comisión del odontólogo
    SELECT porcentaje_odontologo, porcentaje_clinica
    INTO v_porcentaje_odon, v_porcentaje_clinica
    FROM configuracion_comisiones
    WHERE odontologo_id = NEW.odontologo_id AND activo = true
    LIMIT 1;
    
    -- Si no existe configuración, usar valores por defecto
    IF v_porcentaje_odon IS NULL THEN
      v_porcentaje_odon := 60.00;
      v_porcentaje_clinica := 40.00;
    END IF;
    
    -- Verificar si ya existe distribución
    IF NOT EXISTS (SELECT 1 FROM distribucion_ingresos WHERE factura_id = NEW.id) THEN
      INSERT INTO distribucion_ingresos (
        factura_id, odontologo_id, monto_total,
        porcentaje_odontologo, monto_odontologo,
        porcentaje_clinica, monto_clinica,
        estado
      ) VALUES (
        NEW.id,
        NEW.odontologo_id,
        NEW.total,
        v_porcentaje_odon,
        ROUND((NEW.total * v_porcentaje_odon / 100), 2),
        v_porcentaje_clinica,
        ROUND((NEW.total * v_porcentaje_clinica / 100), 2),
        'PENDIENTE_PAGO'
      );
      
      RAISE NOTICE 'Distribución creada para factura % - Odontólogo: %, Clínica: %',
        NEW.numero_factura,
        ROUND((NEW.total * v_porcentaje_odon / 100), 2),
        ROUND((NEW.total * v_porcentaje_clinica / 100), 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_crear_distribucion ON facturas;
CREATE TRIGGER trigger_crear_distribucion
  AFTER INSERT OR UPDATE ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION crear_distribucion_automatica();

-- 7. FUNCIÓN PARA ACTUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
DROP TRIGGER IF EXISTS trigger_actualizar_facturas ON facturas;
CREATE TRIGGER trigger_actualizar_facturas
  BEFORE UPDATE ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

DROP TRIGGER IF EXISTS trigger_actualizar_distribucion ON distribucion_ingresos;
CREATE TRIGGER trigger_actualizar_distribucion
  BEFORE UPDATE ON distribucion_ingresos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp();

-- 8. VISTAS ÚTILES
CREATE OR REPLACE VIEW vista_facturas_completas AS
SELECT 
  f.id,
  f.numero_factura,
  f.paciente_id,
  CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
  p.correo as paciente_correo,
  p.telefono as paciente_telefono,
  f.odontologo_id,
  CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
  f.cita_id,
  c.fecha as cita_fecha,
  c.hora as cita_hora,
  f.servicios,
  f.subtotal,
  f.descuento,
  f.impuestos,
  f.total,
  f.estado,
  f.metodo_pago,
  f.fecha_emision,
  f.fecha_vencimiento,
  f.fecha_pago,
  f.es_demo,
  f.notas,
  f.created_at,
  f.updated_at
FROM facturas f
LEFT JOIN usuarios p ON f.paciente_id = p.id
LEFT JOIN usuarios o ON f.odontologo_id = o.id
LEFT JOIN citas c ON f.cita_id = c.id;

CREATE OR REPLACE VIEW vista_distribucion_completa AS
SELECT 
  d.id,
  d.factura_id,
  f.numero_factura,
  f.fecha_emision,
  d.odontologo_id,
  CONCAT(o.nombre, ' ', o.apellido) as odontologo_nombre,
  d.monto_total,
  d.porcentaje_odontologo,
  d.monto_odontologo,
  d.porcentaje_clinica,
  d.monto_clinica,
  d.estado,
  d.fecha_calculo,
  d.fecha_pago_odontologo,
  d.metodo_pago_odontologo,
  f.paciente_id,
  CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
  d.created_at,
  d.updated_at
FROM distribucion_ingresos d
JOIN facturas f ON d.factura_id = f.id
LEFT JOIN usuarios o ON d.odontologo_id = o.id
LEFT JOIN usuarios p ON f.paciente_id = p.id;

-- ===============================================
-- DATOS DE PRUEBA (DEMO)
-- ===============================================

-- Insertar algunas facturas de ejemplo para pruebas
-- (Solo si hay usuarios y citas en el sistema)

DO $$
DECLARE
  v_paciente_id INT;
  v_odontologo_id INT;
  v_cita_id INT;
BEGIN
  -- Obtener primer paciente
  SELECT id INTO v_paciente_id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'paciente') LIMIT 1;
  
  -- Obtener primer odontólogo
  SELECT id INTO v_odontologo_id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'odontologo') LIMIT 1;
  
  -- Obtener una cita
  SELECT id INTO v_cita_id FROM citas WHERE estado = 'completada' LIMIT 1;
  
  IF v_paciente_id IS NOT NULL AND v_odontologo_id IS NOT NULL THEN
    -- Factura de ejemplo 1: PAGADA
    INSERT INTO facturas (
      paciente_id, odontologo_id, cita_id,
      servicios, subtotal, total, estado, metodo_pago,
      fecha_emision, fecha_pago, es_demo, transaccion_demo_id
    ) VALUES (
      v_paciente_id, v_odontologo_id, v_cita_id,
      '[{"servicio_id": 1, "nombre": "Consulta General", "cantidad": 1, "precio_unitario": 50000, "subtotal": 50000}]'::jsonb,
      50000, 50000, 'PAGADA', 'efectivo_demo',
      NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', true, 'DEMO-PAY-001'
    ) ON CONFLICT DO NOTHING;
    
    -- Factura de ejemplo 2: PENDIENTE
    INSERT INTO facturas (
      paciente_id, odontologo_id, cita_id,
      servicios, subtotal, total, estado,
      fecha_emision, fecha_vencimiento, es_demo
    ) VALUES (
      v_paciente_id, v_odontologo_id, NULL,
      '[{"servicio_id": 2, "nombre": "Limpieza Dental", "cantidad": 1, "precio_unitario": 80000, "subtotal": 80000}]'::jsonb,
      80000, 80000, 'PENDIENTE',
      NOW(), NOW() + INTERVAL '2 days', true
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Facturas de ejemplo creadas exitosamente';
  END IF;
END $$;

-- ===============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento) WHERE estado = 'PENDIENTE';
CREATE INDEX IF NOT EXISTS idx_distribucion_pendiente ON distribucion_ingresos(odontologo_id, estado) WHERE estado = 'PENDIENTE_PAGO';

-- ===============================================
-- COMENTARIOS EN TABLAS
-- ===============================================

COMMENT ON TABLE catalogo_servicios IS 'Catálogo de servicios odontológicos con precios';
COMMENT ON TABLE facturas IS 'Facturas generadas por consultas y tratamientos - MODO DEMO';
COMMENT ON TABLE distribucion_ingresos IS 'Distribución automática de ingresos entre odontólogo y clínica';
COMMENT ON TABLE configuracion_comisiones IS 'Configuración de porcentajes de comisión por odontólogo';

COMMENT ON COLUMN facturas.es_demo IS 'Indica si es una transacción de prueba (siempre true en este sistema)';
COMMENT ON COLUMN facturas.transaccion_demo_id IS 'ID simulado de transacción para demostración';

-- ===============================================
-- FIN DE SCRIPT
-- ===============================================

SELECT 'Sistema de facturación DEMO creado exitosamente' as mensaje;
SELECT 'Total servicios: ' || COUNT(*) as servicios FROM catalogo_servicios;
SELECT 'Total facturas: ' || COUNT(*) as facturas FROM facturas;
SELECT 'Total distribuciones: ' || COUNT(*) as distribuciones FROM distribucion_ingresos;
