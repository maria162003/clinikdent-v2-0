-- ==========================================
-- SISTEMA DE COMUNICACIONES Y NOTIFICACIONES AVANZADAS
-- Extensión +6% hacia funcionalidad 99%
-- ==========================================

USE clinikdent;

-- Tabla para mensajes del sistema de chat
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversacion_id VARCHAR(100) NOT NULL,
    remitente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo_mensaje ENUM('texto', 'imagen', 'archivo', 'audio', 'sistema') DEFAULT 'texto',
    archivo_adjunto VARCHAR(500),
    leido BOOLEAN DEFAULT FALSE,
    fecha_leido TIMESTAMP NULL,
    respuesta_a INT NULL, -- Para respuestas a mensajes específicos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id),
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id),
    FOREIGN KEY (respuesta_a) REFERENCES mensajes_chat(id) ON DELETE SET NULL,
    INDEX idx_conversacion_fecha (conversacion_id, created_at),
    INDEX idx_destinatario_leido (destinatario_id, leido)
) ENGINE=InnoDB;

-- Tabla para configuración de notificaciones por usuario
CREATE TABLE IF NOT EXISTS configuracion_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    email_nuevas_citas BOOLEAN DEFAULT TRUE,
    email_recordatorio_citas BOOLEAN DEFAULT TRUE,
    email_cancelacion_citas BOOLEAN DEFAULT TRUE,
    email_resultados_tratamientos BOOLEAN DEFAULT TRUE,
    email_promociones BOOLEAN DEFAULT FALSE,
    push_mensajes_chat BOOLEAN DEFAULT TRUE,
    push_recordatorio_citas BOOLEAN DEFAULT TRUE,
    push_actualizaciones_sistema BOOLEAN DEFAULT TRUE,
    sms_recordatorio_citas BOOLEAN DEFAULT FALSE,
    sms_confirmacion_citas BOOLEAN DEFAULT FALSE,
    horario_notificaciones_inicio TIME DEFAULT '08:00:00',
    horario_notificaciones_fin TIME DEFAULT '20:00:00',
    dias_anticipacion_recordatorio INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_config (usuario_id)
) ENGINE=InnoDB;

-- Tabla para historial de notificaciones enviadas
CREATE TABLE IF NOT EXISTS historial_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_notificacion ENUM('email', 'push', 'sms', 'sistema') NOT NULL,
    categoria ENUM('cita', 'tratamiento', 'pago', 'promocion', 'sistema', 'chat') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    destinatario VARCHAR(255) NOT NULL, -- email, teléfono, etc.
    estado ENUM('pendiente', 'enviado', 'entregado', 'fallido', 'leido') DEFAULT 'pendiente',
    error_mensaje TEXT,
    metadata JSON, -- Datos adicionales específicos del tipo
    programado_para TIMESTAMP NULL,
    enviado_en TIMESTAMP NULL,
    leido_en TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_usuario_tipo (usuario_id, tipo_notificacion),
    INDEX idx_estado_programado (estado, programado_para),
    INDEX idx_categoria_fecha (categoria, created_at)
) ENGINE=InnoDB;

-- Tabla para plantillas de notificaciones personalizables
CREATE TABLE IF NOT EXISTS plantillas_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria ENUM('cita', 'tratamiento', 'pago', 'promocion', 'sistema', 'chat') NOT NULL,
    tipo ENUM('email', 'push', 'sms') NOT NULL,
    asunto VARCHAR(200), -- Para emails
    contenido_html TEXT, -- Para emails
    contenido_texto TEXT NOT NULL,
    variables_disponibles JSON, -- Variables que se pueden usar {nombre}, {fecha}, etc.
    activa BOOLEAN DEFAULT TRUE,
    es_sistema BOOLEAN DEFAULT FALSE, -- No editable por usuarios
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    INDEX idx_categoria_tipo (categoria, tipo)
) ENGINE=InnoDB;

-- Tabla para recordatorios automáticos programados
CREATE TABLE IF NOT EXISTS recordatorios_programados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cita_id INT,
    tipo_recordatorio ENUM('cita_proxima', 'cita_pendiente_confirmar', 'seguimiento_tratamiento', 'revision_periodica', 'pago_pendiente') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_programada TIMESTAMP NOT NULL,
    repetir BOOLEAN DEFAULT FALSE,
    intervalo_repeticion ENUM('diario', 'semanal', 'mensual', 'anual') NULL,
    veces_repetidas INT DEFAULT 0,
    max_repeticiones INT NULL,
    canales JSON, -- ['email', 'push', 'sms']
    estado ENUM('activo', 'pausado', 'completado', 'cancelado') DEFAULT 'activo',
    ejecutado_en TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL,
    INDEX idx_fecha_estado (fecha_programada, estado),
    INDEX idx_usuario_tipo (usuario_id, tipo_recordatorio)
) ENGINE=InnoDB;

