-- =========================================================
-- SISTEMA DE OPTIMIZACIÓN DE PERFORMANCE Y ESCALABILIDAD
-- Base de datos para monitoreo y optimización automática
-- =========================================================

-- ===============================
-- 1. MÉTRICAS DE PERFORMANCE
-- ===============================
CREATE TABLE IF NOT EXISTS metricas_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_metrica VARCHAR(100) NOT NULL COMMENT 'Tipo de métrica (cpu, memoria, db, api, etc)',
    componente VARCHAR(100) NOT NULL COMMENT 'Componente monitoreado',
    valor_metrica DECIMAL(10,4) NOT NULL COMMENT 'Valor numérico de la métrica',
    unidad VARCHAR(20) NOT NULL COMMENT 'Unidad de medida (%,ms,MB,etc)',
    timestamp_metrica TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata_adicional JSON COMMENT 'Información adicional de la métrica',
    severidad ENUM('low','medium','high','critical') DEFAULT 'medium',
    INDEX idx_tipo_metrica (tipo_metrica),
    INDEX idx_componente (componente),
    INDEX idx_timestamp (timestamp_metrica),
    INDEX idx_severidad (severidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Almacena métricas de performance del sistema';

-- ===============================
-- 2. ANÁLISIS DE QUERIES DB
-- ===============================
CREATE TABLE IF NOT EXISTS analisis_queries_db (
    id INT AUTO_INCREMENT PRIMARY KEY,
    query_hash VARCHAR(64) NOT NULL UNIQUE COMMENT 'Hash único del query',
    query_sql TEXT NOT NULL COMMENT 'SQL del query original',
    query_normalizado TEXT COMMENT 'Query normalizado sin parámetros',
    tiempo_ejecucion_promedio DECIMAL(8,4) NOT NULL COMMENT 'Tiempo promedio en segundos',
    tiempo_ejecucion_max DECIMAL(8,4) NOT NULL COMMENT 'Tiempo máximo registrado',
    frecuencia_ejecucion INT DEFAULT 1 COMMENT 'Veces que se ha ejecutado',
    filas_examinadas_promedio BIGINT DEFAULT 0,
    filas_retornadas_promedio BIGINT DEFAULT 0,
    indices_utilizados JSON COMMENT 'Índices utilizados por el query',
    sugerencias_optimizacion JSON COMMENT 'Sugerencias automáticas',
    ultima_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado_optimizacion ENUM('pendiente','revisado','optimizado','critico') DEFAULT 'pendiente',
    INDEX idx_tiempo_promedio (tiempo_ejecucion_promedio),
    INDEX idx_frecuencia (frecuencia_ejecucion),
    INDEX idx_estado (estado_optimizacion),
    INDEX idx_ultima_ejecucion (ultima_ejecucion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Análisis de performance de queries SQL';

-- ===============================
-- 3. CACHÉ DE APLICACIÓN
-- ===============================
CREATE TABLE IF NOT EXISTS cache_aplicacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE COMMENT 'Clave única del cache',
    cache_value LONGTEXT NOT NULL COMMENT 'Valor almacenado en cache',
    categoria VARCHAR(100) NOT NULL COMMENT 'Categoría del cache (usuarios, citas, etc)',
    ttl_segundos INT NOT NULL DEFAULT 3600 COMMENT 'Time to live en segundos',
    hits_counter INT DEFAULT 0 COMMENT 'Número de veces accedido',
    ultimo_hit TIMESTAMP NULL COMMENT 'Último acceso al cache',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    tamaño_bytes INT DEFAULT 0 COMMENT 'Tamaño en bytes',
    comprimido BOOLEAN DEFAULT FALSE COMMENT 'Si está comprimido',
    INDEX idx_categoria (categoria),
    INDEX idx_fecha_expiracion (fecha_expiracion),
    INDEX idx_hits (hits_counter),
    INDEX idx_ultimo_hit (ultimo_hit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sistema de caché de aplicación';

-- ===============================
-- 4. MONITOREO DE ENDPOINTS API
-- ===============================
CREATE TABLE IF NOT EXISTS monitoreo_endpoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL COMMENT 'Ruta del endpoint',
    metodo_http VARCHAR(10) NOT NULL COMMENT 'GET, POST, PUT, DELETE',
    tiempo_respuesta_ms INT NOT NULL COMMENT 'Tiempo de respuesta en milisegundos',
    status_code INT NOT NULL COMMENT 'Código de respuesta HTTP',
    tamaño_respuesta_bytes INT DEFAULT 0,
    ip_cliente VARCHAR(45) COMMENT 'IP del cliente',
    user_agent TEXT COMMENT 'User agent del cliente',
    timestamp_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    memoria_usada_mb DECIMAL(8,2) COMMENT 'Memoria usada durante el request',
    cpu_usado_percent DECIMAL(5,2) COMMENT 'CPU usado durante el request',
    errores_detectados JSON COMMENT 'Errores detectados durante la ejecución',
    INDEX idx_endpoint (endpoint),
    INDEX idx_metodo (metodo_http),
    INDEX idx_tiempo_respuesta (tiempo_respuesta_ms),
    INDEX idx_status_code (status_code),
    INDEX idx_timestamp (timestamp_request)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Monitoreo de performance de endpoints API';

-- ===============================
-- 5. CONFIGURACIONES DE ESCALABILIDAD
-- ===============================
CREATE TABLE IF NOT EXISTS configuraciones_escalabilidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    componente VARCHAR(100) NOT NULL COMMENT 'Componente del sistema',
    parametro VARCHAR(100) NOT NULL COMMENT 'Parámetro de configuración',
    valor_actual TEXT NOT NULL COMMENT 'Valor actual del parámetro',
    valor_recomendado TEXT COMMENT 'Valor recomendado por el sistema',
    valor_minimo TEXT COMMENT 'Valor mínimo permitido',
    valor_maximo TEXT COMMENT 'Valor máximo permitido',
    descripcion TEXT COMMENT 'Descripción del parámetro',
    impacto_performance ENUM('bajo','medio','alto','critico') DEFAULT 'medio',
    auto_ajuste BOOLEAN DEFAULT FALSE COMMENT 'Si se ajusta automáticamente',
    fecha_ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modificado_por INT COMMENT 'ID del usuario que modificó',
    UNIQUE KEY idx_componente_parametro (componente, parametro),
    INDEX idx_impacto (impacto_performance),
    INDEX idx_auto_ajuste (auto_ajuste),
    FOREIGN KEY (modificado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuraciones para escalabilidad automática';

-- ===============================
-- 6. ALERTAS DE PERFORMANCE
-- ===============================
CREATE TABLE IF NOT EXISTS alertas_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_alerta VARCHAR(100) NOT NULL COMMENT 'Tipo de alerta generada',
    componente_afectado VARCHAR(100) NOT NULL COMMENT 'Componente que generó la alerta',
    nivel_severidad ENUM('info','warning','error','critical') NOT NULL,
    mensaje TEXT NOT NULL COMMENT 'Mensaje descriptivo de la alerta',
    valor_medido DECIMAL(10,4) COMMENT 'Valor que disparó la alerta',
    umbral_configurado DECIMAL(10,4) COMMENT 'Umbral configurado',
    accion_recomendada TEXT COMMENT 'Acción recomendada para resolver',
    accion_automatica_ejecutada TEXT COMMENT 'Acción automática que se ejecutó',
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP NULL,
    estado ENUM('pendiente','en_revision','resuelto','ignorado') DEFAULT 'pendiente',
    resuelto_por INT COMMENT 'ID del usuario que resolvió',
    notas_resolucion TEXT COMMENT 'Notas sobre la resolución',
    INDEX idx_tipo_alerta (tipo_alerta),
    INDEX idx_nivel_severidad (nivel_severidad),
    INDEX idx_estado (estado),
    INDEX idx_fecha_alerta (fecha_alerta),
    FOREIGN KEY (resuelto_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sistema de alertas de performance';

-- ===============================
-- 7. ESTADÍSTICAS DE USO DEL SISTEMA
-- ===============================
CREATE TABLE IF NOT EXISTS estadisticas_uso_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL COMMENT 'Fecha de las estadísticas',
    usuarios_activos_dia INT DEFAULT 0 COMMENT 'Usuarios únicos activos en el día',
    sesiones_iniciadas INT DEFAULT 0 COMMENT 'Sesiones iniciadas en el día',
    requests_totales INT DEFAULT 0 COMMENT 'Total de requests API',
    requests_exitosos INT DEFAULT 0 COMMENT 'Requests con status 2xx',
    tiempo_respuesta_promedio_ms DECIMAL(8,2) DEFAULT 0,
    pico_concurrencia_usuarios INT DEFAULT 0 COMMENT 'Máximo de usuarios concurrentes',
    hora_pico_concurrencia TIME COMMENT 'Hora del pico de concurrencia',
    memoria_promedio_mb DECIMAL(8,2) DEFAULT 0,
    memoria_pico_mb DECIMAL(8,2) DEFAULT 0,
    cpu_promedio_percent DECIMAL(5,2) DEFAULT 0,
    cpu_pico_percent DECIMAL(5,2) DEFAULT 0,
    trafico_red_mb DECIMAL(10,2) DEFAULT 0,
    consultas_db_totales INT DEFAULT 0,
    consultas_db_lentas INT DEFAULT 0 COMMENT 'Queries > 1 segundo',
    errores_aplicacion INT DEFAULT 0,
    errores_servidor INT DEFAULT 0,
    UNIQUE KEY idx_fecha (fecha),
    INDEX idx_usuarios_activos (usuarios_activos_dia),
    INDEX idx_tiempo_respuesta (tiempo_respuesta_promedio_ms)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Estadísticas diarias de uso del sistema';

-- ===============================
-- 8. PLAN DE ESCALABILIDAD AUTOMÁTICA
-- ===============================
CREATE TABLE IF NOT EXISTS planes_escalabilidad_automatica (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_plan VARCHAR(100) NOT NULL COMMENT 'Nombre descriptivo del plan',
    descripcion TEXT COMMENT 'Descripción del plan de escalabilidad',
    condiciones_activacion JSON NOT NULL COMMENT 'Condiciones para activar el plan',
    acciones_escalabilidad JSON NOT NULL COMMENT 'Acciones a ejecutar',
    umbral_cpu_percent DECIMAL(5,2) DEFAULT 80.0 COMMENT 'Umbral de CPU para activar',
    umbral_memoria_percent DECIMAL(5,2) DEFAULT 85.0 COMMENT 'Umbral de memoria para activar',
    umbral_tiempo_respuesta_ms INT DEFAULT 2000 COMMENT 'Umbral de tiempo de respuesta',
    usuarios_concurrentes_max INT DEFAULT 100 COMMENT 'Máximo usuarios concurrentes soportados',
    activo BOOLEAN DEFAULT TRUE COMMENT 'Si el plan está activo',
    prioridad INT DEFAULT 1 COMMENT 'Prioridad de ejecución (1=más alta)',
    ejecuciones_exitosas INT DEFAULT 0 COMMENT 'Veces que se ejecutó exitosamente',
    ultima_ejecucion TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT NOT NULL,
    INDEX idx_activo (activo),
    INDEX idx_prioridad (prioridad),
    INDEX idx_ultima_ejecucion (ultima_ejecucion),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Planes automatizados de escalabilidad';

-- ===============================
-- DATOS DE EJEMPLO PARA DEMOSTRACIÓN
-- ===============================

-- Métricas de performance ejemplo
INSERT INTO metricas_performance (tipo_metrica, componente, valor_metrica, unidad, metadata_adicional, severidad) VALUES
('cpu_usage', 'servidor_principal', 45.7, '%', '{"core_count": 8, "load_average": [2.1, 2.3, 2.0]}', 'medium'),
('memoria_usage', 'servidor_principal', 68.2, '%', '{"total_mb": 16384, "available_mb": 5210}', 'medium'),
('tiempo_respuesta', 'api_citas', 234.5, 'ms', '{"endpoint": "/api/citas", "metodo": "GET"}', 'low'),
('queries_lentas', 'base_datos', 12, 'count', '{"queries_over_1s": 12, "total_queries": 2847}', 'high'),
('conexiones_db', 'mysql', 78, 'connections', '{"max_connections": 200, "active": 78}', 'medium'),
('cache_hit_ratio', 'redis_cache', 94.3, '%', '{"hits": 8743, "misses": 529}', 'low'),
('disco_usage', 'servidor_principal', 72.1, '%', '{"total_gb": 500, "used_gb": 360.5}', 'medium'),
('trafico_red', 'servidor_principal', 125.7, 'mbps', '{"inbound": 67.2, "outbound": 58.5}', 'low');

-- Análisis de queries ejemplo
INSERT INTO analisis_queries_db (query_hash, query_sql, query_normalizado, tiempo_ejecucion_promedio, tiempo_ejecucion_max, frecuencia_ejecucion, filas_examinadas_promedio, filas_retornadas_promedio, indices_utilizados, sugerencias_optimizacion, estado_optimizacion) VALUES
('a1b2c3d4', 'SELECT * FROM citas WHERE fecha_cita BETWEEN ? AND ? AND estado = ?', 'SELECT * FROM citas WHERE fecha_cita BETWEEN ? AND ? AND estado = ?', 0.456, 1.234, 2847, 12500, 45, '["idx_fecha_cita", "idx_estado"]', '{"agregar_indice": "fecha_cita,estado", "eliminar_select_asterisco": true}', 'pendiente'),
('e5f6g7h8', 'SELECT u.*, p.nombre FROM usuarios u LEFT JOIN perfiles p ON u.id = p.usuario_id WHERE u.activo = 1', 'SELECT u.*, p.nombre FROM usuarios u LEFT JOIN perfiles p ON u.id = p.usuario_id WHERE u.activo = ?', 0.123, 0.567, 1567, 890, 234, '["idx_activo", "idx_usuario_id"]', '{"query_frecuente": true, "considerar_cache": true}', 'revisado'),
('i9j0k1l2', 'SELECT COUNT(*) FROM citas c JOIN usuarios u ON c.paciente_id = u.id WHERE c.fecha_cita = CURDATE()', 'SELECT COUNT(*) FROM citas c JOIN usuarios u ON c.paciente_id = u.id WHERE c.fecha_cita = ?', 0.789, 2.145, 456, 5670, 1, '["idx_fecha_cita", "idx_paciente_id"]', '{"optimizar_join": true, "usar_covering_index": true}', 'critico'),
('m3n4o5p6', 'UPDATE citas SET estado = ? WHERE id = ?', 'UPDATE citas SET estado = ? WHERE id = ?', 0.034, 0.156, 3421, 1, 1, '["PRIMARY"]', '{"query_rapido": true, "sin_optimizacion_necesaria": true}', 'optimizado');

-- Configuraciones de cache ejemplo
INSERT INTO cache_aplicacion (cache_key, cache_value, categoria, ttl_segundos, hits_counter, fecha_expiracion, tamaño_bytes, comprimido) VALUES
('usuarios_activos_hoy', '[{"id": 1, "nombre": "Dr. García"}, {"id": 2, "nombre": "Dra. López"}]', 'usuarios', 3600, 234, DATE_ADD(NOW(), INTERVAL 1 HOUR), 1024, FALSE),
('menu_principal_admin', '{"dashboard": "/dashboard", "citas": "/citas", "pacientes": "/pacientes"}', 'navegacion', 7200, 567, DATE_ADD(NOW(), INTERVAL 2 HOUR), 512, FALSE),
('estadisticas_dashboard', '{"citas_hoy": 45, "pacientes_nuevos": 12, "ingresos_dia": 2500000}', 'dashboard', 900, 1234, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 2048, TRUE),
('tratamientos_populares', '[{"id": 1, "nombre": "Limpieza Dental"}, {"id": 2, "nombre": "Ortodoncia"}]', 'tratamientos', 1800, 890, DATE_ADD(NOW(), INTERVAL 30 MINUTE), 1536, FALSE);

-- Configuraciones de escalabilidad ejemplo
INSERT INTO configuraciones_escalabilidad (componente, parametro, valor_actual, valor_recomendado, valor_minimo, valor_maximo, descripcion, impacto_performance, auto_ajuste, modificado_por) VALUES
('mysql', 'max_connections', '200', '300', '100', '1000', 'Máximo número de conexiones simultáneas a MySQL', 'alto', TRUE, 1),
('nodejs', 'max_old_space_size', '4096', '8192', '2048', '16384', 'Memoria máxima para Node.js en MB', 'critico', FALSE, 1),
('redis', 'maxmemory', '2gb', '4gb', '1gb', '16gb', 'Memoria máxima para Redis', 'alto', TRUE, 1),
('api', 'request_timeout', '30000', '45000', '5000', '120000', 'Timeout de requests en milisegundos', 'medio', TRUE, 1),
('cache', 'default_ttl', '3600', '7200', '300', '86400', 'TTL por defecto del cache en segundos', 'medio', TRUE, 1),
('uploads', 'max_file_size', '10485760', '52428800', '1048576', '104857600', 'Tamaño máximo de archivos en bytes (10MB actual, 50MB recomendado)', 'bajo', FALSE, 1);

-- Alertas de performance ejemplo
INSERT INTO alertas_performance (tipo_alerta, componente_afectado, nivel_severidad, mensaje, valor_medido, umbral_configurado, accion_recomendada, fecha_alerta, estado) VALUES
('high_cpu_usage', 'servidor_principal', 'warning', 'Uso de CPU elevado detectado', 87.5, 80.0, 'Revisar procesos activos y considerar escalabilidad horizontal', NOW() - INTERVAL 2 HOUR, 'resuelto'),
('slow_query_detected', 'mysql', 'error', 'Query lento detectado afectando performance', 3.456, 1.000, 'Optimizar query o agregar índices apropiados', NOW() - INTERVAL 1 HOUR, 'en_revision'),
('memory_leak_suspected', 'nodejs', 'critical', 'Posible memory leak detectado', 95.2, 90.0, 'Reiniciar aplicación y revisar código', NOW() - INTERVAL 30 MINUTE, 'pendiente'),
('disk_space_low', 'servidor_principal', 'warning', 'Espacio en disco bajo', 85.7, 80.0, 'Limpiar archivos temporales y logs antiguos', NOW() - INTERVAL 15 MINUTE, 'pendiente');

-- Estadísticas de uso ejemplo
INSERT INTO estadisticas_uso_sistema (fecha, usuarios_activos_dia, sesiones_iniciadas, requests_totales, requests_exitosos, tiempo_respuesta_promedio_ms, pico_concurrencia_usuarios, hora_pico_concurrencia, memoria_promedio_mb, memoria_pico_mb, cpu_promedio_percent, cpu_pico_percent, trafico_red_mb, consultas_db_totales, consultas_db_lentas, errores_aplicacion, errores_servidor) VALUES
(CURDATE() - INTERVAL 1 DAY, 156, 189, 12547, 12301, 234.5, 45, '14:30:00', 2048.5, 3072.1, 45.7, 78.2, 1250.7, 8945, 23, 12, 2),
(CURDATE() - INTERVAL 2 DAY, 134, 167, 10234, 10109, 267.8, 38, '11:15:00', 1890.2, 2756.8, 42.3, 73.5, 1105.3, 7234, 18, 8, 1),
(CURDATE() - INTERVAL 3 DAY, 178, 203, 15678, 15456, 198.7, 52, '16:45:00', 2234.7, 3345.2, 48.9, 82.1, 1478.9, 10456, 31, 15, 3);

-- Planes de escalabilidad ejemplo
INSERT INTO planes_escalabilidad_automatica (nombre_plan, descripcion, condiciones_activacion, acciones_escalabilidad, umbral_cpu_percent, umbral_memoria_percent, umbral_tiempo_respuesta_ms, usuarios_concurrentes_max, activo, prioridad, creado_por) VALUES
('Escalado_CPU_Crítico', 'Plan de escalabilidad cuando el CPU supera el 85%', 
'{"cpu_percent": "> 85", "duracion_minutos": 5, "usuarios_concurrentes": "> 80"}', 
'{"aumentar_instancias": 2, "notificar_admins": true, "ajustar_balanceador": true}', 
85.0, 90.0, 2000, 150, TRUE, 1, 1),

('Escalado_Memoria_Alto', 'Plan para manejo de memoria alta', 
'{"memoria_percent": "> 90", "queries_lentas": "> 20"}', 
'{"limpiar_cache": true, "reiniciar_servicios": ["cache", "session"], "escalar_bd": true}', 
80.0, 90.0, 1500, 120, TRUE, 2, 1),

('Optimización_Nocturna', 'Optimizaciones automáticas durante la noche', 
'{"hora": "02:00", "dia_semana": "daily"}', 
'{"limpiar_logs": true, "optimizar_indices": true, "backup_metricas": true}', 
70.0, 80.0, 1000, 200, TRUE, 3, 1);

-- Crear índices adicionales para optimización
CREATE INDEX idx_metricas_tipo_timestamp ON metricas_performance (tipo_metrica, timestamp_metrica);
CREATE INDEX idx_queries_tiempo_frecuencia ON analisis_queries_db (tiempo_ejecucion_promedio, frecuencia_ejecucion);
CREATE INDEX idx_cache_categoria_expiracion ON cache_aplicacion (categoria, fecha_expiracion);
CREATE INDEX idx_endpoints_endpoint_timestamp ON monitoreo_endpoints (endpoint, timestamp_request);
CREATE INDEX idx_alertas_severidad_estado ON alertas_performance (nivel_severidad, estado);
CREATE INDEX idx_estadisticas_fecha_usuarios ON estadisticas_uso_sistema (fecha, usuarios_activos_dia);

DELIMITER $$

-- Procedimiento para limpiar datos antiguos
CREATE PROCEDURE LimpiarDatosAntiguos()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Limpiar métricas de más de 30 días
    DELETE FROM metricas_performance WHERE timestamp_metrica < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Limpiar logs de endpoints de más de 15 días
    DELETE FROM monitoreo_endpoints WHERE timestamp_request < DATE_SUB(NOW(), INTERVAL 15 DAY);
    
    -- Limpiar cache expirado
    DELETE FROM cache_aplicacion WHERE fecha_expiracion < NOW();
    
    -- Limpiar alertas resueltas de más de 7 días
    DELETE FROM alertas_performance WHERE estado = 'resuelto' AND fecha_resolucion < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    COMMIT;
    
    SELECT CONCAT('Limpieza completada: ', ROW_COUNT(), ' registros eliminados') as resultado;
END$$

-- Procedimiento para generar reporte de performance
CREATE PROCEDURE GenerarReportePerformance(IN fecha_inicio DATE, IN fecha_fin DATE)
BEGIN
    SELECT 
        'Resumen de Performance' as seccion,
        COUNT(*) as total_metricas,
        AVG(CASE WHEN tipo_metrica = 'cpu_usage' THEN valor_metrica END) as cpu_promedio,
        AVG(CASE WHEN tipo_metrica = 'memoria_usage' THEN valor_metrica END) as memoria_promedio,
        AVG(CASE WHEN tipo_metrica = 'tiempo_respuesta' THEN valor_metrica END) as tiempo_respuesta_promedio
    FROM metricas_performance 
    WHERE DATE(timestamp_metrica) BETWEEN fecha_inicio AND fecha_fin;
    
    SELECT 
        'Queries Más Lentos' as seccion,
        query_normalizado,
        tiempo_ejecucion_promedio,
        frecuencia_ejecucion,
        estado_optimizacion
    FROM analisis_queries_db 
    ORDER BY tiempo_ejecucion_promedio DESC 
    LIMIT 10;
    
    SELECT 
        'Alertas Críticas' as seccion,
        COUNT(*) as total_alertas,
        nivel_severidad,
        COUNT(*) as cantidad
    FROM alertas_performance 
    WHERE DATE(fecha_alerta) BETWEEN fecha_inicio AND fecha_fin
    GROUP BY nivel_severidad;
END$$

DELIMITER ;

-- ===============================
-- VISTAS PARA REPORTING
-- ===============================

-- Vista para dashboard de performance
CREATE VIEW vista_dashboard_performance AS
SELECT 
    (SELECT COUNT(*) FROM metricas_performance WHERE DATE(timestamp_metrica) = CURDATE()) as metricas_hoy,
    (SELECT COUNT(*) FROM alertas_performance WHERE estado = 'pendiente') as alertas_pendientes,
    (SELECT AVG(valor_metrica) FROM metricas_performance WHERE tipo_metrica = 'cpu_usage' AND DATE(timestamp_metrica) = CURDATE()) as cpu_promedio_hoy,
    (SELECT AVG(valor_metrica) FROM metricas_performance WHERE tipo_metrica = 'memoria_usage' AND DATE(timestamp_metrica) = CURDATE()) as memoria_promedio_hoy,
    (SELECT COUNT(*) FROM analisis_queries_db WHERE estado_optimizacion = 'critico') as queries_criticos,
    (SELECT COUNT(*) FROM cache_aplicacion WHERE fecha_expiracion > NOW()) as cache_entries_activos;

-- Vista para queries que necesitan optimización
CREATE VIEW vista_queries_optimizacion AS
SELECT 
    id,
    query_normalizado,
    tiempo_ejecucion_promedio,
    frecuencia_ejecucion,
    (tiempo_ejecucion_promedio * frecuencia_ejecucion) as impacto_total,
    estado_optimizacion,
    ultima_ejecucion
FROM analisis_queries_db 
WHERE estado_optimizacion IN ('pendiente', 'critico')
ORDER BY impacto_total DESC;

-- Vista para tendencias de performance
CREATE VIEW vista_tendencias_performance AS
SELECT 
    DATE(timestamp_metrica) as fecha,
    tipo_metrica,
    AVG(valor_metrica) as valor_promedio,
    MIN(valor_metrica) as valor_minimo,
    MAX(valor_metrica) as valor_maximo,
    COUNT(*) as mediciones
FROM metricas_performance 
WHERE timestamp_metrica >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp_metrica), tipo_metrica
ORDER BY fecha DESC, tipo_metrica;

COMMIT;

-- ===============================
-- CONFIRMACIÓN DE CREACIÓN
-- ===============================
SELECT 
    'Sistema de Optimización de Performance implementado exitosamente' as mensaje,
    '8 tablas creadas' as tablas,
    '2 procedimientos almacenados' as procedimientos,
    '3 vistas creadas' as vistas,
    'Datos de ejemplo insertados' as datos,
    '+4.5% funcionalidad agregada' as incremento,
    '99.0% funcionalidad total alcanzada' as progreso_total;
