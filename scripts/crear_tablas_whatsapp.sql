-- Tabla para registrar contactos de WhatsApp
CREATE TABLE IF NOT EXISTS contactos_whatsapp (
    id SERIAL PRIMARY KEY,
    telefono VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    paciente_id INTEGER REFERENCES pacientes(usuario_id) ON DELETE SET NULL,
    mensaje_inicial TEXT,
    plataforma VARCHAR(50) DEFAULT 'whatsapp',
    primera_interaccion TIMESTAMP DEFAULT NOW(),
    ultima_interaccion TIMESTAMP DEFAULT NOW(),
    contador_mensajes INTEGER DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'activo',
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para PQR/Soporte desde WhatsApp
CREATE TABLE IF NOT EXISTS pqr_soporte (
    id SERIAL PRIMARY KEY,
    telefono VARCHAR(20) NOT NULL,
    nombre VARCHAR(255),
    paciente_id INTEGER REFERENCES pacientes(usuario_id) ON DELETE SET NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'consulta', -- consulta, queja, reclamo, sugerencia
    canal VARCHAR(50) DEFAULT 'whatsapp',
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, en_proceso, resuelto, cerrado
    prioridad VARCHAR(20) DEFAULT 'media', -- baja, media, alta, urgente
    asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_respuesta TIMESTAMP,
    fecha_cierre TIMESTAMP,
    respuesta TEXT,
    notas_internas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_contactos_whatsapp_telefono ON contactos_whatsapp(telefono);
CREATE INDEX IF NOT EXISTS idx_contactos_whatsapp_paciente ON contactos_whatsapp(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pqr_estado ON pqr_soporte(estado);
CREATE INDEX IF NOT EXISTS idx_pqr_telefono ON pqr_soporte(telefono);
CREATE INDEX IF NOT EXISTS idx_pqr_fecha ON pqr_soporte(fecha_creacion DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contactos_whatsapp_timestamp
BEFORE UPDATE ON contactos_whatsapp
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_timestamp();

CREATE TRIGGER update_pqr_timestamp
BEFORE UPDATE ON pqr_soporte
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_timestamp();

-- Comentarios de documentación
COMMENT ON TABLE contactos_whatsapp IS 'Registro de contactos que interactúan via WhatsApp Bot';
COMMENT ON TABLE pqr_soporte IS 'Sistema de PQR (Peticiones, Quejas, Reclamos) desde WhatsApp';
COMMENT ON COLUMN pqr_soporte.tipo IS 'Tipo de solicitud: consulta, queja, reclamo, sugerencia';
COMMENT ON COLUMN pqr_soporte.estado IS 'Estado: pendiente, en_proceso, resuelto, cerrado';
