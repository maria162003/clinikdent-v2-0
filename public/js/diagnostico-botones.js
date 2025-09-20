// Script de diagnóstico para botones de servicios
console.log('🔍 INICIANDO DIAGNÓSTICO DE BOTONES');

// 1. Verificar si las funciones existen
console.log('📋 Verificando funciones:');
console.log('- configurarServicios:', typeof configurarServicios);
console.log('- nuevoServicio:', typeof nuevoServicio);

// 2. Verificar elementos del DOM
console.log('📋 Verificando elementos DOM:');
const btnConfigurar = document.querySelector('button[onclick="configurarServicios()"]');
const btnNuevo = document.querySelector('button[onclick="nuevoServicio()"]');
const serviciosTab = document.getElementById('servicios-tab');
const modal = document.getElementById('modalConfigServicios');

console.log('- Botón Configurar Servicios:', btnConfigurar ? '✅ Encontrado' : '❌ No encontrado');
console.log('- Botón Nuevo Servicio:', btnNuevo ? '✅ Encontrado' : '❌ No encontrado');
console.log('- Tab Servicios:', serviciosTab ? '✅ Encontrado' : '❌ No encontrado');
console.log('- Modal:', modal ? '✅ Encontrado' : '❌ No encontrado');

// 3. Verificar estado de los botones
if (btnConfigurar) {
    console.log('📋 Estado Botón Configurar:');
    console.log('- Disabled:', btnConfigurar.disabled);
    console.log('- Classes:', btnConfigurar.className);
    console.log('- Style display:', btnConfigurar.style.display);
}

if (btnNuevo) {
    console.log('📋 Estado Botón Nuevo:');
    console.log('- Disabled:', btnNuevo.disabled);
    console.log('- Classes:', btnNuevo.className);
    console.log('- Style display:', btnNuevo.style.display);
}

// 4. Test manual de los botones
console.log('🧪 EJECUTANDO TESTS MANUALES:');

// Test configurarServicios
if (typeof configurarServicios === 'function') {
    console.log('✅ Función configurarServicios disponible');
    
    // Crear evento simulado
    window.testConfigurarServicios = function() {
        console.log('🔥 Ejecutando test de configurarServicios...');
        try {
            // Simular event.target para el botón
            const fakeEvent = {
                target: btnConfigurar || { closest: () => null }
            };
            window.event = fakeEvent;
            
            configurarServicios();
            console.log('✅ Test configurarServicios ejecutado sin errores');
        } catch (error) {
            console.error('❌ Error en test configurarServicios:', error);
        }
    };
} else {
    console.error('❌ Función configurarServicios NO disponible');
}

// Test nuevoServicio
if (typeof nuevoServicio === 'function') {
    console.log('✅ Función nuevoServicio disponible');
    
    window.testNuevoServicio = function() {
        console.log('🔥 Ejecutando test de nuevoServicio...');
        try {
            const fakeEvent = {
                target: btnNuevo || { closest: () => null }
            };
            window.event = fakeEvent;
            
            nuevoServicio();
            console.log('✅ Test nuevoServicio ejecutado sin errores');
        } catch (error) {
            console.error('❌ Error en test nuevoServicio:', error);
        }
    };
} else {
    console.error('❌ Función nuevoServicio NO disponible');
}

// 5. Información adicional
console.log('📋 Información adicional:');
console.log('- Bootstrap modal:', typeof bootstrap !== 'undefined' && bootstrap.Modal ? '✅ Disponible' : '❌ No disponible');
console.log('- jQuery:', typeof $ !== 'undefined' ? '✅ Disponible' : '❌ No disponible');

// 6. Comandos de test disponibles
console.log('🎯 COMANDOS DE TEST DISPONIBLES:');
console.log('- testConfigurarServicios() - Para probar botón configurar');
console.log('- testNuevoServicio() - Para probar botón nuevo');
console.log('- Ejecuta estos comandos en la consola para probar');

console.log('🔍 DIAGNÓSTICO COMPLETADO');