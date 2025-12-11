-- ===================================================
-- SISTEMA DE INTELIGENCIA ARTIFICIAL Y AUTOMATIZACIÓN
-- Progreso: +7.5% hacia funcionalidad completa del 99%
-- ===================================================

-- Tabla para configuraciones de IA y automatización
CREATE TABLE IF NOT EXISTS configuraciones_ia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_configuracion ENUM('chatbot', 'predicciones', 'recomendaciones', 'programacion_inteligente') NOT NULL,
    nombre_configuracion VARCHAR(100) NOT NULL,
    parametros_ia JSON NOT NULL,
    esta_activo BOOLEAN DEFAULT true,
    umbral_confianza DECIMAL(5,3) DEFAULT 0.850,
    modelo_version VARCHAR(50) DEFAULT 'v1.0',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo_config (tipo_configuracion),
    INDEX idx_activo (esta_activo)
);

-- Tabla para el chatbot inteligente
CREATE TABLE IF NOT EXISTS chatbot_conversaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    session_id VARCHAR(100) NOT NULL,
    mensaje_usuario TEXT NOT NULL,
    respuesta_bot TEXT NOT NULL,
    intencion_detectada VARCHAR(100),
    confianza_intencion DECIMAL(5,3),
    entidades_extraidas JSON,
    accion_ejecutada VARCHAR(100),
    satisfaccion_usuario ENUM('muy_buena', 'buena', 'regular', 'mala', 'muy_mala'),
    requiere_agente_humano BOOLEAN DEFAULT false,
    timestamp_conversacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_session (session_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_intencion (intencion_detectada),
    INDEX idx_timestamp (timestamp_conversacion)
);

-- Tabla para predicciones y analytics predictivos
CREATE TABLE IF NOT EXISTS predicciones_ia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_prediccion ENUM('citas_canceladas', 'tratamientos_necesarios', 'riesgo_abandono', 'ingresos_futuros', 'inventario_optimo') NOT NULL,
    usuario_id INT,
    sede_id INT,
    fecha_prediccion DATE NOT NULL,
    valor_predicho DECIMAL(15,4),
    probabilidad DECIMAL(5,3),
    factores_influyentes JSON,
    precision_modelo DECIMAL(5,3),
    datos_entrenamiento JSON,
    resultado_real DECIMAL(15,4),
    desviacion_prediccion DECIMAL(15,4),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_validacion TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_tipo_pred (tipo_prediccion),
    INDEX idx_fecha_pred (fecha_prediccion),
    INDEX idx_usuario (usuario_id),
    INDEX idx_probabilidad (probabilidad DESC)
);

-- Tabla para recomendaciones inteligentes
CREATE TABLE IF NOT EXISTS recomendaciones_ia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo_recomendacion ENUM('tratamiento', 'cita_siguiente', 'producto_cuidado', 'plan_pago', 'especialista') NOT NULL,
    titulo_recomendacion VARCHAR(200) NOT NULL,
    descripcion TEXT,
    puntuacion_relevancia DECIMAL(5,3) NOT NULL,
    razonamiento_ia TEXT,
    datos_utilizados JSON,
    accion_sugerida TEXT,
    url_accion VARCHAR(500),
    mostrada_usuario BOOLEAN DEFAULT false,
    fecha_mostrado TIMESTAMP NULL,
    accion_tomada ENUM('aceptada', 'rechazada', 'pospuesta', 'ignorada'),
    feedback_usuario TEXT,
    fecha_expiracion TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo (tipo_recomendacion),
    INDEX idx_puntuacion (puntuacion_relevancia DESC),
    INDEX idx_mostrada (mostrada_usuario),
    INDEX idx_expiracion (fecha_expiracion)
);

-- Tabla para programación inteligente de citas
CREATE TABLE IF NOT EXISTS programacion_inteligente (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha_programacion DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    sede_id INT,
    odontologo_id INT,
    tipo_optimizacion ENUM('tiempo_espera', 'utilizacion_recursos', 'satisfaccion_paciente', 'ingresos') NOT NULL,
    algoritmo_utilizado VARCHAR(100) NOT NULL,
    parametros_algoritmo JSON,
    eficiencia_calculada DECIMAL(5,3),
    citas_programadas INT DEFAULT 0,
    tiempo_libre_optimizado INT, -- en minutos
    conflictos_resueltos INT DEFAULT 0,
    satisfaccion_estimada DECIMAL(5,3),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aplicacion TIMESTAMP NULL,
    resultados_reales JSON,
    FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_fecha_prog (fecha_programacion),
    INDEX idx_sede (sede_id),
    INDEX idx_odontologo (odontologo_id),
    INDEX idx_eficiencia (eficiencia_calculada DESC)
);

