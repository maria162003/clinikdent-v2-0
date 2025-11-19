// config-dinamica.js
// Cargar configuración dinámica de horarios y branding desde el servidor

(async function() {
    console.log('🔧 Cargando configuración dinámica...');
    
    try {
        const response = await fetch('/api/configuracion/publica');
        const data = await response.json();
        
        if (data.success && data.configuracion) {
            const config = data.configuracion;
            console.log('✅ Configuración cargada:', config);
            
            // Actualizar horarios
            if (config.horario_apertura && config.horario_cierre) {
                const horaApertura = formatearHora(config.horario_apertura);
                const horaCierre = formatearHora(config.horario_cierre);
                const horarioTexto = `${horaApertura} - ${horaCierre}`;
                
                // Actualizar en sección de contacto
                const horarioSemana = document.getElementById('horarioSemana');
                if (horarioSemana) {
                    horarioSemana.textContent = horarioTexto;
                }
                
                // Actualizar en footer
                const horarioSemanaFooter = document.getElementById('horarioSemanaFooter');
                if (horarioSemanaFooter) {
                    horarioSemanaFooter.textContent = horarioTexto;
                }
                
                // Si los días de atención incluyen sábado, mostrar horario
                if (config.dias_atencion && Array.isArray(config.dias_atencion)) {
                    const incluyeSabado = config.dias_atencion.some(dia => 
                        dia.toLowerCase().includes('sab') || dia.toLowerCase() === 'sáb'
                    );
                    
                    if (incluyeSabado) {
                        const horarioSabado = document.getElementById('horarioSabado');
                        const horarioSabadoFooter = document.getElementById('horarioSabadoFooter');
                        
                        if (horarioSabado) {
                            horarioSabado.textContent = horarioTexto;
                        }
                        if (horarioSabadoFooter) {
                            horarioSabadoFooter.textContent = horarioTexto;
                        }
                        
                        console.log('✅ Horarios actualizados (incluye sábado)');
                    } else {
                        // Si no incluye sábado, ocultar o indicar cerrado
                        const horarioSabado = document.getElementById('horarioSabado');
                        const horarioSabadoFooter = document.getElementById('horarioSabadoFooter');
                        
                        if (horarioSabado) {
                            horarioSabado.parentElement.style.display = 'none';
                        }
                        if (horarioSabadoFooter) {
                            horarioSabadoFooter.parentElement.style.display = 'none';
                        }
                        
                        console.log('ℹ️ Sábado no está en días de atención, elemento oculto');
                    }
                }
                
                console.log('✅ Horarios actualizados correctamente');
            }
            
            // Actualizar nombre de la clínica
            if (config.clinica_nombre) {
                // Actualizar en navbar
                const brandElements = document.querySelectorAll('.navbar-brand h1');
                brandElements.forEach(el => {
                    el.textContent = config.clinica_nombre;
                });
                
                // Actualizar en footer
                const footerBrands = document.querySelectorAll('footer h2');
                footerBrands.forEach(el => {
                    el.textContent = config.clinica_nombre;
                });
                
                // Actualizar título de la página
                const titleElement = document.querySelector('title');
                if (titleElement && titleElement.textContent.includes('Clinik Dent')) {
                    titleElement.textContent = titleElement.textContent.replace('Clinik Dent', config.clinica_nombre);
                }
                
                console.log('✅ Nombre de clínica actualizado:', config.clinica_nombre);
            }
            
            // Aplicar color primario si está configurado
            if (config.clinica_color_primario && config.clinica_color_primario !== '#0ea5e9') {
                aplicarColorPrimario(config.clinica_color_primario);
            }
            
            // Si hay logo configurado, actualizarlo
            if (config.clinica_logo_url && config.clinica_logo_url.trim() !== '') {
                actualizarLogo(config.clinica_logo_url);
            }
            
        } else {
            console.warn('⚠️ No se pudo cargar la configuración, usando valores por defecto');
        }
        
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        console.log('ℹ️ Usando valores por defecto del HTML');
    }
})();

// Función auxiliar para formatear hora de 24h a 12h con am/pm
function formatearHora(hora24) {
    const [horas, minutos] = hora24.split(':');
    const horaNum = parseInt(horas);
    
    if (horaNum === 0) {
        return `12:${minutos} am`;
    } else if (horaNum < 12) {
        return `${horaNum}:${minutos} am`;
    } else if (horaNum === 12) {
        return `12:${minutos} pm`;
    } else {
        return `${horaNum - 12}:${minutos} pm`;
    }
}

// Aplicar color primario a los elementos principales
function aplicarColorPrimario(color) {
    try {
        // Crear una hoja de estilos dinámica
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --primary-color: ${color} !important;
            }
            .btn-primary {
                background-color: ${color} !important;
                border-color: ${color} !important;
            }
            .text-primary {
                color: ${color} !important;
            }
            .bg-primary {
                background-color: ${color} !important;
            }
            .navbar {
                background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%) !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Color primario aplicado:', color);
    } catch (error) {
        console.error('❌ Error aplicando color primario:', error);
    }
}

// Actualizar logo de la clínica
function actualizarLogo(logoUrl) {
    try {
        const logoElements = document.querySelectorAll('.navbar-brand img, footer img.logo');
        logoElements.forEach(img => {
            img.src = logoUrl;
            img.alt = 'Logo de la clínica';
        });
        console.log('✅ Logo actualizado:', logoUrl);
    } catch (error) {
        console.error('❌ Error actualizando logo:', error);
    }
}
