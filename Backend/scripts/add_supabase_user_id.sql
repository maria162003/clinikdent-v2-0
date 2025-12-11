-- Migración: Agregar columna supabase_user_id
-- Fecha: 2025-11-11
-- Descripción: Agrega supabase_user_id para vincular usuarios de PostgreSQL con Supabase Auth

DO $$ 
BEGIN
    -- Agregar supabase_user_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'supabase_user_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN supabase_user_id UUID;
        RAISE NOTICE 'Columna supabase_user_id agregada';
    ELSE
        RAISE NOTICE 'Columna supabase_user_id ya existe';
    END IF;
END $$;

-- Crear índice único para búsqueda rápida
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_supabase_user_id 
ON usuarios(supabase_user_id) 
WHERE supabase_user_id IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN usuarios.supabase_user_id IS 'ID del usuario en Supabase Auth (UUID)';

SELECT '✅ Migración completada - supabase_user_id agregado' AS resultado;
