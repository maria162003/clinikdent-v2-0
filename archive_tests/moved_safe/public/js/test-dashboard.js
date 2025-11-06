// Simple test script for dashboard
console.log('🔥 Test script cargando...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando test');
    
    // Test básico para cambiar el texto de "Cargando..."
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = 'Administrador Sistema';
        console.log('✅ Nombre de usuario actualizado');
    } else {
        console.error('❌ No se encontró elemento userName');
    }
    
    // Test de APIs básicas
    fetch('/api/usuarios')
        .then(response => response.json())
        .then(data => {
            console.log('✅ API usuarios funciona:', data);
        })
        .catch(error => {
            console.error('❌ Error en API usuarios:', error);
        });
    
    console.log('🎯 Test script completado');
});
