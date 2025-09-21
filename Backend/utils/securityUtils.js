const crypto = require('crypto');

// Generar token alfanumérico seguro
exports.generateSecureToken = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.randomBytes(length);
    const result = new Array(length);
    const len = chars.length;
    
    for (let i = 0; i < length; i++) {
        result[i] = chars[randomBytes[i] % len];
    }
    
    return result.join('');
};

// Validación mejorada de contraseñas
exports.validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    const validations = [
        {
            isValid: password.length >= minLength,
            message: `La contraseña debe tener al menos ${minLength} caracteres`
        },
        {
            isValid: hasUpperCase,
            message: 'La contraseña debe incluir al menos una mayúscula'
        },
        {
            isValid: hasLowerCase,
            message: 'La contraseña debe incluir al menos una minúscula'
        },
        {
            isValid: hasNumbers,
            message: 'La contraseña debe incluir al menos un número'
        },
        {
            isValid: hasSpecialChar,
            message: 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*)'
        }
    ];

    const failures = validations.filter(v => !v.isValid);
    return {
        isValid: failures.length === 0,
        errors: failures.map(f => f.message)
    };
};

// Constantes de seguridad
exports.SECURITY_CONSTANTS = {
    MAX_LOGIN_ATTEMPTS: 3,
    LOCK_DURATION_MINUTES: 15,
    PASSWORD_RESET_TOKEN_LENGTH: 8,
    TOKEN_EXPIRATION_MINUTES: 15
};