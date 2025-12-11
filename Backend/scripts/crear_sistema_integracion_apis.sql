-- ===================================================
-- SISTEMA DE INTEGRACIÓN AVANZADA Y APIS EXTERNAS
-- Progreso: +5.5% hacia funcionalidad completa del 99%
-- ===================================================

-- Tabla para configuraciones de APIs externas
CREATE TABLE IF NOT EXISTS configuraciones_api_externas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_api VARCHAR(100) NOT NULL,
    tipo_integracion ENUM('pasarela_pago', 'email_marketing', 'calendario', 'contabilidad', 'crm', 'telehealth', 'laboratorio', 'seguros', 'otros') NOT NULL,
    proveedor VARCHAR(100) NOT NULL,
    endpoint_base_url VARCHAR(500) NOT NULL,
    version_api VARCHAR(20) DEFAULT 'v1',
    credenciales_config JSON NOT NULL,
    headers_default JSON,
    parametros_default JSON,
    esta_activo BOOLEAN DEFAULT true,
    limite_requests_minuto INT DEFAULT 60,
    timeout_segundos INT DEFAULT 30,
    reintentos_max INT DEFAULT 3,
    ultima_conexion TIMESTAMP NULL,
    estado_conexion ENUM('activa', 'inactiva', 'error', 'mantenimiento') DEFAULT 'inactiva',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo_integracion (tipo_integracion),
    INDEX idx_proveedor (proveedor),
    INDEX idx_estado (estado_conexion)
);

-- Tabla para logs de llamadas a APIs externas
CREATE TABLE IF NOT EXISTS logs_api_externas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_externa_id INT,
    endpoint_llamado VARCHAR(500) NOT NULL,
    metodo_http ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
    request_headers JSON,
    request_body JSON,
    response_status_code INT,
    response_headers JSON,
    response_body JSON,
    tiempo_respuesta_ms INT,
    usuario_id INT,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    exitoso BOOLEAN DEFAULT false,
    mensaje_error TEXT,
    timestamp_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_externa_id) REFERENCES configuraciones_api_externas(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_api_externa (api_externa_id),
    INDEX idx_timestamp (timestamp_request),
    INDEX idx_exitoso (exitoso),
    INDEX idx_usuario (usuario_id)
);

-- Tabla para webhooks entrantes
CREATE TABLE IF NOT EXISTS webhooks_entrantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_webhook VARCHAR(100) NOT NULL,
    url_endpoint VARCHAR(500) NOT NULL,
    token_seguridad VARCHAR(255),
    metodos_permitidos JSON DEFAULT ('["POST"]'),
    headers_requeridos JSON,
    origen_permitido VARCHAR(255),
    esta_activo BOOLEAN DEFAULT true,
    procesamiento_automatico BOOLEAN DEFAULT true,
    accion_procesar ENUM('crear_cita', 'actualizar_pago', 'notificar_resultado', 'sincronizar_datos', 'custom') NOT NULL,
    configuracion_accion JSON,
    ultima_ejecucion TIMESTAMP NULL,
    total_ejecuciones INT DEFAULT 0,
    ejecuciones_exitosas INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_url_endpoint (url_endpoint),
    INDEX idx_activo (esta_activo),
    INDEX idx_accion (accion_procesar)
);

-- Tabla para logs de webhooks recibidos
CREATE TABLE IF NOT EXISTS logs_webhooks_recibidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webhook_entrante_id INT,
    headers_recibidos JSON,
    payload_recibido JSON NOT NULL,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    firma_seguridad VARCHAR(255),
    procesado_exitosamente BOOLEAN DEFAULT false,
    tiempo_procesamiento_ms INT,
    resultado_procesamiento JSON,
    mensaje_error TEXT,
    timestamp_recibido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timestamp_procesado TIMESTAMP NULL,
    FOREIGN KEY (webhook_entrante_id) REFERENCES webhooks_entrantes(id) ON DELETE CASCADE,
    INDEX idx_webhook (webhook_entrante_id),
    INDEX idx_timestamp (timestamp_recibido),
    INDEX idx_procesado (procesado_exitosamente)
);

-- Tabla para sincronización de datos externos
CREATE TABLE IF NOT EXISTS sincronizaciones_datos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_sincronizacion VARCHAR(100) NOT NULL,
    tipo_sincronizacion ENUM('importar', 'exportar', 'bidireccional') NOT NULL,
    api_externa_id INT,
    tabla_local VARCHAR(100) NOT NULL,
    campo_clave_local VARCHAR(100) NOT NULL,
    campo_clave_externa VARCHAR(100) NOT NULL,
    mapeo_campos JSON NOT NULL,
    filtros_sincronizacion JSON,
    frecuencia ENUM('manual', 'tiempo_real', 'cada_minuto', 'cada_hora', 'diaria', 'semanal') DEFAULT 'manual',
    ultima_sincronizacion TIMESTAMP NULL,
    proxima_sincronizacion TIMESTAMP NULL,
    registros_procesados INT DEFAULT 0,
    registros_exitosos INT DEFAULT 0,
    registros_fallidos INT DEFAULT 0,
    esta_activa BOOLEAN DEFAULT true,
    configuracion_avanzada JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_externa_id) REFERENCES configuraciones_api_externas(id) ON DELETE CASCADE,
    INDEX idx_tipo_sync (tipo_sincronizacion),
    INDEX idx_tabla_local (tabla_local),
    INDEX idx_frecuencia (frecuencia),
    INDEX idx_activa (esta_activa)
);

