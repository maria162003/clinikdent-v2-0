#!/usr/bin/env node

// Script de inicio simplificado para Clinikdent
// Uso: node start.js o simplemente node start

const path = require('path');
const { spawn } = require('child_process');

// Cambiar al directorio correcto
process.chdir(__dirname);

console.log('🚀 Iniciando Clinikdent...');
console.log(`📁 Directorio de trabajo: ${process.cwd()}`);

// Ejecutar app.js
const child = spawn('node', ['app.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

child.on('error', (err) => {
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
});

child.on('exit', (code) => {
    console.log(`🔚 Servidor terminado con código: ${code}`);
    process.exit(code);
});

// Manejar señales de cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    child.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    child.kill('SIGTERM');
});
