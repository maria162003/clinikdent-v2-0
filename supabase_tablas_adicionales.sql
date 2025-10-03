-- Tablas adicionales que faltaban del sistema original Clinikdent
-- Ejecutar este script DESPUÉS de supabase_schema.sql y supabase_init_data.sql

CREATE TABLE IF NOT EXISTS planes_tratamiento (
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

CREATE TABLE IF NOT EXISTS tratamientos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  duracion_estimada INTEGER, -- en minutos
  costo_base NUMERIC(12,2),
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paciente_tratamientos (
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

CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(12,2),
  duracion INTEGER, -- en minutos
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS especialidades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS odontologos_especialidades (
  id SERIAL PRIMARY KEY,
  odontologo_id INTEGER REFERENCES usuarios(id),
  especialidad_id INTEGER REFERENCES especialidades(id),
  fecha_certificacion DATE,
  institucion VARCHAR(255),
  numero_certificado VARCHAR(100),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS horarios_trabajo (
  id SERIAL PRIMARY KEY,
  odontologo_id INTEGER REFERENCES usuarios(id),
  sede_id INTEGER REFERENCES sedes(id),
  dia_semana INTEGER, -- 0=domingo, 1=lunes, etc.
  hora_inicio TIME,
  hora_fin TIME,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pagos (
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

CREATE TABLE IF NOT EXISTS planes_pago (
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

CREATE TABLE IF NOT EXISTS cuotas_plan_pago (
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

-- Insertar algunos tratamientos básicos
INSERT INTO tratamientos (nombre, descripcion, duracion_estimada, costo_base, categoria) VALUES
('Limpieza Dental', 'Profilaxis dental completa', 60, 150000, 'Prevención'),
('Obturación Simple', 'Restauración dental con resina', 45, 200000, 'Operatoria'),
('Endodoncia', 'Tratamiento de conductos', 90, 450000, 'Endodoncia'),
('Extracción Simple', 'Extracción dental básica', 30, 180000, 'Cirugía'),
('Corona Dental', 'Corona de porcelana', 60, 800000, 'Prótesis');

-- Insertar especialidades básicas
INSERT INTO especialidades (nombre, descripcion) VALUES
('Odontología General', 'Práctica general odontológica'),
('Endodoncia', 'Especialista en tratamientos de conductos'),
('Cirugía Oral', 'Especialista en procedimientos quirúrgicos'),
('Ortodoncia', 'Especialista en corrección dental'),
('Periodoncia', 'Especialista en enfermedades de las encías');
