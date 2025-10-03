# Guía de Seguridad Backend (ClinikDent)

## 1. Principios
- Mínimo privilegio
- Defense in Depth
- Fail Secure (ante error, denegar)
- Zero Trust (validar todo)
- Observabilidad y trazabilidad (logs + métricas)

## 2. Superficie de Ataque
- Endpoints API
- Autenticación / JWT / sesiones
- Base de datos (inyección, exfiltración)
- Servicios internos (citas, inventario, correo)
- Subida de archivos (riesgo RCE / traversal)
- Dependencias (supply chain)
- Config / secretos
- Webhooks y colas de mensajes

## 3. Amenazas y Mitigaciones (resumen)
| Vector | Riesgo | Mitigaciones |
|--------|--------|--------------|
| Fuerza bruta | Acceso no autorizado | Rate limit, bloqueo progresivo, 2FA |
| Inyección SQL/NoSQL | Robo / corrupción datos | Queries parametrizadas, validación estricta |
| XSS (si se sirve HTML) | Robo tokens / sesión | Escapar output, CSP, sanitizar |
| CSRF (si cookies) | Acciones no autorizadas | SameSite + token CSRF |
| IDOR | Acceso a recursos ajenos | Autorización por recurso / dueño |
| JWT manipulado | Suplantación | Algoritmo fijo, rotación secret, expiración corta |
| SSRF | Acceso interno | Lista blanca hosts, bloquear metadata IP |
| Subida maliciosa | RCE / malware | Límite tamaño, validación MIME real, almacenamiento aislado |
| Dependencias vulnerables | RCE / filtración | Auditoría (npm audit, Snyk), lockfile |
| Enumeración usuarios | Disclosure | Respuestas uniformes, delays adaptativos |
| Reutilización refresh tokens | Secuestro sesión | Rotación + revocación + detección reuse |

## 4. Autenticación y Acceso
- Hash: Argon2id (ideal) o bcrypt cost ≥ 12
- 2FA para roles sensibles; TOTP o WebAuthn
- Access tokens: 5–15 min; Refresh tokens rotativos (revocar si reuse)
- Roles/Permisos explícitos (RBAC) + posibilidad de extensiones ABAC
- Evitar lógica dispersa: centralizar autorización en un servicio (checkPermission(usuario, acción, recurso))

## 5. Validación / Sanitización
- Validar en capa borde (DTO / schema)
- Rechazar campos extra (whitelisting)
- Limitar tamaños (string, arrays)
- Normalizar emails (lowercase + trim)
- Sanitizar campos que puedan renderizarse (HTML encodado si aplica)

## 6. Gestión de Errores
- No exponer stack traces fuera de desarrollo
- Mapear errores a categorías (AuthError, ValidationError, DomainError)
- Incluir X-Request-ID en respuesta y log

## 7. Anti-Abuso
- Rate limiting multinivel (global + endpoints sensibles)
- Captcha adaptativo tras heurística de riesgo
- Bloqueo progresivo (backoff) tras intentos fallidos
- Monitoreo: picos de 401/403, creación masiva de cuentas, intentos contra endpoints inexistentes

## 8. Seguridad de Datos
- TLS obligatorio (reverse proxy)
- Cifrado en reposo con KMS (si datos sensibles)
- Campos muy sensibles cifrados a nivel aplicación (AES-256-GCM)
- Minimizar retención de datos (política de borrado)

## 9. Logging y Detección
Campos recomendados: timestamp, level, event, userId, ip, path, latencyMs, correlationId  
Redactar: password, tokens, PII sensible  
Alertar sobre:
- Reutilización de refresh tokens
- Bloqueos masivos
- Accesos admin fuera de horario
- Picos inusuales de escritura

## 10. Dependencias / Supply Chain
- npm ci (usa lockfile exacto)
- Revisión de paquetes abandonados (>1 año sin update)
- Escaneo SAST (Semgrep) + SCA (Dependabot)
- Deshabilitar scripts postinstall no necesarios

## 11. Infraestructura
- Contenedores no-root, imágenes minimalistas
- Escaneo de imágenes (Trivy)
- Variables de entorno gestionadas (Vault / Secrets Manager)
- CORS restrictivo (whitelist dominios)
- WAF / API Gateway (rate / IP reputation)

## 12. Anti-Credential Stuffing
- Respuestas homogéneas a login fallido
- Registro de IP + user-agent hash
- Integración con breach data (futuro)
- Requerir 2FA tras patrón sospechoso

## 13. Procesos
- Threat modeling iterativo (STRIDE)
- Revisiones de seguridad en PR críticos
- Pruebas: SAST (cada commit), DAST (staging), pentest (ciclos)
- Playbooks de incidentes (roles, SLA, comunicación)
- Backups cifrados probados (restore drills)

## 14. Checklist MVP
[ ] HTTPS forzado  
[ ] Rate limit en login/reset  
[ ] Bloqueo progresivo credenciales  
[ ] Hash seguro password  
[ ] 2FA disponible (roles críticos)  
[ ] JWT corto + refresh rotativo  
[ ] Validación entrada estricta  
[ ] Logs estructurados + redacción  
[ ] Auditoría acciones sensibles  
[ ] Dependencias sin high/critical abiertas  
[ ] Secrets fuera del repo  
[ ] CORS restringido  
[ ] Rotación secrets/JWT keys planificada  

## 15. Middleware Ejemplo (Node.js)
```js
// securityLayer.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

function securityLayer(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  app.use(rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  }));

  app.use((req, res, next) => {
    const len = parseInt(req.headers['content-length'] || '0', 10);
    if (len > 500_000) return res.status(413).json({ error: 'Payload demasiado grande' });
    next();
  });
}

module.exports = { securityLayer };
```

## 16. Roadmap
1. Baseline: hashing, rate limiting, validación, logs
2. Resiliencia: 2FA, rotación tokens, auditoría
3. Madurez: Threat modeling continuo, SAST+DAST, mTLS interno
4. Optimización: Integración SIEM, pruebas de caos de seguridad

## 17. Recursos
- OWASP Top 10 / ASVS
- OWASP Cheat Sheets
- NIST SP 800-63 (identidad)
- CIS Benchmarks
- OpenTelemetry (tracing)