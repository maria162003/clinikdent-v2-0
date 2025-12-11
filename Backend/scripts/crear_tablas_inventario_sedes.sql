-- Script para crear las tablas de sedes, equipos e inventario_equipos
-- Ejecutar en MariaDB/MySQL

-- Crear tabla sedes
CREATE TABLE IF NOT EXISTS sedes (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activa', 'inactiva') DEFAULT 'activa'
);

-- Crear tabla equipos (catálogo de equipos disponibles)
CREATE TABLE IF NOT EXISTS equipos (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    precio DECIMAL(10,2) DEFAULT 0.00,
    descripcion TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla inventario_equipos (inventario por sede)
CREATE TABLE IF NOT EXISTS inventario_equipos (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    sede_id INT(11) NOT NULL,
    equipo_id INT(11) NOT NULL,
    cantidad INT(11) NOT NULL DEFAULT 0,
    descripcion TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sede_equipo (sede_id, equipo_id)
);

-- Insertar datos de ejemplo

-- Sedes de ejemplo
INSERT INTO sedes (nombre, direccion, telefono, ciudad, estado) VALUES
('Sede Principal', 'Carrera 15 #85-32', '601-2345678', 'Bogotá', 'activa'),
('Sede Norte', 'Calle 140 #19-45', '601-2345679', 'Bogotá', 'activa'),
('Sede Chapinero', 'Carrera 13 #63-18', '601-2345680', 'Bogotá', 'activa'),
('Sede Medellín', 'Carrera 70 #52-21', '604-4567890', 'Medellín', 'activa');

-- Equipos de ejemplo
INSERT INTO equipos (nombre, categoria, precio, descripcion) VALUES
('Sillón Dental Eléctrico', 'Mobiliario', 2500000.00, 'Sillón dental con sistema eléctrico y luces LED'),
('Compresor de Aire', 'Equipos Base', 800000.00, 'Compresor libre de aceite para consultorio dental'),
('Autoclave', 'Esterilización', 1200000.00, 'Autoclave de vapor para esterilización de instrumentos'),
('Lámpara de Fotocurado', 'Equipos Menores', 350000.00, 'Lámpara LED para fotocurado de resinas'),
('Amalgamador', 'Equipos Menores', 450000.00, 'Amalgamador digital para preparación de amalgamas'),
('Ultrasonido Dental', 'Equipos Menores', 280000.00, 'Equipo de ultrasonido para limpieza dental'),
('Rayos X Intraoral', 'Imagenología', 3500000.00, 'Equipo de rayos X digital intraoral'),
('Micromotor', 'Instrumental', 180000.00, 'Micromotor de alta precisión'),
('Turbina de Alta Velocidad', 'Instrumental', 220000.00, 'Turbina con sistema de refrigeración'),
('Cavitron', 'Equipos Menores', 650000.00, 'Equipo ultrasónico para profilaxis'),
('Mesa de Instrumental', 'Mobiliario', 320000.00, 'Mesa rodable para instrumental dental'),
('Lámpara Cielítica', 'Iluminación', 480000.00, 'Lámpara sin sombras para consultorio'),
('Aspirador Quirúrgico', 'Equipos Base', 750000.00, 'Sistema de aspiración de alta potencia'),
('Esterilizador UV', 'Esterilización', 180000.00, 'Gabinete de esterilización con luz UV'),
('Bisturí Eléctrico', 'Equipos Quirúrgicos', 920000.00, 'Bisturí eléctrico para cirugía oral');

-- Inventario de ejemplo (distribución de equipos en sedes)
INSERT INTO inventario_equipos (sede_id, equipo_id, cantidad, descripcion) VALUES
-- Sede Principal (id: 1)
(1, 1, 3, 'Sillones principales en consultorios 1, 2 y 3'),
(1, 2, 1, 'Compresor central para toda la sede'),
(1, 3, 2, 'Autoclave principal y de respaldo'),
(1, 4, 6, 'Una por consultorio'),
(1, 5, 2, 'Amalgamadores para preparaciones'),
(1, 6, 4, 'Equipos de ultrasonido'),
(1, 7, 1, 'Equipo de rayos X principal'),
(1, 8, 8, 'Micromotores de uso diario'),
(1, 9, 6, 'Turbinas para todos los consultorios'),
(1, 10, 2, 'Cavitrones para limpieza'),

-- Sede Norte (id: 2)
(2, 1, 2, 'Consultorios 1 y 2'),
(2, 2, 1, 'Compresor sede norte'),
(2, 3, 1, 'Autoclave principal'),
(2, 4, 4, 'Lámparas de fotocurado'),
(2, 5, 1, 'Amalgamador'),
(2, 6, 2, 'Ultrasonidos'),
(2, 8, 4, 'Micromotores'),
(2, 9, 4, 'Turbinas'),
(2, 11, 3, 'Mesas de instrumental'),
(2, 12, 2, 'Lámparas cielíticas'),

-- Sede Chapinero (id: 3)
(3, 1, 2, 'Consultorios especializados'),
(3, 2, 1, 'Compresor'),
(3, 3, 1, 'Autoclave'),
(3, 4, 3, 'Lámparas'),
(3, 6, 2, 'Ultrasonidos'),
(3, 8, 3, 'Micromotores'),
(3, 9, 3, 'Turbinas'),
(3, 13, 1, 'Aspirador quirúrgico'),
(3, 14, 2, 'Esterilizadores UV'),
(3, 15, 1, 'Bisturí eléctrico'),

-- Sede Medellín (id: 4)
(4, 1, 4, 'Sede más grande - 4 consultorios'),
(4, 2, 1, 'Compresor principal'),
(4, 3, 2, 'Dos autoclaves'),
(4, 4, 8, 'Lámparas de fotocurado'),
(4, 5, 2, 'Amalgamadores'),
(4, 6, 3, 'Ultrasonidos'),
(4, 7, 1, 'Rayos X'),
(4, 8, 10, 'Micromotores'),
(4, 9, 8, 'Turbinas'),
(4, 10, 2, 'Cavitrones'),
(4, 11, 4, 'Mesas de instrumental'),
(4, 12, 4, 'Lámparas cielíticas'),
(4, 13, 1, 'Aspirador quirúrgico'),
(4, 15, 1, 'Bisturí eléctrico');

-- Verificar la inserción
SELECT 'Resumen de datos insertados:' as Info;
SELECT COUNT(*) as 'Total Sedes' FROM sedes;
SELECT COUNT(*) as 'Total Equipos' FROM equipos;
SELECT COUNT(*) as 'Total Items Inventario' FROM inventario_equipos;

-- Mostrar inventario por sede
SELECT 
    s.nombre as Sede,
    COUNT(ie.id) as 'Items Inventario',
    SUM(ie.cantidad) as 'Cantidad Total'
FROM sedes s
LEFT JOIN inventario_equipos ie ON s.id = ie.sede_id
GROUP BY s.id, s.nombre
ORDER BY s.nombre;
