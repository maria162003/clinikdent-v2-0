// Script para probar facturas sin autenticación primero
console.log('🔍 Probando conectividad...');

// Usar curl para probar
const { exec } = require('child_process');

// Probar endpoint de facturas con headers simulados
const curlCommand = `curl -X GET "http://localhost:3001/api/pagos-ext/odontologo/facturas?limit=20&offset=0" -H "user-id: 2" -H "Content-Type: application/json"`;

exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error ejecutando curl:', error);
        return;
    }
    
    if (stderr) {
        console.error('⚠️ Stderr:', stderr);
    }
    
    console.log('✅ Response:', stdout);
    
    try {
        const response = JSON.parse(stdout);
        console.log('📊 Facturas encontradas:', response.facturas?.length || 0);
        if (response.facturas && response.facturas.length > 0) {
            console.log('💰 Primera factura:', {
                numero: response.facturas[0].numero_factura,
                paciente: response.facturas[0].paciente_nombre,
                total: response.facturas[0].total,
                estado: response.facturas[0].estado
            });
        }
    } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
    }
});

setTimeout(() => process.exit(0), 5000);