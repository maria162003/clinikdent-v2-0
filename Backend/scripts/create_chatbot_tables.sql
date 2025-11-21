-- ============================================
-- TABLAS PARA CHATBOT Y WHATSAPP - CLINIKDENT
-- ============================================

-- Tabla para sesiones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    nombre_usuario VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telefono (telefono),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para interacciones del chatbot por WhatsApp
CREATE TABLE IF NOT EXISTS chat_whatsapp_interacciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100),
    telefono VARCHAR(20) NOT NULL,
    mensaje_usuario TEXT NOT NULL,
    respuesta_bot TEXT NOT NULL,
    intencion VARCHAR(50),
    mensaje_sid VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_telefono (telefono),
    INDEX idx_intencion (intencion),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para notificaciones de WhatsApp enviadas
CREATE TABLE IF NOT EXISTS notificaciones_whatsapp (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cita_id INT,
    telefono VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    mensaje_sid VARCHAR(50),
    tipo ENUM('recordatorio', 'confirmacion', 'cancelacion', 'general') DEFAULT 'general',
    estado ENUM('pendiente', 'enviado', 'entregado', 'leido', 'fallido') DEFAULT 'pendiente',
    error_mensaje TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    INDEX idx_cita (cita_id),
    INDEX idx_telefono (telefono),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para interacciones del chatbot web
CREATE TABLE IF NOT EXISTS chat_web_interacciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id VARCHAR(100),
    user_id INT,
    mensaje_usuario TEXT NOT NULL,
    respuesta_bot TEXT NOT NULL,
    intencion VARCHAR(50),
    datos_adicionales JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    INDEX idx_user (user_id),
    INDEX idx_intencion (intencion),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para estadísticas del chatbot
CREATE TABLE IF NOT EXISTS chatbot_estadisticas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL,
    canal ENUM('web', 'whatsapp') NOT NULL,
    total_mensajes INT DEFAULT 0,
    mensajes_exitosos INT DEFAULT 0,
    mensajes_fallidos INT DEFAULT 0,
    tiempo_respuesta_promedio DECIMAL(10,2),
    intenciones_detectadas JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fecha_canal (fecha, canal),
    INDEX idx_fecha (fecha),
    INDEX idx_canal (canal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista para análisis de conversaciones
CREATE OR REPLACE VIEW v_chatbot_analytics AS
SELECT 
    DATE(created_at) as fecha,
    'web' as canal,
    COUNT(*) as total_interacciones,
    COUNT(DISTINCT conversation_id) as conversaciones_unicas,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    intencion,
    COUNT(*) as veces_detectada
FROM chat_web_interacciones
GROUP BY DATE(created_at), intencion

UNION ALL

SELECT 
    DATE(created_at) as fecha,
    'whatsapp' as canal,
    COUNT(*) as total_interacciones,
    COUNT(DISTINCT session_id) as conversaciones_unicas,
    COUNT(DISTINCT telefono) as usuarios_unicos,
    intencion,
    COUNT(*) as veces_detectada
FROM chat_whatsapp_interacciones
GROUP BY DATE(created_at), intencion;

-- Procedimiento para limpiar datos antiguos (opcional)
DELIMITER //
CREATE PROCEDURE sp_limpiar_chatbot_antiguo()
BEGIN
    -- Eliminar interacciones de más de 90 días
    DELETE FROM chat_web_interacciones 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    DELETE FROM chat_whatsapp_interacciones 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Eliminar sesiones inactivas de más de 30 días
    DELETE FROM whatsapp_sessions 
    WHERE last_activity < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SELECT 'Limpieza completada' as resultado;
END //
DELIMITER ;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

ALTER TABLE whatsapp_sessions 
COMMENT = 'Sesiones de conversación por WhatsApp';

ALTER TABLE chat_whatsapp_interacciones 
COMMENT = 'Registro de todas las interacciones del chatbot por WhatsApp';

ALTER TABLE notificaciones_whatsapp 
COMMENT = 'Log de notificaciones enviadas por WhatsApp (recordatorios, confirmaciones, etc)';

ALTER TABLE chat_web_interacciones 
COMMENT = 'Registro de todas las interacciones del chatbot web';

ALTER TABLE chatbot_estadisticas 
COMMENT = 'Estadísticas diarias del chatbot por canal';

-- ============================================
-- DATOS INICIALES DE EJEMPLO (OPCIONAL)
-- ============================================

-- Insertar estadísticas del día actual
INSERT INTO chatbot_estadisticas (fecha, canal, total_mensajes, mensajes_exitosos)
VALUES 
    (CURDATE(), 'web', 0, 0),
    (CURDATE(), 'whatsapp', 0, 0)
ON DUPLICATE KEY UPDATE total_mensajes = total_mensajes;

COMMIT;
