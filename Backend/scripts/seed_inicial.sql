INSERT INTO inventario (id, nombre, cantidad, unidad)
VALUES
  (gen_random_uuid(), 'Guantes de látex', 500, 'pares'),
  (gen_random_uuid(), 'Anestesia local', 120, 'viales'),
  (gen_random_uuid(), 'Mascarillas quirúrgicas', 1000, 'unidades')
ON CONFLICT DO NOTHING;
