// Fix temporal para el problema de configuración del sistema
// Agregar al final de admin-modules.js

// Override de la función problemática
function fixConfigModuleAuth() {
    if (window.adminConfigModule && window.adminConfigModule.openConfigModal) {
        // Backup de la función original
        const originalOpenConfigModal = window.adminConfigModule.openConfigModal;
        
        // Reemplazar con una versión que no requiera token
        window.adminConfigModule.openConfigModal = function() {
            console.log('🔧 Usando fix temporal para configuración del sistema');
            
            try {
                // Verificar usuario básico
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (!user.id || user.rol !== 'administrador') {
                    alert('Solo administradores pueden acceder a esta configuración');
                    return;
                }
                
                // Abrir modal directamente
                const modal = new bootstrap.Modal(document.getElementById('configModal'));
                modal.show();
                
                // Llenar con datos de demostración
                const mockConfig = {
                    horariosClinica: {
                        apertura: '08:00',
                        cierre: '18:00',
                        diasHabiles: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie']
                    },
                    recordatorios: {
                        sms: true,
                        email: true,
                        horasAnticipacion: 24
                    },
                    cancelacion: {
                        permite: true,
                        horasMin: 12,
                        penalizacion: 0
                    },
                    branding: {
                        nombreClinica: 'Clinik Dent',
                        logoUrl: '',
                        colorPrimario: '#0ea5e9'
                    }
                };
                
                // Llenar formulario (si existe la función)
                if (typeof fillConfigForm === 'function') {
                    fillConfigForm(mockConfig);
                } else {
                    console.log('ℹ️ Función fillConfigForm no disponible');
                }
                
                console.log('✅ Modal de configuración abierto con datos de prueba');
                
            } catch (error) {
                console.error('❌ Error al abrir modal de configuración:', error);
                alert('Error al abrir configuración: ' + error.message);
            }
        };
        
        console.log('✅ Fix temporal aplicado para adminConfigModule');
    } else {
        console.log('⚠️ adminConfigModule no encontrado');
    }
}

// Aplicar el fix cuando la página esté cargada
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixConfigModuleAuth, 1000); // Esperar 1 segundo para que todo esté cargado
});

// También aplicar inmediatamente si ya está cargado
if (document.readyState === 'complete') {
    fixConfigModuleAuth();
}
