// 🧪 Script de Prueba - Recuperación de Contraseña con Supabase
// Ejecutar en la consola del navegador en http://localhost:3001/recuperar.html

async function testRecuperacionPassword() {
    console.log('🧪 Iniciando prueba de recuperación de contraseña...\n');

    // Datos de prueba (CAMBIAR por datos reales de la BD)
    const datosTest = {
        correo: 'test@clinikdent.com',  // ⚠️ CAMBIAR por email real
        numero_documento: '12345678'     // ⚠️ CAMBIAR por documento real
    };

    console.log('📋 Datos de prueba:', datosTest);
    console.log('🔗 Endpoint:', '/api/seguridad/recuperar-password-supabase');
    
    try {
        console.log('\n⏳ Enviando solicitud...');
        
        const response = await fetch('/api/seguridad/recuperar-password-supabase', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosTest)
        });

        console.log('📡 Status:', response.status);
        console.log('📡 Status Text:', response.statusText);
        
        const data = await response.json();
        
        console.log('\n📦 Respuesta del servidor:');
        console.log(data);

        if (response.ok) {
            console.log('\n✅ SUCCESS - Email de recuperación enviado');
            console.log('📧 Revisa la bandeja de entrada (y spam) de:', datosTest.correo);
            console.log('\n⚠️ PASOS SIGUIENTES:');
            console.log('1. Abre el email');
            console.log('2. Haz clic en el enlace de recuperación');
            console.log('3. Serás redirigido a nueva-password-supabase.html');
            console.log('4. Ingresa tu nueva contraseña');
        } else {
            console.error('\n❌ ERROR:', data.msg);
            
            if (response.status === 400) {
                console.log('\n💡 Posibles causas:');
                console.log('- Usuario o documento no encontrado');
                console.log('- Datos incorrectos');
            } else if (response.status === 423) {
                console.log('\n💡 Cuenta bloqueada temporalmente');
                console.log('- Demasiados intentos fallidos');
                console.log('- Espera unos minutos');
            } else if (response.status === 500) {
                console.log('\n💡 Error del servidor:');
                console.log('- Verifica la configuración de Supabase');
                console.log('- Revisa los logs del backend');
            }
        }

    } catch (error) {
        console.error('\n❌ ERROR DE RED:', error);
        console.log('\n💡 Posibles causas:');
        console.log('- Servidor no está corriendo');
        console.log('- Error de CORS');
        console.log('- Problema de conexión');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 VERIFICACIONES ADICIONALES:');
    console.log('='.repeat(60));
    console.log('\n1️⃣ Verifica que el servidor esté corriendo:');
    console.log('   node app.js');
    console.log('\n2️⃣ Verifica Supabase Dashboard:');
    console.log('   - Authentication > Email Templates > Reset Password');
    console.log('   - Authentication > URL Configuration > Redirect URLs');
    console.log('   - Logs > Auth Logs (buscar eventos recientes)');
    console.log('\n3️⃣ Verifica las variables de entorno (.env):');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY');
    console.log('   - FRONTEND_URL');
    console.log('\n4️⃣ Si el email no llega:');
    console.log('   - Revisa la carpeta de SPAM');
    console.log('   - Verifica que el email esté registrado en Supabase Auth');
    console.log('   - Espera 1-2 minutos (los emails pueden tardar)');
    console.log('   - Revisa los logs de Supabase');
}

// Ejecutar la prueba
console.log('🚀 Para probar la recuperación de contraseña, ejecuta:');
console.log('testRecuperacionPassword()');
console.log('\n⚠️ IMPORTANTE: Cambia el email y documento por datos reales en el código del script');

// Auto-ejecutar si se pasa parámetro
if (typeof window !== 'undefined' && window.location.search.includes('autotest')) {
    testRecuperacionPassword();
}