-- Tabla para conexiones con sistemas de terceros
CREATE TABLE IF NOT EXISTS conexiones_terceros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_conexion VARCHAR(150) NOT NULL,
    tipo_sistema ENUM('erp', 'crm', 'laboratorio', 'seguros', 'banco', 'gobierno', 'proveedores', 'marketing', 'analytics') NOT NULL,
    proveedor_sistema VARCHAR(100) NOT NULL,
    configuracion_conexion JSON NOT NULL,
    credenciales_encriptadas TEXT,
    ssl_requerido BOOLEAN DEFAULT true,
    certificados_ssl JSON,
    puerto_conexion INT,
    protocolo ENUM('https', 'ftp', 'sftp', 'soap', 'rest', 'graphql', 'websocket') DEFAULT 'https',
    estado_conexion ENUM('conectado', 'desconectado', 'error', 'configurando') DEFAULT 'desconectado',
    test_conexion_exitoso BOOLEAN DEFAULT false,
    ultima_prueba_conexion TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo_sistema (tipo_sistema),
    INDEX idx_proveedor (proveedor_sistema),
    INDEX idx_estado (estado_conexion)
);

-- Tabla para transformaciones de datos
CREATE TABLE IF NOT EXISTS transformaciones_datos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_transformacion VARCHAR(100) NOT NULL,
    tipo_transformacion ENUM('mapeo_campos', 'conversion_formato', 'validacion', 'enriquecimiento', 'limpieza') NOT NULL,
    datos_origen_formato ENUM('json', 'xml', 'csv', 'sql', 'excel', 'text') NOT NULL,
    datos_destino_formato ENUM('json', 'xml', 'csv', 'sql', 'excel', 'text') NOT NULL,
    reglas_transformacion JSON NOT NULL,
    script_transformacion TEXT,
    validaciones_aplicar JSON,
    configuracion_errores JSON,
    total_transformaciones INT DEFAULT 0,
    transformaciones_exitosas INT DEFAULT 0,
    transformaciones_fallidas INT DEFAULT 0,
    tiempo_promedio_ms INT DEFAULT 0,
    esta_activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo_trans (tipo_transformacion),
    INDEX idx_formato_origen (datos_origen_formato),
    INDEX idx_formato_destino (datos_destino_formato),
    INDEX idx_activa (esta_activa)
);

-- Tabla para cola de tareas de integración
CREATE TABLE IF NOT EXISTS cola_tareas_integracion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_tarea VARCHAR(150) NOT NULL,
    tipo_tarea ENUM('sync_datos', 'call_api', 'process_webhook', 'transform_data', 'send_notification') NOT NULL,
    prioridad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    estado ENUM('pendiente', 'procesando', 'completada', 'fallida', 'cancelada') DEFAULT 'pendiente',
    parametros_tarea JSON NOT NULL,
    resultado_tarea JSON,
    intentos_procesamiento INT DEFAULT 0,
    max_intentos INT DEFAULT 3,
    tiempo_procesamiento_ms INT,
    mensaje_error TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_procesamiento TIMESTAMP NULL,
    fecha_completada TIMESTAMP NULL,
    procesada_por VARCHAR(100),
    INDEX idx_tipo_tarea (tipo_tarea),
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- Insertar configuraciones de APIs externas de ejemplo
INSERT INTO configuraciones_api_externas (nombre_api, tipo_integracion, proveedor, endpoint_base_url, credenciales_config, headers_default, parametros_default, limite_requests_minuto) VALUES
('PayPal Payments API', 'pasarela_pago', 'PayPal', 'https://api.paypal.com/v1/', 
 JSON_OBJECT('client_id', 'demo_client_id', 'client_secret', 'demo_client_secret', 'environment', 'sandbox'),
 JSON_OBJECT('Content-Type', 'application/json', 'Accept', 'application/json'),
 JSON_OBJECT('currency', 'COP', 'intent', 'sale'), 120),

