-- Consultar usuario administrador
SELECT id, nombre, email, rol, password 
FROM usuarios 
WHERE rol = 'admin' 
LIMIT 5;

-- Si no hay admin, buscar todos los roles
SELECT id, nombre, email, rol 
FROM usuarios 
ORDER BY id 
LIMIT 10;
