const fs = require('fs');

// Leer el archivo
const filePath = './public/js/dashboard-paciente.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Limpiando caracteres especiales del archivo dashboard-paciente.js...');

// Reemplazar todos los emojis y caracteres especiales problemáticos
const replacements = [
    // Emojis comunes
    ['❌', ''],
    ['✅', ''],
    ['🔄', ''],
    ['⏰', ''],
    ['👨‍⚕️', ''],
    ['📋', ''],
    ['⚠️', ''],
    ['💰', ''],
    ['📧', ''],
    ['🔍', ''],
    ['📅', ''],
    ['⚡', ''],
    ['🎯', ''],
    ['📊', ''],
    ['🔧', ''],
    ['💡', ''],
    
    // Caracteres problemáticos
    ['ñ', 'n'],
    ['á', 'a'], 
    ['é', 'e'],
    ['í', 'i'],
    ['ó', 'o'],
    ['ú', 'u'],
    ['ü', 'u'],
    ['Ñ', 'N'],
    ['Á', 'A'],
    ['É', 'E'],
    ['Í', 'I'],
    ['Ó', 'O'],
    ['Ú', 'U']
];

let changesCount = 0;

replacements.forEach(([from, to]) => {
    const beforeCount = (content.match(new RegExp(from, 'g')) || []).length;
    content = content.replace(new RegExp(from, 'g'), to);
    changesCount += beforeCount;
});

// Escribir el archivo limpio
fs.writeFileSync(filePath, content, 'utf8');

console.log(`Se realizaron ${changesCount} reemplazos en total`);
console.log('Archivo limpiado exitosamente');