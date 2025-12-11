const db = require('../Backend/config/db');

(async () => {
  try {
    const result = await db.query(`
      SELECT c.id, c.fecha, c.hora, c.motivo, c.estado,
             p.nombre, p.apellido, r.nombre as rol
      FROM citas c
      JOIN usuarios p ON c.paciente_id = p.id
      JOIN roles r ON p.rol_id = r.id
      WHERE lower(p.correo) = 'camilafontalvolopez@gmail.com'
      ORDER BY c.fecha DESC
    `);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
})();
