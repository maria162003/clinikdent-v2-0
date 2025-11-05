-- Script para insertar datos de prueba para el dashboard
-- Esto permitirá ver ingresos reales en las estadísticas

-- Insertar algunos datos de pagos del mes actual para mostrar ingresos
INSERT INTO pagos (paciente_id, monto, metodo_pago, referencia_pago, estado, fecha_pago, created_at) VALUES
(3, 150000.00, 'tarjeta_credito', 'TXN001', 'completado', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 200000.00, 'efectivo', 'EFE001', 'completado', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(3, 350000.00, 'transferencia', 'TRF001', 'completado', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(4, 120000.00, 'tarjeta_debito', 'DEB001', 'completado', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(3, 180000.00, 'efectivo', 'EFE002', 'completado', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(4, 250000.00, 'tarjeta_credito', 'TXN002', 'completado', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 90000.00, 'efectivo', 'EFE003', 'completado', CURRENT_TIMESTAMP - INTERVAL '1 days', CURRENT_TIMESTAMP - INTERVAL '1 days'),
(4, 300000.00, 'transferencia', 'TRF002', 'completado', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- Insertar algunas citas de hoy para las estadísticas
INSERT INTO citas (paciente_id, odontologo_id, fecha, hora, motivo, estado, fecha_creacion) VALUES
(3, 2, CURRENT_DATE, '10:00:00', 'Consulta general', 'confirmada', CURRENT_TIMESTAMP),
(4, 2, CURRENT_DATE, '14:30:00', 'Limpieza dental', 'confirmada', CURRENT_TIMESTAMP),
(3, 2, CURRENT_DATE, '16:00:00', 'Revisión', 'pendiente', CURRENT_TIMESTAMP),
(4, 2, CURRENT_DATE + INTERVAL '1 day', '09:00:00', 'Endodoncia', 'confirmada', CURRENT_TIMESTAMP),
(3, 2, CURRENT_DATE + INTERVAL '1 day', '11:30:00', 'Ortodoncia', 'confirmada', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Actualizar roles si no existen
INSERT INTO roles (id, nombre) VALUES 
(1, 'administrador'),
(2, 'odontologo'),
(3, 'paciente'),
(4, 'auxiliar')
ON CONFLICT (id) DO UPDATE SET 
nombre = EXCLUDED.nombre;

-- Actualizar algunos usuarios con roles específicos
UPDATE usuarios SET rol_id = 1 WHERE id = 1; -- Admin
UPDATE usuarios SET rol_id = 2 WHERE id = 2; -- Dr. Carlos como odontólogo
UPDATE usuarios SET rol_id = 3 WHERE id = 3; -- María como paciente
UPDATE usuarios SET rol_id = 3 WHERE id = 4; -- Juan como paciente
UPDATE usuarios SET rol_id = 1 WHERE id = 5; -- Camila como admin

-- Asegurar que los usuarios estén activos
UPDATE usuarios SET activo = true WHERE id IN (1, 2, 3, 4, 5);

-- Verificar datos insertados
SELECT 'Pagos insertados:' as info, COUNT(*) as cantidad, SUM(monto) as total_ingresos FROM pagos WHERE fecha_pago >= DATE_TRUNC('month', CURRENT_DATE);
SELECT 'Citas de hoy:' as info, COUNT(*) as cantidad FROM citas WHERE DATE(fecha) = CURRENT_DATE;
SELECT 'Usuarios por rol:' as info, r.nombre as rol, COUNT(u.id) as cantidad FROM usuarios u LEFT JOIN roles r ON u.rol_id = r.id GROUP BY r.nombre;