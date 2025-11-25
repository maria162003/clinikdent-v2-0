-- Agregar columna photo_url a la tabla usuarios si no existe
-- Esta columna permitirá a los usuarios (especialmente odontólogos) actualizar su foto de perfil

-- Verificar si la columna existe y agregarla si no
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN photo_url VARCHAR(500);
        RAISE NOTICE 'Columna photo_url agregada exitosamente a la tabla usuarios';
    ELSE
        RAISE NOTICE 'La columna photo_url ya existe en la tabla usuarios';
    END IF;
END $$;

-- Comentario descriptivo para la columna
COMMENT ON COLUMN usuarios.photo_url IS 'URL de la foto de perfil del usuario. Permite a odontólogos y otros usuarios personalizar su avatar.';
