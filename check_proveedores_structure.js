require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function checkProveedoresStructure() {
  try {
    console.log('=== VERIFICANDO ESTRUCTURA DE TABLA PROVEEDORES ===');
    
    // Verificar si la tabla existe
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'proveedores'
      );
    `);
    
    console.log('¿Existe la tabla proveedores?', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Obtener la estructura de la tabla
      const structure = await db.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'proveedores' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\n=== COLUMNAS DE LA TABLA PROVEEDORES ===');
      structure.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
      
      // Intentar obtener todos los datos
      const data = await db.query('SELECT * FROM proveedores LIMIT 5');
      console.log('\n=== DATOS EN LA TABLA (MAX 5) ===');
      console.log(`Total de filas: ${data.rowCount}`);
      if (data.rows.length > 0) {
        console.log('Datos:', data.rows);
      } else {
        console.log('No hay datos en la tabla');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
  }
}

checkProveedoresStructure();