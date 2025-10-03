// Debug script para verificar el estado del sistema de paginación
console.log('=== SISTEMA DE PAGINACIÓN - DEBUG ===');

// Verificar si pagination-system.js se cargó correctamente
if (typeof window.paginationModules !== 'undefined') {
    console.log('✓ window.paginationModules existe');
    console.log('Secciones disponibles:', Object.keys(window.paginationModules));
    
    // Verificar cada sección
    Object.keys(window.paginationModules).forEach(section => {
        const module = window.paginationModules[section];
        console.log(`\n--- Sección: ${section} ---`);
        console.log(`Items por página: ${module.itemsPerPage}`);
        console.log(`Datos de prueba: ${module.testData ? module.testData.length : 0} items`);
        console.log(`Función renderPage: ${typeof module.renderPage}`);
        
        // Verificar elementos HTML necesarios
        const elements = [
            `${section}Table`,
            `${section}PaginationInfo`,
            `${section}Pagination`,
            `${section}Showing`,
            `${section}Total`,
            `${section}ItemsPerPage`
        ];
        
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                console.log(`✓ Elemento ${elementId} existe`);
            } else {
                console.log(`✗ Elemento ${elementId} NO existe`);
            }
        });
    });
} else {
    console.log('✗ window.paginationModules NO existe');
}

// Verificar funciones globales
const globalFunctions = [
    'initializePaginationAdmin',
    'changeItemsPerPageAdmin',
    'goToPageAdmin',
    'loadDataAdmin'
];

globalFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
        console.log(`✓ Función global ${funcName} existe`);
    } else {
        console.log(`✗ Función global ${funcName} NO existe`);
    }
});

console.log('=== FIN DEBUG ===');

// Auto-inicializar algunas secciones para prueba
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('\n=== INICIALIZACIÓN AUTOMÁTICA ===');
        
        // Probar inicializar algunas secciones
        const sectionsToTest = ['usuarios', 'citas', 'faqs', 'reportes', 'pagos'];
        
        sectionsToTest.forEach(section => {
            try {
                if (typeof initializePaginationAdmin === 'function') {
                    console.log(`Inicializando ${section}...`);
                    initializePaginationAdmin(section);
                    console.log(`✓ ${section} inicializado correctamente`);
                } else {
                    console.log(`✗ No se puede inicializar ${section} - función no existe`);
                }
            } catch (error) {
                console.log(`✗ Error inicializando ${section}:`, error.message);
            }
        });
        
        console.log('=== FIN INICIALIZACIÓN ===');
    }, 1000);
});