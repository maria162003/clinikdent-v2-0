-- Crear tabla de movimientos de inventario para PostgreSQL
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'transferencia', 'eliminacion')) NOT NULL,
    cantidad INTEGER NOT NULL,
    motivo VARCHAR(255),
    sede_origen_id INTEGER DEFAULT NULL,
    sede_destino_id INTEGER DEFAULT NULL,
    usuario_id INTEGER NOT NULL,
    stock_anterior INTEGER DEFAULT NULL,
    stock_nuevo INTEGER DEFAULT NULL,
    costo_unitario DECIMAL(15,2) DEFAULT NULL,
    numero_documento VARCHAR(100) DEFAULT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    producto_nombre VARCHAR(255),
    usuario_nombre VARCHAR(255),
    sede_nombre VARCHAR(255)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario (producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_inventario (tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario (fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos_inventario (usuario_id);

-- Insertar datos de prueba
INSERT INTO movimientos_inventario (
    producto_id, tipo_movimiento, cantidad, motivo, usuario_id, 
    stock_anterior, stock_nuevo, fecha_movimiento, observaciones,
    producto_nombre, usuario_nombre, sede_nombre
) VALUES 
(1, 'entrada', 5, 'Compra inicial', 1, 0, 5, CURRENT_TIMESTAMP, 'Stock inicial del producto', 'Sillón Dental Premium', 'Admin Sistema', 'Sede Principal'),
(2, 'salida', 1, 'Mantenimiento', 1, 3, 2, CURRENT_TIMESTAMP - INTERVAL '1 day', 'Enviado a reparación', 'Lámpara LED', 'Dr. García', 'Sede Principal'),
(3, 'entrada', 10, 'Restock', 1, 5, 15, CURRENT_TIMESTAMP - INTERVAL '2 days', 'Reposición de stock mensual', 'Guantes de Látex', 'Admin Sistema', 'Sede Norte'),
(4, 'salida', 3, 'Uso consulta', 2, 15, 12, CURRENT_TIMESTAMP - INTERVAL '3 days', 'Utilizados en consulta regular', 'Guantes de Látex', 'Dra. López', 'Sede Norte'),
(1, 'ajuste', -1, 'Corrección inventario', 1, 5, 4, CURRENT_TIMESTAMP - INTERVAL '4 days', 'Ajuste por discrepancia en conteo', 'Sillón Dental Premium', 'Admin Sistema', 'Sede Principal');

-- Verificar datos insertados
SELECT 'Movimientos insertados:' as info, COUNT(*) as total FROM movimientos_inventario;
