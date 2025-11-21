-- ============================================================================
-- TABLA PARA REGISTRO DE NOTIFICACIONES DE CITAS
-- ============================================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS notificaciones_citas (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'confirmacion', 'recordatorio', 'cancelacion'
    enviado BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP DEFAULT NOW(),
    detalles JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_notificacion UNIQUE(cita_id, tipo)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_cita_id ON notificaciones_citas(cita_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_tipo ON notificaciones_citas(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_enviado ON notificaciones_citas(enviado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_citas_fecha_envio ON notificaciones_citas(fecha_envio);

-- Comentarios descriptivos
COMMENT ON TABLE notificaciones_citas IS 'Registro de todas las notificaciones por correo enviadas a los pacientes';
COMMENT ON COLUMN notificaciones_citas.tipo IS 'Tipo de notificación: confirmacion, recordatorio, cancelacion';
COMMENT ON COLUMN notificaciones_citas.enviado IS 'Indica si la notificación fue enviada exitosamente';
COMMENT ON COLUMN notificaciones_citas.detalles IS 'Información adicional del envío (messageId, errores, etc.)';

-- Mostrar resultado
SELECT 'Tabla notificaciones_citas creada exitosamente' as mensaje;
