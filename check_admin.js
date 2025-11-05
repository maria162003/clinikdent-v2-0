const db = require('./Backend/config/db.js');

async function checkAdmin() {
  try {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE correo = $1', ['admin@clinikdent.com']);
    if (rows.length > 0) {
      console.log('Usuario admin existe:', { 
        id: rows[0].id, 
        nombre: rows[0].nombre, 
        apellido: rows[0].apellido, 
        correo: rows[0].correo 
      });
    } else {
      console.log('Usuario admin NO existe');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAdmin();
