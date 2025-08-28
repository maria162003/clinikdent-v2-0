const jwt = require('jsonwebtoken');

/**
 * 🔒 MIDDLEWARE DE AUTENTICACIÓN SEGURO CON JWT
 * Valida tokens JWT y protege rutas
 */
const authMiddleware = (req, res, next) => {
    console.log('🔐 AuthMiddleware - Validando token JWT...');
    
    // 🎫 Extraer token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
    
    console.log('🔐 AuthMiddleware - Token recibido:', token ? 'SÍ (oculto por seguridad)' : 'NO');
    
    // 🚫 Si no hay token
    if (!token) {
        console.log('❌ AuthMiddleware - Token faltante');
        
        // Para desarrollo temporal, permitir acceso limitado
        if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ MODO DESARROLLO - Permitiendo acceso temporal');
            req.user = { 
                id: 1, 
                rol: 'administrador',
                temp: true // Indicar que es temporal
            };
            return next();
        }
        
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Token requerido.',
            code: 'TOKEN_MISSING'
        });
    }
    
    try {
        // 🔍 Verificar y decodificar token JWT
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const decoded = jwt.verify(token, jwtSecret, {
            issuer: 'clinikdent-v2',
            audience: 'clinikdent-users'
        });
        
        // ✅ Token válido - agregar info de usuario a request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol,
            nombre: decoded.nombre,
            apellido: decoded.apellido,
            tokenExp: decoded.exp
        };
        
        console.log('✅ AuthMiddleware - Token válido para usuario:', decoded.nombre, decoded.apellido);
        
        // 🕐 Verificar si el token está próximo a expirar (menos de 1 hora)
        const now = Math.floor(Date.now() / 1000);
        const timeToExpire = decoded.exp - now;
        
        if (timeToExpire < 3600) { // Menos de 1 hora
            console.log('⚠️ AuthMiddleware - Token expira pronto:', timeToExpire, 'segundos');
            res.setHeader('X-Token-Warning', 'Token expires soon');
        }
        
        next();
        
    } catch (error) {
        console.error('❌ AuthMiddleware - Error validando token:', error.message);
        
        let errorResponse = {
            success: false,
            message: 'Token inválido.',
            code: 'TOKEN_INVALID'
        };
        
        // 🕐 Manejo específico de tokens expirados
        if (error.name === 'TokenExpiredError') {
            errorResponse.message = 'Token expirado. Por favor, inicia sesión nuevamente.';
            errorResponse.code = 'TOKEN_EXPIRED';
            errorResponse.expiredAt = error.expiredAt;
        }
        // 🔒 Token malformado o inválido
        else if (error.name === 'JsonWebTokenError') {
            errorResponse.message = 'Token malformado o inválido.';
            errorResponse.code = 'TOKEN_MALFORMED';
        }
        
        return res.status(401).json(errorResponse);
    }
};

/**
 * 🎯 MIDDLEWARE DE AUTORIZACIÓN POR ROL
 * Verifica que el usuario tenga el rol adecuado
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('🔐 RequireRole - Verificando rol:', req.user?.rol, 'contra:', allowedRoles);
        
        if (!req.user || !req.user.rol) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Usuario no identificado.',
                code: 'USER_NOT_IDENTIFIED'
            });
        }
        
        if (!allowedRoles.includes(req.user.rol)) {
            console.log('❌ RequireRole - Rol insuficiente:', req.user.rol);
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Permisos insuficientes.',
                code: 'INSUFFICIENT_PERMISSIONS',
                requiredRoles: allowedRoles,
                userRole: req.user.rol
            });
        }
        
        console.log('✅ RequireRole - Autorización exitosa');
        next();
    };
};

module.exports = {
    authMiddleware,
    requireRole
};
