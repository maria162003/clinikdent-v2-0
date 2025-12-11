-- ==========================================
-- SISTEMA DE REPORTES Y ANALYTICS AVANZADOS
-- Extensión +5% hacia funcionalidad 99%
-- ==========================================

USE clinikdent;

-- Tabla para métricas del sistema
CREATE TABLE IF NOT EXISTS metricas_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    tipo_metrica ENUM('pacientes_activos', 'citas_completadas', 'ingresos_diarios', 'tratamientos_realizados', 'satisfaccion_promedio') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha_tipo (fecha, tipo_metrica)
) ENGINE=InnoDB;

-- Tabla para reportes programados
CREATE TABLE IF NOT EXISTS reportes_programados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo_reporte ENUM('financiero', 'operacional', 'satisfaccion', 'inventario', 'personalizado') NOT NULL,
    frecuencia ENUM('diario', 'semanal', 'mensual', 'trimestral') NOT NULL,
    parametros JSON,
    destinatarios JSON, -- Array de emails
    ultima_ejecucion TIMESTAMP NULL,
    proxima_ejecucion TIMESTAMP NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Tabla para almacenar reportes generados
CREATE TABLE IF NOT EXISTS historial_reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporte_programado_id INT,
    titulo VARCHAR(200) NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL,
    parametros JSON,
    datos_reporte JSON,
    archivo_path VARCHAR(500),
    estado ENUM('generando', 'completado', 'error') DEFAULT 'generando',
    error_mensaje TEXT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generado_por INT,
    FOREIGN KEY (reporte_programado_id) REFERENCES reportes_programados(id) ON DELETE SET NULL,
    FOREIGN KEY (generado_por) REFERENCES usuarios(id),
    INDEX idx_fecha_tipo (fecha_generacion, tipo_reporte)
) ENGINE=InnoDB;

-- Tabla para dashboard personalizable
CREATE TABLE IF NOT EXISTS dashboards_personalizados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    configuracion JSON NOT NULL, -- Layout y widgets
    es_publico BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_publico (usuario_id, es_publico)
) ENGINE=InnoDB;

-- Tabla para KPIs personalizados
CREATE TABLE IF NOT EXISTS kpis_personalizados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    formula JSON NOT NULL, -- Definición de la fórmula del KPI
    unidad VARCHAR(20), -- %, $, unidades, etc.
    meta_minima DECIMAL(10,2),
    meta_maxima DECIMAL(10,2),
    color_config JSON, -- Configuración de colores para rangos
    activo BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ==========================================
-- DATOS INICIALES Y CONFIGURACIONES
-- ==========================================

-- Insertar métricas base para los últimos 30 días
INSERT INTO metricas_sistema (fecha, tipo_metrica, valor, metadata) VALUES
-- Pacientes activos por día
('2025-07-26', 'pacientes_activos', 145.00, '{"nuevos": 3, "reactivados": 2}'),
('2025-07-27', 'pacientes_activos', 148.00, '{"nuevos": 4, "reactivados": 1}'),
('2025-07-28', 'pacientes_activos', 152.00, '{"nuevos": 5, "reactivados": 1}'),
('2025-07-29', 'pacientes_activos', 149.00, '{"nuevos": 2, "reactivados": 0}'),
('2025-07-30', 'pacientes_activos', 155.00, '{"nuevos": 6, "reactivados": 0}'),
('2025-08-01', 'pacientes_activos', 158.00, '{"nuevos": 4, "reactivados": 1}'),
('2025-08-02', 'pacientes_activos', 162.00, '{"nuevos": 5, "reactivados": 1}'),
('2025-08-03', 'pacientes_activos', 165.00, '{"nuevos": 3, "reactivados": 0}'),
('2025-08-04', 'pacientes_activos', 168.00, '{"nuevos": 4, "reactivados": 1}'),
('2025-08-05', 'pacientes_activos', 171.00, '{"nuevos": 5, "reactivados": 2}'),

-- Citas completadas por día
('2025-07-26', 'citas_completadas', 28.00, '{"programadas": 32, "canceladas": 4}'),
('2025-07-27', 'citas_completadas', 31.00, '{"programadas": 35, "canceladas": 3}'),
('2025-07-28', 'citas_completadas', 25.00, '{"programadas": 28, "canceladas": 2}'),
('2025-07-29', 'citas_completadas', 33.00, '{"programadas": 36, "canceladas": 3}'),
('2025-07-30', 'citas_completadas', 29.00, '{"programadas": 31, "canceladas": 2}'),
('2025-08-01', 'citas_completadas', 35.00, '{"programadas": 38, "canceladas": 3}'),
('2025-08-02', 'citas_completadas', 32.00, '{"programadas": 35, "canceladas": 2}'),
('2025-08-03', 'citas_completadas', 28.00, '{"programadas": 30, "canceladas": 1}'),
('2025-08-04', 'citas_completadas', 36.00, '{"programadas": 39, "canceladas": 3}'),
('2025-08-05', 'citas_completadas', 34.00, '{"programadas": 37, "canceladas": 2}'),

