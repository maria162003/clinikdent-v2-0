/**
 * 🔐 SISTEMA DE ENCRIPTACIÓN EMPRESARIAL
 * AES-256-GCM para datos sensibles y hashing seguro
 * Compatible con sistemas existentes
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const argon2 = require('argon2');

// 🔑 Configuración de encriptación
const ENCRYPTION_CONFIG = {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16,  // 128 bits
    tagLength: 16, // 128 bits
    saltLength: 32, // 256 bits
    iterations: 100000, // PBKDF2 iterations
    memorySize: 64 * 1024, // 64MB para Argon2
    timeCost: 3,
    parallelism: 4
};

// 🛡️ Generar clave maestra desde password/secret
const generateMasterKey = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, ENCRYPTION_CONFIG.iterations, ENCRYPTION_CONFIG.keyLength, 'sha512');
};

// 🔐 Encriptar datos sensibles
class DataEncryption {
    constructor() {
        // Obtener o generar master key
        this.masterKey = this.getMasterKey();
    }

    getMasterKey() {
        const masterSecret = process.env.ENCRYPTION_MASTER_KEY || process.env.JWT_SECRET || 'default-key-change-in-production';
        const salt = crypto.createHash('sha256').update('clinikdent-salt').digest();
        return generateMasterKey(masterSecret, salt);
    }

    /**
     * Encriptar datos sensibles con AES-256-GCM
     * @param {string} plaintext - Texto a encriptar
     * @param {string} additionalData - Datos adicionales para autenticación (opcional)
     * @returns {object} - Objeto con datos encriptados
     */
    encrypt(plaintext, additionalData = null) {
        try {
            const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
            const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, this.masterKey);
            cipher.setAAD(Buffer.from(additionalData || '', 'utf8'));

            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();

            return {
                encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
                algorithm: ENCRYPTION_CONFIG.algorithm
            };
        } catch (error) {
            console.error('❌ Error encriptando datos:', error);
            throw new Error('Error en encriptación de datos');
        }
    }

    /**
     * Desencriptar datos
     * @param {object} encryptedData - Datos encriptados
     * @param {string} additionalData - Datos adicionales para autenticación (opcional)
     * @returns {string} - Texto desencriptado
     */
    decrypt(encryptedData, additionalData = null) {
        try {
            const { encrypted, iv, tag, algorithm } = encryptedData;
            
            if (algorithm !== ENCRYPTION_CONFIG.algorithm) {
                throw new Error('Algoritmo de encriptación no compatible');
            }

            const decipher = crypto.createDecipher(algorithm, this.masterKey);
            decipher.setAuthTag(Buffer.from(tag, 'hex'));
            decipher.setAAD(Buffer.from(additionalData || '', 'utf8'));

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('❌ Error desencriptando datos:', error);
            throw new Error('Error en desencriptación de datos');
        }
    }

    /**
     * Encriptar objeto completo
     * @param {object} obj - Objeto a encriptar
     * @returns {string} - String encriptado
     */
    encryptObject(obj) {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }

    /**
     * Desencriptar objeto
     * @param {object} encryptedData - Datos encriptados
     * @returns {object} - Objeto desencriptado
     */
    decryptObject(encryptedData) {
        const jsonString = this.decrypt(encryptedData);
        return JSON.parse(jsonString);
    }
}

