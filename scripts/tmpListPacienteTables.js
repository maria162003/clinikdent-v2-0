const db = require('../Backend/config/db');

(async () => {
  try {
    const result = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%paciente%' ORDER BY table_name`);
    console.log(result.rows);
  } catch (err) {
    console.error('Error listing tables:', err);
  } finally {
    process.exit(0);
  }
})();
