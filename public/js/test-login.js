// Script para probar login unificado directamente en la consola del navegador
async function testLoginUnificado() {
    console.log('🧪 Probando login unificado...');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo: 'admin@clinikdent.com',
                password: 'admin123'
                // Sin especificar rol - debe detectarlo automáticamente
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Login exitoso:', data);
            console.log(`👤 Usuario: ${data.nombre} ${data.apellido}`);
            console.log(`🎭 Rol detectado: ${data.rol}`); 
            console.log(`🔗 Debería ir a: dashboard-${data.rol}.html`);
        } else {
            console.log('❌ Error:', data);
        }
        
    } catch (error) {
        console.log('💥 Error de red:', error);
    }
}

// También probemos con otros usuarios
async function testMultipleUsers() {
    const users = [
        { correo: 'admin@clinikdent.com', password: 'admin123', expected: 'administrador' },
        { correo: 'juan.perez@gmail.com', password: 'paciente123', expected: 'paciente' },
        { correo: 'carlos.rodriguez@clinikdent.com', password: 'odontologo123', expected: 'odontologo' }
    ];
    
    for (const user of users) {
        console.log(`\n🧪 Probando ${user.correo}...`);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correo: user.correo,
                    password: user.password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const match = data.rol === user.expected ? '✅' : '❌';
                console.log(`${match} ${data.nombre} ${data.apellido} - Rol: ${data.rol} (esperado: ${user.expected})`);
            } else {
                console.log(`❌ Error: ${data.msg}`);
            }
            
        } catch (error) {
            console.log(`💥 Error: ${error.message}`);
        }
    }
}

console.log('🚀 Scripts de prueba cargados. Ejecuta:');
console.log('   testLoginUnificado() - Prueba básica');
console.log('   testMultipleUsers() - Prueba múltiples usuarios');