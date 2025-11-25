const db = require('../Backend/config/db');

(async () => {
  try {
    // obtener pacientes
    const pacientes = await db.query(`SELECT u.id FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = 'paciente' LIMIT 10`);
    if (pacientes.rowCount === 0) {
      console.log('No hay pacientes para asignar');
      process.exit(0);
    }
    const odontologos = await db.query(`SELECT u.id FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = 'odontologo' LIMIT 10`);
    if (odontologos.rowCount === 0) {
      console.log('No hay odontólogos disponibles');
      process.exit(0);
    }
    for (let i = 0; i < pacientes.rows.length; i++) {
      const pacienteId = pacientes.rows[i].id;
      const odontologoId = odontologos.rows[i % odontologos.rows.length].id;
      await db.query(`INSERT INTO pacientes (usuario_id, odontologo_id) VALUES ($1, $2)
        ON CONFLICT (usuario_id) DO UPDATE SET odontologo_id = EXCLUDED.odontologo_id, updated_at = NOW()`, [pacienteId, odontologoId]);
      console.log(`Asignado paciente ${pacienteId} -> odontólogo ${odontologoId}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
