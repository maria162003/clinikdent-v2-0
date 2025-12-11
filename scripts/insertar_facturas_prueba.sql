-- =========================================================
-- FACTURAS DE PRUEBA - SISTEMA DEMO DE FACTURACI�N
-- =========================================================
-- Este script inserta 4 facturas de prueba usando IDs reales

-- Factura 1: PENDIENTE - Paciente 42 (Daniel), Odont�logo 47 (Javier)
-- Consulta + Limpieza = $130,000
INSERT INTO facturas (
  paciente_id,
  odontologo_id,
  servicios,
  subtotal,
  descuento,
  total,
  fecha_emision,
  fecha_vencimiento,
  estado,
  metodo_pago,
  es_demo
) VALUES (
  42,
  47,
  '[
    {\"servicio_id\": 1, \"nombre\": \"Consulta general\", \"cantidad\": 1, \"precio_unitario\": 50000, \"subtotal\": 50000},
    {\"servicio_id\": 2, \"nombre\": \"Limpieza dental\", \"cantidad\": 1, \"precio_unitario\": 80000, \"subtotal\": 80000}
  ]'::jsonb,
  130000,
  0,
  130000,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '3 days',
  'PENDIENTE',
  NULL,
  true
);

-- Factura 2: VENCIDA - Paciente 41 (Julian), Odont�logo 48 (Yadir)
-- Extracci�n = $120,000 (vencida hace 5 d�as)
INSERT INTO facturas (
  paciente_id,
  odontologo_id,
  servicios,
  subtotal,
  descuento,
  total,
  fecha_emision,
  fecha_vencimiento,
  estado,
  metodo_pago,
  es_demo
) VALUES (
  41,
  48,
  '[
    {\"servicio_id\": 4, \"nombre\": \"Extracci�n dental\", \"cantidad\": 1, \"precio_unitario\": 120000, \"subtotal\": 120000}
  ]'::jsonb,
  120000,
  0,
  120000,
  CURRENT_TIMESTAMP - INTERVAL '10 days',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  'VENCIDA',
  NULL,
  true
);

-- Factura 3: PAGADA - Paciente 1 (Daniel Rayo), Odont�logo 50 (Daniel Bejarano)
-- Ortodoncia con descuento = $90,000 (pagada hace 2 d�as)
INSERT INTO facturas (
  paciente_id,
  odontologo_id,
  servicios,
  subtotal,
  descuento,
  total,
  fecha_emision,
  fecha_vencimiento,
  fecha_pago,
  estado,
  metodo_pago,
  es_demo
) VALUES (
  1,
  50,
  '[
    {\"servicio_id\": 5, \"nombre\": \"Ortodoncia\", \"cantidad\": 1, \"precio_unitario\": 100000, \"subtotal\": 100000}
  ]'::jsonb,
  100000,
  10000,
  90000,
  CURRENT_TIMESTAMP - INTERVAL '7 days',
  CURRENT_TIMESTAMP + INTERVAL '23 days',
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  'PAGADA',
  'tarjeta_demo',
  true
);

-- Factura 4: PENDIENTE - Paciente 5 (Camila), Odont�logo 47 (Javier)
-- Blanqueamiento dental con descuento = $300,000
INSERT INTO facturas (
  paciente_id,
  odontologo_id,
  servicios,
  subtotal,
  descuento,
  total,
  fecha_emision,
  fecha_vencimiento,
  estado,
  metodo_pago,
  es_demo
) VALUES (
  5,
  47,
  '[
    {\"servicio_id\": 6, \"nombre\": \"Blanqueamiento dental\", \"cantidad\": 1, \"precio_unitario\": 350000, \"subtotal\": 350000}
  ]'::jsonb,
  350000,
  50000,
  300000,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '5 days',
  'PENDIENTE',
  NULL,
  true
);

-- Verificaci�n: Ver facturas creadas
SELECT 
  f.numero_factura,
  u1.nombre || ' ' || u1.apellido as paciente,
  u2.nombre || ' ' || u2.apellido as odontologo,
  f.total,
  f.estado,
  f.fecha_emision,
  f.fecha_vencimiento
FROM facturas f
JOIN usuarios u1 ON f.paciente_id = u1.id
JOIN usuarios u2 ON f.odontologo_id = u2.id
WHERE f.es_demo = true
ORDER BY f.fecha_emision DESC;

-- Verificaci�n: Ver distribuciones de ingresos generadas
SELECT 
  d.*,
  u.nombre || ' ' || u.apellido as odontologo
FROM distribucion_ingresos d
JOIN usuarios u ON d.odontologo_id = u.id
WHERE EXISTS (
  SELECT 1 FROM facturas f 
  WHERE f.id = d.factura_id AND f.es_demo = true
)
ORDER BY d.created_at DESC;
