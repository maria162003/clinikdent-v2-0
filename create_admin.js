const db = require('./Backend/config/db.js');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    // Primero verificar si ya existe
    const { rows: existing } = await db.query('SELECT id FROM usuarios WHERE correo = $1', ['admin@clinikdent.com']);
    if (existing.length > 0) {
      console.log('Usuario admin ya existe con ID:', existing[0].id);
      return;
    }

    // Obtener rol_id de administrador
    const { rows: rolResult } = await db.query('SELECT id FROM roles WHERE nombre = $1', ['administrador']);
    if (rolResult.length === 0) {
      console.log('❌ Rol administrador no encontrado');
      return;
    }
    const rol_id = rolResult[0].id;

    // Crear hash de la contraseña
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Insertar usuario
    const { rows: result } = await db.query(
      'INSERT INTO usuarios (nombre, apellido, correo, contraseña_hash, rol_id, activo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id', 
      ['Camila', 'Perez', 'admin@clinikdent.com', passwordHash, rol_id]
    );
    
    console.log('✅ Usuario admin creado exitosamente:', {
      id: result[0].id,
      nombre: 'Camila',
      apellido: 'Perez',
      correo: 'admin@clinikdent.com'
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
