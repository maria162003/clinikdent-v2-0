-- =================== TABLAS PARA INVENTARIO EXPANDIDO ===================
-- Script para crear las tablas necesarias para el sistema de inventario avanzado
-- Clinik Dent - Módulo de Inventario

-- Tabla principal de inventario (productos)
CREATE TABLE IF NOT EXISTS inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    sede_id INT,
    cantidad INT DEFAULT 0,
    stock_minimo INT DEFAULT 0,
    stock_maximo INT DEFAULT NULL,
    precio_unitario DECIMAL(15,2) DEFAULT 0.00,
    unidad_medida VARCHAR(50) DEFAULT 'unidad',
    proveedor_id INT DEFAULT NULL,
    fecha_vencimiento DATE DEFAULT NULL,
    ubicacion VARCHAR(255) DEFAULT NULL,
    alerta_stock_bajo BOOLEAN DEFAULT TRUE,
    alerta_vencimiento BOOLEAN DEFAULT FALSE,
    requiere_receta BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo),
    INDEX idx_categoria (categoria_id),
    INDEX idx_sede (sede_id),
    INDEX idx_stock (cantidad, stock_minimo),
    INDEX idx_vencimiento (fecha_vencimiento)
);

-- Tabla de categorías de inventario
CREATE TABLE IF NOT EXISTS categorias_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre)
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    especialidades TEXT,
    tiempo_entrega_dias INT DEFAULT 7,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_email (email)
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'transferencia', 'eliminacion') NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    sede_origen_id INT DEFAULT NULL,
    sede_destino_id INT DEFAULT NULL,
    usuario_id INT NOT NULL,
    stock_anterior INT DEFAULT NULL,
    stock_nuevo INT DEFAULT NULL,
    costo_unitario DECIMAL(15,2) DEFAULT NULL,
    numero_documento VARCHAR(100) DEFAULT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES inventario(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id),
    INDEX idx_tipo (tipo_movimiento),
    INDEX idx_fecha (fecha_movimiento),
    INDEX idx_usuario (usuario_id)
);

-- Tabla de alertas de inventario
CREATE TABLE IF NOT EXISTS alertas_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo_alerta ENUM('stock_bajo', 'stock_agotado', 'vencimiento_proximo', 'vencido') NOT NULL,
    mensaje TEXT,
    activa BOOLEAN DEFAULT TRUE,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP DEFAULT NULL,
    usuario_revision_id INT DEFAULT NULL,
    
    FOREIGN KEY (producto_id) REFERENCES inventario(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id),
    INDEX idx_tipo (tipo_alerta),
    INDEX idx_activa (activa),
    INDEX idx_fecha (fecha_generacion)
);

-- Tabla de transferencias entre sedes
CREATE TABLE IF NOT EXISTS transferencias_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    sede_origen_id INT NOT NULL,
    sede_destino_id INT NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    estado ENUM('pendiente', 'en_transito', 'completada', 'cancelada') DEFAULT 'pendiente',
    usuario_solicita_id INT NOT NULL,
    usuario_autoriza_id INT DEFAULT NULL,
    usuario_recibe_id INT DEFAULT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_autorizacion TIMESTAMP DEFAULT NULL,
    fecha_recepcion TIMESTAMP DEFAULT NULL,
    observaciones TEXT,
    
    FOREIGN KEY (producto_id) REFERENCES inventario(id),
    INDEX idx_producto (producto_id),
    INDEX idx_origen (sede_origen_id),
    INDEX idx_destino (sede_destino_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_solicitud (fecha_solicitud)
);

-- =================== DATOS INICIALES ===================

-- Insertar categorías predeterminadas
INSERT IGNORE INTO categorias_inventario (nombre, descripcion, color) VALUES
('Material Médico', 'Guantes, mascarillas, batas y material desechable', '#007bff'),
('Instrumental', 'Espejos bucales, sondas, pinzas y herramientas dentales', '#28a745'),
('Consumibles', 'Algodón, gasas, rollos de algodón y materiales de un solo uso', '#ffc107'),
('Equipos', 'Amalgamadores, compresores, equipos de rayos X', '#dc3545'),
('Medicamentos', 'Anestésicos, antibióticos, analgésicos y medicamentos dentales', '#6f42c1'),
('Materiales de Restauración', 'Amalgamas, resinas, cementos y materiales de obturación', '#fd7e14'),
('Material de Laboratorio', 'Yesos, ceras, materiales de impresión', '#20c997');

