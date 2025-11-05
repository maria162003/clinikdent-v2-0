const http = require('http');

// Test básico de la API de MercadoPago
function testAPI() {
    console.log('🧪 Probando API de MercadoPago...');
    
    // Test 1: Endpoint básico
    const options1 = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/mercadopago/',
        method: 'GET'
    };

    const req1 = http.request(options1, (res) => {
        console.log(`✅ Test 1 - Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('📋 Respuesta básica:', response);
            } catch (e) {
                console.log('📋 Respuesta básica (text):', data);
            }
            
            // Test 2: Endpoint de transacciones
            console.log('\n🧪 Probando endpoint de transacciones...');
            const options2 = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/mercadopago/transacciones?usuario_id=3',
                method: 'GET'
            };

            const req2 = http.request(options2, (res) => {
                console.log(`✅ Test 2 - Status: ${res.statusCode}`);
                let data2 = '';
                res.on('data', chunk => data2 += chunk);
                res.on('end', () => {
                    try {
                        const response2 = JSON.parse(data2);
                        console.log('💰 Transacciones encontradas:', response2);
                        console.log('📊 Total transacciones:', response2.length);
                    } catch (e) {
                        console.log('❌ Error parseando respuesta:', e.message);
                        console.log('📋 Respuesta cruda:', data2);
                    }
                    console.log('✅ Test completado');
                });
            });

            req2.on('error', (e) => {
                console.error('❌ Error en test 2:', e.message);
            });

            req2.end();
        });
    });

    req1.on('error', (e) => {
        console.error('❌ Error en test 1:', e.message);
    });

    req1.end();
}

// Ejecutar test
testAPI();
