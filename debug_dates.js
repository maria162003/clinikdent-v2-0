// Script simple para entender el problema de fechas
console.log('Testing date parsing...');

// Simular los datos que vienen de la API
const citasEjemplo = [
    {
        id: 1,
        fecha: '2025-09-06T00:00:00.000Z',
        hora: '10:30:00',
        estado: 'programada'
    },
    {
        id: 2,
        fecha: '2025-09-10T00:00:00.000Z',
        hora: '14:00:00',
        estado: 'programada'
    }
];

const ahora = new Date();
console.log('Fecha actual:', ahora);

citasEjemplo.forEach(cita => {
    console.log(`\nCita ${cita.id}:`);
    console.log('  Fecha original:', cita.fecha);
    console.log('  Hora:', cita.hora);
    
    // Método original (problemático)
    const fechaStr = cita.fecha.split('T')[0];
    const fechaCitaOriginal = new Date(`${fechaStr} ${cita.hora}`);
    console.log('  Método original:', fechaCitaOriginal);
    console.log('  Es futura (original):', fechaCitaOriginal > ahora);
    
    // Método mejorado
    const [year, month, day] = fechaStr.split('-');
    const [hour, minute] = cita.hora.split(':');
    const fechaCitaMejorado = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    console.log('  Método mejorado:', fechaCitaMejorado);
    console.log('  Es futura (mejorado):', fechaCitaMejorado > ahora);
});
