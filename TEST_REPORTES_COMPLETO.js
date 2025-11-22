/**
 * TEST COMPLETO DEL SISTEMA DE REPORTES
 * Ejecutar: node TEST_REPORTES_COMPLETO.js
 */

const http = require('http');

console.log('\n🔍 INICIANDO PRUEBAS DEL SISTEMA DE REPORTES\n');

const BASE_URL = 'http://localhost:3001';
const tests = [];

// Test 1: Reporte Financiero
tests.push({
  name: 'Reporte Financiero',
  method: 'POST',
  path: '/api/reportes-basicos/financiero',
  body: {
    fechaInicio: '2025-01-01',
    fechaFin: '2025-01-31'
  }
});

// Test 2: Reporte Citas Agendadas
tests.push({
  name: 'Reporte Citas Agendadas',
  method: 'POST',
  path: '/api/reportes-basicos/citas-agendadas',
  body: {
    fechaInicio: '2025-01-01',
    fechaFin: '2025-01-31'
  }
});

// Test 3: Reporte Cancelaciones
tests.push({
  name: 'Reporte Cancelaciones',
  method: 'POST',
  path: '/api/reportes-basicos/cancelaciones',
  body: {
    fechaInicio: '2025-01-01',
    fechaFin: '2025-01-31'
  }
});

// Test 4: Reporte Actividad Usuarios
tests.push({
  name: 'Reporte Actividad Usuarios',
  method: 'POST',
  path: '/api/reportes-basicos/actividad-usuarios',
  body: {
    fechaInicio: '2025-01-01',
    fechaFin: '2025-01-31'
  }
});

// Test 5: Reporte Seguimiento Tratamientos
tests.push({
  name: 'Reporte Seguimiento Tratamientos',
  method: 'POST',
  path: '/api/reportes-basicos/seguimiento-tratamientos',
  body: {
    fechaInicio: '2025-01-01',
    fechaFin: '2025-01-31'
  }
});

async function runTest(test) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(test.body);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: test.path,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            test: test.name,
            status: res.statusCode,
            success: res.statusCode === 200,
            data: response,
            error: null
          });
        } catch (e) {
          resolve({
            test: test.name,
            status: res.statusCode,
            success: false,
            data: null,
            error: `Error parsing JSON: ${e.message}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        test: test.name,
        status: 0,
        success: false,
        data: null,
        error: error.message
      });
    });

    req.write(data);
    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Ejecutando pruebas...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    
    if (result.success) {
      console.log(`✅ ${result.test}`);
      console.log(`   Status: ${result.status}`);
      if (result.data && result.data.resumen) {
        console.log(`   Resumen:`, result.data.resumen);
      }
      if (result.data && result.data.detalles) {
        console.log(`   Registros: ${result.data.detalles.length}`);
      }
      passed++;
    } else {
      console.log(`❌ ${result.test}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      failed++;
    }
    console.log('');
  }
  
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log(`✅ Exitosas: ${passed}/${tests.length}`);
  console.log(`❌ Fallidas: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!\n');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar configuración.\n');
  }
}

// Verificar que el servidor esté corriendo
console.log('🔍 Verificando que el servidor esté corriendo en puerto 3001...\n');

const checkServer = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET'
}, (res) => {
  console.log(`✅ Servidor detectado (Status: ${res.statusCode})\n`);
  runAllTests();
});

checkServer.on('error', (error) => {
  console.log('❌ ERROR: El servidor NO está corriendo');
  console.log('   Por favor inicia el servidor con: node app.js');
  console.log(`   Error: ${error.message}\n`);
});

checkServer.end();