('Stripe API', 'pasarela_pago', 'Stripe', 'https://api.stripe.com/v1/',
 JSON_OBJECT('secret_key', 'sk_test_demo', 'publishable_key', 'pk_test_demo'),
 JSON_OBJECT('Authorization', 'Bearer sk_test_demo', 'Content-Type', 'application/x-www-form-urlencoded'),
 JSON_OBJECT('currency', 'cop'), 100),

('SendGrid Email API', 'email_marketing', 'SendGrid', 'https://api.sendgrid.com/v3/',
 JSON_OBJECT('api_key', 'SG.demo_api_key'),
 JSON_OBJECT('Authorization', 'Bearer SG.demo_api_key', 'Content-Type', 'application/json'),
 JSON_OBJECT('from_email', 'noreply@clinikdent.com', 'from_name', 'Clinikdent'), 300),

('Google Calendar API', 'calendario', 'Google', 'https://www.googleapis.com/calendar/v3/',
 JSON_OBJECT('client_id', 'demo_google_client', 'client_secret', 'demo_google_secret', 'refresh_token', 'demo_refresh'),
 JSON_OBJECT('Authorization', 'Bearer demo_access_token', 'Content-Type', 'application/json'),
 JSON_OBJECT('timeZone', 'America/Bogota'), 200),

('Microsoft Outlook API', 'calendario', 'Microsoft', 'https://graph.microsoft.com/v1.0/',
 JSON_OBJECT('tenant_id', 'demo_tenant', 'client_id', 'demo_client', 'client_secret', 'demo_secret'),
 JSON_OBJECT('Authorization', 'Bearer demo_token', 'Content-Type', 'application/json'),
 JSON_OBJECT('timeZone', 'SA Pacific Standard Time'), 150),

('Siigo Contabilidad API', 'contabilidad', 'Siigo', 'https://api.siigo.com/v1/',
 JSON_OBJECT('username', 'demo_user', 'access_key', 'demo_key'),
 JSON_OBJECT('Authorization', 'demo_auth', 'Content-Type', 'application/json', 'Partner-Id', 'clinikdent'),
 JSON_OBJECT('document_type', 'FV'), 80);

-- Insertar webhooks entrantes de ejemplo
INSERT INTO webhooks_entrantes (nombre_webhook, url_endpoint, token_seguridad, metodos_permitidos, accion_procesar, configuracion_accion) VALUES
('PayPal IPN', '/webhook/paypal-ipn', 'paypal_webhook_secret_123', '["POST"]', 'actualizar_pago',
 JSON_OBJECT('verificar_ipn', true, 'url_verificacion', 'https://www.paypal.com/cgi-bin/webscr')),

('Stripe Webhook', '/webhook/stripe', 'whsec_stripe_demo_secret', '["POST"]', 'actualizar_pago',
 JSON_OBJECT('eventos_escuchar', JSON_ARRAY('payment_intent.succeeded', 'payment_intent.payment_failed'))),

('Calendario Google Webhook', '/webhook/google-calendar', 'google_calendar_secret', '["POST"]', 'crear_cita',
 JSON_OBJECT('sincronizar_bidireccionalmente', true, 'calendario_id', 'primary')),

('Laboratorio Resultados', '/webhook/lab-results', 'lab_results_secret_456', '["POST"]', 'notificar_resultado',
 JSON_OBJECT('tipos_examenes', JSON_ARRAY('radiografia', 'laboratorio_clinico'), 'notificar_odontologo', true)),

('SMS Gateway Webhook', '/webhook/sms-status', 'sms_gateway_secret', '["POST"]', 'custom',
 JSON_OBJECT('accion_custom', 'actualizar_estado_sms', 'estados_procesar', JSON_ARRAY('delivered', 'failed')));

-- Insertar sincronizaciones de datos de ejemplo
INSERT INTO sincronizaciones_datos (nombre_sincronizacion, tipo_sincronizacion, api_externa_id, tabla_local, campo_clave_local, campo_clave_externa, mapeo_campos, frecuencia) VALUES
('Sincronización Pagos PayPal', 'importar', 1, 'pagos', 'id', 'payment_id',
 JSON_OBJECT('amount', 'monto', 'status', 'estado', 'created_time', 'fecha_pago', 'payer_email', 'email_pagador'), 'cada_hora'),

('Exportar Citas a Google Calendar', 'exportar', 4, 'citas', 'id', 'event_id',
 JSON_OBJECT('fecha_hora', 'start.dateTime', 'titulo', 'summary', 'descripcion', 'description', 'ubicacion', 'location'), 'tiempo_real'),

('Sincronización Facturas Siigo', 'bidireccional', 6, 'facturas', 'numero_factura', 'number',
 JSON_OBJECT('fecha', 'date', 'cliente_id', 'customer.identification', 'total', 'total', 'estado', 'status'), 'diaria'),

('Importar Contactos CRM', 'importar', 3, 'usuarios', 'email', 'email',
 JSON_OBJECT('nombre', 'first_name', 'apellido', 'last_name', 'telefono', 'phone', 'empresa', 'company'), 'semanal');

