-- ==========================================
-- VERIFICACIÓN Y CREACIÓN DE TABLAS PARA REPORTES
-- Clinik Dent - Sistema de Reportes
-- ==========================================

-- Verificar si existe la tabla de registro_actividad
CREATE TABLE IF NOT EXISTS registro_actividad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    detalles TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_fecha (usuario_id, fecha_hora),
    INDEX idx_fecha (fecha_hora),
    INDEX idx_accion (accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asegurar que la tabla citas tenga los campos necesarios
-- Si ya existe, solo se agregarán los campos faltantes
ALTER TABLE citas 
ADD COLUMN IF NOT EXISTS fecha_cancelacion DATETIME,
ADD COLUMN IF NOT EXISTS motivo_cancelacion VARCHAR(200),
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Asegurar que la tabla tratamientos tenga los campos necesarios
ALTER TABLE tratamientos 
ADD COLUMN IF NOT EXISTS progreso INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_estimada_fin DATE;

-- Crear tabla de pagos si no existe
CREATE TABLE IF NOT EXISTS pagos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    cita_id INT,
    tratamiento_id INT,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
    estado ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pagado',
    fecha DATE NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_registro_id INT,
    observaciones TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL,
    FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_fecha (fecha),
    INDEX idx_paciente (paciente_id),
    INDEX idx_metodo_pago (metodo_pago),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear índices adicionales para optimizar las consultas de reportes
CREATE INDEX IF NOT EXISTS idx_citas_fecha_estado ON citas(fecha, estado);
CREATE INDEX IF NOT EXISTS idx_tratamientos_fecha_estado ON tratamientos(fecha_inicio, estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- ==========================================
-- INSERTAR DATOS DE PRUEBA (opcional)
-- ==========================================

-- Insertar registros de actividad de ejemplo
INSERT INTO registro_actividad (usuario_id, accion, modulo, detalles)
SELECT 
    u.id,
    'login',
    'autenticacion',
    CONCAT('Inicio de sesión del usuario ', u.nombre)
FROM usuarios u
WHERE NOT EXISTS (SELECT 1 FROM registro_actividad WHERE usuario_id = u.id AND accion = 'login')
LIMIT 5;

-- Insertar pagos de ejemplo si no existen
INSERT INTO pagos (paciente_id, concepto, monto, metodo_pago, fecha)
SELECT 
    p.id,
    'Consulta Odontológica',
    150000,
    'efectivo',
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY)
FROM pacientes p
WHERE NOT EXISTS (SELECT 1 FROM pagos WHERE paciente_id = p.id)
LIMIT 10;

-- Verificar la estructura de las tablas
SHOW TABLES LIKE '%actividad%';
SHOW TABLES LIKE '%pagos%';

SELECT 
    'registro_actividad' as tabla,
    COUNT(*) as registros
FROM registro_actividad
UNION ALL
SELECT 
    'pagos' as tabla,
    COUNT(*) as registros
FROM pagos
UNION ALL
SELECT 
    'citas' as tabla,
    COUNT(*) as registros
FROM citas
UNION ALL
SELECT 
    'tratamientos' as tabla,
    COUNT(*) as registros
FROM tratamientos;
