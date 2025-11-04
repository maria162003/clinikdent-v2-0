-- Agregar columna 'estado' a la tabla citas si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='citas' AND column_name='estado') THEN
        ALTER TABLE citas ADD COLUMN estado VARCHAR(20) DEFAULT 'pendiente';
        UPDATE citas SET estado = 'completada' WHERE fecha < CURRENT_DATE;
        UPDATE citas SET estado = 'confirmada' WHERE fecha >= CURRENT_DATE AND estado = 'pendiente';
        RAISE NOTICE 'Columna estado agregada a la tabla citas';
    ELSE
        RAISE NOTICE 'La columna estado ya existe en la tabla citas';
    END IF;
END $$;