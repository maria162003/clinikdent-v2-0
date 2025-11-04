// Test para verificar botones de citas
console.log('🔧 Debug de botones de acciones de citas iniciado');

// Verificar que la clase DashboardPaciente existe
if (typeof DashboardPaciente !== 'undefined') {
    console.log('✅ Clase DashboardPaciente encontrada');
} else {
    console.log('❌ Clase DashboardPaciente no encontrada');
}

// Verificar que la instancia global existe
if (typeof window.dashboardPaciente !== 'undefined') {
    console.log('✅ Instancia window.dashboardPaciente encontrada');
    
    // Verificar funciones específicas
    const funciones = ['verDetalleCita', 'reprogramarCita', 'cancelarCita'];
    funciones.forEach(funcion => {
        if (typeof window.dashboardPaciente[funcion] === 'function') {
            console.log(`✅ Función ${funcion} encontrada y es ejecutable`);
        } else {
            console.log(`❌ Función ${funcion} no encontrada o no es ejecutable`);
        }
    });
    
    // Test de funciones con IDs de prueba
    console.log('🧪 Probando funciones con ID de prueba...');
    
    try {
        // Estas funciones deberían mostrar algún comportamiento sin errores
        console.log('Probando verDetalleCita(999)...');
        window.dashboardPaciente.verDetalleCita(999);
        console.log('✅ verDetalleCita ejecutada sin errores');
    } catch (error) {
        console.log('❌ Error en verDetalleCita:', error.message);
    }
    
} else {
    console.log('❌ Instancia window.dashboardPaciente no encontrada');
    console.log('🔧 Buscando otras referencias posibles...');
    
    // Buscar en el DOM si hay eventos onclick
    const botones = document.querySelectorAll('button[onclick*="dashboardPaciente"]');
    console.log(`Encontrados ${botones.length} botones con onclick que llaman a dashboardPaciente`);
    
    botones.forEach((boton, index) => {
        console.log(`Botón ${index + 1}: ${boton.onclick ? boton.onclick.toString() : boton.getAttribute('onclick')}`);
    });
}

// Verificar si hay errores de JavaScript en consola
window.addEventListener('error', function(event) {
    console.log('❌ Error de JavaScript detectado:', event.error);
});

console.log('🔧 Debug completado. Revisa los resultados arriba.');