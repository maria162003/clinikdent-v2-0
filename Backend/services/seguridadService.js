/**
 * Servicio de Seguridad.
 * Características:
 * - Registro y login con hashing (bcrypt)
 * - Bloqueo de cuenta tras intentos fallidos progresivos
 * - 2FA TOTP simulado
 * - Tokens de recuperación
 * - Generación de JWT
 * Nota: Persistencia en memoria, reemplazar por base de datos / Redis en producción.
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ATTEMPT_LIMIT = 5;
const BASE_LOCK_MINUTES = 5;
const usersStore = new Map(); // userId -> userObject
const loginAttempts = new Map(); // email -> { fails, lockedUntil }
const twoFASecrets = new Map(); // userId -> encryptedSecret
const recoveryCodes = new Map(); // userId -> [codes]
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-inseguro';

function now() {
  return Date.now();
}

function encryptSecret(raw) {
  return Buffer.from(raw).toString('base64');
}
function decryptSecret(enc) {
  return Buffer.from(enc, 'base64').toString('utf8');
}

async function registerUser({ email, password, nombre }) {
  if (Array.from(usersStore.values()).some(u => u.email === email)) {
    throw new Error('Email ya registrado');
  }
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id,
    email,
    nombre,
    passwordHash,
    roles: ['USER'],
    createdAt: new Date(),
    twoFAEnabled: false
  };
  usersStore.set(id, user);
  return { id, email, nombre };
}

function _progressiveLockDurationMinutes(fails) {
  const factor = Math.min(fails - ATTEMPT_LIMIT + 1, 6);
  return BASE_LOCK_MINUTES * factor;
}

function _checkLock(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return;
  if (entry.lockedUntil && entry.lockedUntil > now()) {
    const msLeft = entry.lockedUntil - now();
    throw new Error(`Cuenta bloqueada. Intenta nuevamente en ${Math.ceil(msLeft / 60000)} minutos.`);
  }
}

async function loginUser({ email, password, twoFACode, recoveryCode }) {
  _checkLock(email);
  const user = Array.from(usersStore.values()).find(u => u.email === email);
  if (!user) {
    _registerFail(email);
    throw new Error('Credenciales inválidas');
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    _registerFail(email);
    throw new Error('Credenciales inválidas');
  }
  loginAttempts.delete(email);

  if (user.twoFAEnabled) {
    const secretEnc = twoFASecrets.get(user.id);
    if (!secretEnc) {
      throw new Error('2FA inconsistente');
    }
    const secret = decryptSecret(secretEnc);

    let passed2FA = false;
    if (twoFACode && _simulateCheckTotp(twoFACode, secret)) passed2FA = true;

    if (!passed2FA && recoveryCode) {
      const codes = recoveryCodes.get(user.id) || [];
      const idx = codes.indexOf(recoveryCode);
      if (idx >= 0) {
        codes.splice(idx, 1);
        recoveryCodes.set(user.id, codes);
        passed2FA = true;
      }
    }

    if (!passed2FA) {
      throw new Error('2FA requerido o código inválido');
    }
  }

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: { id: user.id, email: user.email, nombre: user.nombre, roles: user.roles, twoFAEnabled: user.twoFAEnabled },
    tokens: { accessToken, refreshToken }
  };
}

function _simulateCheckTotp(code, secret) {
  const windowSlot = Math.floor(Date.now() / 30000);
  const expected = crypto
    .createHash('sha1')
    .update(secret + windowSlot)
    .digest('hex')
    .slice(-6);
  return code === expected;
}

function _registerFail(email) {
  const entry = loginAttempts.get(email) || { fails: 0, lockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= ATTEMPT_LIMIT) {
    const minutes = _progressiveLockDurationMinutes(entry.fails);
    entry.lockedUntil = now() + minutes * 60000;
  }
  loginAttempts.set(email, entry);
}

async function enable2FA(userId) {
  const user = usersStore.get(userId);
  if (!user) throw new Error('Usuario no encontrado');
  if (user.twoFAEnabled) throw new Error('2FA ya activado');

  const secret = crypto.randomBytes(16).toString('hex');
  const encrypted = encryptSecret(secret);
  twoFASecrets.set(userId, encrypted);

  const codes = Array.from({ length: 8 }).map(() =>
    crypto.randomBytes(5).toString('hex')
  );
  recoveryCodes.set(userId, codes);

  return {
    secret,
    recoveryCodes: codes
  };
}

function confirm2FA(userId, code) {
  const enc = twoFASecrets.get(userId);
  if (!enc) throw new Error('2FA no inicializado');
  const secret = decryptSecret(enc);
  if (!_simulateCheckTotp(code, secret)) {
    throw new Error('Código TOTP inválido');
  }
  const user = usersStore.get(userId);
  user.twoFAEnabled = true;
  usersStore.set(userId, user);
  return { twoFAEnabled: true };
}

function disable2FA(userId) {
  const user = usersStore.get(userId);
  if (!user) throw new Error('Usuario no encontrado');
  user.twoFAEnabled = false;
  usersStore.set(userId, user);
  twoFASecrets.delete(userId);
  recoveryCodes.delete(userId);
  return { twoFAEnabled: false };
}

module.exports = {
  registerUser,
  loginUser,
  enable2FA,
  confirm2FA,
  disable2FA
};