-- Insertar proveedores de ejemplo
INSERT IGNORE INTO proveedores (nombre, contacto, telefono, email, direccion, ciudad, especialidades) VALUES
('Dental Supply Colombia SA', 'Carlos Mendoza', '601-555-0123', 'ventas@dentalsupply.com.co', 'Calle 100 #15-20', 'Bogotá', 'Material médico, instrumental dental'),
('Medical Equipment Corp', 'Ana Torres', '601-555-0456', 'info@medicalequip.com', 'Av. El Dorado #68-45', 'Bogotá', 'Equipos dentales, radiología'),
('Insumos Odontológicos Ltda', 'Luis Ramírez', '604-555-0789', 'pedidos@insumosodon.com', 'Carrera 43A #20-50', 'Medellín', 'Consumibles, material desechable'),
('Farmacia Dental Plus', 'María González', '602-555-0321', 'farmacia@dentalplus.com', 'Calle 5 #36-08', 'Cali', 'Medicamentos, anestésicos'),
('Laboratorio Dental Andino', 'Jorge Herrera', '607-555-0654', 'lab@dentalandino.com', 'Calle 19 #3-45', 'Bucaramanga', 'Material de laboratorio, prótesis');

-- Verificar que la tabla sedes existe, si no, crearla básica
CREATE TABLE IF NOT EXISTS sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar sedes de ejemplo si no existen
INSERT IGNORE INTO sedes (id, nombre, direccion, ciudad) VALUES
(1, 'Sede Centro', 'Calle 72 #10-34, Centro', 'Bogotá'),
(2, 'Sede Norte', 'Carrera 15 #127-45, Zona Norte', 'Bogotá'),
(3, 'Sede Sur', 'Calle 42 Sur #68-23, Zona Sur', 'Bogotá');

-- =================== PRODUCTOS DE EJEMPLO ===================

-- Insertar productos de ejemplo en el inventario
INSERT IGNORE INTO inventario (codigo, nombre, descripcion, categoria_id, sede_id, cantidad, stock_minimo, stock_maximo, precio_unitario, unidad_medida, proveedor_id) VALUES

-- Material Médico
('MED001', 'Guantes de Látex Talla M', 'Guantes desechables de látex para examinación', 1, 1, 150, 50, 500, 1500.00, 'caja', 1),
('MED002', 'Mascarillas Quirúrgicas', 'Mascarillas desechables de 3 capas', 1, 1, 200, 100, 1000, 800.00, 'caja', 1),
('MED003', 'Batas Desechables', 'Batas impermeables desechables', 1, 2, 25, 10, 100, 3500.00, 'unidad', 1),

-- Instrumental
('INS001', 'Espejo Bucal #5', 'Espejo bucal con mango metálico', 2, 2, 8, 10, 30, 15000.00, 'unidad', 2),
('INS002', 'Sonda Periodontal', 'Sonda para medición de bolsas periodontales', 2, 2, 15, 5, 25, 25000.00, 'unidad', 2),
('INS003', 'Pinza de Algodón', 'Pinza para manipular algodón estéril', 2, 1, 12, 8, 20, 18000.00, 'unidad', 2),

-- Consumibles
('CON001', 'Algodón Hidrófilo', 'Algodón estéril para uso odontológico', 3, 3, 0, 20, 100, 5000.00, 'paquete', 3),
('CON002', 'Rollos de Algodón #2', 'Rollos de algodón para aislamiento', 3, 1, 45, 30, 150, 2500.00, 'caja', 3),
('CON003', 'Gasas Estériles', 'Gasas estériles 10x10 cm', 3, 2, 80, 50, 200, 1800.00, 'paquete', 3),

-- Equipos
('EQU001', 'Amalgamador Digital', 'Amalgamador automático con temporizador', 4, 1, 2, 1, 3, 850000.00, 'unidad', 2),
('EQU002', 'Compresor Silencioso', 'Compresor de aire libre de aceite', 4, 2, 1, 1, 2, 1200000.00, 'unidad', 2),

-- Medicamentos
('MED004', 'Anestesia Lidocaína 2%', 'Anestésico local con epinefrina', 5, 1, 25, 15, 50, 12000.00, 'cartucho', 4),
('MED005', 'Ibuprofeno 600mg', 'Analgésico antiinflamatorio', 5, 2, 100, 50, 200, 800.00, 'tableta', 4),

