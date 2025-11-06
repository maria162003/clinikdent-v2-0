const fetch = require('node-fetch');

async function testFacturasAPI() {
    try {
        console.log('🔍 Probando API de facturas directamente...');
        
        // Primero hacer login
        console.log('1️⃣ Haciendo login...');
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo: 'carlos@gmail.com',
                password: '123456'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login response:', { 
            success: loginData.success, 
            userId: loginData.user?.id,
            userRole: loginData.user?.rol_id 
        });
        
        if (!loginData.success) {
            console.log('❌ Error en login:', loginData.message);
            return;
        }
        
        const token = loginData.token;
        const userId = loginData.user.id;
        
        // Ahora probar la API de facturas
        console.log('2️⃣ Consultando facturas...');
        const facturasResponse = await fetch('http://localhost:3001/api/pagos-ext/odontologo/facturas?limit=20&offset=0', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'user-id': userId.toString(),
                'Content-Type': 'application/json'
            }
        });
        
        const facturasData = await facturasResponse.json();
        console.log('💰 Facturas response:', facturasData);
        
        if (facturasData.success && facturasData.facturas) {
            console.log(`✅ Se obtuvieron ${facturasData.facturas.length} facturas`);
            facturasData.facturas.forEach((factura, index) => {
                console.log(`  ${index + 1}. ${factura.numero_factura} - ${factura.paciente_nombre} ${factura.paciente_apellido} - $${factura.total} (${factura.estado})`);
            });
        } else {
            console.log('❌ No se obtuvieron facturas o hubo error');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testFacturasAPI();