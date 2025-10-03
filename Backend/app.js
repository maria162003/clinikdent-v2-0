const express = require('express');
const rateLimit = require('./middleware/rateLimit');
const captcha = require('./middleware/captcha');
const firewall = require('./middleware/firewall');

const usuarios = require('./controllers/usuariosController');
const citas = require('./controllers/citasController');
const inventario = require('./controllers/inventarioController');

const app = express();
app.use(express.json());

app.use(firewall);
app.use(rateLimit({ windowMs: 60000, max: 120 }));

app.post('/api/usuarios/registro', captcha, usuarios.registrar);
app.post('/api/usuarios/login', captcha, usuarios.login);
app.post('/api/usuarios/:id/2fa/iniciar', usuarios.iniciar2FA);
app.post('/api/usuarios/:id/2fa/confirmar', usuarios.confirmar2FA);
app.post('/api/usuarios/:id/2fa/desactivar', usuarios.desactivar2FA);

app.post('/api/citas', citas.crearCita);
app.get('/api/citas', citas.listarCitas);
app.post('/api/citas/:id/recordatorio', citas.enviarRecordatorio);

app.post('/api/inventario', inventario.agregarItem);
app.get('/api/inventario', inventario.listarInventario);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

module.exports = app;