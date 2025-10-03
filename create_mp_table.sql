-- Solo la tabla de transacciones de MercadoPago
CREATE TABLE IF NOT EXISTS transacciones_mercadopago (
    id SERIAL PRIMARY KEY,
    preference_id VARCHAR(100),
    payment_id VARCHAR(100),
    external_reference VARCHAR(200) UNIQUE,
    tipo VARCHAR(50) NOT NULL, -- 'pago_paciente', 'pago_odontologo', 'pago_proveedor'
    
    -- Referencias a otras entidades
    usuario_id INTEGER REFERENCES usuarios(id), -- Para pacientes y odontólogos
    proveedor_id INTEGER, -- Para proveedores
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
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna de estado de pago a la tabla citas si no existe
ALTER TABLE citas ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'pendiente';

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_usuario ON transacciones_mercadopago(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_tipo ON transacciones_mercadopago(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_estado ON transacciones_mercadopago(estado);
CREATE INDEX IF NOT EXISTS idx_transacciones_mp_fecha ON transacciones_mercadopago(fecha_creacion);
