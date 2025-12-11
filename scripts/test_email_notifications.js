// Script para probar las notificaciones de email
require('dotenv').config();
const emailService = require('../Backend/services/emailService');

async function testEmailNotifications() {
  console.log('🧪 Iniciando prueba de notificaciones de email...\n');

  // Datos de prueba para cancelación
  const datosCancelacion = {
    paciente_nombre: 'Juan Pérez',
    fecha: new Date('2025-11-15'),
    hora: '10:00',
    motivo: 'Limpieza dental',
    motivo_cancelacion: 'Emergencia médica'
  };

  // Datos de prueba para reprogramación
  const datosReprogramacion = {
    paciente_nombre: 'María González',
    fecha_anterior: new Date('2025-11-13'),
    hora_anterior: '14:00',
    fecha_nueva: new Date('2025-11-20'),
    hora_nueva: '16:00',
    motivo: 'Control de ortodoncia'
  };

  try {
    // Test 1: Email de cancelación
    console.log('📧 Test 1: Enviando email de cancelación...');
    const resultCancelacion = await emailService.sendCitaCanceladaEmail(
      'test@example.com', // Cambiar por un email real para prueba
      datosCancelacion
    );
    console.log('Resultado cancelación:', resultCancelacion);
    console.log('');

    // Test 2: Email de reprogramación
    console.log('📧 Test 2: Enviando email de reprogramación...');
    const resultReprogramacion = await emailService.sendCitaReprogramadaEmail(
      'test@example.com', // Cambiar por un email real para prueba
      datosReprogramacion
    );
    console.log('Resultado reprogramación:', resultReprogramacion);
    console.log('');

    console.log('✅ Pruebas completadas exitosamente!');
    console.log('\n💡 Nota: Si el modo DEMO está activo, los emails no se enviaron realmente.');
    console.log('   Para envío real, configura EMAIL_USER y EMAIL_PASS en el archivo .env');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
testEmailNotifications();
