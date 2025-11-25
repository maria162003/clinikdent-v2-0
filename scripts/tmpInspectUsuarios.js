const db = require('../Backend/config/db');
(async () => {
  try {
    const result = await db.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='usuarios' ORDER BY ordinal_position`);
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
