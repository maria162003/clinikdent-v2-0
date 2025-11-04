// Debug script para monitorear cambios en la tabla de pagos
// Sirve para detectar conflictos entre datos estáticos y datos reales de la API

console.log('🔍 Debug Pagos iniciado - monitoreando cambios en tabla de historial de pagos...');

let ultimosDatosPagos = null;
let contadorCambios = 0;

// Monitor para la tabla de historial de pagos
function observarTablaPagos() {
    const tablaPagos = document.querySelector('#pagosTableBody');
    
    if (!tablaPagos) {
        console.log('⏳ Tabla de pagos no encontrada aún, reintentando...');
        setTimeout(observarTablaPagos, 1000);
        return;
    }
    
    console.log('✅ Tabla de pagos encontrada, iniciando observación...');
    
    // Observer para detectar cambios en la tabla
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                contadorCambios++;
                console.log(`🔄 Cambio ${contadorCambios} detectado en tabla de pagos`);
                
                // Extraer datos actuales de la tabla
                const filas = tablaPagos.querySelectorAll('tr');
                const datosActuales = Array.from(filas).map(fila => {
                    const celdas = fila.querySelectorAll('td');
                    if (celdas.length >= 4) {
                        return {
                            fecha: celdas[0]?.textContent?.trim(),
                            paciente: celdas[1]?.textContent?.trim(),
                            monto: celdas[2]?.textContent?.trim(),
                            estado: celdas[3]?.textContent?.trim(),
                            timestamp: new Date().toLocaleTimeString()
                        };
                    }
                    return null;
                }).filter(Boolean);
                
                if (datosActuales.length > 0) {
                    console.log(`📊 Datos de pagos cargados (${datosActuales.length} registros):`, datosActuales);
                    
                    // Detectar si hay datos estáticos conocidos
                    const tieneJuanPerez = datosActuales.some(pago => 
                        pago.paciente?.includes('Juan Pérez') && pago.monto?.includes('150')
                    );
                    const tieneMariaGarcia = datosActuales.some(pago => 
                        pago.paciente?.includes('María García') && (pago.monto?.includes('200') || pago.monto?.includes('75'))
                    );
                    const tieneCarlosLopez = datosActuales.some(pago => 
                        pago.paciente?.includes('Carlos López') && pago.monto?.includes('180')
                    );
                    
                    if (tieneJuanPerez || tieneMariaGarcia || tieneCarlosLopez) {
                        console.warn('⚠️ DATOS ESTÁTICOS DETECTADOS en tabla de pagos:');
                        if (tieneJuanPerez) console.warn('   - Juan Pérez $150,000 (dato estático)');
                        if (tieneMariaGarcia) console.warn('   - María García $200,000/$75,000 (dato estático)');
                        if (tieneCarlosLopez) console.warn('   - Carlos López $180,000 (dato estático)');
                        console.warn('   🚨 CONFLICTO: Estos datos no coinciden con la base de datos real');
                    } else {
                        console.log('✅ Datos parecen ser de la API real (no contienen patrones estáticos conocidos)');
                    }
                    
                    // Comparar con datos anteriores
                    if (ultimosDatosPagos && contadorCambios > 1) {
                        console.log('🔄 Comparando con carga anterior...');
                        
                        const pacientesAntes = ultimosDatosPagos.map(p => p.paciente).join(', ');
                        const pacientesAhora = datosActuales.map(p => p.paciente).join(', ');
                        
                        if (pacientesAntes !== pacientesAhora) {
                            console.warn('🚨 CAMBIO DE DATOS DETECTADO:');
                            console.warn('   Antes:', pacientesAntes);
                            console.warn('   Ahora:', pacientesAhora);
                            console.warn('   ❗ Posible conflicto entre datos estáticos y API real');
                        }
                    }
                    
                    ultimosDatosPagos = datosActuales;
                }
            }
        });
    });
    
    // Configurar el observer
    observer.observe(tablaPagos, {
        childList: true,
        subtree: true
    });
    
    console.log('👀 Observer de pagos configurado correctamente');
}

// Iniciar observación cuando se cargue la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observarTablaPagos);
} else {
    observarTablaPagos();
}

// También observar cuando se cambie a la pestaña de pagos
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-section="pagos"], #historial-tab, [data-bs-target="#historial-pagos"]')) {
        console.log('🔄 Cambiando a sección de pagos, reiniciando observación...');
        setTimeout(observarTablaPagos, 500);
    }
});