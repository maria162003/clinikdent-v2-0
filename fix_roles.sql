UPDATE usuarios SET rol_id = 3 WHERE correo = 'camila@example.com';
UPDATE usuarios SET rol_id = 1 WHERE correo = 'juan@example.com';

SELECT u.correo, r.nombre as rol, u.nombre, u.apellido 
FROM usuarios u 
LEFT JOIN roles r ON u.rol_id = r.id 
WHERE u.correo IN ('camila@example.com', 'juan@example.com', 'fernanda@example.com')
ORDER BY u.correo;
