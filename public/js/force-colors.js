/**
 * Forzar colores sólidos en todos los elementos
 * Este script se ejecuta después de que la página se carga completamente
 */

function forceButtonColors() {
    // Forzar colores en todos los botones de editar (verdes)
    document.querySelectorAll('button').forEach(button => {
        const text = button.textContent.toLowerCase().trim();
        const classes = button.className.toLowerCase();
        
        // Botones de editar (verdes)
        if (text.includes('editar') || text.includes('edit') || 
            classes.includes('btn-success') || 
            button.querySelector('.bi-pencil') ||
            button.querySelector('.fa-edit') ||
            button.querySelector('.fa-pencil') ||
            button.title?.includes('Editar')) {
            
            button.style.cssText = 'background: #198754 !important; background-image: none !important; border-color: #198754 !important; color: white !important; box-shadow: none !important;';
            button.classList.remove('btn-warning', 'btn-outline-success', 'btn-outline-warning');
            button.classList.add('btn-success');
        }
        
        // Botones de eliminar (rojos)
        else if (text.includes('eliminar') || text.includes('delete') || 
                 classes.includes('btn-danger') ||
                 button.querySelector('.bi-trash') ||
                 button.querySelector('.fa-trash') ||
                 button.querySelector('.fa-delete') ||
                 button.title?.includes('Eliminar')) {
            
            button.style.cssText = 'background: #dc3545 !important; background-image: none !important; border-color: #dc3545 !important; color: white !important; box-shadow: none !important;';
            button.classList.remove('btn-outline-danger');
            button.classList.add('btn-danger');
        }
        
        // Botones específicos que no queremos mostrar (ocultar botones de estado individuales)
        else if (button.querySelector('.bi-check-circle') || 
                 button.querySelector('.bi-check2-all') ||
                 button.querySelector('.bi-x-circle') ||
                 button.querySelector('.bi-arrow-repeat')) {
            // Solo ocultar si está en una tabla de citas y hay más de 3 botones en el grupo
            const btnGroup = button.closest('.btn-group');
            if (btnGroup && btnGroup.querySelectorAll('button').length > 3) {
                button.style.display = 'none';
            }
        }
    });
    
    // Forzar colores en badges de estado
    document.querySelectorAll('.badge').forEach(badge => {
        const text = badge.textContent.toLowerCase().trim();
        
        if (text === 'activo' || text === 'active' || text === 'true') {
            badge.style.cssText = 'background: #198754 !important; color: white !important;';
            badge.className = 'badge bg-success';
        } else if (text === 'inactivo' || text === 'inactive' || text === 'false') {
            badge.style.cssText = 'background: #dc3545 !important; color: white !important;';
            badge.className = 'badge bg-danger';
        }
    });
    
    // Aplicar a elementos que puedan cargarse dinámicamente
    setTimeout(() => {
        forceButtonColors();
    }, 500);
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', forceButtonColors);

// Ejecutar después de que la página se cargue completamente
window.addEventListener('load', forceButtonColors);

// Observar cambios en el DOM para aplicar colores a contenido dinámico
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Esperar un poco para que el contenido se renderice
            setTimeout(forceButtonColors, 100);
        }
    });
});

// Iniciar observación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

console.log('🎨 Force Colors Script Loaded - Forcing solid green/red colors');