-- Tabla para análisis de patrones y comportamientos
CREATE TABLE IF NOT EXISTS analisis_patrones_ia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_analisis ENUM('comportamiento_paciente', 'tendencias_tratamiento', 'patrones_cancelacion', 'optimizacion_inventario', 'prediccion_demanda') NOT NULL,
    periodo_analizado_inicio DATE NOT NULL,
    periodo_analizado_fin DATE NOT NULL,
    patrones_detectados JSON NOT NULL,
    insights_principales TEXT,
    recomendaciones_accion TEXT,
    confianza_analisis DECIMAL(5,3),
    usuarios_afectados INT,
    impacto_estimado DECIMAL(15,4),
    metadatos_analisis JSON,
    algoritmos_usados JSON,
    validacion_estadistica JSON,
    fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    proxima_actualizacion TIMESTAMP,
    INDEX idx_tipo_analisis (tipo_analisis),
    INDEX idx_periodo (periodo_analizado_inicio, periodo_analizado_fin),
    INDEX idx_confianza (confianza_analisis DESC),
    INDEX idx_impacto (impacto_estimado DESC)
);

-- Tabla para automatizaciones y workflows inteligentes
CREATE TABLE IF NOT EXISTS automatizaciones_workflow (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_workflow VARCHAR(150) NOT NULL,
    descripcion TEXT,
    trigger_evento VARCHAR(100) NOT NULL, -- que evento dispara la automatización
    condiciones_ejecutar JSON, -- condiciones que deben cumplirse
    acciones_automaticas JSON NOT NULL, -- acciones a ejecutar
    prioridad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    esta_activo BOOLEAN DEFAULT true,
    frecuencia_ejecucion ENUM('inmediata', 'diaria', 'semanal', 'mensual', 'personalizada'),
    parametros_frecuencia JSON,
    ultima_ejecucion TIMESTAMP NULL,
    proxima_ejecucion TIMESTAMP NULL,
    ejecuciones_exitosas INT DEFAULT 0,
    ejecuciones_fallidas INT DEFAULT 0,
    tiempo_promedio_ejecucion INT, -- en segundos
    logs_ejecucion JSON,
    usuario_creador_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_creador_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_trigger (trigger_evento),
    INDEX idx_activo (esta_activo),
    INDEX idx_prioridad (prioridad),
    INDEX idx_proxima_ejecucion (proxima_ejecucion)
);

-- Tabla para modelos de Machine Learning
CREATE TABLE IF NOT EXISTS modelos_ml (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_modelo VARCHAR(100) NOT NULL,
    tipo_modelo ENUM('clasificacion', 'regresion', 'clustering', 'nlp', 'vision', 'recomendacion') NOT NULL,
    version_modelo VARCHAR(50) NOT NULL,
    proposito TEXT NOT NULL,
    algoritmo_base VARCHAR(100),
    hiperparametros JSON,
    metricas_rendimiento JSON NOT NULL,
    datos_entrenamiento_info JSON,
    fecha_entrenamiento TIMESTAMP NOT NULL,
    fecha_ultimo_uso TIMESTAMP,
    veces_utilizado INT DEFAULT 0,
    precision_promedio DECIMAL(5,3),
    recall_promedio DECIMAL(5,3),
    f1_score DECIMAL(5,3),
    esta_en_produccion BOOLEAN DEFAULT false,
    archivo_modelo_path VARCHAR(500),
    notas_desarrollo TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo_modelo),
    INDEX idx_version (version_modelo),
    INDEX idx_produccion (esta_en_produccion),
    INDEX idx_precision (precision_promedio DESC)
);

-- Insertar configuraciones iniciales de IA
INSERT INTO configuraciones_ia (tipo_configuracion, nombre_configuracion, parametros_ia, umbral_confianza, modelo_version) VALUES
('chatbot', 'Chatbot Principal Clinikdent', 
 JSON_OBJECT(
   'idioma', 'es',
   'personalidad', 'profesional_amigable',
   'temas_habilitados', JSON_ARRAY('citas', 'tratamientos', 'pagos', 'información_general'),
   'escalamiento_humano', true,
   'horario_atencion', JSON_OBJECT('inicio', '07:00', 'fin', '20:00'),
   'respuestas_personalizadas', true
 ), 0.750, 'chatbot-v2.1'),

