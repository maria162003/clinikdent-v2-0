/**
 * 🛡️ JWT AVANZADO CON SEGURIDAD EMPRESARIAL
 * Sistema completo de JWT con refresh tokens, blacklist y rate limiting
 * Compatible con el sistema existente
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { promisify } = require('util');

// Importar configuración de base de datos existente
const db = require('../../config/db');

// 🔐 Configuración de JWT Empresarial
const JWT_CONFIG = {
    access: {
        secret: process.env.JWT_SECRET + '_ACCESS_' + crypto.createHash('sha256').update(process.env.JWT_SECRET).digest('hex').substring(0, 16),
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        algorithm: 'HS512'
    },
    refresh: {
        secret: process.env.JWT_SECRET + '_REFRESH_' + crypto.createHash('sha256').update(process.env.JWT_SECRET).digest('hex').substring(16, 32),
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
        algorithm: 'HS512'
    },
    issuer: 'clinikdent-enterprise',
    audience: 'clinikdent-users'
};

// 📝 In-memory blacklist (en producción usar Redis)
const tokenBlacklist = new Set();
const refreshTokenStore = new Map(); // userId -> Set of valid refresh tokens

// 🚨 Rate Limiting para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: { 
        success: false, 
        message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
        code: 'AUTH_RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + '_' + (req.body?.email || req.body?.correo || 'unknown');
    }
});

// 🎫 Generar par de tokens (Access + Refresh)
const generateTokenPair = (payload) => {
    try {
        const userId = payload.id || payload.userId;
        const sessionId = crypto.randomUUID();
        
        // Payload enriquecido para access token
        const accessPayload = {
            ...payload,
            sessionId,
            tokenType: 'access',
            iss: JWT_CONFIG.issuer,
            aud: JWT_CONFIG.audience,
            iat: Math.floor(Date.now() / 1000)
        };

        // Payload para refresh token
        const refreshPayload = {
            userId,
            sessionId,
            tokenType: 'refresh',
            iss: JWT_CONFIG.issuer,
            aud: JWT_CONFIG.audience,
            iat: Math.floor(Date.now() / 1000)
        };

        const accessToken = jwt.sign(accessPayload, JWT_CONFIG.access.secret, {
            expiresIn: JWT_CONFIG.access.expiresIn,
            algorithm: JWT_CONFIG.access.algorithm
        });

        const refreshToken = jwt.sign(refreshPayload, JWT_CONFIG.refresh.secret, {
            expiresIn: JWT_CONFIG.refresh.expiresIn,
            algorithm: JWT_CONFIG.refresh.algorithm
        });

        // Almacenar refresh token válido
        if (!refreshTokenStore.has(userId)) {
            refreshTokenStore.set(userId, new Set());
        }
        refreshTokenStore.get(userId).add(refreshToken);

        return {
            accessToken,
            refreshToken,
            expiresIn: JWT_CONFIG.access.expiresIn,
            tokenType: 'Bearer',
            sessionId
        };

    } catch (error) {
        console.error('❌ Error generando tokens:', error);
        throw new Error('Error generando tokens de autenticación');
    }
};

// 🔍 Verificar Access Token
const verifyAccessToken = async (token) => {
    try {
        // Verificar si está en blacklist
        if (tokenBlacklist.has(token)) {
            throw new Error('Token revocado');
        }

        const decoded = jwt.verify(token, JWT_CONFIG.access.secret, {
            algorithms: [JWT_CONFIG.access.algorithm],
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });

        if (decoded.tokenType !== 'access') {
            throw new Error('Tipo de token inválido');
        }

        return decoded;

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token malformado');
        } else {
            throw error;
        }
    }
};

// 🔄 Verificar Refresh Token
const verifyRefreshToken = async (token, userId) => {
    try {
        // Verificar si está en blacklist
        if (tokenBlacklist.has(token)) {
            throw new Error('Refresh token revocado');
        }

        // Verificar si está en la lista de tokens válidos
        if (!refreshTokenStore.has(userId) || !refreshTokenStore.get(userId).has(token)) {
            throw new Error('Refresh token no válido');
        }

        const decoded = jwt.verify(token, JWT_CONFIG.refresh.secret, {
            algorithms: [JWT_CONFIG.refresh.algorithm],
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });

        if (decoded.tokenType !== 'refresh' || decoded.userId !== userId) {
            throw new Error('Refresh token inválido');
        }

        return decoded;

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Refresh token malformado');
        } else {
            throw error;
        }
    }
};

// 🛡️ Middleware de autenticación empresarial (compatible con existente)
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token de acceso requerido',
                code: 'TOKEN_REQUIRED'
            });
        }

        const token = authHeader.substring(7);
        const decoded = await verifyAccessToken(token);

        // Verificar si el usuario todavía existe y está activo
        if (db) {
            const [userRows] = await db.query('SELECT id, activo FROM usuarios WHERE id = ?', [decoded.id || decoded.userId]);
            
            if (!userRows.length || !userRows[0].activo) {
                // Revocar tokens del usuario inactivo
                await revokeAllUserTokens(decoded.id || decoded.userId);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Usuario inactivo o no encontrado',
                    code: 'USER_INACTIVE'
                });
            }
        }

        // Agregar información del usuario a la request
        req.user = decoded;
        req.token = token;

        // Log de acceso exitoso
        console.log(`✅ Acceso autorizado: Usuario ${decoded.id || decoded.userId} - Session ${decoded.sessionId}`);
        
        next();

    } catch (error) {
        console.error('❌ Error de autenticación:', error.message);
        
        return res.status(401).json({ 
            success: false, 
            message: error.message,
            code: 'AUTH_FAILED'
        });
    }
};

// 🔄 Refrescar tokens
const refreshTokenFunction = async (refreshToken, userId) => {
    try {
        // Verificar refresh token
        const decoded = await verifyRefreshToken(refreshToken, userId);
        
        // Obtener información actual del usuario
        const [userRows] = await db.query(
            'SELECT id, email, correo, nombre, role, tipo_usuario FROM usuarios WHERE id = ?', 
            [userId]
        );

        if (!userRows.length) {
            throw new Error('Usuario no encontrado');
        }

        const user = userRows[0];
        
        // Revocar el refresh token usado
        if (refreshTokenStore.has(userId)) {
            refreshTokenStore.get(userId).delete(refreshToken);
        }

        // Generar nuevo par de tokens
        const newTokenPair = generateTokenPair({
            id: user.id,
            email: user.email || user.correo,
            nombre: user.nombre,
            role: user.role,
            tipo_usuario: user.tipo_usuario
        });

        return newTokenPair;

    } catch (error) {
        throw new Error('Error refrescando tokens: ' + error.message);
    }
};

// 🚫 Revocar token específico
const revokeToken = (token) => {
    tokenBlacklist.add(token);
    console.log('🚫 Token revocado exitosamente');
};

// 🚫 Revocar todos los tokens de un usuario
const revokeAllUserTokens = async (userId) => {
    try {
        // Revocar refresh tokens
        if (refreshTokenStore.has(userId)) {
            const userRefreshTokens = refreshTokenStore.get(userId);
            userRefreshTokens.forEach(token => {
                tokenBlacklist.add(token);
            });
            refreshTokenStore.delete(userId);
        }

        console.log(`🚫 Todos los tokens del usuario ${userId} han sido revocados`);
    } catch (error) {
        console.error('❌ Error revocando tokens del usuario:', error);
    }
};

// 🧹 Limpiar tokens expirados de la blacklist (tarea programada)
const cleanupExpiredTokens = () => {
    // En producción, esta función se ejecutaría con un cron job
    // Por ahora, es un placeholder para limpiar la memoria
    console.log('🧹 Limpiando tokens expirados...');
};

// 📊 Middleware de logging para auditoría
const auditLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log de request
    console.log(`📝 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip} - User: ${req.user?.id || 'Anonymous'}`);
    
    // Interceptar response para logging
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        console.log(`📊 [${new Date().toISOString()}] Response: ${res.statusCode} - Duration: ${duration}ms`);
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = {
    // Funciones principales
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    refreshTokens: refreshTokenFunction,
    
    // Middlewares
    authenticateJWT,
    authLimiter,
    auditLogger,
    
    // Gestión de tokens
    revokeToken,
    revokeAllUserTokens,
    cleanupExpiredTokens,
    
    // Configuración (solo lectura)
    JWT_CONFIG: { ...JWT_CONFIG }
};