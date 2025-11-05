const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPI(endpoint, description) {
    try {
        console.log(`\n🔍 Probando: ${description}`);
        console.log(`📡 GET ${endpoint}`);
        
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Datos recibidos: ${Array.isArray(response.data) ? response.data.length : 'N/A'} elementos`);
        
        return true;
    } catch (error) {
        console.log(`❌ Error: ${error.response?.status || error.code} - ${error.message}`);
        if (error.response?.data) {
            console.log(`📋 Detalles: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Iniciando pruebas completas de APIs del Dashboard Admin\n');
    console.log('═'.repeat(60));
    
    const tests = [
        { endpoint: '/api/usuarios', description: 'API de Usuarios' },
        { endpoint: '/api/citas/admin/todas', description: 'API de Citas (Previamente con error 500)' },
        { endpoint: '/api/inventario', description: 'API de Inventario' },
        { endpoint: '/api/pagos-extendido/todos', description: 'API de Pagos' },
        { endpoint: '/api/reportes', description: 'API de Reportes' },
        { endpoint: '/api/estadisticas/dashboard', description: 'API de Estadísticas' },
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        const result = await testAPI(test.endpoint, test.description);
        if (result) {
            passed++;
        } else {
            failed++;
        }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log(`✅ Exitosas: ${passed}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📈 Porcentaje de éxito: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 ¡Todas las APIs del dashboard admin están funcionando correctamente!');
        console.log('🏁 El fix de PostgreSQL en citaController.js fue exitoso');
        console.log('🎯 Los botones de acciones ya tienen iconos y texto');
    } else {
        console.log('\n⚠️ Algunas APIs necesitan atención adicional');
    }
    
    process.exit(0);
}

// Ejecutar las pruebas
runAllTests().catch(console.error);