('predicciones', 'Predictor de Cancelaciones', 
 JSON_OBJECT(
   'ventana_prediccion_dias', 7,
   'factores', JSON_ARRAY('historial_cancelaciones', 'clima', 'dia_semana', 'hora_cita', 'tipo_tratamiento'),
   'algoritmo', 'random_forest',
   'reentrenamiento_dias', 30
 ), 0.825, 'pred-cancel-v1.3'),

('recomendaciones', 'Motor de Recomendaciones', 
 JSON_OBJECT(
   'tipos_activos', JSON_ARRAY('tratamiento', 'cita_siguiente', 'plan_pago'),
   'algoritmo_recomendacion', 'collaborative_filtering',
   'factores_peso', JSON_OBJECT('historial', 0.4, 'preferencias', 0.3, 'tendencias', 0.3),
   'max_recomendaciones_dia', 3
 ), 0.800, 'recom-v2.0'),

('programacion_inteligente', 'Optimizador de Agenda', 
 JSON_OBJECT(
   'objetivos', JSON_ARRAY('minimizar_esperas', 'maximizar_utilizacion'),
   'restricciones', JSON_OBJECT('almuerzo_obligatorio', true, 'descansos_minimos', 15),
   'algoritmo_optimizacion', 'genetic_algorithm',
   'horizonte_planificacion_dias', 14
 ), 0.850, 'sched-v1.2');

-- Insertar datos de ejemplo para chatbot_conversaciones
INSERT INTO chatbot_conversaciones (usuario_id, session_id, mensaje_usuario, respuesta_bot, intencion_detectada, confianza_intencion, entidades_extraidas, accion_ejecutada, satisfaccion_usuario, requiere_agente_humano) VALUES
(1, 'sess_001_2025', '¿Puedo agendar una cita para limpieza dental?', 
 'Claro, puedo ayudarte a agendar una cita para limpieza dental. ¿Qué día y horario prefieres? Tenemos disponibilidad esta semana en varios horarios.',
 'agendar_cita', 0.920, 
 JSON_OBJECT('tipo_tratamiento', 'limpieza_dental', 'intencion_principal', 'agendar'),
 'mostrar_calendario_disponible', 'buena', false),

(2, 'sess_002_2025', 'Me duele mucho una muela, necesito ayuda urgente',
 'Lamento escuchar que tienes dolor. Esto parece una emergencia dental. Te voy a conectar inmediatamente con nuestro servicio de urgencias y mientras tanto, puedes tomar un analgésico si tienes disponible.',
 'emergencia_dental', 0.950,
 JSON_OBJECT('urgencia', 'alta', 'sintoma', 'dolor_muela', 'tipo_consulta', 'emergencia'),
 'escalamiento_urgencia', 'muy_buena', true),

(3, 'sess_003_2025', '¿Cuánto cuesta un tratamiento de ortodoncia?',
 'Los costos de ortodoncia varían según el tipo de tratamiento. Tenemos opciones desde brackets tradicionales hasta alineadores invisibles. Te puedo agendar una consulta de valoración gratuita donde te darán un presupuesto personalizado.',
 'consulta_precios', 0.875,
 JSON_OBJECT('tratamiento', 'ortodoncia', 'tipo_consulta', 'precios'),
 'ofrecer_consulta_valoracion', 'buena', false);

-- Insertar predicciones de ejemplo
INSERT INTO predicciones_ia (tipo_prediccion, usuario_id, sede_id, fecha_prediccion, valor_predicho, probabilidad, factores_influyentes, precision_modelo, datos_entrenamiento) VALUES
('citas_canceladas', 1, 1, '2025-08-26', 0.15, 0.832,
 JSON_OBJECT('historial_cancelaciones', 0.10, 'dia_semana', 'lunes', 'clima_pronostico', 'lluvia', 'hora_cita', '08:00'),
 0.847, JSON_OBJECT('registros_usados', 1250, 'periodo_entrenamiento', '2024-01-01_2025-07-31')),