-- Ingresos diarios
('2025-07-26', 'ingresos_diarios', 2450000.00, '{"efectivo": 800000, "tarjeta": 1650000}'),
('2025-07-27', 'ingresos_diarios', 2780000.00, '{"efectivo": 920000, "tarjeta": 1860000}'),
('2025-07-28', 'ingresos_diarios', 2200000.00, '{"efectivo": 650000, "tarjeta": 1550000}'),
('2025-07-29', 'ingresos_diarios', 3100000.00, '{"efectivo": 1100000, "tarjeta": 2000000}'),
('2025-07-30', 'ingresos_diarios', 2650000.00, '{"efectivo": 850000, "tarjeta": 1800000}'),
('2025-08-01', 'ingresos_diarios', 3300000.00, '{"efectivo": 1200000, "tarjeta": 2100000}'),
('2025-08-02', 'ingresos_diarios', 2900000.00, '{"efectivo": 950000, "tarjeta": 1950000}'),
('2025-08-03', 'ingresos_diarios', 2550000.00, '{"efectivo": 800000, "tarjeta": 1750000}'),
('2025-08-04', 'ingresos_diarios', 3450000.00, '{"efectivo": 1300000, "tarjeta": 2150000}'),
('2025-08-05', 'ingresos_diarios', 3100000.00, '{"efectivo": 1050000, "tarjeta": 2050000}'),

-- Satisfacción promedio
('2025-07-26', 'satisfaccion_promedio', 4.3, '{"total_evaluaciones": 18, "distribucion": {"5": 8, "4": 7, "3": 3}}'),
('2025-07-27', 'satisfaccion_promedio', 4.5, '{"total_evaluaciones": 22, "distribucion": {"5": 12, "4": 8, "3": 2}}'),
('2025-07-28', 'satisfaccion_promedio', 4.2, '{"total_evaluaciones": 15, "distribucion": {"5": 6, "4": 6, "3": 3}}'),
('2025-07-29', 'satisfaccion_promedio', 4.6, '{"total_evaluaciones": 25, "distribucion": {"5": 15, "4": 8, "3": 2}}'),
('2025-07-30', 'satisfaccion_promedio', 4.4, '{"total_evaluaciones": 20, "distribucion": {"5": 9, "4": 9, "3": 2}}');

-- Reportes programados de ejemplo
INSERT INTO reportes_programados (nombre, descripcion, tipo_reporte, frecuencia, parametros, destinatarios, proxima_ejecucion, created_by) VALUES
('Reporte Financiero Mensual', 'Resumen completo de ingresos, gastos y rentabilidad mensual', 'financiero', 'mensual', 
 '{"incluir_graficos": true, "detalles_por_odontologo": true, "comparacion_mes_anterior": true}',
 '["admin@clinikdent.com", "finanzas@clinikdent.com"]',
 '2025-09-01 08:00:00', 1),

('Dashboard Operacional Semanal', 'Métricas operacionales: citas, tratamientos, eficiencia', 'operacional', 'semanal',
 '{"incluir_kpis": true, "alertas_automaticas": true, "comparacion_semanal": true}',
 '["operaciones@clinikdent.com", "admin@clinikdent.com"]',
 '2025-08-26 09:00:00', 1),

('Reporte de Satisfacción Mensual', 'Análisis de evaluaciones y feedback de pacientes', 'satisfaccion', 'mensual',
 '{"incluir_comentarios": true, "analisis_sentimientos": false, "recomendaciones": true}',
 '["calidad@clinikdent.com", "admin@clinikdent.com"]',
 '2025-09-01 10:00:00', 1);

-- KPIs personalizados
INSERT INTO kpis_personalizados (nombre, descripcion, formula, unidad, meta_minima, meta_maxima, color_config, created_by) VALUES
('Tasa de Ocupación Semanal', 'Porcentaje de citas programadas vs capacidad total de la clínica', 
 '{"numerador": "citas_completadas + citas_programadas", "denominador": "capacidad_total_semanal", "multiplicador": 100}',
 '%', 75.00, 90.00, 
 '{"ranges": [{"min": 0, "max": 60, "color": "#dc3545"}, {"min": 60, "max": 75, "color": "#ffc107"}, {"min": 75, "max": 100, "color": "#28a745"}]}',
 1),

