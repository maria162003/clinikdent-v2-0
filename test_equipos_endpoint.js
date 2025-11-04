const http = require('http');

// Función para hacer request
function testEquipos() {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/inventario/equipos-test',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            try {
                const jsonData = JSON.parse(data);
                console.log('Response:', JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log('Raw Response:', data);
            }
            process.exit(0);
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
        process.exit(1);
    });

    req.end();
}

// Esperar un poco y luego hacer el test
setTimeout(testEquipos, 2000);