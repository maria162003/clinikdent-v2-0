-- Migración: Agregar columnas para recuperación de contraseña
-- Fecha: 2025-11-11
-- Descripción: Agrega reset_token y reset_token_expiry a la tabla usuarios

-- Verificar si las columnas ya existen antes de agregarlas
DO $$ 
BEGIN
    -- Agregar reset_token si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'reset_token'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255);
        RAISE NOTICE 'Columna reset_token agregada';
    ELSE
        RAISE NOTICE 'Columna reset_token ya existe';
    END IF;

    -- Agregar reset_token_expiry si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'reset_token_expiry'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN reset_token_expiry TIMESTAMP;
        RAISE NOTICE 'Columna reset_token_expiry agregada';
    ELSE
        RAISE NOTICE 'Columna reset_token_expiry ya existe';
    END IF;
END $$;

-- Crear índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_usuarios_reset_token 
ON usuarios(reset_token) 
WHERE reset_token IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN usuarios.reset_token IS 'Token hash SHA-256 para recuperación de contraseña';
COMMENT ON COLUMN usuarios.reset_token_expiry IS 'Fecha y hora de expiración del token (60 minutos desde generación)';

SELECT '✅ Migración completada exitosamente' AS resultado;
