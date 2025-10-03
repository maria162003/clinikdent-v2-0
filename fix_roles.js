const db = require('./Backend/config/db');

async function corregirRoles() {
    try {
        console.log('=== CORRIGIENDO ROLES DE USUARIOS ===');
        
        // Camila será ADMINISTRADOR (rol_id = 3)
        await db.query('UPDATE usuarios SET rol_id = 3 WHERE correo = ?', ['camila@example.com']);
        console.log('✅ camila@example.com → ADMINISTRADOR');
        
        // Juan será PACIENTE (rol_id = 1)  
        await db.query('UPDATE usuarios SET rol_id = 1 WHERE correo = ?', ['juan@example.com']);
        console.log('✅ juan@example.com → PACIENTE');
        
        console.log('\n=== VERIFICANDO USUARIOS PRINCIPALES ===');
        const [usuarios] = await db.query(`
            SELECT u.correo, r.nombre as rol, u.nombre, u.apellido 
            FROM usuarios u 
            LEFT JOIN roles r ON u.rol_id = r.id 
            WHERE u.correo IN (?, ?, ?)
            ORDER BY u.correo
        `, ['camila@example.com', 'juan@example.com', 'fernanda@example.com']);
        
        usuarios.forEach(u => {
            console.log(`Email: ${u.correo} | Rol: ${u.rol} | Nombre: ${u.nombre} ${u.apellido}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

corregirRoles();
