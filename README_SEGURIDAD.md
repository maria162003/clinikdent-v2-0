# Módulo de Seguridad

Este módulo añade:
- Bloqueo de cuenta progresivo tras intentos fallidos
- Simulación de 2FA con TOTP
- Middleware de CAPTCHA (token estático configurable)
- Filtro de IP (whitelist / blacklist)
- Rate limiting básico
- Recordatorios de citas (servicio de email)

## Variables de Entorno Clave

```
DB_VENDOR=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
DB_NAME=clinikdent
JWT_SECRET=dev-secret
CAPTCHA_REQUIRED=true
CAPTCHA_FAKE_TOKEN=captcha-dev
FW_WHITELIST=
FW_BLACKLIST=
PORT=3000
```

## Próximos Pasos
1. Sustituir almacenamiento en memoria por tablas reales.
2. Implementar Redis para rate limiting y bloqueo de intentos.
3. Reemplazar servicio de email por nodemailer / proveedor externo.
4. Añadir validaciones (celebrate/joi/zod) y sanitización.
5. Añadir logging estructurado (pino / winston).
6. Tests de integración (Jest / Vitest / Supertest).
