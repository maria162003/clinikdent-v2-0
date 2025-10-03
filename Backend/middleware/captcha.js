/**
 * Middleware CAPTCHA.
 * Comprueba cabecera 'x-captcha-token' contra un valor de entorno.
 * Sustituir por verificación real (reCAPTCHA, hCaptcha, Turnstile) en producción.
 */
function captchaMiddleware(req, res, next) {
  const required = process.env.CAPTCHA_REQUIRED === 'true';
  if (!required) return next();

  const provided = req.header('x-captcha-token');
  const expected = process.env.CAPTCHA_FAKE_TOKEN || 'captcha-dev';

  if (!provided || provided !== expected) {
    return res.status(400).json({ error: 'CAPTCHA inválido o ausente' });
  }
  next();
}

module.exports = captchaMiddleware;