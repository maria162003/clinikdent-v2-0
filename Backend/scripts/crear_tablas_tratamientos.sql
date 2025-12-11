-- Script para crear las tablas de tratamientos

-- Crear tabla de tipos de tratamientos
CREATE TABLE IF NOT EXISTS tratamientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    costo_estimado DECIMAL(10,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Crear tabla de tratamientos asignados a pacientes
CREATE TABLE IF NOT EXISTS paciente_tratamientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    tratamiento_id INT NOT NULL,
    odontologo_id INT NOT NULL,
    cita_id INT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE NULL,
    fecha_fin_real DATE NULL,
    costo_estimado DECIMAL(10,2) NULL,
    costo_real DECIMAL(10,2) NULL,
    estado ENUM('planificado', 'en_proceso', 'pausado', 'completado', 'cancelado') DEFAULT 'planificado',
    descripcion TEXT,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE CASCADE,
    FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_paciente (paciente_id),
    INDEX idx_odontologo (odontologo_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- Insertar algunos tratamientos básicos
INSERT INTO tratamientos (nombre, descripcion, costo_estimado) VALUES
('Limpieza Dental', 'Profilaxis y limpieza profunda', 50000),
('Obturación Simple', 'Restauración con resina compuesta', 80000),
('Obturación Compleja', 'Restauración de caries extensas', 120000),
('Endodoncia', 'Tratamiento de conducto radicular', 300000),
('Corona Dental', 'Corona de porcelana o metal-porcelana', 450000),
('Extracción Simple', 'Extracción de diente sin complicaciones', 60000),
('Extracción Quirúrgica', 'Extracción compleja con cirugía', 150000),
('Blanqueamiento Dental', 'Blanqueamiento dental profesional', 200000),
('Ortodoncia', 'Tratamiento ortodóntico con brackets', 2500000),
('Implante Dental', 'Implante osteointegrado con corona', 1500000),
('Puente Dental', 'Puente fijo de 3 unidades', 900000),
('Prótesis Parcial', 'Prótesis removible parcial', 600000),
('Prótesis Total', 'Prótesis completa superior o inferior', 800000),
('Cirugía Periodontal', 'Tratamiento quirúrgico de encías', 400000),
('Tratamiento ATM', 'Tratamiento de articulación temporomandibular', 350000)
ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion), costo_estimado=VALUES(costo_estimado);
