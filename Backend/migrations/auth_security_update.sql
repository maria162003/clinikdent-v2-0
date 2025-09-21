-- Agregar nuevos campos de seguridad a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_failed_attempt TIMESTAMP,
ADD COLUMN IF NOT EXISTS account_lock_until TIMESTAMP;

-- Actualizar la tabla password_reset_tokens
ALTER TABLE password_reset_tokens
ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_is_locked ON usuarios(is_locked);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_is_used ON password_reset_tokens(is_used);