('Ingresos por Paciente Activo', 'Promedio de ingresos generados por cada paciente activo mensualmente',
 '{"numerador": "ingresos_totales_mes", "denominador": "pacientes_activos_promedio"}',
 '$', 150000.00, 300000.00,
 '{"ranges": [{"min": 0, "max": 100000, "color": "#dc3545"}, {"min": 100000, "max": 150000, "color": "#ffc107"}, {"min": 150000, "max": 500000, "color": "#28a745"}]}',
 1),

('Índice de Satisfacción General', 'Promedio ponderado de todas las evaluaciones de pacientes',
 '{"numerador": "suma_calificaciones_ponderadas", "denominador": "total_evaluaciones"}',
 'pts', 4.0, 4.8,
 '{"ranges": [{"min": 0, "max": 3.5, "color": "#dc3545"}, {"min": 3.5, "max": 4.0, "color": "#ffc107"}, {"min": 4.0, "max": 5.0, "color": "#28a745"}]}',
 1),

('Eficiencia de Tratamientos', 'Porcentaje de tratamientos completados vs tratamientos iniciados',
 '{"numerador": "tratamientos_completados", "denominador": "tratamientos_iniciados", "multiplicador": 100}',
 '%', 85.00, 95.00,
 '{"ranges": [{"min": 0, "max": 70, "color": "#dc3545"}, {"min": 70, "max": 85, "color": "#ffc107"}, {"min": 85, "max": 100, "color": "#28a745"}]}',
 1);

-- Dashboard personalizado para administrador
INSERT INTO dashboards_personalizados (usuario_id, nombre, configuracion, es_publico) VALUES
(1, 'Dashboard Ejecutivo', '{
  "layout": "grid",
  "widgets": [
    {
      "id": "ingresos_mes",
      "type": "metric_card",
      "title": "Ingresos del Mes",
      "position": {"row": 1, "col": 1, "width": 3, "height": 1},
      "config": {"metric": "ingresos_mensuales", "format": "currency", "comparison": "previous_month"}
    },
    {
      "id": "pacientes_activos",
      "type": "metric_card", 
      "title": "Pacientes Activos",
      "position": {"row": 1, "col": 4, "width": 3, "height": 1},
      "config": {"metric": "pacientes_activos", "format": "number", "comparison": "previous_month"}
    },
    {
      "id": "satisfaccion",
      "type": "gauge_chart",
      "title": "Satisfacción Promedio",
      "position": {"row": 1, "col": 7, "width": 3, "height": 2},
      "config": {"metric": "satisfaccion_promedio", "min": 1, "max": 5, "target": 4.5}
    },
    {
      "id": "ingresos_trend",
      "type": "line_chart",
      "title": "Tendencia de Ingresos (30 días)",
      "position": {"row": 2, "col": 1, "width": 6, "height": 2},
      "config": {"metrics": ["ingresos_diarios"], "period": "30d"}
    },
    {
      "id": "citas_por_estado",
      "type": "pie_chart",
      "title": "Citas por Estado",
      "position": {"row": 3, "col": 1, "width": 4, "height": 2},
      "config": {"metric": "citas_por_estado", "colors": {"completada": "#28a745", "programada": "#17a2b8", "cancelada": "#dc3545"}}
    },
    {
      "id": "top_tratamientos",
      "type": "bar_chart",
      "title": "Top 5 Tratamientos",
      "position": {"row": 3, "col": 5, "width": 5, "height": 2},
      "config": {"metric": "tratamientos_populares", "limit": 5, "order": "desc"}
    }
  ],
  "filters": {
    "date_range": {"enabled": true, "default": "current_month"},
    "sede": {"enabled": true, "default": "all"}
  },
  "refresh_interval": 300
}', TRUE);

-- Insertar algunos registros de historial de reportes
INSERT INTO historial_reportes (reporte_programado_id, titulo, tipo_reporte, parametros, datos_reporte, estado, fecha_generacion, generado_por) VALUES
(1, 'Reporte Financiero - Julio 2025', 'financiero', 
 '{"mes": "2025-07", "incluir_graficos": true}',
 '{"ingresos_totales": 78500000, "gastos_totales": 23400000, "utilidad_neta": 55100000, "crecimiento": 12.5}',
 'completado', '2025-08-01 08:30:00', 1),

(2, 'Dashboard Operacional - Semana 32', 'operacional',
 '{"semana": "2025-W32", "incluir_kpis": true}',
 '{"citas_completadas": 245, "tasa_ocupacion": 87.2, "tiempo_promedio_cita": 45, "eficiencia": 92.1}',
 'completado', '2025-08-12 09:15:00', 1);

SELECT '✅ Sistema de Reportes y Analytics creado exitosamente' as resultado;
SELECT '📊 Tablas creadas: metricas_sistema, reportes_programados, historial_reportes, dashboards_personalizados, kpis_personalizados' as detalle;
SELECT '🎯 Funcionalidad agregada: +5% hacia objetivo 99%' as progreso;