-- Materiales de Restauración
('MAT001', 'Resina Compuesta A2', 'Resina fotopolimerizable color A2', 6, 1, 8, 5, 20, 45000.00, 'jeringa', 1),
('MAT002', 'Amalgama Dental', 'Amalgama de plata en cápsulas', 6, 2, 50, 25, 100, 8500.00, 'cápsula', 1);

-- =================== TRIGGERS PARA ALERTAS AUTOMÁTICAS ===================

-- Trigger para generar alertas de stock bajo después de actualizar inventario
DELIMITER //
CREATE TRIGGER IF NOT EXISTS generar_alerta_stock_bajo
    AFTER UPDATE ON inventario
    FOR EACH ROW
BEGIN
    -- Verificar stock bajo
    IF NEW.cantidad <= NEW.stock_minimo AND NEW.alerta_stock_bajo = TRUE THEN
        INSERT IGNORE INTO alertas_inventario (producto_id, tipo_alerta, mensaje, activa)
        VALUES (
            NEW.id,
            CASE 
                WHEN NEW.cantidad <= 0 THEN 'stock_agotado'
                ELSE 'stock_bajo'
            END,
            CONCAT('El producto ', NEW.nombre, ' tiene stock ', 
                   CASE 
                       WHEN NEW.cantidad <= 0 THEN 'agotado'
                       ELSE 'bajo'
                   END, 
                   '. Stock actual: ', NEW.cantidad, ', Stock mínimo: ', NEW.stock_minimo),
            TRUE
        );
    ELSE
        -- Desactivar alerta si el stock se normaliza
        UPDATE alertas_inventario 
        SET activa = FALSE, fecha_revision = NOW() 
        WHERE producto_id = NEW.id 
        AND tipo_alerta IN ('stock_bajo', 'stock_agotado')
        AND activa = TRUE;
    END IF;
    
    -- Verificar vencimiento próximo (30 días)
    IF NEW.fecha_vencimiento IS NOT NULL 
       AND NEW.alerta_vencimiento = TRUE 
       AND DATEDIFF(NEW.fecha_vencimiento, CURDATE()) <= 30
       AND DATEDIFF(NEW.fecha_vencimiento, CURDATE()) >= 0 THEN
        INSERT IGNORE INTO alertas_inventario (producto_id, tipo_alerta, mensaje, activa)
        VALUES (
            NEW.id,
            'vencimiento_proximo',
            CONCAT('El producto ', NEW.nombre, ' vence en ', 
                   DATEDIFF(NEW.fecha_vencimiento, CURDATE()), ' días'),
            TRUE
        );
    END IF;
    
    -- Verificar producto vencido
    IF NEW.fecha_vencimiento IS NOT NULL 
       AND NEW.fecha_vencimiento < CURDATE() THEN
        INSERT IGNORE INTO alertas_inventario (producto_id, tipo_alerta, mensaje, activa)
        VALUES (
            NEW.id,
            'vencido',
            CONCAT('El producto ', NEW.nombre, ' está vencido desde ', NEW.fecha_vencimiento),
            TRUE
        );
    END IF;
END//
DELIMITER ;

-- =================== VISTAS ÚTILES ===================

-- Vista de inventario con información completa
CREATE OR REPLACE VIEW vista_inventario_completo AS
SELECT 
    i.id,
    i.codigo,
    i.nombre,
    i.descripcion,
    i.cantidad,
    i.stock_minimo,
    i.stock_maximo,
    i.precio_unitario,
    (i.cantidad * i.precio_unitario) as valor_total,
    i.unidad_medida,
    i.ubicacion,
    i.fecha_vencimiento,
    DATEDIFF(i.fecha_vencimiento, CURDATE()) as dias_para_vencer,
    c.nombre as categoria,
    c.color as categoria_color,
    s.nombre as sede,
    p.nombre as proveedor,
    p.telefono as proveedor_telefono,
    CASE 
        WHEN i.cantidad <= 0 THEN 'agotado'
        WHEN i.cantidad <= i.stock_minimo THEN 'bajo'
        WHEN i.stock_maximo IS NOT NULL AND i.cantidad > i.stock_maximo THEN 'exceso'
        ELSE 'normal'
    END as estado_stock,
    CASE
        WHEN i.fecha_vencimiento IS NULL THEN 'sin_vencimiento'
        WHEN i.fecha_vencimiento < CURDATE() THEN 'vencido'
        WHEN DATEDIFF(i.fecha_vencimiento, CURDATE()) <= 30 THEN 'por_vencer'
        ELSE 'vigente'
    END as estado_vencimiento,
    i.fecha_creacion,
    i.fecha_actualizacion
