/**
 * 🧪 CONFIGURACIÓN GLOBAL DE TESTS - CLINIKDENT V2.0
 * Setup inicial para todas las pruebas Jest
 */

// Configurar timeout global
jest.setTimeout(30000);

// Variables globales para tests
global.testConfig = {
    baseURL: 'http://localhost:3000',
    testDB: {
        host: process.env.TEST_DB_HOST || 'localhost',
        user: process.env.TEST_DB_USER || 'test_user',
        password: process.env.TEST_DB_PASSWORD || 'test_password',
        database: process.env.TEST_DB_NAME || 'clinikdent_test'
    },
    testUser: {
        email: 'test@clinikdent.com',
        password: 'TestPass123!',
        role: 'admin'
    },
    apiEndpoints: {
        auth: '/api/auth',
        usuarios: '/api/usuarios',
        citas: '/api/citas',
        inventario: '/api/inventario',
        proveedores: '/api/proveedores',
        pagos: '/api/pagos'
    }
};

// Configurar mocks globales
beforeAll(() => {
    // Mock para console en producción
    if (process.env.NODE_ENV === 'test') {
        global.console = {
            ...console,
            log: jest.fn(),
            debug: jest.fn(),
            info: jest.fn()
        };
    }
});

// Limpiar mocks después de cada test
afterEach(() => {
    jest.clearAllMocks();
});

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-very-secure';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'clinikdent_test';

// Función helper para crear datos de prueba
global.createTestData = {
    user: () => ({
        nombre: 'Usuario Test',
        email: 'test@example.com',
        telefono: '3001234567',
        rol: 'paciente',
        password: 'TestPass123!'
    }),
    
    cita: () => ({
        paciente_id: 1,
        odontologo_id: 1,
        fecha: new Date().toISOString().split('T')[0],
        hora: '10:00',
        tratamiento: 'Consulta General',
        estado: 'programada'
    }),
    
    producto: () => ({
        nombre: 'Producto Test',
        categoria_id: 1,
        stock: 100,
        precio: 25000,
        proveedor_id: 1
    })
};

// Función helper para limpiar base de datos de prueba
global.cleanTestDB = async () => {
    // Esta función se implementará cuando tengamos conexión a DB de prueba
    console.log('🧹 Limpiando base de datos de prueba...');
};

console.log('✅ Setup de pruebas configurado correctamente');
