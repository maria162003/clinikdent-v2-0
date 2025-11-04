const db = require('./Backend/config/db');
const authController = require('./Backend/controllers/authControllerNew');

// Datos de prueba
const testData = {
  nombre: 'Test',
  apellido: 'User',
  correo: 'test@test.com',
  password: '123456',
  rol: 'paciente'
};

// Simular objeto request
const req = {
  body: testData
};

// Simular objeto response
const res = {
  status: function(code) {
    console.log(`Status: ${code}`);
    return this;
  },
  json: function(data) {
    console.log('Response:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function testRegister() {
  console.log('🧪 Probando función de registro...');
  console.log('📝 Datos de prueba:', testData);
  
  try {
    await authController.registerUser(req, res);
    console.log('✅ Prueba completada');
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
  
  // Cerrar conexión
  process.exit(0);
}

testRegister();
