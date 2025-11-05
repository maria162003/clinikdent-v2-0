/**
 * Script para debuggear el problema de carga de citas
 */

// Función para monitorear cambios en la tabla de citas
function monitorearTablaCitas() {
    console.log('🔍 Iniciando monitoreo de tabla de citas...');
    
    const tableBody = document.getElementById('citasTableBody');
    if (!tableBody) {
        console.log('❌ No se encontró citasTableBody');
        return;
    }
    
    let cambiosDetectados = 0;
    
    // Observer para detectar cambios en el contenido
    const observer = new MutationObserver(function(mutationsList) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                cambiosDetectados++;
                const filas = tableBody.querySelectorAll('tr').length;
                
                console.log(`🔄 Cambio ${cambiosDetectados} detectado en tabla de citas:`);
                console.log(`   📊 Número de filas: ${filas}`);
                
                if (filas > 0) {
                    const primeraFila = tableBody.querySelector('tr');
                    if (primeraFila) {
                        const paciente = primeraFila.querySelector('td:nth-child(2)')?.textContent?.trim();
                        const odontologo = primeraFila.querySelector('td:nth-child(3)')?.textContent?.trim();
                        
                        console.log(`   👤 Primera cita - Paciente: ${paciente}`);
                        console.log(`   👨‍⚕️ Primera cita - Odontólogo: ${odontologo}`);
                        
                        // Detectar si son datos estáticos o reales
                        if (paciente?.includes('Juan Pérez') && odontologo?.includes('Carlos Rodríguez')) {
                            console.log('   📋 Fuente detectada: Datos de base de datos');
                        } else if (paciente?.includes('María González')) {
                            console.log('   📋 Fuente detectada: Datos estáticos (PROBLEMA)');
                        }
                    }
                }
                
                console.log(`   ⏰ Timestamp: ${new Date().toLocaleTimeString()}`);
                console.log('   ─────────────────────────────────────');
            }
        }
    });
    
    // Configurar el observer
    observer.observe(tableBody, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Monitoreo activo. Se registrarán todos los cambios en la tabla.');
    
    // Función para detener el monitoreo
    window.detenerMonitoreoCitas = function() {
        observer.disconnect();
        console.log('🛑 Monitoreo de citas detenido');
    };
}

// Función para analizar el estado actual
function analizarEstadoActual() {
    console.log('\n📊 ANÁLISIS DEL ESTADO ACTUAL');
    console.log('═══════════════════════════════════');
    
    const tableBody = document.getElementById('citasTableBody');
    if (!tableBody) {
        console.log('❌ Tabla de citas no encontrada');
        return;
    }
    
    const filas = tableBody.querySelectorAll('tr');
    console.log(`📈 Total de citas mostradas: ${filas.length}`);
    
    if (filas.length > 0) {
        console.log('\n📋 Análisis de datos:');
        filas.forEach((fila, index) => {
            const celdas = fila.querySelectorAll('td');
            if (celdas.length >= 3) {
                const id = celdas[0]?.textContent?.trim();
                const paciente = celdas[1]?.textContent?.trim().split('\n')[0];
                const odontologo = celdas[2]?.textContent?.trim().split('\n')[0];
                
                console.log(`   ${index + 1}. ID: ${id} | Paciente: ${paciente} | Odontólogo: ${odontologo}`);
            }
        });
    }
    
    // Verificar qué scripts están cargados
    console.log('\n🔧 Scripts relacionados con citas:');
    console.log(`   • dashboard-admin.js: ${typeof dashboardAdmin !== 'undefined' ? '✅ Cargado' : '❌ No cargado'}`);
    console.log(`   • citas-colores.js: ${typeof loadCitasConColores !== 'undefined' ? '⚠️ Cargado (CONFLICTO)' : '✅ No cargado'}`);
    
    console.log('\n✅ Análisis completado');
}

// Auto-ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        analizarEstadoActual();
        monitorearTablaCitas();
    }, 1000);
});

console.log('🛠️ Debug script para citas cargado');
console.log('📝 Comandos disponibles:');
console.log('   • analizarEstadoActual() - Analiza el estado actual');
console.log('   • monitorearTablaCitas() - Inicia monitoreo');
console.log('   • detenerMonitoreoCitas() - Detiene monitoreo');