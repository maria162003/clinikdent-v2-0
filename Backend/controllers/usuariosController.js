const seguridadService = require('../services/seguridadService');

async function registrar(req, res) {
  try {
    const { email, password, nombre } = req.body;
    const user = await seguridadService.registerUser({ email, password, nombre });
    res.status(201).json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password, twoFACode, recoveryCode } = req.body;
    const result = await seguridadService.loginUser({ email, password, twoFACode, recoveryCode });
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
}

async function iniciar2FA(req, res) {
  try {
    const userId = req.params.id;
    const data = await seguridadService.enable2FA(userId);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function confirmar2FA(req, res) {
  try {
    const userId = req.params.id;
    const { code } = req.body;
    const data = seguridadService.confirm2FA(userId, code);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function desactivar2FA(req, res) {
  try {
    const userId = req.params.id;
    const data = await seguridadService.disable2FA(userId);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = {
  registrar,
  login,
  iniciar2FA,
  confirmar2FA,
  desactivar2FA
};