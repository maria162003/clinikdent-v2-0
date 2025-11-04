console.log('Starting simple debug...');

const db = require('./Backend/config/db');

db.query('SELECT 1 as test')
  .then(result => {
    console.log('DB Connection OK:', result);
    return db.query('SHOW TABLES');
  })
  .then(([tables]) => {
    console.log('Tables:', tables.map(t => Object.values(t)[0]));
    return db.query('DESCRIBE citas');
  })
  .then(([columns]) => {
    console.log('Citas table columns:');
    columns.forEach(col => console.log('-', col.Field, col.Type));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