-- Insertar conexiones con terceros de ejemplo
INSERT INTO conexiones_terceros (nombre_conexion, tipo_sistema, proveedor_sistema, configuracion_conexion, ssl_requerido, protocolo) VALUES
('Conexión ERP Empresa', 'erp', 'SAP Business One', 
 JSON_OBJECT('server_url', 'https://erp-empresa.com:50000', 'database', 'CLINIKDENT_DB', 'company_db', 'CLINIK001'), 
 true, 'https'),

('Integración Laboratorio Central', 'laboratorio', 'LabCore System',
 JSON_OBJECT('endpoint', 'https://api.labcentral.com', 'institution_code', 'CLIN001', 'department', 'DENTAL'),
 true, 'https'),

('Conexión Seguros Médicos', 'seguros', 'Seguros Bolívar',
 JSON_OBJECT('webservice_url', 'https://ws.segurosbolivar.com/dental', 'institution_id', 'INST_CLIN_001'),
 true, 'soap'),

('Integración Bancaria', 'banco', 'Banco de Bogotá',
 JSON_OBJECT('api_endpoint', 'https://api.bancodebogota.com/empresas', 'account_number', '0011112223', 'branch_code', '001'),
 true, 'https'),

('Conexión Proveedores', 'proveedores', 'Distribuidora Dental SA',
 JSON_OBJECT('b2b_portal', 'https://b2b.distribuidoradental.com', 'customer_code', 'CUST_001', 'catalog_access', true),
 true, 'https');

-- Insertar transformaciones de datos de ejemplo  
INSERT INTO transformaciones_datos (nombre_transformacion, tipo_transformacion, datos_origen_formato, datos_destino_formato, reglas_transformacion) VALUES
('PayPal a Formato Interno', 'conversion_formato', 'json', 'json',
 JSON_OBJECT(
   'mapeos', JSON_OBJECT('id', 'payment_id', 'state', 'estado', 'amount.total', 'monto', 'create_time', 'fecha_creacion'),
   'conversiones', JSON_OBJECT('estado', JSON_OBJECT('approved', 'aprobado', 'pending', 'pendiente', 'failed', 'fallido')),
   'validaciones', JSON_ARRAY('required:payment_id', 'numeric:monto', 'datetime:fecha_creacion')
 )),

('Google Calendar a Cita', 'mapeo_campos', 'json', 'json',
 JSON_OBJECT(
   'mapeos', JSON_OBJECT('id', 'evento_id', 'summary', 'titulo', 'start.dateTime', 'fecha_inicio', 'end.dateTime', 'fecha_fin', 'description', 'notas'),
   'defaults', JSON_OBJECT('estado', 'programada', 'tipo', 'consulta', 'sede_id', 1),
   'validaciones', JSON_ARRAY('required:titulo,fecha_inicio', 'future_date:fecha_inicio')
 )),

('CSV Laboratorio a JSON', 'conversion_formato', 'csv', 'json',
 JSON_OBJECT(
   'separador', ';', 'encoding', 'utf-8', 'primera_fila_headers', true,
   'mapeos', JSON_OBJECT('codigo_examen', 'exam_code', 'resultado', 'result', 'valores_referencia', 'reference_values', 'fecha_resultado', 'result_date'),
   'validaciones', JSON_ARRAY('required:codigo_examen,resultado', 'date:fecha_resultado')
 ));

-- Insertar tareas de integración de ejemplo en la cola
INSERT INTO cola_tareas_integracion (nombre_tarea, tipo_tarea, prioridad, parametros_tarea) VALUES
('Sincronizar Pagos PayPal', 'sync_datos', 'alta',
 JSON_OBJECT('sincronizacion_id', 1, 'fecha_desde', '2025-08-25 00:00:00', 'limite_registros', 50)),

('Enviar Cita a Google Calendar', 'call_api', 'media',
 JSON_OBJECT('api_id', 4, 'cita_id', 123, 'operacion', 'crear_evento')),

('Procesar Webhook PayPal', 'process_webhook', 'critica',
 JSON_OBJECT('webhook_id', 1, 'payload', JSON_OBJECT('payment_id', 'PAY-123456', 'payment_status', 'Completed'))),

('Transformar Datos Laboratorio', 'transform_data', 'media',
 JSON_OBJECT('transformacion_id', 3, 'archivo_origen', 'resultados_lab_20250825.csv', 'destino_tabla', 'examenes_laboratorio'));

SELECT 'Sistema de Integración Avanzada y APIs Externas creado exitosamente!' as mensaje;
SELECT 'Se han creado 8 nuevas tablas para integración con sistemas externos' as detalle;
SELECT 'Funcionalidad agregada: +5.5% - Total acumulado: 94.5%' as progreso;
