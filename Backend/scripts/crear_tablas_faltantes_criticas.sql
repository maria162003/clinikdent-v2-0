-- Tablas faltantes críticas para el sistema Clinik Dent

-- 1. Tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado TINYINT(1) DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario_id (usuario_id)
);

-- 2. Tabla para horarios disponibles de citas
CREATE TABLE IF NOT EXISTS citas_disponibles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    odontologo_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    disponible TINYINT(1) DEFAULT 1,
    sede_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sede_id) REFERENCES sedes(id),
    UNIQUE KEY unique_slot (odontologo_id, fecha, hora_inicio)
);

-- 3. Tabla para archivos adjuntos médicos
CREATE TABLE IF NOT EXISTS archivos_adjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    historial_id INT,
    cita_id INT,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100),
    ruta_archivo VARCHAR(500) NOT NULL,
    tamaño_bytes INT,
    tipo_documento ENUM('rayos_x', 'receta', 'consentimiento', 'factura', 'otro') DEFAULT 'otro',
    subido_por INT NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (historial_id) REFERENCES historial_clinico(id) ON DELETE CASCADE,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id),
    INDEX idx_historial (historial_id),
    INDEX idx_cita (cita_id)
);

-- 4. Tabla para planes de tratamiento
CREATE TABLE IF NOT EXISTS planes_tratamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    odontologo_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    costo_total DECIMAL(10,2),
    estado ENUM('borrador', 'propuesto', 'aprobado', 'rechazado', 'en_progreso', 'completado') DEFAULT 'borrador',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP NULL,
    fecha_inicio TIMESTAMP NULL,
    fecha_fin_estimada DATE,
    notas TEXT,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (odontologo_id) REFERENCES usuarios(id),
    INDEX idx_paciente (paciente_id),
    INDEX idx_odontologo (odontologo_id)
);

-- 5. Tabla para categorías de inventario
CREATE TABLE IF NOT EXISTS categorias_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    codigo_categoria VARCHAR(20) UNIQUE,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla para proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    codigo_proveedor VARCHAR(50) UNIQUE,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Tabla para evaluaciones de servicio
CREATE TABLE IF NOT EXISTS evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cita_id INT NOT NULL,
    paciente_id INT NOT NULL,
    odontologo_id INT NOT NULL,
    calificacion_servicio INT NOT NULL CHECK (calificacion_servicio BETWEEN 1 AND 5),
    calificacion_odontologo INT NOT NULL CHECK (calificacion_odontologo BETWEEN 1 AND 5),
    comentarios TEXT,
    recomendaria TINYINT(1) DEFAULT 1,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (odontologo_id) REFERENCES usuarios(id),
    UNIQUE KEY unique_evaluation (cita_id)
);

-- 8. Tabla para recordatorios automáticos
CREATE TABLE IF NOT EXISTS recordatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cita_id INT NOT NULL,
    tipo_recordatorio ENUM('sms', 'email', 'ambos') DEFAULT 'email',
    tiempo_anticipacion INT NOT NULL COMMENT 'Horas antes de la cita',
    enviado TINYINT(1) DEFAULT 0,
    fecha_programado TIMESTAMP NOT NULL,
    fecha_enviado TIMESTAMP NULL,
    mensaje_personalizado TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
    INDEX idx_cita (cita_id),
    INDEX idx_programado (fecha_programado, enviado)
);

-- Insertar categorías básicas de inventario
INSERT INTO categorias_inventario (nombre, descripcion, codigo_categoria) VALUES
('Instrumental Básico', 'Instrumentos dentales básicos', 'INST_BASICO'),
('Anestésicos', 'Productos para anestesia local', 'ANEST'),
('Materiales de Curación', 'Materiales para restauraciones', 'MAT_CURACION'),
('Profilaxis', 'Productos para limpieza dental', 'PROFILAXIS'),
('Endodoncia', 'Materiales para tratamientos de endodoncia', 'ENDODONCIA'),
('Cirugía', 'Instrumental y materiales quirúrgicos', 'CIRUGIA'),
('Prótesis', 'Materiales para prótesis dentales', 'PROTESIS'),
('Ortodoncia', 'Materiales para tratamientos ortodóncicos', 'ORTODON'),
('Desinfección', 'Productos de limpieza y desinfección', 'DESINFEC'),
('Consumibles', 'Materiales de un solo uso', 'CONSUMIBLE');

-- Insertar proveedores ejemplo
INSERT INTO proveedores (nombre, contacto, telefono, email, ciudad, codigo_proveedor) VALUES
('Dental Supply Colombia', 'Juan Pérez', '+57 1 2345678', 'ventas@dentalsupply.co', 'Bogotá', 'DSC001'),
('Instrumentos Médicos Ltda', 'María García', '+57 4 8765432', 'info@instmedicos.com', 'Medellín', 'IML002'),
('Suministros Odontológicos', 'Carlos Rodríguez', '+57 2 5556789', 'carlos@suministros.com', 'Cali', 'SO003');

-- Crear horarios disponibles ejemplo (próximas 2 semanas para odontólogos)
INSERT INTO citas_disponibles (odontologo_id, fecha, hora_inicio, hora_fin) 
SELECT 
    u.id,
    DATE_ADD(CURDATE(), INTERVAL seq DAY) as fecha,
    TIME(CONCAT(hora, ':00:00')) as hora_inicio,
    TIME(CONCAT(hora + 1, ':00:00')) as hora_fin
FROM usuarios u
CROSS JOIN (
    SELECT 0 seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 
    UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13
) dates
CROSS JOIN (
    SELECT 8 hora UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 
    UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17
) horas
WHERE u.rol = 'odontologo' 
AND DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL seq DAY)) BETWEEN 2 AND 6; -- Solo lunes a viernes

COMMIT;
