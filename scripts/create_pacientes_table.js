const db = require('../Backend/config/db');

(async () => {
  const createSql = `
    CREATE TABLE IF NOT EXISTS public.pacientes (
      usuario_id INTEGER PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
      odontologo_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pacientes_odontologo ON public.pacientes(odontologo_id);
  `;
  try {
    await db.query(createSql);
    console.log('✅ Tabla pacientes verificada/creada.');
  } catch (err) {
    console.error('❌ Error creando tabla pacientes:', err);
  } finally {
    process.exit(0);
  }
})();
