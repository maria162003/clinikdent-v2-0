// Script para crear tabla de configuración del sistema
const db = require('../Backend/config/db');

async function crearTablaConfiguracion() {
  console.log('📋 Creando tabla de configuración del sistema...');
  
  try {
    // Crear tabla configuracion_sistema
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS configuracion_sistema (
        id SERIAL PRIMARY KEY,
        clave VARCHAR(100) UNIQUE NOT NULL,
        valor TEXT,
        tipo VARCHAR(50) DEFAULT 'string',
        descripcion TEXT,
        actualizado_por INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(createTableQuery);
    console.log('✅ Tabla configuracion_sistema creada exitosamente');
    
    // Insertar configuraciones predeterminadas
    const configDefaults = [
      // Horarios
      { clave: 'horario_apertura', valor: '08:00', tipo: 'time', descripcion: 'Hora de apertura de la clínica' },
      { clave: 'horario_cierre', valor: '18:00', tipo: 'time', descripcion: 'Hora de cierre de la clínica' },
      { clave: 'dias_atencion', valor: JSON.stringify(['Lun', 'Mar', 'Mie', 'Jue', 'Vie']), tipo: 'json', descripcion: 'Días de atención' },
      
      // Notificaciones
      { clave: 'notif_sms_enabled', valor: 'true', tipo: 'boolean', descripcion: 'Habilitar recordatorios por SMS' },
      { clave: 'notif_email_enabled', valor: 'true', tipo: 'boolean', descripcion: 'Habilitar recordatorios por Email' },
      { clave: 'notif_horas_anticipacion', valor: '24', tipo: 'number', descripcion: 'Horas de anticipación para recordatorios' },
      
      // Cancelación
      { clave: 'cancelacion_permitida', valor: 'true', tipo: 'boolean', descripcion: 'Permitir cancelación de citas' },
      { clave: 'cancelacion_horas_min', valor: '2', tipo: 'number', descripcion: 'Horas mínimas de anticipación para cancelar' },
      { clave: 'cancelacion_penalizacion', valor: '0', tipo: 'number', descripcion: 'Porcentaje de penalización' },
      
      // General
      { clave: 'clinica_nombre', valor: 'ClinikDent', tipo: 'string', descripcion: 'Nombre de la clínica' },
      { clave: 'clinica_logo_url', valor: '', tipo: 'string', descripcion: 'URL del logo de la clínica' },
      { clave: 'clinica_color_primario', valor: '#0ea5e9', tipo: 'string', descripcion: 'Color primario del branding' }
    ];
    
    console.log('📝 Insertando configuraciones predeterminadas...');
    
    for (const config of configDefaults) {
      const insertQuery = `
        INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (clave) DO NOTHING
      `;
      
      await db.query(insertQuery, [config.clave, config.valor, config.tipo, config.descripcion]);
    }
    
    console.log('✅ Configuraciones predeterminadas insertadas');
    
    // Verificar las configuraciones
    const result = await db.query('SELECT * FROM configuracion_sistema ORDER BY clave');
    console.log(`\n📊 Total de configuraciones: ${result.rows.length}`);
    console.log('\n🔍 Configuraciones actuales:');
    result.rows.forEach(config => {
      console.log(`   ${config.clave}: ${config.valor} (${config.tipo})`);
    });
    
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creando tabla de configuración:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

crearTablaConfiguracion();
