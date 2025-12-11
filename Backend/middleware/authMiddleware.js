// Middleware básico para obtener el usuario del localStorage enviado desde el frontend
const authMiddleware = (req, res, next) => {
    // Por ahora, vamos a obtener el userId desde el header o query params
    const userId = req.headers['user-id'] || req.query.userId || (req.body && req.body.userId);
    
    console.log('🔐 AuthMiddleware - Headers recibidos:', Object.keys(req.headers));
    console.log('🔐 AuthMiddleware - Query params:', req.query);
    console.log('🔐 AuthMiddleware - userId extraído:', userId);
    
    // Para desarrollo, permitir acceso temporal sin autenticación estricta
    if (!userId) {
        console.log('⚠️ AuthMiddleware - No se encontró userId, usando usuario por defecto para desarrollo');
        req.user = { id: 1 }; // Usuario por defecto para desarrollo
        console.log('✅ AuthMiddleware - Usuario configurado (desarrollo):', req.user);
        return next();
    }
    
    // Agregamos el usuario a la request
    req.user = { id: parseInt(userId) };
    console.log('✅ AuthMiddleware - Usuario configurado:', req.user);
    next();
};

module.exports = authMiddleware;
