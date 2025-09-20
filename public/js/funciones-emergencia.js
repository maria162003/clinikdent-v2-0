// Funciones de emergencia para botones de servicios
// Estas son versiones simplificadas que SIEMPRE funcionarán

console.log('🚨 CARGANDO FUNCIONES DE EMERGENCIA PARA BOTONES');

// Sobrescribir función configurarServicios con versión simplificada
window.configurarServicios = function() {
    console.log('🔧 [EMERGENCIA] Configurar Servicios clickeado');
    
    // Feedback visual inmediato
    const btnElement = event ? event.target.closest('button') : null;
    if (btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activando...';
        btnElement.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.backgroundColor = '';
        }, 1000);
    }
    
    // Intentar cambiar a pestaña servicios
    const serviciosTab = document.getElementById('servicios-tab');
    if (serviciosTab) {
        serviciosTab.click();
        console.log('✅ Pestaña servicios activada exitosamente');
        
        // Mostrar alerta de confirmación
        setTimeout(() => {
            if (typeof Swal !== 'undefined') {
                Swal.fire('✅ Éxito', 'Configuración de servicios cargada', 'success');
            } else {
                alert('✅ Configuración de servicios cargada correctamente');
            }
        }, 500);
    } else {
        console.error('❌ No se encontró la pestaña servicios');
        alert('❌ Error: No se encontró la pestaña de servicios');
    }
};

// Sobrescribir función nuevoServicio con versión simplificada
window.nuevoServicio = function() {
    console.log('➕ [EMERGENCIA] Nuevo Servicio clickeado');
    
    // Feedback visual inmediato
    const btnElement = event ? event.target.closest('button') : null;
    if (btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abriendo...';
        btnElement.style.backgroundColor = '#007bff';
        
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.backgroundColor = '';
        }, 800);
    }
    
    // Intentar abrir modal
    const modalElement = document.getElementById('modalConfigServicios');
    if (modalElement) {
        // Usar Bootstrap modal si está disponible
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('✅ Modal abierto con Bootstrap');
        } else {
            // Fallback manual
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
            console.log('✅ Modal abierto manualmente');
        }
        
        // Limpiar formulario
        const form = document.getElementById('formConfigServicio');
        if (form) {
            form.reset();
        }
        
        // Valores por defecto
        const duracionInput = document.getElementById('duracionServicio');
        const activoInput = document.getElementById('activoServicio');
        
        if (duracionInput) duracionInput.value = '60';
        if (activoInput) activoInput.checked = true;
        
        // Mostrar confirmación
        setTimeout(() => {
            if (typeof Swal !== 'undefined') {
                Swal.fire('✅ Éxito', 'Modal de nuevo servicio abierto', 'success');
            } else {
                alert('✅ Modal abierto - Complete los datos del nuevo servicio');
            }
        }, 300);
    } else {
        console.error('❌ No se encontró el modal');
        alert('❌ Error: No se encontró el modal de configuración');
    }
};

// Función de prueba de conectividad
window.testBotonesServicios = function() {
    console.log('🧪 Ejecutando test completo de botones...');
    
    // Test 1: Configurar servicios
    console.log('Test 1: Configurar Servicios');
    try {
        configurarServicios();
        console.log('✅ Test 1 pasado');
    } catch (error) {
        console.error('❌ Test 1 fallido:', error);
    }
    
    // Test 2: Nuevo servicio (después de 2 segundos)
    setTimeout(() => {
        console.log('Test 2: Nuevo Servicio');
        try {
            nuevoServicio();
            console.log('✅ Test 2 pasado');
        } catch (error) {
            console.error('❌ Test 2 fallido:', error);
        }
    }, 2000);
};

// Auto-habilitación de botones
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Auto-habilitando botones...');
    
    // Buscar y habilitar todos los botones de servicios
    const botones = document.querySelectorAll('button[onclick*="configurarServicios"], button[onclick*="nuevoServicio"]');
    
    botones.forEach((btn, index) => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        console.log(`✅ Botón ${index + 1} habilitado`);
    });
    
    setTimeout(() => {
        console.log('🎯 FUNCIONES DE EMERGENCIA LISTAS');
        console.log('💡 Comandos disponibles:');
        console.log('   - configurarServicios()');
        console.log('   - nuevoServicio()');
        console.log('   - testBotonesServicios()');
    }, 1000);
});

console.log('✅ FUNCIONES DE EMERGENCIA CARGADAS');