FROM inventario i
LEFT JOIN categorias_inventario c ON i.categoria_id = c.id
LEFT JOIN sedes s ON i.sede_id = s.id
LEFT JOIN proveedores p ON i.proveedor_id = p.id;

-- Vista de alertas activas con detalles
CREATE OR REPLACE VIEW vista_alertas_activas AS
SELECT 
    a.id,
    a.tipo_alerta,
    a.mensaje,
    a.fecha_generacion,
    i.codigo,
    i.nombre as producto,
    i.cantidad as stock_actual,
    i.stock_minimo,
    s.nombre as sede,
    c.nombre as categoria,
    CASE a.tipo_alerta
        WHEN 'stock_agotado' THEN 'Crítica'
        WHEN 'stock_bajo' THEN 'Alta'
        WHEN 'vencido' THEN 'Crítica'
        WHEN 'vencimiento_proximo' THEN 'Media'
        ELSE 'Baja'
    END as prioridad
FROM alertas_inventario a
JOIN inventario i ON a.producto_id = i.id
LEFT JOIN sedes s ON i.sede_id = s.id
LEFT JOIN categorias_inventario c ON i.categoria_id = c.id
WHERE a.activa = TRUE
ORDER BY 
    CASE a.tipo_alerta
        WHEN 'stock_agotado' THEN 1
        WHEN 'vencido' THEN 2
        WHEN 'stock_bajo' THEN 3
        WHEN 'vencimiento_proximo' THEN 4
        ELSE 5
    END,
    a.fecha_generacion DESC;

-- =================== PROCEDIMIENTOS ALMACENADOS ===================

-- Procedimiento para transferir stock entre sedes
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS transferir_stock(
    IN p_producto_id INT,
    IN p_sede_origen_id INT,
    IN p_sede_destino_id INT,
    IN p_cantidad INT,
    IN p_usuario_id INT,
    IN p_motivo VARCHAR(255)
)
BEGIN
    DECLARE stock_origen INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar stock en sede origen
    SELECT cantidad INTO stock_origen
    FROM inventario 
    WHERE id = p_producto_id AND sede_id = p_sede_origen_id;
    
    IF stock_origen < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente en sede origen';
    END IF;
    
    -- Reducir stock en sede origen
    UPDATE inventario 
    SET cantidad = cantidad - p_cantidad,
        fecha_actualizacion = NOW()
    WHERE id = p_producto_id AND sede_id = p_sede_origen_id;
    
    -- Aumentar stock en sede destino
    UPDATE inventario 
    SET cantidad = cantidad + p_cantidad,
        fecha_actualizacion = NOW()
    WHERE id = p_producto_id AND sede_id = p_sede_destino_id;
    
    -- Registrar movimientos
    INSERT INTO movimientos_inventario 
    (producto_id, tipo_movimiento, cantidad, motivo, sede_origen_id, sede_destino_id, usuario_id, stock_anterior, stock_nuevo)
    VALUES 
    (p_producto_id, 'transferencia', p_cantidad, p_motivo, p_sede_origen_id, p_sede_destino_id, p_usuario_id, stock_origen, stock_origen - p_cantidad);
    
    COMMIT;
END//
DELIMITER ;

-- =================== ÍNDICES ADICIONALES PARA RENDIMIENTO ===================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_inventario_busqueda ON inventario (nombre, codigo, descripcion(100));
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha_tipo ON movimientos_inventario (fecha_movimiento, tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo_activa ON alertas_inventario (tipo_alerta, activa);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_inventario_valor ON inventario (precio_unitario, cantidad);
CREATE INDEX IF NOT EXISTS idx_inventario_categoria_sede ON inventario (categoria_id, sede_id);

-- =================== COMENTARIOS FINALES ===================
-- Este script crea una estructura completa para el manejo de inventario con:
-- 1. Gestión de productos con códigos únicos
-- 2. Categorización y proveedores
-- 3. Control de stock con alertas automáticas
-- 4. Historial completo de movimientos
-- 5. Transferencias entre sedes
-- 6. Alertas de vencimiento
-- 7. Vistas optimizadas para consultas
-- 8. Procedimientos para operaciones complejas
-- 9. Triggers para automatización
-- 10. Índices para rendimiento óptimo

SELECT 'Inventario expandido configurado exitosamente' as mensaje;
