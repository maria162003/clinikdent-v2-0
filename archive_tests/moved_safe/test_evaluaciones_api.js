// Test para verificar API de evaluaciones
const fetch = require('node-fetch');

async function testEvaluacionesAPI() {
    try {
        console.log('🔄 Consultando API de evaluaciones...');
        
        const response = await fetch('http://localhost:3001/api/evaluaciones/admin/todas');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Respuesta de API:');
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\n📊 Análisis de evaluaciones:');
        const evaluaciones = data.evaluaciones || data;
        
        if (Array.isArray(evaluaciones)) {
            console.log(`Total evaluaciones: ${evaluaciones.length}`);
            
            evaluaciones.forEach((evaluacion, index) => {
                console.log(`\nEvaluación ${index + 1}:`);
                console.log(`- Paciente: ${evaluacion.nombre_paciente || evaluacion.paciente_nombre || 'N/A'}`);
                console.log(`- Servicio: ${evaluacion.calificacion_servicio || 'N/A'}`);
                console.log(`- Atención: ${evaluacion.calificacion_atencion || 'N/A'}`);
                console.log(`- Instalaciones: ${evaluacion.calificacion_instalaciones || 'N/A'}`);
                console.log(`- Fecha: ${evaluacion.fecha_evaluacion || evaluacion.created_at || 'N/A'}`);
            });
        } else {
            console.log('⚠️ No se recibió un array de evaluaciones');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEvaluacionesAPI();