const { Pool } = require('pg');const { Pool } = require('pg');

require('dotenv').config();require('dotenv').config();



const pool = new Pool({const pool = new Pool({

  host: process.env.PGHOST,  host: process.env.PGHOST,

  user: process.env.PGUSER,  user: process.env.PGUSER,

  password: process.env.PGPASSWORD,  password: process.env.PGPASSWORD,

  database: process.env.PGDATABASE,  database: process.env.PGDATABASE,

  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,

  max: 10,  max: 10,

  idleTimeoutMillis: 30000,  idleTimeoutMillis: 30000,

  family: 4  family: 4

});});



async function checkUsuariosTable() {async function checkUsuariosTable() {

  try {  try {

    console.log('🔍 Verificando estructura de tabla usuarios...');    console.log(' Verificando estructura de tabla usuarios...');

        

    // Obtener la estructura de la tabla usuarios    // Obtener la estructura de la tabla usuarios

    const result = await pool.query(`    const result = await pool.query(

      SELECT column_name, data_type, is_nullable, column_default       SELECT column_name, data_type, is_nullable, column_default 

      FROM information_schema.columns       FROM information_schema.columns 

      WHERE table_name = 'usuarios'       WHERE table_name = 'usuarios' 

      ORDER BY ordinal_position;      ORDER BY ordinal_position;

    `);    );

        

    console.log('📋 Columnas de la tabla usuarios:');    console.log(' Columnas de la tabla usuarios:');

    result.rows.forEach(row => {    result.rows.forEach(row => {

      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);      console.log(  - :  (nullable: ));

    });    });

        

    // Verificar datos de ejemplo    // Verificar datos de ejemplo

    console.log('\n👥 Datos de ejemplo en usuarios:');    console.log('\n Datos de ejemplo en usuarios:');

    const userData = await pool.query('SELECT * FROM usuarios LIMIT 3');    const userData = await pool.query('SELECT * FROM usuarios LIMIT 3');

    console.log(userData.rows);    console.log(userData.rows);

        

  } catch (error) {  } catch (error) {

    console.error('❌ Error:', error.message);    console.error(' Error:', error.message);

  } finally {  } finally {

    await pool.end();    await pool.end();

  }  }

}}



checkUsuariosTable();checkUsuariosTable();
