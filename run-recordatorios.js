/**
 * ============================================================================
 * SCRIPT PARA ENVÍO AUTOMÁTICO DE RECORDATORIOS DE CITAS
 * Ejecuta cada hora para enviar recordatorios 24 horas antes
 * ============================================================================
 */

const { procesarRecordatorios } = require('./services/email-service');

console.log('🚀 Iniciando proceso de recordatorios automáticos...');
console.log('📅 Fecha/Hora actual:', new Date().toLocaleString('es-ES'));

// Ejecutar el proceso de recordatorios
procesarRecordatorios()
    .then(() => {
        console.log('✅ Proceso de recordatorios completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error en proceso de recordatorios:', error);
        process.exit(1);
    });