-- Tabla para comunicaciones familiares (pacientes menores o dependientes)
CREATE TABLE IF NOT EXISTS comunicaciones_familiares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    responsable_id INT NOT NULL, -- Padre, madre, tutor
    parentesco ENUM('padre', 'madre', 'tutor', 'hermano', 'abuelo', 'otro') NOT NULL,
    puede_recibir_notificaciones BOOLEAN DEFAULT TRUE,
    puede_agendar_citas BOOLEAN DEFAULT TRUE,
    puede_ver_historial BOOLEAN DEFAULT TRUE,
    puede_autorizar_tratamientos BOOLEAN DEFAULT TRUE,
    nivel_acceso ENUM('completo', 'limitado', 'solo_notificaciones') DEFAULT 'limitado',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id),
    UNIQUE KEY unique_paciente_responsable (paciente_id, responsable_id)
) ENGINE=InnoDB;

-- ==========================================
-- DATOS INICIALES
-- ==========================================

-- Plantillas de notificaciones del sistema
INSERT INTO plantillas_notificaciones (nombre, categoria, tipo, asunto, contenido_html, contenido_texto, variables_disponibles, es_sistema) VALUES

-- Plantillas de Email
('Confirmación de Cita', 'cita', 'email', 
 'Confirmación de Cita - {fecha} a las {hora}',
 '<h2>Confirmación de Cita</h2><p>Estimado/a {nombre_paciente},</p><p>Su cita ha sido confirmada para el <strong>{fecha}</strong> a las <strong>{hora}</strong> con {nombre_odontologo}.</p><p><strong>Tratamiento:</strong> {tratamiento}</p><p><strong>Sede:</strong> {sede}</p><p>Si necesita reprogramar, por favor contacte a la clínica con 24 horas de anticipación.</p><p>¡Esperamos verle pronto!</p>',
 'Estimado/a {nombre_paciente}, su cita ha sido confirmada para el {fecha} a las {hora} con {nombre_odontologo}. Tratamiento: {tratamiento}. Sede: {sede}.',
 '{"nombre_paciente": "string", "fecha": "date", "hora": "time", "nombre_odontologo": "string", "tratamiento": "string", "sede": "string"}',
 TRUE),

('Recordatorio de Cita', 'cita', 'email',
 'Recordatorio: Cita Mañana a las {hora}',
 '<h2>Recordatorio de Cita</h2><p>Estimado/a {nombre_paciente},</p><p>Le recordamos su cita programada para <strong>mañana {fecha} a las {hora}</strong> con {nombre_odontologo}.</p><p><strong>Tratamiento:</strong> {tratamiento}</p><p><strong>Dirección:</strong> {direccion_sede}</p><p><strong>Recomendaciones:</strong></p><ul><li>Llegar 15 minutos antes</li><li>Traer documento de identidad</li><li>Si toma medicamentos, informar al odontólogo</li></ul><p>Para reprogramar: {telefono_contacto}</p>',
 'Recordatorio: Cita mañana {fecha} a las {hora} con {nombre_odontologo}. Tratamiento: {tratamiento}. Llegar 15 min antes. Info: {telefono_contacto}',
 '{"nombre_paciente": "string", "fecha": "date", "hora": "time", "nombre_odontologo": "string", "tratamiento": "string", "direccion_sede": "string", "telefono_contacto": "string"}',
 TRUE),

('Resultados de Tratamiento', 'tratamiento', 'email',
 'Resultados de su Tratamiento - {tratamiento}',
 '<h2>Resultados de Tratamiento</h2><p>Estimado/a {nombre_paciente},</p><p>Su tratamiento de <strong>{tratamiento}</strong> realizado el {fecha} ha sido completado exitosamente.</p><p><strong>Observaciones del Odontólogo:</strong></p><p>{observaciones}</p><p><strong>Recomendaciones de Cuidado:</strong></p><p>{recomendaciones}</p><p><strong>Próxima Cita:</strong> {proxima_cita}</p><p>Si tiene alguna pregunta o molestia, no dude en contactarnos.</p>',
 'Tratamiento {tratamiento} completado el {fecha}. Observaciones: {observaciones}. Próxima cita: {proxima_cita}. Consultas: {telefono_contacto}',
 '{"nombre_paciente": "string", "tratamiento": "string", "fecha": "date", "observaciones": "text", "recomendaciones": "text", "proxima_cita": "string", "telefono_contacto": "string"}',
 TRUE),

