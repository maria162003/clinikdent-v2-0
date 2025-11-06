/**
 * Script para probar el login unificado
 */

async function testUnifiedLogin() {
    console.log('🧪 Probando sistema de login unificado...\n');
    
    const testCases = [
        {
            correo: 'admin@clinikdent.com',
            password: 'admin123',
            descripcion: 'Login de administrador sin especificar rol'
        },
        {
            correo: 'juan.perez@gmail.com', 
            password: 'paciente123',
            descripcion: 'Login de paciente sin especificar rol'
        },
        {
            correo: 'carlos.rodriguez@clinikdent.com',
            password: 'odontologo123', 
            descripcion: 'Login de odontólogo sin especificar rol'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n📝 ${testCase.descripcion}`);
        console.log(`   Email: ${testCase.correo}`);
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correo: testCase.correo,
                    password: testCase.password
                    // Nota: No se envía 'rol' - se detecta automáticamente
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`   ✅ ${data.msg}`);
                console.log(`   👤 Usuario: ${data.nombre} ${data.apellido}`);
                console.log(`   🎭 Rol detectado: ${data.rol}`);
                console.log(`   🔗 Redireccionar a: dashboard-${data.rol}.html`);
            } else {
                console.log(`   ❌ Error: ${data.msg}`);
            }
            
        } catch (error) {
            console.log(`   💥 Error de conexión: ${error.message}`);
        }
    }
    
    console.log('\n🎯 Pruebas completadas');
}

// Ejecutar solo si el servidor está corriendo
if (typeof window !== 'undefined') {
    // En el navegador
    window.testUnifiedLogin = testUnifiedLogin;
    console.log('🌐 Script cargado. Ejecuta testUnifiedLogin() en la consola del navegador.');
} else {
    // En Node.js (si se ejecuta directamente)
    testUnifiedLogin();
}