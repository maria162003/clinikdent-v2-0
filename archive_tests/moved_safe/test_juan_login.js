// Script para probar exactamente qué retorna el login de Juan Pérez
async function testJuanLogin() {
  console.log('🧪 === PRUEBA DE LOGIN JUAN PÉREZ ===');
  
  try {
    console.log('📤 Enviando solicitud de login...');
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        correo: 'juan@gmail.com', 
        password: 'juan123' 
      })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries([...response.headers]));
    
    const data = await response.json();
    console.log('📋 Data completa recibida:', data);
    
    // Simular lo que hace el frontend
    const userData = data.user || data;
    console.log('👤 userData calculado (data.user || data):', userData);
    
    const localStorageMock = {
      user: JSON.stringify({ 
        id: userData.id,
        nombre: userData.nombre, 
        apellido: userData.apellido || '', 
        rol: userData.rol 
      }),
      userId: userData.id,
      userRole: userData.rol
    };
    
    console.log('💾 Datos que se guardarían en localStorage:');
    console.log('   user:', localStorageMock.user);
    console.log('   userId:', localStorageMock.userId);
    console.log('   userRole:', localStorageMock.userRole);
    
    if (userData.id === 3) {
      console.log('❌ PROBLEMA: Juan Pérez está obteniendo ID 3 (María González)');
    } else if (userData.id === 4) {
      console.log('✅ CORRECTO: Juan Pérez tiene ID 4');
    } else {
      console.log('⚠️ ID inesperado:', userData.id);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar la prueba
testJuanLogin();