-- Plantillas Push
('Nueva Cita Agendada', 'cita', 'push', NULL, NULL,
 'Nueva cita agendada para el {fecha} a las {hora}. Tratamiento: {tratamiento}',
 '{"fecha": "date", "hora": "time", "tratamiento": "string"}',
 TRUE),

('Mensaje de Chat', 'chat', 'push', NULL, NULL,
 'Nuevo mensaje de {remitente}: {mensaje_preview}',
 '{"remitente": "string", "mensaje_preview": "string"}',
 TRUE),

-- Plantillas SMS
('Recordatorio Cita SMS', 'cita', 'sms', NULL, NULL,
 'CLINIKDENT: Recordatorio cita mañana {fecha} {hora} con {odontologo}. {direccion}. Info: {telefono}',
 '{"fecha": "date", "hora": "time", "odontologo": "string", "direccion": "string", "telefono": "string"}',
 TRUE);

-- Configuraciones de notificaciones por defecto para usuarios existentes
INSERT INTO configuracion_notificaciones (usuario_id)
SELECT id FROM usuarios WHERE id NOT IN (SELECT usuario_id FROM configuracion_notificaciones);

-- Recordatorios programados de ejemplo
INSERT INTO recordatorios_programados (usuario_id, tipo_recordatorio, titulo, mensaje, fecha_programada, canales) VALUES
-- Para pacientes existentes
(2, 'revision_periodica', 'Tiempo de Revisión Dental', 
 'Han pasado 6 meses desde su última revisión. Es recomendable agendar una cita de control.',
 DATE_ADD(NOW(), INTERVAL 1 DAY), '["email", "push"]'),

(3, 'seguimiento_tratamiento', 'Seguimiento de Ortodoncia',
 'Control de ortodoncia programado. Por favor agende su cita de seguimiento.',
 DATE_ADD(NOW(), INTERVAL 2 DAY), '["email", "push"]');

-- Mensajes de chat de ejemplo
INSERT INTO mensajes_chat (conversacion_id, remitente_id, destinatario_id, mensaje, tipo_mensaje) VALUES
-- Conversación entre paciente y odontólogo
('conv_2_4', 2, 4, 'Buenos días doctor, tengo una consulta sobre mi tratamiento de ortodoncia.', 'texto'),
('conv_2_4', 4, 2, 'Buenos días! Claro, dígame en qué puedo ayudarle.', 'texto'),
('conv_2_4', 2, 4, '¿Es normal sentir molestias después del ajuste de los brackets?', 'texto'),
('conv_2_4', 4, 2, 'Sí, es completamente normal. Las molestias pueden durar 2-3 días después del ajuste. Puede tomar analgésicos si es necesario.', 'texto'),

-- Conversación entre paciente y administrador
('conv_3_1', 3, 1, 'Hola, necesito reprogramar mi cita de mañana.', 'texto'),
('conv_3_1', 1, 3, 'Por supuesto, ¿qué día le queda mejor?', 'texto'),
('conv_3_1', 3, 1, '¿Tendría disponibilidad el viernes en la mañana?', 'texto');

-- Historial de notificaciones de ejemplo
INSERT INTO historial_notificaciones (usuario_id, tipo_notificacion, categoria, titulo, mensaje, destinatario, estado, enviado_en) VALUES
(2, 'email', 'cita', 'Confirmación de Cita', 'Su cita ha sido confirmada para mañana a las 10:00 AM', 'paciente@email.com', 'entregado', NOW()),
(3, 'push', 'chat', 'Nuevo Mensaje', 'Tiene un nuevo mensaje del Dr. García', 'device_token_123', 'entregado', NOW()),
(4, 'email', 'sistema', 'Nuevo Paciente Asignado', 'Se le ha asignado un nuevo paciente: María López', 'odontologo@email.com', 'leido', DATE_SUB(NOW(), INTERVAL 2 HOUR));

SELECT '✅ Sistema de Comunicaciones y Notificaciones creado exitosamente' as resultado;
SELECT '📱 Tablas creadas: mensajes_chat, configuracion_notificaciones, historial_notificaciones, plantillas_notificaciones, recordatorios_programados, comunicaciones_familiares' as detalle;
SELECT '🎯 Funcionalidad agregada: +6% hacia objetivo 99%' as progreso;
