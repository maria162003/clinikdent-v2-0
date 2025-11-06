const pool = require('./Backend/config/db');

async function checkRoles() {
    try {
        console.log('🔍 Verificando tabla de roles...');
        
        // Ver los roles disponibles
        const roles = await pool.query('SELECT * FROM roles ORDER BY id');
        console.log('👥 Roles disponibles:', roles.rows);
        
        // Ver usuarios con sus roles
        const usuariosConRoles = await pool.query(`
            SELECT u.id, u.nombre, u.apellido, u.correo, r.nombre as rol_nombre, u.rol_id
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id
        `);
        console.log('\n👤 Usuarios con roles:', usuariosConRoles.rows);
        
        // Buscar si existe un odontólogo
        const odontologo = await pool.query(`
            SELECT u.*, r.nombre as rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE r.nombre ILIKE '%odontologo%' OR r.nombre ILIKE '%dentist%'
        `);
        
        console.log('\n🦷 Odontólogos encontrados:', odontologo.rows);
        
        if (odontologo.rows.length === 0) {
            console.log('\n⚠️ No hay odontólogos. Verificando si existe el rol de odontólogo...');
            
            const rolOdontologo = await pool.query("SELECT * FROM roles WHERE nombre ILIKE '%odontologo%'");
            if (rolOdontologo.rows.length > 0) {
                console.log('✅ Rol de odontólogo encontrado:', rolOdontologo.rows[0]);
                
                // Crear usuario odontólogo
                const bcrypt = require('bcrypt');
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash('123456', saltRounds);
                
                const nuevoOdontologo = await pool.query(`
                    INSERT INTO usuarios (nombre, apellido, correo, contraseña_hash, rol_id, activo)
                    VALUES ('Carlos', 'Rodriguez', 'odontologo@clinikdent.com', $1, $2, true)
                    RETURNING *
                `, [hashedPassword, rolOdontologo.rows[0].id]);
                
                console.log('✅ Odontólogo creado:', nuevoOdontologo.rows[0]);
            } else {
                console.log('❌ No existe el rol de odontólogo');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

checkRoles();