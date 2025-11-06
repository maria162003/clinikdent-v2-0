const pool = require('./Backend/config/db');
const bcrypt = require('bcrypt');

async function testPasswords() {
    try {
        console.log('🔍 Probando contraseñas para el odontólogo...');
        
        // Obtener el hash de la contraseña del odontólogo
        const usuario = await pool.query("SELECT * FROM usuarios WHERE correo = 'carlos@gmail.com'");
        
        if (usuario.rows.length === 0) {
            console.log('❌ Usuario no encontrado');
            return;
        }
        
        console.log('👤 Usuario encontrado:', {
            id: usuario.rows[0].id,
            nombre: usuario.rows[0].nombre,
            correo: usuario.rows[0].correo
        });
        
        const hashAlmacenado = usuario.rows[0].contraseña_hash;
        console.log('🔒 Hash almacenado:', hashAlmacenado);
        
        // Probar contraseñas comunes
        const contraseñasComunes = ['123456', 'password', 'carlos', 'carlos123', 'admin', '1234'];
        
        for (const password of contraseñasComunes) {
            try {
                const esCorrecta = await bcrypt.compare(password, hashAlmacenado);
                console.log(`🔑 Probando "${password}":`, esCorrecta ? '✅ CORRECTA' : '❌ Incorrecta');
                
                if (esCorrecta) {
                    console.log(`\n🎉 ¡Contraseña encontrada! "${password}"`);
                    break;
                }
            } catch (error) {
                console.log(`❌ Error probando "${password}":`, error.message);
            }
        }
        
        console.log('\n💡 Si ninguna contraseña funciona, podemos crear una nueva...');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

testPasswords();