// Test rápido de endpoint de tratamientos
const fetch = require('node-fetch');

async function testTratamientos() {
    try {
        console.log('🔄 Probando endpoint /api/tratamientos...');
        
        // Primero verificar que el servidor esté corriendo
        const response = await fetch('http://localhost:3001/api/tratamientos');
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint funciona correctamente');
            console.log('📊 Datos recibidos:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Error en endpoint:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
        console.log('💡 ¿Está el servidor corriendo en puerto 3001?');
    }
}

testTratamientos();