// 🔒 Sistema de Hashing Avanzado
class SecureHashing {
    /**
     * Hash con Argon2 (recomendado para nuevas contraseñas)
     * @param {string} password - Contraseña a hashear
     * @returns {string} - Hash seguro
     */
    static async hashPasswordArgon2(password) {
        try {
            const hash = await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: ENCRYPTION_CONFIG.memorySize,
                timeCost: ENCRYPTION_CONFIG.timeCost,
                parallelism: ENCRYPTION_CONFIG.parallelism
            });
            return hash;
        } catch (error) {
            console.error('❌ Error hashing password con Argon2:', error);
            throw new Error('Error procesando contraseña');
        }
    }

    /**
     * Verificar contraseña con Argon2
     * @param {string} password - Contraseña a verificar
     * @param {string} hash - Hash almacenado
     * @returns {boolean} - True si coincide
     */
    static async verifyPasswordArgon2(password, hash) {
        try {
            return await argon2.verify(hash, password);
        } catch (error) {
            console.error('❌ Error verificando password con Argon2:', error);
            return false;
        }
    }

    /**
     * Hash con bcrypt (compatible con sistema existente)
     * @param {string} password - Contraseña a hashear
     * @param {number} rounds - Rondas de hashing (default: 12)
     * @returns {string} - Hash bcrypt
     */
    static async hashPasswordBcrypt(password, rounds = 12) {
        try {
            return await bcrypt.hash(password, rounds);
        } catch (error) {
            console.error('❌ Error hashing password con bcrypt:', error);
            throw new Error('Error procesando contraseña');
        }
    }

    /**
     * Verificar contraseña con bcrypt (compatible con existente)
     * @param {string} password - Contraseña a verificar
     * @param {string} hash - Hash almacenado
     * @returns {boolean} - True si coincide
     */
    static async verifyPasswordBcrypt(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.error('❌ Error verificando password con bcrypt:', error);
            return false;
        }
    }

    /**
     * Hash híbrido - detecta automáticamente el tipo y verifica
     * @param {string} password - Contraseña a verificar
     * @param {string} hash - Hash almacenado
     * @returns {boolean} - True si coincide
     */
    static async verifyPasswordHybrid(password, hash) {
        try {
            // Detectar tipo de hash
            if (hash.startsWith('$argon2')) {
                return await this.verifyPasswordArgon2(password, hash);
            } else if (hash.startsWith('$2a') || hash.startsWith('$2b') || hash.startsWith('$2y')) {
                return await this.verifyPasswordBcrypt(password, hash);
            } else {
                // Para hashes legacy (texto plano o MD5), usar comparación simple
                // SOLO PARA MIGRACIÓN - remover en producción
                console.warn('⚠️ Hash legacy detectado, considerar actualizar');
                return password === hash;
            }
        } catch (error) {
            console.error('❌ Error en verificación híbrida:', error);
            return false;
        }
    }

    /**
     * Generar hash seguro automático (usa Argon2 por defecto)
     * @param {string} password - Contraseña a hashear
     * @returns {string} - Hash seguro
     */
    static async hashPassword(password) {
        // En producción usar Argon2, en desarrollo bcrypt por compatibilidad
        if (process.env.NODE_ENV === 'production') {
            return await this.hashPasswordArgon2(password);
        } else {
            return await this.hashPasswordBcrypt(password, 10); // Menos rounds en dev
        }
    }
}

// 🔐 Middleware de encriptación para campos específicos
const encryptSensitiveFields = (fields = []) => {
    return (req, res, next) => {
        try {
            const encryption = new DataEncryption();
            
            fields.forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field + '_encrypted'] = encryption.encrypt(req.body[field]);
                    // Mantener campo original para compatibilidad
                }
            });
            
            next();
        } catch (error) {
            console.error('❌ Error en middleware de encriptación:', error);
            next(); // Continuar sin encriptar para no romper funcionalidad
        }
    };
};

// 🔓 Middleware de desencriptación para respuestas
const decryptSensitiveFields = (fields = []) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            try {
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                
                const encryption = new DataEncryption();
                
                if (Array.isArray(data)) {
                    data = data.map(item => decryptItem(item, fields, encryption));
                } else if (typeof data === 'object' && data !== null) {
                    data = decryptItem(data, fields, encryption);
                }
                
                originalSend.call(this, JSON.stringify(data));
            } catch (error) {
                console.error('❌ Error en desencriptación:', error);
                originalSend.call(this, arguments[0]); // Enviar datos originales
            }
        };
        
        next();
    };
};

// 🔧 Función auxiliar para desencriptar item
const decryptItem = (item, fields, encryption) => {
    fields.forEach(field => {
        const encryptedField = field + '_encrypted';
        if (item[encryptedField]) {
            try {
                item[field] = encryption.decrypt(item[encryptedField]);
            } catch (error) {
                console.error(`❌ Error desencriptando campo ${field}:`, error);
                // Mantener valor encriptado si hay error
            }
        }
    });
    return item;
};

// 🧂 Generar salt criptográficamente seguro
const generateSecureSalt = (length = ENCRYPTION_CONFIG.saltLength) => {
    return crypto.randomBytes(length).toString('hex');
};

// 🔑 Generar API Key segura
const generateAPIKey = (prefix = 'ck') => {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${timestamp}_${randomPart}`;
};

module.exports = {
    // Clases principales
    DataEncryption,
    SecureHashing,
    
    // Middlewares
    encryptSensitiveFields,
    decryptSensitiveFields,
    
    // Utilidades
    generateSecureSalt,
    generateAPIKey,
    generateMasterKey,
    
    // Configuración (solo lectura)
    ENCRYPTION_CONFIG: { ...ENCRYPTION_CONFIG }
};