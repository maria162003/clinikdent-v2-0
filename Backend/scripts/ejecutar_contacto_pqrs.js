const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function ejecutarScript() {
  try {
    // Configuración de la base de datos usando variables de entorno
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinikdent',
      multipleStatements: true
    });

    console.log('📞 Conectado a la base de datos MySQL');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'crear_tablas_contacto_pqrs.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el script SQL
    console.log('🛠️ Ejecutando script SQL...');
    await connection.execute(sqlScript);

    console.log('✅ Tablas de contacto y PQRS creadas correctamente');
    console.log('📋 Datos de ejemplo insertados');

    // Verificar que las tablas se crearon
    const [tables] = await connection.execute("SHOW TABLES LIKE 'contactos'");
    const [pqrsTables] = await connection.execute("SHOW TABLES LIKE 'pqrs'");

    if (tables.length > 0) {
      console.log('✅ Tabla contactos creada');
    }

    if (pqrsTables.length > 0) {
      console.log('✅ Tabla pqrs actualizada');
    }

    // Cerrar conexión
    await connection.end();
    console.log('🔐 Conexión cerrada');

  } catch (error) {
    console.error('❌ Error al ejecutar el script:', error.message);
    process.exit(1);
  }
}

ejecutarScript();
