/**
 * 🔐 EJEMPLO DE INTEGRACIÓN - SEGURIDAD EMPRESARIAL
 * Este archivo muestra cómo integrar la seguridad empresarial
 * en la aplicación existente SIN ROMPER FUNCIONALIDAD
 */

const express = require('express');
const cors = require('cors');

// 🛡️ IMPORTAR SEGURIDAD EMPRESARIAL
const { setupEnterpriseSecurity, validators } = require('./Backend/security/middleware/securityStack');
const { authenticateJWT, generateTokenPair } = require('./Backend/security/middleware/jwtAdvanced');
const { SecureHashing } = require('./Backend/security/encryption/dataEncryption');

// Crear app (código existente)
const app = express();

// 🔐 ACTIVAR SEGURIDAD EMPRESARIAL - ANTES de middlewares existentes
setupEnterpriseSecurity(app);

// Middlewares existentes (sin cambios)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🎯 EJEMPLO 1: Login mejorado con JWT avanzado
app.post('/api/auth/login-secure', 
    // Validación empresarial automática
    validators.emailColombian(),
    validators.passwordEnterprise('password'),
    async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Buscar usuario (código existente)
            const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            
            if (!users.length) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciales inválidas' 
                });
            }
            
            const user = users[0];
            
            // Verificar contraseña con sistema híbrido (compatible con hashes existentes)
            const isValidPassword = await SecureHashing.verifyPasswordHybrid(password, user.contraseña_hash);
            
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciales inválidas' 
                });
            }
            
            // Generar tokens empresariales (reemplaza JWT simple)
            const tokenPair = generateTokenPair({
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                role: user.role,
                tipo_usuario: user.tipo_usuario
            });
            
            res.json({
                success: true,
                message: 'Login exitoso',
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    role: user.role
                },
                ...tokenPair // accessToken, refreshToken, expiresIn, sessionId
            });
            
        } catch (error) {
            console.error('Error en login seguro:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
);

// 🎯 EJEMPLO 2: Registro con validación empresarial
app.post('/api/auth/register-secure',
    // Stack completo de validación colombiana
    validators.emailColombian(),
    validators.passwordEnterprise('password'),
    validators.documentoColombian(),
    validators.telefonoColombian(),
    validators.fechaNacimiento(),
    validators.direccionColombian(),
    async (req, res) => {
        try {
            const { 
                email, password, nombre, apellido, 
                tipo_documento, numero_documento,
                telefono, fecha_nacimiento, direccion 
            } = req.body;
            
            // Hash seguro de contraseña (Argon2 en producción, bcrypt en desarrollo)
            const hashedPassword = await SecureHashing.hashPassword(password);
            
            // Insertar usuario (código existente)
            const [result] = await db.query(`
                INSERT INTO usuarios (
                    email, contraseña_hash, nombre, apellido,
                    tipo_documento, numero_documento,
                    telefono, fecha_nacimiento, direccion,
                    fecha_registro, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)
            `, [
                email, hashedPassword, nombre, apellido,
                tipo_documento, numero_documento,
                telefono, fecha_nacimiento, direccion
            ]);
            
            res.json({
                success: true,
                message: 'Usuario registrado exitosamente',
                userId: result.insertId
            });
            
        } catch (error) {
            console.error('Error en registro seguro:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El email ya está registrado' 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
);

// 🎯 EJEMPLO 3: Ruta protegida (compatible con middleware existente)
app.get('/api/user/profile', 
    authenticateJWT, // Reemplaza tu middleware JWT existente
    async (req, res) => {
        try {
            // req.user contiene la información desencriptada del token
            const userId = req.user.id;
            
            const [users] = await db.query(`
                SELECT id, email, nombre, apellido, telefono, fecha_registro
                FROM usuarios WHERE id = ?
            `, [userId]);
            
            if (!users.length) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Usuario no encontrado' 
                });
            }
            
            res.json({
                success: true,
                user: users[0]
            });
            
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
);

// 🎯 EJEMPLO 4: Endpoint de refresh token
app.post('/api/auth/refresh-token', async (req, res) => {
    try {
        const { refreshToken, userId } = req.body;
        
        if (!refreshToken || !userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Refresh token y userId requeridos' 
            });
        }
        
        // Importar función de refresh
        const { refreshTokens } = require('./Backend/security/middleware/jwtAdvanced');
        
        const newTokens = await refreshTokens(refreshToken, userId);
        
        res.json({
            success: true,
            message: 'Tokens actualizados',
            ...newTokens
        });
        
    } catch (error) {
        console.error('Error refrescando tokens:', error);
        res.status(401).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// 🎯 EJEMPLO 5: Métricas de seguridad (solo admin)
app.get('/api/admin/security-metrics', 
    authenticateJWT,
    async (req, res) => {
        try {
            // Verificar que es admin
            if (req.user.role !== 'admin' && req.user.tipo_usuario !== 'administrador') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Acceso denegado' 
                });
            }
            
            const { getSecurityMetrics } = require('./Backend/security/middleware/securityStack');
            const metrics = await getSecurityMetrics();
            
            res.json({
                success: true,
                metrics
            });
            
        } catch (error) {
            console.error('Error obteniendo métricas:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
);

// Importar y usar rutas existentes (sin cambios)
// ... todas tus rutas existentes siguen funcionando igual

// Servir archivos estáticos (sin cambios)
app.use(express.static('public'));

// Puerto (sin cambios)
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`🔐 Seguridad empresarial ACTIVA`);
    console.log(`📊 Logs en: Backend/logs/`);
    console.log(`📚 Documentación: Backend/security/README.md`);
});

// 📋 NOTAS DE MIGRACIÓN:
// 
// 1. Reemplazar rutas de login/register existentes por las versiones seguras
// 2. Cambiar middleware JWT por authenticateJWT
// 3. Usar SecureHashing.verifyPasswordHybrid() para compatibilidad
// 4. Todas las demás rutas siguen funcionando sin cambios
// 5. El frontend no requiere modificaciones

module.exports = app;