('tratamientos_necesarios', 2, 1, '2025-09-15', 2.3, 0.756,
 JSON_OBJECT('ultima_consulta_dias', 180, 'historial_tratamientos', JSON_ARRAY('limpieza', 'empaste'), 'edad_paciente', 34, 'habitos_cuidado', 'regular'),
 0.823, JSON_OBJECT('registros_usados', 890, 'algoritmo', 'gradient_boosting')),

('ingresos_futuros', NULL, 1, '2025-09-01', 85000.50, 0.889,
 JSON_OBJECT('tendencia_historica', 'creciente', 'temporada', 'alta', 'promociones_activas', 2, 'nuevos_pacientes_estimados', 12),
 0.891, JSON_OBJECT('registros_usados', 2100, 'modelo', 'time_series_lstm'));

-- Insertar recomendaciones inteligentes
INSERT INTO recomendaciones_ia (usuario_id, tipo_recomendacion, titulo_recomendacion, descripcion, puntuacion_relevancia, razonamiento_ia, datos_utilizados, accion_sugerida, url_accion, fecha_expiracion) VALUES
(1, 'tratamiento', 'Revisión de Ortodoncia Recomendada', 
 'Basado en tu última consulta hace 6 meses, es recomendable una evaluación ortodóntica para prevenir futuros problemas de alineación.',
 0.834, 'El algoritmo detectó patrones en tu historial dental que sugieren beneficios preventivos de una evaluación ortodóntica temprana.',
 JSON_OBJECT('ultima_consulta', '2025-02-15', 'edad', 28, 'historial_familiar', 'problemas_ortodoncia'),
 'Agendar consulta de evaluación ortodóntica', '/agenda?especialidad=ortodoncia',
 '2025-09-15 23:59:59'),

(2, 'cita_siguiente', 'Recordatorio: Control Post-Tratamiento',
 'Ha pasado el tiempo recomendado desde tu último tratamiento de endodoncia. Un control de seguimiento asegurará que todo esté perfecto.',
 0.912, 'Protocolo clínico indica control obligatorio a los 3 meses post-endodoncia. El algoritmo detectó que es el momento óptimo.',
 JSON_OBJECT('ultimo_tratamiento', 'endodoncia', 'fecha_tratamiento', '2025-05-20', 'protocolo_seguimiento', 90),
 'Agendar cita de control', '/agenda?tipo=control',
 '2025-09-01 23:59:59'),

(3, 'producto_cuidado', 'Kit de Cuidado Personalizado',
 'Recomendamos un kit de cuidado específico para mantener los resultados de tu blanqueamiento dental.',
 0.768, 'Análisis de tu tratamiento reciente y preferencias de cuidado sugieren productos específicos para maximizar duración del blanqueamiento.',
 JSON_OBJECT('tratamiento_reciente', 'blanqueamiento', 'sensibilidad_detectada', 'baja', 'preferencias_naturales', true),
 'Ver productos recomendados', '/productos/cuidado-personalizado',
 '2025-10-01 23:59:59');

-- Insertar programación inteligente
INSERT INTO programacion_inteligente (fecha_programacion, hora_inicio, hora_fin, sede_id, odontologo_id, tipo_optimizacion, algoritmo_utilizado, parametros_algoritmo, eficiencia_calculada, citas_programadas, tiempo_libre_optimizado, conflictos_resueltos, satisfaccion_estimada) VALUES
('2025-08-26', '08:00:00', '18:00:00', 1, 2, 'utilizacion_recursos', 'genetic_algorithm',
 JSON_OBJECT('poblacion', 100, 'generaciones', 50, 'crossover_rate', 0.8, 'mutation_rate', 0.1, 'objetivos_peso', JSON_OBJECT('utilizacion', 0.6, 'satisfaccion', 0.4)),
 0.887, 12, 45, 3, 0.834),

('2025-08-27', '08:00:00', '17:00:00', 1, 3, 'tiempo_espera', 'simulated_annealing',
 JSON_OBJECT('temperatura_inicial', 1000, 'factor_enfriamiento', 0.95, 'iteraciones_max', 1000),
 0.923, 10, 30, 2, 0.891),

('2025-08-28', '07:30:00', '19:00:00', 2, 4, 'satisfaccion_paciente', 'tabu_search',
 JSON_OBJECT('tabu_size', 20, 'iteraciones', 500, 'diversificacion', true),
 0.856, 15, 60, 1, 0.945);

