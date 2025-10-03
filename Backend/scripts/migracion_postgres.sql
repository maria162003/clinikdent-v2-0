CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT,
  password_hash TEXT NOT NULL,
  roles TEXT[] DEFAULT ARRAY['USER'],
  twofa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY,
  paciente_id UUID NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  motivo TEXT,
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas (fecha);
CREATE INDEX IF NOT EXISTS idx_audit_user_action ON audit_log (user_id, action);
