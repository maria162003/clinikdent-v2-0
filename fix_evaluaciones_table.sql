-- Actualizar tabla evaluaciones para incluir todos los campos necesarios
-- Agregar las columnas faltantes

ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS calificacion_atencion INTEGER;

ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS calificacion_instalaciones INTEGER;

ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS calificacion_limpieza INTEGER;

ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS calificacion_puntualidad INTEGER;

ALTER TABLE evaluaciones 
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP;

-- Renombrar calificacion_odontologo a calificacion_atencion si existe
-- (para mantener consistencia)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'evaluaciones' 
               AND column_name = 'calificacion_odontologo') THEN
        
        -- Si no existe calificacion_atencion, renombrar
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'evaluaciones' 
                       AND column_name = 'calificacion_atencion') THEN
            ALTER TABLE evaluaciones 
            RENAME COLUMN calificacion_odontologo TO calificacion_atencion;
        END IF;
    END IF;
END $$;

-- Insertar datos de ejemplo para probar
INSERT INTO evaluaciones (
    cita_id, 
    paciente_id, 
    odontologo_id, 
    calificacion_servicio, 
    calificacion_atencion, 
    calificacion_instalaciones, 
    calificacion_limpieza, 
    calificacion_puntualidad, 
    comentarios, 
    recomendaria, 
    fecha_evaluacion
) VALUES 
(1, 3, 4, 5, 5, 4, 5, 4, 'Excelente atención, muy profesional y las instalaciones están muy bien.', true, '2025-09-12 10:00:00'),
(2, 1, 2, 4, 5, 4, 4, 5, 'Muy buen servicio, la doctora muy atenta y puntual.', true, '2025-09-11 14:30:00'),
(3, 3, 4, 4, 4, 4, 5, 3, 'Buen servicio en general, aunque llegué un poco tarde por el tráfico.', true, '2025-09-10 16:00:00')
ON CONFLICT (id) DO NOTHING;

-- Verificar la estructura final
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'evaluaciones' 
ORDER BY ordinal_position;