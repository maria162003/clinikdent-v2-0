const axios = require('axios');

const baseURL = 'http://localhost:3001';

async function testAPIs() {
  console.log('🧪 Probando APIs corregidas...\n');
  
  try {
    // 1. Test citas por usuario
    console.log('1. Probando GET /api/citas/3');
    try {
      const citasResponse = await axios.get(`${baseURL}/api/citas/3`);
      console.log('✅ Citas:', citasResponse.status, '- Datos:', citasResponse.data.length, 'citas');
    } catch (err) {
      console.log('❌ Citas:', err.response?.status, '-', err.response?.data?.msg || err.message);
    }
    
    // 2. Test historial por paciente
    console.log('\n2. Probando GET /api/historial/paciente/3');
    try {
      const historialResponse = await axios.get(`${baseURL}/api/historial/paciente/3`);
      console.log('✅ Historial:', historialResponse.status, '- Datos:', historialResponse.data.length, 'registros');
    } catch (err) {
      console.log('❌ Historial:', err.response?.status, '-', err.response?.data?.msg || err.message);
    }
    
    // 3. Test perfil de usuario
    console.log('\n3. Probando GET /api/usuarios/3/perfil');
    try {
      const perfilResponse = await axios.get(`${baseURL}/api/usuarios/3/perfil`);
      console.log('✅ Perfil:', perfilResponse.status, '- Usuario:', perfilResponse.data.nombre, perfilResponse.data.apellido);
    } catch (err) {
      console.log('❌ Perfil:', err.response?.status, '-', err.response?.data?.msg || err.message);
    }
    
    // 4. Test evaluaciones paciente
    console.log('\n4. Probando GET /api/evaluaciones/paciente (headers user-id: 3)');
    try {
      const evaluacionesResponse = await axios.get(`${baseURL}/api/evaluaciones/paciente`, {
        headers: { 'user-id': '3' }
      });
      console.log('✅ Evaluaciones:', evaluacionesResponse.status, '- Datos:', evaluacionesResponse.data.evaluaciones?.length || 0, 'evaluaciones');
    } catch (err) {
      console.log('❌ Evaluaciones:', err.response?.status, '-', err.response?.data?.message || err.message);
    }
    
    // 5. Test evaluaciones pendientes
    console.log('\n5. Probando GET /api/evaluaciones/pendientes (headers user-id: 3)');
    try {
      const pendientesResponse = await axios.get(`${baseURL}/api/evaluaciones/pendientes`, {
        headers: { 'user-id': '3' }
      });
      console.log('✅ Pendientes:', pendientesResponse.status, '- Datos:', pendientesResponse.data.citas_pendientes?.length || 0, 'citas pendientes');
    } catch (err) {
      console.log('❌ Pendientes:', err.response?.status, '-', err.response?.data?.message || err.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
  
  console.log('\n🏁 Pruebas completadas');
}

testAPIs();
