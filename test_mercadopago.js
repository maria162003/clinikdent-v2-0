// Test simple para verificar la API de MercadoPago
async function testMercadoPagoAPI() {
    try {
        console.log('🧪 Probando API de MercadoPago...');
        
        // Test básico
        const response1 = await fetch('http://localhost:3001/api/mercadopago/');
        console.log('📡 Test básico:', response1.status, response1.statusText);
        const data1 = await response1.json();
        console.log('� Respuesta:', data1);
        
        // Test transacciones
        const response2 = await fetch('http://localhost:3001/api/mercadopago/transacciones?usuario_id=3');
        console.log('📡 Test transacciones:', response2.status, response2.statusText);
        const data2 = await response2.json();
        console.log('📄 Transacciones:', data2);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testMercadoPagoAPI();
