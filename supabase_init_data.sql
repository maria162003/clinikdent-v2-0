-- Datos iniciales para Supabase después de crear el esquema
-- Ejecutar este script después de ejecutar supabase_schema.sql

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion, activo) VALUES 
('administrador', 'Administrador del sistema con acceso completo', true),
('odontologo', 'Profesional odontólogo que atiende pacientes', true),
('paciente', 'Usuario paciente que agenda citas', true);

-- Insertar sedes básicas
INSERT INTO sedes (nombre, direccion, telefono, ciudad, activa) VALUES 
('Sede Principal', 'Calle 123 # 45-67', '3001234567', 'Bogotá', true),
('Sede Norte', 'Carrera 78 # 90-12', '3009876543', 'Bogotá', true),
('Sede Sur', 'Avenida 34 # 56-78', '3005551234', 'Bogotá', true);

-- Insertar categorías de inventario
INSERT INTO categorias (nombre, descripcion, color, icono, activa, orden) VALUES
('Equipos Base', 'Categoría con equipos registrados', '#b6d85f', 'bi-tools', true, 10),
('Equipos Menores', 'Categoría con equipos registrados', '#b54e39', 'bi-tools', true, 20),
('Equipos Quirúrgicos', 'Categoría con equipos registrados', '#6d22a8', 'bi-tools', true, 30),
('Esterilización', 'Categoría con equipos registrados', '#d79a31', 'bi-tools', true, 40),
('Iluminación', 'Categoría con equipos registrados', '#961d53', 'bi-tools', true, 50),
('Imagenología', 'Categoría con equipos registrados', '#c835da', 'bi-tools', true, 60),
('Instrumental', 'Categoría con equipos registrados', '#779a0d', 'bi-tools', true, 70),
('Mobiliario', 'Categoría con equipos registrados', '#9d84d9', 'bi-tools', true, 80),
('Instrumental Básico', 'Instrumentos dentales básicos', '#4921ca', 'bi-box', true, 90),
('Anestésicos', 'Productos para anestesia local', '#c19c67', 'bi-box', true, 100),
('Materiales de Curación', 'Materiales para restauraciones', '#50b253', 'bi-box', true, 110),
('Profilaxis', 'Productos para limpieza dental', '#e48d18', 'bi-box', true, 120),
('Endodoncia', 'Materiales para tratamientos de endodoncia', '#9a6671', 'bi-box', true, 130),
('Consumibles', 'Materiales de uso único', '#ffc107', 'bi-box-seam', true, 140),
('Medicamentos', 'Fármacos y medicinas', '#dc3545', 'bi-prescription2', true, 150),
('Material de Oficina', 'Suministros administrativos', '#6c757d', 'bi-file-text', true, 160),
('Limpieza', 'Productos de limpieza y desinfección', '#20c997', 'bi-droplet', true, 170);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, apellido, correo, telefono, numero_documento, tipo_documento, contraseña_hash, rol_id, sede_id, activo) 
VALUES ('Admin', 'Sistema', 'admin@clinikdent.com', '3001234567', '12345678', 'CC', 
        '$2b$10$8K1p/a0dkfqUfQ7JjKl8o.TgPQ6Hzp7i2j1l8KcTNwFoRy1q6GdOu', -- contraseña: admin123
        (SELECT id FROM roles WHERE nombre = 'administrador'),
        (SELECT id FROM sedes WHERE nombre = 'Sede Principal'), 
        true);

-- Insertar algunas FAQs básicas
INSERT INTO faqs (pregunta, respuesta, orden) VALUES
('¿Cuáles son los horarios de atención?', 'Nuestros horarios son de Lunes a Viernes de 7:00 AM a 7:00 PM, y Sábados de 8:00 AM a 2:00 PM.', 1),
('¿Cómo puedo agendar una cita?', 'Puedes agendar tu cita a través de nuestro portal web, llamando al teléfono de contacto, o visitando cualquiera de nuestras sedes.', 2),
('¿Qué métodos de pago aceptan?', 'Aceptamos efectivo, tarjetas de crédito y débito, transferencias bancarias y convenios con entidades de salud.', 3),
('¿Necesito alguna preparación especial antes de mi cita?', 'Para la mayoría de procedimientos no se requiere preparación especial. Sin embargo, es recomendable realizar una buena higiene oral antes de la consulta.', 4),
('¿Ofrecen planes de tratamiento?', 'Sí, ofrecemos planes de tratamiento personalizados que se adaptan a las necesidades y presupuesto de cada paciente.', 5);

-- Insertar FAQs visibles en el sitio principal (si no existen)
-- Nota: Ajusta ON CONFLICT según tu motor (PostgreSQL vs MySQL). A continuación versión estándar que puede requerir adaptación.

-- Orden consolidado del sitio (1..8):
-- 1 ¿Cada cuánto tiempo debo visitar al dentista?
-- 2 ¿Cuáles son sus horarios de atención?
-- 3 ¿Qué formas de pago aceptan?
-- 4 ¿Necesito cita previa para ser atendido?
-- 5 ¿Dónde están ubicados?
-- 6 ¿Qué medidas de bioseguridad manejan?
-- 7 ¿Atienden niños?
-- 8 ¿Qué debo hacer en caso de emergencia dental?

INSERT INTO faqs (pregunta, respuesta, orden)
VALUES
('¿Cada cuánto tiempo debo visitar al dentista?', 'Recomendamos visitas cada 6 meses para controles preventivos y limpiezas dentales. La frecuencia puede variar según tu salud bucal específica.', 1),
('¿Cuáles son sus horarios de atención?', 'Lunes a Viernes: 8:00 AM - 6:00 PM. Sábados: 9:00 AM - 2:00 PM. Domingos: Cerrado. Contamos con servicio de urgencias 24/7.', 2),
('¿Qué formas de pago aceptan?', 'Efectivo, tarjetas de débito y crédito (Visa, Mastercard, American Express), transferencias bancarias y planes de financiamiento.', 3),
('¿Necesito cita previa para ser atendido?', 'Sí, recomendamos cita previa para garantizar la mejor atención. Para urgencias atendemos sin cita.', 4),
('¿Dónde están ubicados?', 'Sede Centro: Calle Principal #123 (555 123-4567). Sede Norte: Av. Salud #456 (555 234-5678). Sede Plaza: Plaza Dental, Local 789 (555 345-6789).', 5),
('¿Qué medidas de bioseguridad manejan?', 'Esterilización de instrumentos, equipos de protección, desinfección de superficies, ventilación adecuada y protocolos sanitarios actualizados.', 6),
('¿Atienden niños?', 'Sí, contamos con odontopediatras, ambiente amigable para niños, técnicas de relajación y tratamientos preventivos. Primera visita recomendada a los 3 años.', 7),
('¿Qué debo hacer en caso de emergencia dental?', 'Llama de inmediato. Aplica frío externo, evita calor, usa analgésicos comunes si es necesario y mantén la calma. Tenemos dentista de guardia 24/7.', 8);
