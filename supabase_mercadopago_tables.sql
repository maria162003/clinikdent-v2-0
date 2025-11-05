-- Tabla para transacciones de MercadoPago
CREATE TABLE IF NOT EXISTS transacciones_mercadopago (
    id SERIAL PRIMARY KEY,
    preference_id VARCHAR(100),
    payment_id VARCHAR(100),
    external_reference VARCHAR(200) UNIQUE,
    tipo VARCHAR(50) NOT NULL, -- 'pago_paciente', 'pago_odontologo', 'pago_proveedor'
    
    -- Referencias a otras entidades
    usuario_id INTEGER REFERENCES usuarios(id), -- Para pacientes y odontólogos
    proveedor_id INTEGER, -- Para proveedores (si existe tabla proveedores)
    cita_id INTEGER REFERENCES citas(id), -- Para pagos de citas
    
    -- Información del pago
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'COP',
    estado VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    
    -- Metadatos adicionales
    descripcion TEXT,
    periodo VARCHAR(50), -- Para honorarios: '2025-01', etc.
    factura_referencia VARCHAR(100), -- Para proveedores
    
    -- Datos completos del pago (JSON)
    datos_pago JSONB,
    
    -- Timestamps
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    CONSTRAINT unique_external_reference UNIQUE (external_reference)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_usuario ON transacciones_mercadopago(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_tipo ON transacciones_mercadopago(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_estado ON transacciones_mercadopago(estado);
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_fecha ON transacciones_mercadopago(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_cita ON transacciones_mercadopago(cita_id);

-- Agregar columna de estado de pago a la tabla citas si no existe
ALTER TABLE citas ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'pendiente';

-- Crear tabla de proveedores si no existe (básica)
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    nit VARCHAR(20) UNIQUE,
    contacto_principal VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar algunos proveedores de ejemplo
INSERT INTO proveedores (nombre, email, telefono, nit, contacto_principal) VALUES
('Dental Supply Co.', 'ventas@dentalsupply.com', '3001234567', '900123456-1', 'Carlos Rodríguez'),
('Instrumentos Odontológicos SA', 'info@instrumentos.com', '3007654321', '900654321-2', 'María González'),
('Suministros Médicos SAS', 'contacto@suministros.com', '3009876543', '900987654-3', 'Luis Martínez')
ON CONFLICT (email) DO NOTHING;

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar automáticamente updated_at en proveedores
DROP TRIGGER IF EXISTS update_proveedores_updated_at ON proveedores;
CREATE TRIGGER update_proveedores_updated_at
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar automáticamente fecha_actualizacion en transacciones
DROP TRIGGER IF EXISTS update_transacciones_updated_at ON transacciones_mercadopago;
CREATE TRIGGER update_transacciones_updated_at
    BEFORE UPDATE ON transacciones_mercadopago
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE transacciones_mercadopago IS 'Registro de todas las transacciones procesadas por MercadoPago';
COMMENT ON TABLE proveedores IS 'Catálogo de proveedores para pagos de suministros e insumos';
