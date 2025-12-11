# Política de Seguridad

## 🔒 Versiones Soportadas

Actualmente se proporcionan actualizaciones de seguridad para las siguientes versiones de ClinikDent:

| Versión | Soportada          |
| ------- | ------------------ |
| 1.9.x   | :white_check_mark: |
| < 1.9   | :x:                |

## 🚨 Reportar una Vulnerabilidad

La seguridad de ClinikDent es una prioridad. Apreciamos tus esfuerzos para divulgar responsablemente tus hallazgos.

### Proceso de Reporte

**NO** crees un issue público para vulnerabilidades de seguridad.

En su lugar, por favor reporta las vulnerabilidades de seguridad de forma privada siguiendo estos pasos:

1. **Email**: Envía un correo detallado a [Contacto de Seguridad]
   - Incluye "SECURITY" en el asunto
   - Describe la vulnerabilidad en detalle
   - Incluye pasos para reproducir el problema
   - Proporciona cualquier código de prueba de concepto (PoC)

2. **Información a Incluir**:
   - Tipo de vulnerabilidad (ej: SQL Injection, XSS, CSRF, etc.)
   - Ubicación del código afectado (archivo y línea si es posible)
   - Configuración especial requerida para reproducir
   - Pasos detallados para reproducir la vulnerabilidad
   - Impacto potencial del exploit
   - Posibles mitigaciones o soluciones

3. **Qué Esperar**:
   - Confirmación de recepción dentro de 48 horas
   - Evaluación inicial del reporte dentro de 7 días
   - Actualizaciones regulares sobre el progreso
   - Crédito público si lo deseas (opcional)

### Divulgación Responsable

Solicitamos que:

- Nos des tiempo razonable para investigar y remediar la vulnerabilidad antes de divulgarla públicamente
- No explotes la vulnerabilidad más allá de lo necesario para demostrarla
- No accedas a datos de otros usuarios sin permiso explícito
- No realices acciones que puedan dañar la disponibilidad del servicio

### Proceso de Respuesta

1. **Reconocimiento** (0-2 días)
   - Confirmamos recepción del reporte
   - Asignamos un investigador principal

2. **Evaluación** (3-7 días)
   - Reproducimos la vulnerabilidad
   - Evaluamos el impacto y severidad
   - Confirmamos o rechazamos el reporte

3. **Remediación** (variable según severidad)
   - Crítico: 1-7 días
   - Alto: 7-30 días
   - Medio: 30-90 días
   - Bajo: 90+ días

4. **Divulgación** (después de patch)
   - Publicamos un security advisory
   - Damos crédito al reportero (si lo desea)
   - Documentamos la vulnerabilidad y fix

## 🛡️ Mejores Prácticas de Seguridad

### Para Desarrolladores

Si contribuyes a ClinikDent, sigue estas mejores prácticas:

#### 1. Manejo de Secretos

```javascript
// ✅ CORRECTO: Usar variables de entorno
const apiKey = process.env.GROQ_API_KEY;

// ❌ INCORRECTO: Hardcodear credenciales
const apiKey = 'gsk_abc123...'; // NUNCA hagas esto
```

#### 2. Validación de Entrada

```javascript
// ✅ CORRECTO: Validar y sanitizar
export async function onRequest(context) {
  const { request } = context;
  const body = await request.json();
  
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return Response.json({ error: 'Email inválido' }, { status: 400 });
  }
  // ... procesar
}
```

#### 3. Queries Parametrizadas

```javascript
// ✅ CORRECTO: Usar parámetros
const { data, error } = await supabase
  .from('usuarios')
  .select('*')
  .eq('email', userEmail);

// ❌ INCORRECTO: Concatenación de strings
const query = `SELECT * FROM usuarios WHERE email = '${userEmail}'`;
```

#### 4. Autenticación y Autorización

```javascript
// ✅ CORRECTO: Verificar permisos
export async function onRequest(context) {
  const user = await authenticateUser(context.request);
  
  if (!user || !user.hasPermission('admin')) {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }
  // ... procesar
}
```

### Para Usuarios/Administradores

#### Configuración Segura

1. **Variables de Entorno**:
   ```bash
   # Usar secrets de Cloudflare
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_ANON_KEY
   wrangler secret put GROQ_API_KEY
   ```

2. **HTTPS Obligatorio**:
   - Cloudflare Pages fuerza HTTPS automáticamente
   - Nunca uses HTTP para producción

3. **Actualizaciones**:
   ```bash
   # Mantén dependencias actualizadas
   npm audit
   npm update
   ```

4. **Backups**:
   - Configura backups automáticos en Supabase
   - Mantén copias de seguridad encriptadas

## 🔍 Vulnerabilidades Conocidas

### Resueltas

| ID | Severidad | Descripción | Versión Afectada | Fix en Versión |
|----|-----------|-------------|------------------|----------------|
| - | - | - | - | - |

*Actualmente no hay vulnerabilidades conocidas sin resolver.*

### En Progreso

*No hay vulnerabilidades siendo investigadas actualmente.*

## 📋 Historial de Security Advisories

Todos los security advisories se publicarán en:
- GitHub Security Advisories: `https://github.com/maria162003/clinikdent-v2-0/security/advisories`
- Release Notes con tag `security`

## 🏆 Hall of Fame

Agradecemos a los siguientes investigadores de seguridad por su contribución responsable:

*Aún no hay reportes de seguridad verificados.*

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Best Practices](https://developers.cloudflare.com/pages/platform/security/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

## 📞 Contacto

Para asuntos de seguridad urgentes:

- **Email de Seguridad**: [A definir por el equipo]
- **PGP Key**: [Opcional - agregar key pública]
- **Response Time**: 48 horas para reconocimiento inicial

---

**Última Actualización**: 2024-01-15  
**Política Versión**: 1.0

*Esta política de seguridad puede actualizarse periódicamente. Por favor revisa regularmente.*
