/**
 * Script de Prueba del Sistema de Reportes
 * Ejecutar: node scripts/test_reportes_sistema.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null) {
  try {
    log(`\n🧪 Probando: ${name}`, 'blue');
    
    const config = {
      method: method,
      url: `${BASE_URL}${url}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === 200) {
      log(`✅ ${name} - OK`, 'green');
      log(`   Datos recibidos: ${JSON.stringify(response.data).substring(0, 100)}...`, 'reset');
      return true;
    } else {
      log(`⚠️  ${name} - Status: ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ ${name} - Error: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensaje: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════', 'blue');
  log('📊 PRUEBAS DEL SISTEMA DE REPORTES', 'blue');
  log('═══════════════════════════════════════════\n', 'blue');
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const fechaInicio = firstDayOfMonth.toISOString().split('T')[0];
  const fechaFin = today.toISOString().split('T')[0];
  
  log(`📅 Período de prueba: ${fechaInicio} al ${fechaFin}`, 'yellow');
  
  const tests = [
    {
      name: 'Reporte Financiero',
      method: 'POST',
      url: '/api/reportes-basicos/financiero',
      data: { fechaInicio, fechaFin, metodoPago: '' }
    },
    {
      name: 'Reporte Citas Agendadas',
      method: 'POST',
      url: '/api/reportes-basicos/citas-agendadas',
      data: { fechaInicio, fechaFin, estado: '', odontologoId: '' }
    },
    {
      name: 'Reporte Cancelaciones',
      method: 'POST',
      url: '/api/reportes-basicos/cancelaciones',
      data: { fechaInicio, fechaFin, motivo: '' }
    },
    {
      name: 'Reporte Actividad Usuarios',
      method: 'POST',
      url: '/api/reportes-basicos/actividad-usuarios',
      data: { fechaInicio, fechaFin, usuarioId: '', tipoAccion: '' }
    },
    {
      name: 'Reporte Seguimiento Tratamientos',
      method: 'POST',
      url: '/api/reportes-basicos/seguimiento-tratamientos',
      data: { fechaInicio, fechaFin, estado: '', tipo: '' }
    },
    {
      name: 'Obtener Odontólogos',
      method: 'GET',
      url: '/api/usuarios/odontologos'
    },
    {
      name: 'Obtener Usuarios',
      method: 'GET',
      url: '/api/usuarios'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.method, test.url, test.data);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  log('\n═══════════════════════════════════════════', 'blue');
  log('📊 RESUMEN DE PRUEBAS', 'blue');
  log('═══════════════════════════════════════════', 'blue');
  log(`✅ Pasadas: ${passed}`, 'green');
  log(`❌ Fallidas: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📊 Total: ${tests.length}`, 'blue');
  
  if (failed === 0) {
    log('\n🎉 ¡Todas las pruebas pasaron exitosamente!', 'green');
  } else {
    log('\n⚠️  Algunas pruebas fallaron. Revisar logs arriba.', 'yellow');
  }
  
  log('\n═══════════════════════════════════════════\n', 'blue');
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    log('🔍 Verificando que el servidor esté corriendo...', 'yellow');
    await axios.get(`${BASE_URL}/`);
    log('✅ Servidor detectado\n', 'green');
    return true;
  } catch (error) {
    log('❌ Servidor no está corriendo', 'red');
    log('   Por favor inicia el servidor con: npm start', 'yellow');
    return false;
  }
}

// Ejecutar pruebas
(async () => {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
})();
