-- Sistema de Seguridad Avanzado para PostgreSQL
-- Implementación sin afectar funcionalidades existentes

-- ===============================
-- 1. INTENTOS DE LOGIN
-- ===============================
CREATE TABLE IF NOT EXISTS intentos_login (
    id SERIAL PRIMARY KEY,
    email_intento VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(50),
    ip_origen VARCHAR(45) NOT NULL,
    user_agent TEXT,
    resultado VARCHAR(50) NOT NULL CHECK (resultado IN ('exitoso', 'email_incorrecto', 'password_incorrecto', 'documento_incorrecto', 'cuenta_bloqueada', 'limite_intentos')),
    timestamp_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ubicacion_estimada VARCHAR(100),
    metodo_autenticacion VARCHAR(20) DEFAULT 'password' CHECK (metodo_autenticacion IN ('password', 'token', '2fa', 'social')),
    detalles_adicionales JSONB,
    sesion_id VARCHAR(128)
);

-- ===============================
-- 2. BLOQUEOS DE SEGURIDAD
-- ===============================
CREATE TABLE IF NOT EXISTS bloqueos_seguridad (
    id SERIAL PRIMARY KEY,
    tipo_bloqueo VARCHAR(20) NOT NULL CHECK (tipo_bloqueo IN ('ip', 'usuario', 'email', 'documento', 'global')),
    valor_bloqueado VARCHAR(255) NOT NULL,
    razon_bloqueo VARCHAR(255) NOT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'expirado', 'levantado_manual')),
    intentos_automaticos INT DEFAULT 0,
    bloqueado_por INT,
    detalles_adicionales JSONB
);

-- ===============================
-- 3. CÓDIGOS DE SEGURIDAD TEMPORALES
-- ===============================
CREATE TABLE IF NOT EXISTS codigos_seguridad (
    id SERIAL PRIMARY KEY,
    usuario_id INT,
    email VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(50),
    codigo VARCHAR(10) NOT NULL,
    tipo_codigo VARCHAR(30) NOT NULL CHECK (tipo_codigo IN ('recuperacion_password', 'cambio_password', 'verificacion_email', 'autenticacion_2fa')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    intentos_usados INT DEFAULT 0,
    max_intentos INT DEFAULT 3,
    usado BOOLEAN DEFAULT FALSE,
    ip_origen VARCHAR(45),
    detalles_adicionales JSONB
);

-- ===============================
-- 4. CONFIGURACIÓN DE SEGURIDAD
-- ===============================
CREATE TABLE IF NOT EXISTS configuracion_seguridad (
    id SERIAL PRIMARY KEY,
    parametro VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) DEFAULT 'general',
    activo BOOLEAN DEFAULT TRUE,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración inicial de seguridad
INSERT INTO configuracion_seguridad (parametro, valor, descripcion, categoria) VALUES
('max_intentos_login', '3', 'Máximo número de intentos de login antes de bloquear', 'authentication'),
('tiempo_bloqueo_minutos', '15', 'Tiempo de bloqueo automático en minutos', 'authentication'),
('duracion_codigo_seguridad_minutos', '5', 'Duración en minutos de los códigos de seguridad', 'authentication'),
('max_intentos_codigo', '3', 'Máximo número de intentos para validar código de seguridad', 'authentication'),
('habilitar_notificaciones_email', 'true', 'Enviar notificaciones por email en eventos de seguridad', 'notifications'),
('longitud_codigo_seguridad', '4', 'Número de dígitos del código de seguridad', 'authentication')
ON CONFLICT (parametro) DO NOTHING;

-- ===============================
-- 5. FUNCIÓN PARA LIMPIAR DATOS EXPIRADOS
-- ===============================
CREATE OR REPLACE FUNCTION limpiar_datos_seguridad_expirados()
RETURNS void AS $$
BEGIN
    -- Limpiar intentos de login antiguos (más de 30 días)
    DELETE FROM intentos_login 
    WHERE timestamp_intento < NOW() - INTERVAL '30 days';
    
    -- Limpiar códigos de seguridad expirados
    DELETE FROM codigos_seguridad 
    WHERE fecha_expiracion < NOW();
    
    -- Marcar bloqueos expirados
    UPDATE bloqueos_seguridad 
    SET estado = 'expirado' 
    WHERE fecha_expiracion IS NOT NULL 
    AND fecha_expiracion < NOW() 
    AND estado = 'activo';
    
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE intentos_login IS 'Registro de todos los intentos de autenticación';
COMMENT ON TABLE bloqueos_seguridad IS 'Control de bloqueos de seguridad por IP, email o documento';
COMMENT ON TABLE codigos_seguridad IS 'Códigos temporales para autenticación y recuperación';
COMMENT ON TABLE configuracion_seguridad IS 'Parámetros de configuración del sistema de seguridad';