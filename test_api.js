const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('🧪 Probando API de pacientes...');
        
        const response = await fetch('http://localhost:3001/api/usuarios/2/pacientes');
        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API funcionando correctamente');
            console.log(`📋 Pacientes: ${data.length}`);
            data.forEach((paciente, index) => {
                console.log(`👤 ${index + 1}. ${paciente.nombre} ${paciente.apellido} - ${paciente.total_citas} citas`);
            });
        } else {
            const error = await response.text();
            console.error('❌ Error en API:', error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPI();