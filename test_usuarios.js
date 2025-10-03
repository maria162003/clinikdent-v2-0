const pool = require('./Backend/config/db');

async function testUsuarios() {
    try {
        console.log('🔍 Verificando usuarios...');
        
        // Buscar usuarios con rol odontologo
        const odontologos = await pool.query("SELECT id, nombre, apellido, correo, rol FROM usuarios WHERE rol = 'odontologo'");
        console.log('👨‍⚕️ Odontólogos encontrados:', odontologos.rows);
        
        // Verificar si el usuario específico existe
        const usuarioTest = await pool.query("SELECT * FROM usuarios WHERE correo = 'odontologo@clinikdent.com'");
        console.log('🔍 Usuario test encontrado:', usuarioTest.rows);
        
        if (usuarioTest.rows.length === 0) {
            console.log('⚠️ El usuario de prueba no existe. Creándolo...');
            
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash('123456', saltRounds);
            
            const nuevoUsuario = await pool.query(`
                INSERT INTO usuarios (nombre, apellido, correo, password, rol, activo)
                VALUES ('Carlos', 'Rodriguez', 'odontologo@clinikdent.com', $1, 'odontologo', true)
                RETURNING *
            `, [hashedPassword]);
            
            console.log('✅ Usuario de prueba creado:', nuevoUsuario.rows[0]);
        }
        
    } catch (error) {
        console.error('❌ Error verificando usuarios:', error);
    } finally {
        process.exit(0);
    }
}

testUsuarios();