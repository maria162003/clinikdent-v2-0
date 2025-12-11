const db = require('../Backend/config/db');
(async () => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM public.pacientes');
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
