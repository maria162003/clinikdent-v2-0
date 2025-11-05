const db = require('./Backend/config/db.js');

async function addEquipoData() {
  try {
    // Insertar equipos de prueba basados en la estructura real de la tabla
    const equipos = [
      {
        nombre: 'Silla Dental Eléctrica Premium',
        descripcion: 'Silla dental eléctrica con sistema de posicionamiento automático y control digital',
        fecha_alta: '2024-01-15',
        categoria: 'Equipo Médico',
        precio: 15000000
      },
      {
        nombre: 'Compresor de Aire Silencioso',
        descripcion: 'Compresor de aire libre de aceite, silencioso, para uso dental',
        fecha_alta: '2024-02-10',
        categoria: 'Equipo de Apoyo',
        precio: 3500000
      },
      {
        nombre: 'Autoclave Digital 18L',
        descripcion: 'Autoclave digital de 18 litros con ciclos programables y validación',
        fecha_alta: '2024-03-05',
        categoria: 'Esterilización',
        precio: 2800000
      },
      {
        nombre: 'Lámpara de Polimerización LED',
        descripcion: 'Lámpara LED de alta potencia para polimerización de resinas',
        fecha_alta: '2024-04-20',
        categoria: 'Instrumental',
        precio: 850000
      },
      {
        nombre: 'Ultrasonido Dental Piezo',
        descripcion: 'Sistema de ultrasonido piezoeléctrico para limpieza dental',
        fecha_alta: '2024-05-15',
        categoria: 'Instrumental',
        precio: 1200000
      },
      {
        nombre: 'Rayos X Intraoral Digital',
        descripcion: 'Sistema de rayos X intraoral digital con sensor CCD',
        fecha_alta: '2024-06-10',
        categoria: 'Diagnóstico',
        precio: 8500000
      },
      {
        nombre: 'Micromotor Endodóntico',
        descripcion: 'Micromotor para endodoncia con control de torque y velocidad',
        fecha_alta: '2024-07-05',
        categoria: 'Instrumental',
        precio: 2200000
      }
    ];
    
    for (const equipo of equipos) {
      await db.query(`
        INSERT INTO equipos (nombre, descripcion, fecha_alta, categoria, precio)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        equipo.nombre, equipo.descripcion, equipo.fecha_alta, 
        equipo.categoria, equipo.precio
      ]);
    }
    
    console.log('✅ Equipos de prueba insertados exitosamente');
    
    // Verificar la inserción
    const result = await db.query('SELECT COUNT(*) as count FROM equipos');
    console.log('Total equipos después de inserción:', result.rows[0].count);
    
    // Mostrar algunos equipos insertados
    const sample = await db.query('SELECT * FROM equipos LIMIT 3');
    console.log('Equipos insertados (muestra):');
    sample.rows.forEach(equipo => {
      console.log(`- ${equipo.nombre} (${equipo.categoria}) - $${equipo.precio.toLocaleString()}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

addEquipoData();
