-- Script para agregar tabla de logs de webhooks y campos adicionales
-- para mejorar el manejo de notificaciones de MercadoPago

-- Tabla para logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    datos JSONB,
    error_message TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Agregar campos adicionales a transacciones_mercadopago si no existen
ALTER TABLE transacciones_mercadopago 
ADD COLUMN IF NOT EXISTS status_detail VARCHAR(100),
ADD COLUMN IF NOT EXISTS notification_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_attempts INTEGER DEFAULT 0;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tipo ON webhook_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_fecha ON webhook_logs(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_transacciones_payment_id ON transacciones_mercadopago(payment_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_external_ref ON transacciones_mercadopago(external_reference);

-- Comentarios para documentación
COMMENT ON TABLE webhook_logs IS 'Logs de webhooks recibidos de MercadoPago y otros servicios';
COMMENT ON COLUMN transacciones_mercadopago.status_detail IS 'Detalle específico del estado del pago';
COMMENT ON COLUMN transacciones_mercadopago.notification_url IS 'URL de notificación configurada';
COMMENT ON COLUMN transacciones_mercadopago.webhook_attempts IS 'Número de intentos de webhook recibidos';

-- Insertar datos de prueba si no existen
INSERT INTO webhook_logs (tipo, datos, fecha_creacion) 
SELECT 'sistema_inicializado', '{"message": "Sistema de webhooks configurado"}', NOW()
WHERE NOT EXISTS (SELECT 1 FROM webhook_logs WHERE tipo = 'sistema_inicializado');

-- Mostrar información de las tablas
SELECT 'webhook_logs' as tabla, COUNT(*) as registros FROM webhook_logs
UNION ALL
SELECT 'transacciones_mercadopago', COUNT(*) FROM transacciones_mercadopago;
