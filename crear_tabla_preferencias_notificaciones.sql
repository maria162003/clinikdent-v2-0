-- ===================================================================
-- TABLA DE PREFERENCIAS DE NOTIFICACIONES Y OFERTAS
-- Sistema de consentimiento para marketing y comunicaciones
-- Cumple con GDPR y mejores prácticas de privacidad
-- ===================================================================

-- Crear tabla de preferencias de usuarios
CREATE TABLE IF NOT EXISTS usuarios_preferencias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Preferencias de comunicación
    acepta_notificaciones BOOLEAN DEFAULT FALSE,
    acepta_ofertas BOOLEAN DEFAULT FALSE,
    
    -- Canales de comunicación preferidos (JSON array)
    -- Ejemplo: ["email", "dashboard", "sms"]
    canales_preferidos JSONB DEFAULT '[]'::jsonb,
    
    -- Auditoría de consentimiento (GDPR compliance)
    fecha_consentimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_consentimiento VARCHAR(45),
    user_agent TEXT,
    
    -- Control de cambios
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INTEGER REFERENCES usuarios(id),
    
    -- Asegurar una sola preferencia por usuario
    UNIQUE(usuario_id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_usuarios_preferencias_usuario ON usuarios_preferencias(usuario_id);
CREATE INDEX idx_usuarios_preferencias_notificaciones ON usuarios_preferencias(acepta_notificaciones);
CREATE INDEX idx_usuarios_preferencias_ofertas ON usuarios_preferencias(acepta_ofertas);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_usuarios_preferencias_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.ultima_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_usuarios_preferencias_timestamp
    BEFORE UPDATE ON usuarios_preferencias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_usuarios_preferencias_timestamp();

-- Comentarios para documentación
COMMENT ON TABLE usuarios_preferencias IS 'Preferencias de notificaciones y ofertas promocionales de usuarios';
COMMENT ON COLUMN usuarios_preferencias.acepta_notificaciones IS 'Usuario acepta recibir notificaciones generales del sistema';
COMMENT ON COLUMN usuarios_preferencias.acepta_ofertas IS 'Usuario acepta recibir ofertas y contenido promocional';
COMMENT ON COLUMN usuarios_preferencias.canales_preferidos IS 'Array JSON de canales preferidos: email, dashboard, sms';
COMMENT ON COLUMN usuarios_preferencias.fecha_consentimiento IS 'Fecha y hora en que el usuario dio su consentimiento';
COMMENT ON COLUMN usuarios_preferencias.ip_consentimiento IS 'IP desde la cual se registró el consentimiento (GDPR)';

-- Vista para obtener usuarios que aceptan notificaciones
CREATE OR REPLACE VIEW usuarios_con_notificaciones AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.correo,
    u.rol,
    up.acepta_notificaciones,
    up.acepta_ofertas,
    up.canales_preferidos,
    up.fecha_consentimiento
FROM usuarios u
INNER JOIN usuarios_preferencias up ON u.id = up.usuario_id
WHERE up.acepta_notificaciones = TRUE;

-- Vista para usuarios que aceptan ofertas
CREATE OR REPLACE VIEW usuarios_con_ofertas AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.correo,
    u.rol,
    up.acepta_ofertas,
    up.canales_preferidos,
    up.fecha_consentimiento
FROM usuarios u
INNER JOIN usuarios_preferencias up ON u.id = up.usuario_id
WHERE up.acepta_ofertas = TRUE;

-- Función para obtener estadísticas de consentimiento
CREATE OR REPLACE FUNCTION obtener_estadisticas_consentimiento()
RETURNS TABLE(
    total_usuarios BIGINT,
    con_notificaciones BIGINT,
    con_ofertas BIGINT,
    porcentaje_notificaciones NUMERIC,
    porcentaje_ofertas NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT u.id) AS total_usuarios,
        COUNT(DISTINCT CASE WHEN up.acepta_notificaciones THEN u.id END) AS con_notificaciones,
        COUNT(DISTINCT CASE WHEN up.acepta_ofertas THEN u.id END) AS con_ofertas,
        ROUND(
            (COUNT(DISTINCT CASE WHEN up.acepta_notificaciones THEN u.id END)::NUMERIC / 
             NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 
            2
        ) AS porcentaje_notificaciones,
        ROUND(
            (COUNT(DISTINCT CASE WHEN up.acepta_ofertas THEN u.id END)::NUMERIC / 
             NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 
            2
        ) AS porcentaje_ofertas
    FROM usuarios u
    LEFT JOIN usuarios_preferencias up ON u.id = up.usuario_id;
END;
$$ LANGUAGE plpgsql;

-- Crear preferencias por defecto para usuarios existentes
INSERT INTO usuarios_preferencias (usuario_id, acepta_notificaciones, acepta_ofertas, canales_preferidos)
SELECT 
    id,
    FALSE,
    FALSE,
    '[]'::jsonb
FROM usuarios u
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios_preferencias up WHERE up.usuario_id = u.id
);

SELECT 'Tabla usuarios_preferencias creada exitosamente' AS resultado;
SELECT 'Vistas y funciones creadas correctamente' AS resultado;
SELECT COUNT(*) || ' preferencias por defecto creadas para usuarios existentes' AS resultado 
FROM usuarios_preferencias;
