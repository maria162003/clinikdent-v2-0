// Script de prueba para crear usuario
const testUserData = {
    nombre: 'Test',
    apellido: 'Usuario',
    correo: 'test' + Date.now() + '@test.com',
    telefono: '1234567890',
    direccion: 'Calle Test 123',
    rol: 'paciente',
    fecha_nacimiento: '1990-01-01',
    password: 'test123',
    tipo_documento: 'CC',
    numero_documento: '12345678'
};

fetch('/api/usuarios', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
    },
    body: JSON.stringify(testUserData)
})
.then(response => response.json())
.then(data => {
    console.log('✅ Resultado de la creación de usuario:', data);
})
.catch(error => {
    console.error('❌ Error:', error);
});

console.log('🧪 Ejecutando prueba de creación de usuario...');
