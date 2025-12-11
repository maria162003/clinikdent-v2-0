-- Agregar columna cita_id a la tabla facturas para vincular facturas con citas
-- Esto permite generar facturas automáticamente al agendar citas

-- Verificar si la columna ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'facturas' 
        AND column_name = 'cita_id'
    ) THEN
        -- Agregar la columna
        ALTER TABLE facturas 
        ADD COLUMN cita_id INT REFERENCES citas(id) ON DELETE SET NULL;
        
        -- Crear índice para mejorar búsquedas
        CREATE INDEX idx_facturas_cita_id ON facturas(cita_id);
        
        RAISE NOTICE 'Columna cita_id agregada exitosamente a la tabla facturas';
    ELSE
        RAISE NOTICE 'La columna cita_id ya existe en la tabla facturas';
    END IF;
END $$;

-- Verificar el resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'facturas' 
AND column_name = 'cita_id';
