/**
 * Script para agregar columna photo_url a la tabla usuarios
 * Permite que odontólogos puedan actualizar su foto de perfil
 */

const db = require('../Backend/config/db');

async function agregarPhotoUrl() {
  console.log('🔧 Iniciando migración: Agregar columna photo_url a usuarios...');
  
  try {
    // Verificar si la columna ya existe
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name = 'photo_url'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ La columna photo_url ya existe en la tabla usuarios');
      process.exit(0);
    }

    // Agregar la columna
    await db.query(`
      ALTER TABLE usuarios ADD COLUMN photo_url VARCHAR(500)
    `);

    console.log('✅ Columna photo_url agregada exitosamente a la tabla usuarios');

    // Agregar comentario
    await db.query(`
      COMMENT ON COLUMN usuarios.photo_url IS 'URL de la foto de perfil del usuario. Permite a odontólogos y otros usuarios personalizar su avatar.'
    `);

    console.log('✅ Comentario agregado a la columna photo_url');
    console.log('🎉 Migración completada exitosamente!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

agregarPhotoUrl();
