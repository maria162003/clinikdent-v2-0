-- Script para crear las tablas necesarias en la base de datos

-- Eliminar tabla si existe para recrearla con la estructura correcta
DROP TABLE IF EXISTS pqrs;

-- Crear tabla PQRS con la estructura correcta
CREATE TABLE pqrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_radicado VARCHAR(50) UNIQUE,
    nombre_completo VARCHAR(120) NOT NULL,
    correo VARCHAR(120) NOT NULL,
    telefono VARCHAR(30),
    numero_documento VARCHAR(40),
    tipo ENUM('Petición', 'Queja', 'Reclamo', 'Sugerencia') NOT NULL,
    asunto VARCHAR(160) NOT NULL,
    resumen VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    servicio_relacionado VARCHAR(100),
    estado ENUM('pendiente', 'en proceso', 'resuelto') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
