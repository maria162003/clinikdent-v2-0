const db = require('../Backend/config/db');

(async () => {
  try {
    console.log('🔄 Iniciando migración: Agregar columna estado a historial_clinico\n');
    
    // Verificar que la columna no existe antes de agregarla
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'historial_clinico' 
      AND column_name = 'estado'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️ La columna "estado" ya existe en historial_clinico');
      console.log('✅ No es necesario ejecutar la migración');
      await db.end();
      return;
    }
    
    console.log('📝 Agregando columna estado a historial_clinico...');
    
    // Agregar la columna estado
    await db.query(`
      ALTER TABLE historial_clinico 
      ADD COLUMN estado VARCHAR(50) DEFAULT 'en_proceso'
    `);
    
    console.log('✅ Columna "estado" agregada exitosamente');
    
    // Actualizar registros existentes
    const updateResult = await db.query(`
      UPDATE historial_clinico 
      SET estado = 'en_proceso' 
      WHERE estado IS NULL
    `);
    
    console.log(`✅ ${updateResult.rowCount} registros actualizados con estado 'en_proceso'`);
    
    // Verificar la estructura final
    console.log('\n📊 Verificando estructura final...');
    const verifyResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'historial_clinico' 
      AND column_name = 'estado'
    `);
    
    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log('\n✅ Columna verificada:');
      console.log(`  - Nombre: ${col.column_name}`);
      console.log(`  - Tipo: ${col.data_type}`);
      console.log(`  - Permite NULL: ${col.is_nullable}`);
      console.log(`  - Valor por defecto: ${col.column_default}`);
    }
    
    console.log('\n🎉 Migración completada exitosamente');
    console.log('\n💡 Valores válidos para estado:');
    console.log('  - en_proceso: Tratamiento en curso');
    console.log('  - completado: Tratamiento finalizado');
    console.log('  - pausado: Tratamiento pausado temporalmente');
    
    await db.end();
  } catch (err) {
    console.error('❌ Error durante la migración:', err.message);
    console.error('Stack trace:', err.stack);
    await db.end();
    process.exit(1);
  }
})();
