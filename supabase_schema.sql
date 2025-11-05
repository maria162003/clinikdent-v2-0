-- Esquema convertido de MariaDB a PostgreSQL para Supabase
-- No incluye datos de prueba, solo estructura

-- Tabla de roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sedes
CREATE TABLE sedes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  ciudad VARCHAR(100),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  numero_documento VARCHAR(50) UNIQUE,
  tipo_documento VARCHAR(20),
  fecha_nacimiento DATE,
  direccion TEXT,
  contraseña_hash VARCHAR(255),
  rol_id INTEGER REFERENCES roles(id),
  sede_id INTEGER REFERENCES sedes(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tokens de recuperación de contraseña
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  token VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registro de actividad
CREATE TABLE registro_actividad (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  accion VARCHAR(255),
  descripcion TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de PQRS
CREATE TABLE pqrs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  numero_radicado VARCHAR(50) UNIQUE,
  tipo VARCHAR(50),
  asunto VARCHAR(255),
  descripcion TEXT,
  estado VARCHAR(50) DEFAULT 'pendiente',
  fecha_respuesta TIMESTAMP,
  respuesta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  contacto VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE archivos_adjuntos (
  id SERIAL PRIMARY KEY,
  fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  descripcion TEXT,
  color VARCHAR(32),
  icono VARCHAR(64),
  activa BOOLEAN,
  orden INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias_inventario (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  descripcion TEXT,
  codigo_categoria VARCHAR(64),
  activa BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id),
  odontologo_id INTEGER REFERENCES usuarios(id),
  fecha DATE,
  hora TIME,
  estado VARCHAR(32),
  motivo TEXT,
  notas TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citas_disponibles (
  id SERIAL PRIMARY KEY,
  odontologo_id INTEGER REFERENCES usuarios(id),
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  disponible BOOLEAN,
  sede_id INTEGER REFERENCES sedes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comisiones_odontologo (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comunicaciones_familiares (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuracion_notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,
  email_nuevas_citas BOOLEAN,
  email_recordatorio_citas BOOLEAN,
  email_cancelacion_citas BOOLEAN,
  email_resultados_tratamientos BOOLEAN,
  email_promociones BOOLEAN,
  push_mensajes_chat BOOLEAN,
  push_recordatorio_citas BOOLEAN,
  push_actualizaciones_sistema BOOLEAN,
  sms_recordatorio_citas BOOLEAN,
  sms_confirmacion_citas BOOLEAN,
  horario_notificaciones_inicio TIME,
  horario_notificaciones_fin TIME,
  dias_anticipacion_recordatorio INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contactos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  correo VARCHAR(255),
  telefono VARCHAR(32),
  servicio_interes VARCHAR(255),
  mensaje TEXT,
  tipo VARCHAR(32),
  estado VARCHAR(32),
  fecha_contacto TIMESTAMP,
  fecha_respuesta TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalles_factura (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER,
  concepto VARCHAR(255),
  descripcion TEXT,
  cantidad INTEGER,
  precio_unitario NUMERIC(12,2),
  subtotal NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  descripcion TEXT,
  fecha_alta DATE,
  categoria VARCHAR(255),
  precio NUMERIC(12,2) DEFAULT 0.00
);

CREATE TABLE evaluaciones (
  id SERIAL PRIMARY KEY,
  cita_id INTEGER,
  paciente_id INTEGER,
  odontologo_id INTEGER,
  calificacion_servicio INTEGER,
  calificacion_odontologo INTEGER,
  comentarios TEXT,
  recomendaria BOOLEAN,
  fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facturas (
  id SERIAL PRIMARY KEY,
  numero_factura VARCHAR(64),
  paciente_id INTEGER,
  odontologo_id INTEGER,
  cita_id INTEGER,
  subtotal NUMERIC(12,2),
  impuestos NUMERIC(12,2),
  total NUMERIC(12,2),
  estado VARCHAR(32),
  fecha_emision TIMESTAMP,
  fecha_vencimiento DATE,
  fecha_pago TIMESTAMP,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  pregunta TEXT,
  respuesta TEXT,
  orden INTEGER
);

CREATE TABLE historial_clinico (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER,
  odontologo_id INTEGER,
  diagnostico TEXT,
  tratamiento_resumido TEXT,
  fecha DATE,
  archivo_adjuntos VARCHAR(255)
);

CREATE TABLE historial_notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,
  tipo_notificacion VARCHAR(64),
  categoria VARCHAR(64),
  titulo VARCHAR(255),
  mensaje TEXT,
  destinatario VARCHAR(255),
  estado VARCHAR(32),
  error_mensaje TEXT,
  metadata TEXT,
  programado_para TIMESTAMP,
  enviado_en TIMESTAMP,
  leido_en TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario (
  id SERIAL PRIMARY KEY,
  categoria_id INTEGER,
  nombre VARCHAR(255),
  descripcion TEXT,
  codigo VARCHAR(64),
  cantidad_actual INTEGER,
  cantidad_minima INTEGER,
  precio_unitario NUMERIC(12,2),
  proveedor VARCHAR(255),
  sede_id INTEGER,
  proveedor_id INTEGER,
  ubicacion VARCHAR(255),
  estado VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario_equipos (
  id SERIAL PRIMARY KEY,
  sede_id INTEGER REFERENCES sedes(id),
  equipo_id INTEGER REFERENCES equipos(id),
  cantidad INTEGER,
  descripcion TEXT
);

-- Tablas adicionales que faltaban del sistema original

CREATE TABLE planes_tratamiento (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id),
  odontologo_id INTEGER REFERENCES usuarios(id),
  nombre VARCHAR(255),
  descripcion TEXT,
  costo_total NUMERIC(12,2),
  estado VARCHAR(50) DEFAULT 'pendiente',
  fecha_inicio DATE,
  fecha_fin_estimada DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tratamientos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  duracion_estimada INTEGER, -- en minutos
  costo_base NUMERIC(12,2),
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE paciente_tratamientos (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id),
  tratamiento_id INTEGER REFERENCES tratamientos(id),
  plan_tratamiento_id INTEGER REFERENCES planes_tratamiento(id),
  odontologo_id INTEGER REFERENCES usuarios(id),
  fecha_inicio DATE,
  fecha_fin DATE,
  estado VARCHAR(50) DEFAULT 'planificado',
  notas TEXT,
  costo_final NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(12,2),
  duracion INTEGER, -- en minutos
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE especialidades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE odontologos_especialidades (
  id SERIAL PRIMARY KEY,
  odontologo_id INTEGER REFERENCES usuarios(id),
  especialidad_id INTEGER REFERENCES especialidades(id),
  fecha_certificacion DATE,
  institucion VARCHAR(255),
  numero_certificado VARCHAR(100),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE horarios_trabajo (
  id SERIAL PRIMARY KEY,
  odontologo_id INTEGER REFERENCES usuarios(id),
  sede_id INTEGER REFERENCES sedes(id),
  dia_semana INTEGER, -- 0=domingo, 1=lunes, etc.
  hora_inicio TIME,
  hora_fin TIME,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER REFERENCES facturas(id),
  paciente_id INTEGER REFERENCES usuarios(id),
  monto NUMERIC(12,2),
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(255),
  estado VARCHAR(50) DEFAULT 'pendiente',
  fecha_pago TIMESTAMP,
  comprobante_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE planes_pago (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id),
  plan_tratamiento_id INTEGER REFERENCES planes_tratamiento(id),
  monto_total NUMERIC(12,2),
  numero_cuotas INTEGER,
  monto_cuota NUMERIC(12,2),
  fecha_inicio DATE,
  estado VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cuotas_plan_pago (
  id SERIAL PRIMARY KEY,
  plan_pago_id INTEGER REFERENCES planes_pago(id),
  numero_cuota INTEGER,
  monto NUMERIC(12,2),
  fecha_vencimiento DATE,
  fecha_pago TIMESTAMP,
  estado VARCHAR(50) DEFAULT 'pendiente',
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
