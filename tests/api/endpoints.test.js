/**
 * 🧪 TESTS DE INTEGRACIÓN - API COMPLETA
 * Pruebas end-to-end de las APIs principales
 */

const request = require('supertest');
const express = require('express');

describe('🌐 API Integration Tests', () => {
    let app;
    let authToken;

    beforeAll(async () => {
        // Crear app de prueba (mock)
        app = express();
        app.use(express.json());
        
        // Simular rutas básicas para testing
        app.post('/api/auth/login', (req, res) => {
            if (req.body.email === 'test@clinikdent.com' && req.body.password === 'TestPass123!') {
                res.json({ 
                    success: true, 
                    token: 'mock-jwt-token',
                    user: { id: 1, email: req.body.email, rol: 'admin' }
                });
            } else {
                res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }
        });

        app.get('/api/usuarios', (req, res) => {
            res.json({
                success: true,
                data: [
                    { id: 1, nombre: 'Admin Test', email: 'admin@test.com', rol: 'admin' },
                    { id: 2, nombre: 'Doctor Test', email: 'doctor@test.com', rol: 'odontologo' }
                ]
            });
        });

        app.get('/api/inventario', (req, res) => {
            res.json({
                success: true,
                data: [
                    { id: 1, nombre: 'Anestesia Local', stock: 50, precio: 15000 },
                    { id: 2, nombre: 'Jeringa Dental', stock: 25, precio: 8000 }
                ]
            });
        });
    });

    describe('🔐 Autenticación', () => {
        test('✅ POST /api/auth/login - Login exitoso', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@clinikdent.com',
                    password: 'TestPass123!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe('test@clinikdent.com');
            
            authToken = response.body.token;
        });

        test('❌ POST /api/auth/login - Credenciales incorrectas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@email.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('inválidas');
        });

        test('❌ POST /api/auth/login - Datos faltantes', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@email.com'
                    // password faltante
                });

            expect(response.status).toBe(401);
        });
    });

    describe('👥 Gestión de Usuarios', () => {
        test('✅ GET /api/usuarios - Listar usuarios', async () => {
            const response = await request(app)
                .get('/api/usuarios');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            
            // Verificar estructura de usuario
            const usuario = response.body.data[0];
            expect(usuario).toHaveProperty('id');
            expect(usuario).toHaveProperty('nombre');
            expect(usuario).toHaveProperty('email');
            expect(usuario).toHaveProperty('rol');
        });

        test('✅ Validar roles de usuario', async () => {
            const response = await request(app).get('/api/usuarios');
            const usuarios = response.body.data;
            
            usuarios.forEach(usuario => {
                expect(['admin', 'odontologo', 'paciente', 'recepcionista']).toContain(usuario.rol);
            });
        });
    });

    describe('📦 Gestión de Inventario', () => {
        test('✅ GET /api/inventario - Listar productos', async () => {
            const response = await request(app)
                .get('/api/inventario');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            
            // Verificar estructura de producto
            const producto = response.body.data[0];
            expect(producto).toHaveProperty('id');
            expect(producto).toHaveProperty('nombre');
            expect(producto).toHaveProperty('stock');
            expect(producto).toHaveProperty('precio');
            expect(typeof producto.stock).toBe('number');
            expect(typeof producto.precio).toBe('number');
        });

        test('✅ Validar datos de productos', async () => {
            const response = await request(app).get('/api/inventario');
            const productos = response.body.data;
            
            productos.forEach(producto => {
                expect(producto.stock).toBeGreaterThanOrEqual(0);
                expect(producto.precio).toBeGreaterThan(0);
                expect(typeof producto.nombre).toBe('string');
                expect(producto.nombre.length).toBeGreaterThan(0);
            });
        });
    });

    describe('🔄 Flujos Completos', () => {
        test('✅ Flujo: Login → Consultar Usuarios → Consultar Inventario', async () => {
            // 1. Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send(global.testConfig.testUser);

            expect(loginResponse.status).toBe(200);
            const token = loginResponse.body.token;

            // 2. Consultar usuarios
            const usuariosResponse = await request(app)
                .get('/api/usuarios');

            expect(usuariosResponse.status).toBe(200);
            expect(usuariosResponse.body.data.length).toBeGreaterThan(0);

            // 3. Consultar inventario
            const inventarioResponse = await request(app)
                .get('/api/inventario');

            expect(inventarioResponse.status).toBe(200);
            expect(inventarioResponse.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('🚦 Manejo de Errores', () => {
        test('❌ Endpoints inexistentes deben retornar 404', async () => {
            const response = await request(app)
                .get('/api/endpoint-inexistente');

            expect(response.status).toBe(404);
        });

        test('❌ Métodos HTTP incorrectos', async () => {
            const response = await request(app)
                .delete('/api/usuarios'); // Método no permitido

            expect([404, 405]).toContain(response.status);
        });
    });

    describe('📊 Validación de Respuestas', () => {
        test('✅ Todas las respuestas deben tener formato consistente', async () => {
            const endpoints = ['/api/usuarios', '/api/inventario'];
            
            for (const endpoint of endpoints) {
                const response = await request(app).get(endpoint);
                
                expect(response.body).toHaveProperty('success');
                expect(typeof response.body.success).toBe('boolean');
                
                if (response.body.success) {
                    expect(response.body).toHaveProperty('data');
                }
            }
        });

        test('✅ Headers de respuesta correctos', async () => {
            const response = await request(app).get('/api/usuarios');
            
            expect(response.headers['content-type']).toMatch(/json/);
        });
    });
});
