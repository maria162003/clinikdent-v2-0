const http = require('http');

function testOdontologosEndpoint() {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/usuarios/odontologos',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('✅ Respuesta del endpoint /api/usuarios/odontologos:');
            try {
                const jsonData = JSON.parse(data);
                console.log('📋 Odontólogos encontrados:', jsonData.length);
                jsonData.forEach((odontologo, index) => {
                    console.log(`${index + 1}. ID: ${odontologo.id}, Nombre: ${odontologo.nombre} ${odontologo.apellido || ''}, Email: ${odontologo.correo}`);
                });
            } catch (e) {
                console.log('📄 Respuesta (texto):', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Error:', e.message);
    });

    req.end();
}

// Esperar un poco y luego probar
setTimeout(testOdontologosEndpoint, 2000);