-- Insertar análisis de patrones
INSERT INTO analisis_patrones_ia (tipo_analisis, periodo_analizado_inicio, periodo_analizado_fin, patrones_detectados, insights_principales, recomendaciones_accion, confianza_analisis, usuarios_afectados, impacto_estimado, algoritmos_usados, validacion_estadistica) VALUES
('comportamiento_paciente', '2025-01-01', '2025-07-31',
 JSON_OBJECT(
   'patron_cancelaciones', JSON_OBJECT('dias_criticos', JSON_ARRAY('lunes', 'viernes'), 'horas_criticas', JSON_ARRAY('08:00', '17:00'), 'motivos_principales', JSON_ARRAY('trabajo', 'transporte')),
   'patron_preferencias', JSON_OBJECT('horarios_preferidos', JSON_ARRAY('10:00-12:00', '14:00-16:00'), 'tratamientos_populares', JSON_ARRAY('limpieza', 'blanqueamiento')),
   'patron_fidelidad', JSON_OBJECT('pacientes_regulares', 0.68, 'tiempo_promedio_retorno', 180, 'satisfaccion_promedio', 4.2)
 ),
 'Los pacientes muestran mayor adherencia en horarios de media mañana y media tarde. Cancelaciones críticas en inicio/fin de jornada.',
 'Implementar recordatorios inteligentes 24h antes para citas críticas. Ofrecer horarios alternativos automáticamente.',
 0.876, 1250, 15000.00,
 JSON_ARRAY('kmeans_clustering', 'association_rules', 'time_series_analysis'),
 JSON_OBJECT('p_value', 0.001, 'r_squared', 0.834, 'confidence_interval', 0.95)),

('prediccion_demanda', '2025-06-01', '2025-07-31',
 JSON_OBJECT(
   'demanda_tratamientos', JSON_OBJECT('ortodoncia', 'creciente_15%', 'blanqueamiento', 'estable', 'implantes', 'creciente_8%'),
   'estacionalidad', JSON_OBJECT('verano_alta_demanda', JSON_ARRAY('blanqueamiento', 'ortodoncia'), 'invierno_baja_demanda', JSON_ARRAY('cirugias_electivas')),
   'factores_externos', JSON_OBJECT('promociones_efectividad', 0.23, 'referidos_impacto', 0.31, 'redes_sociales', 0.18)
 ),
 'Demanda creciente en tratamientos estéticos durante verano. Ortodoncia mantiene tendencia alcista constante.',
 'Aumentar disponibilidad de especialistas en ortodoncia y blanqueamiento para próximos 3 meses. Preparar promociones de invierno.',
 0.912, 2100, 45000.00,
 JSON_ARRAY('arima_forecasting', 'prophet_decomposition', 'regression_analysis'),
 JSON_OBJECT('mape', 0.087, 'mae', 145.32, 'confidence', 0.912));

-- Insertar automatizaciones de ejemplo
INSERT INTO automatizaciones_workflow (nombre_workflow, descripcion, trigger_evento, condiciones_ejecutar, acciones_automaticas, prioridad, frecuencia_ejecucion, parametros_frecuencia, proxima_ejecucion) VALUES
('Recordatorio Citas 24h', 'Envío automático de recordatorios de citas con 24 horas de anticipación',
 'cron_diario', 
 JSON_OBJECT('hora_ejecucion', '09:00', 'dias_anticipacion', 1, 'tipos_cita', JSON_ARRAY('consulta', 'tratamiento', 'control')),
 JSON_OBJECT(
   'acciones', JSON_ARRAY(
     JSON_OBJECT('tipo', 'email', 'template', 'recordatorio_cita_24h'),
     JSON_OBJECT('tipo', 'sms', 'mensaje', 'Recordatorio: Tienes una cita mañana a las {hora} en {sede}'),
     JSON_OBJECT('tipo', 'notificacion_app', 'titulo', 'Cita Próxima', 'mensaje', 'No olvides tu cita de mañana')
   )
 ),
 'alta', 'diaria', JSON_OBJECT('hora', '09:00'), '2025-08-26 09:00:00'),

('Seguimiento Post-Tratamiento', 'Programa automático de seguimiento después de tratamientos importantes',
 'tratamiento_completado',
 JSON_OBJECT('tipos_tratamiento', JSON_ARRAY('endodoncia', 'cirugia', 'implantes'), 'dias_seguimiento', JSON_ARRAY(1, 7, 30)),
 JSON_OBJECT(
   'seguimiento_dia_1', JSON_OBJECT('tipo', 'llamada_automatica', 'mensaje', 'llamada_post_tratamiento'),
   'seguimiento_dia_7', JSON_OBJECT('tipo', 'email', 'template', 'seguimiento_7_dias'),
   'seguimiento_dia_30', JSON_OBJECT('tipo', 'agendar_control', 'especialidad', 'auto')
 ),
 'critica', 'inmediata', JSON_OBJECT('delay_minutos', 60), NULL),

('Optimización Inventario', 'Gestión inteligente de inventario basada en patrones de uso y predicciones',
 'stock_bajo',
 JSON_OBJECT('umbral_minimo', 0.20, 'productos_criticos', JSON_ARRAY('anestesia', 'material_endodoncia', 'brackets')),
 JSON_OBJECT(
   'calcular_demanda', JSON_OBJECT('algoritmo', 'prediccion_ia', 'horizon_dias', 30),
   'generar_orden', JSON_OBJECT('proveedor_preferido', 'auto', 'cantidad_optima', 'calculada'),
   'notificar_admin', JSON_OBJECT('urgencia', 'media', 'incluir_predicciones', true)
 ),
 'media', 'semanal', JSON_OBJECT('dia_semana', 'lunes', 'hora', '08:00'), '2025-09-02 08:00:00');

-- Insertar modelos ML de ejemplo
INSERT INTO modelos_ml (nombre_modelo, tipo_modelo, version_modelo, proposito, algoritmo_base, hiperparametros, metricas_rendimiento, datos_entrenamiento_info, fecha_entrenamiento, precision_promedio, recall_promedio, f1_score, esta_en_produccion) VALUES
('PredictorCancelaciones', 'clasificacion', 'v1.3', 
 'Predicción de probabilidad de cancelación de citas basado en factores históricos y contextuales',
 'random_forest', 
 JSON_OBJECT('n_estimators', 200, 'max_depth', 15, 'min_samples_split', 10, 'random_state', 42),
 JSON_OBJECT('accuracy', 0.847, 'precision', 0.823, 'recall', 0.856, 'f1_score', 0.839, 'auc_roc', 0.891),
 JSON_OBJECT('samples_total', 15000, 'periodo', '2023-01-01_2025-07-31', 'features', 23, 'balanceado', true),
 '2025-08-01 10:30:00', 0.823, 0.856, 0.839, true),

('RecomendadorTratamientos', 'recomendacion', 'v2.0',
 'Sistema de recomendación de tratamientos personalizados basado en historial clínico y preferencias',
 'collaborative_filtering_neural', 
 JSON_OBJECT('embedding_dim', 128, 'hidden_layers', JSON_ARRAY(256, 128, 64), 'dropout', 0.3, 'learning_rate', 0.001),
 JSON_OBJECT('ndcg@10', 0.834, 'map@10', 0.756, 'recall@10', 0.689, 'precision@10', 0.723),
 JSON_OBJECT('usuarios', 2500, 'tratamientos', 45, 'interacciones', 18750, 'densidad', 0.167),
 '2025-07-15 14:20:00', 0.723, 0.689, 0.706, true),

('OptimizadorAgenda', 'regresion', 'v1.2',
 'Optimización de programación de citas para maximizar eficiencia y satisfacción del paciente',
 'genetic_algorithm_ml', 
 JSON_OBJECT('population_size', 100, 'generations', 200, 'crossover_rate', 0.8, 'mutation_rate', 0.1),
 JSON_OBJECT('mae', 0.067, 'rmse', 0.089, 'r2_score', 0.887, 'eficiencia_promedio', 0.891),
 JSON_OBJECT('schedules_training', 5000, 'variables', 15, 'constraints', 8, 'objectives', 3),
 '2025-07-20 09:15:00', 0.891, 0.887, 0.889, true);

SELECT 'Sistema de IA y Automatización creado exitosamente!' as mensaje;
SELECT 'Se han creado 8 nuevas tablas especializadas en inteligencia artificial' as detalle;
SELECT 'Funcionalidad agregada: +7.5% - Total acumulado: 89.0%' as progreso;
