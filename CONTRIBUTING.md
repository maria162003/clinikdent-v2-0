# Contribuyendo a ClinikDent

¡Gracias por tu interés en contribuir a ClinikDent! 🦷✨

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo Puedo Contribuir?](#cómo-puedo-contribuir)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Guía de Estilo](#guía-de-estilo)
- [Convenciones de Commits](#convenciones-de-commits)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Funcionalidades](#solicitar-funcionalidades)

## 📜 Código de Conducta

Este proyecto y todos los participantes están regidos por nuestro [Código de Conducta](CODE_OF_CONDUCT.md). Al participar, se espera que respetes este código.

## 🤝 ¿Cómo Puedo Contribuir?

### 1. Reportar Bugs

Si encuentras un bug:

1. Verifica que no exista un issue similar
2. Crea un nuevo issue usando el template de bug report
3. Incluye:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Información del entorno (navegador, OS)

### 2. Proponer Mejoras

Para proponer nuevas funcionalidades:

1. Crea un issue de "Feature Request"
2. Describe claramente la funcionalidad propuesta
3. Explica por qué sería útil
4. Si es posible, incluye mockups o ejemplos

### 3. Contribuir Código

1. Fork el repositorio
2. Crea una rama desde `master`:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```
3. Realiza tus cambios
4. Asegúrate que el código siga las guías de estilo
5. Commit siguiendo las convenciones
6. Push a tu fork
7. Crea un Pull Request

## 🔄 Proceso de Desarrollo

### Configuración del Entorno

```bash
# 1. Clonar el repositorio
git clone https://github.com/maria162003/clinikdent-v2-0.git
cd clinikdent-v2-0

# 2. Instalar Wrangler CLI
npm install -g wrangler

# 3. Autenticar con Cloudflare
wrangler login

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 5. Ejecutar en desarrollo local
wrangler pages dev public
```

### Estructura de Ramas

- `master`: rama principal (producción en Cloudflare Pages)
- `feature/*`: nuevas funcionalidades
- `fix/*`: correcciones de bugs
- `docs/*`: actualizaciones de documentación
- `refactor/*`: refactorizaciones de código

### Flujo de Trabajo

1. **Desarrollo Local**
   ```bash
   wrangler pages dev public --port 8787
   ```

2. **Testing**
   - Probar endpoints manualmente: `https://localhost:8787/api/health`
   - Verificar funcionalidad en el navegador

3. **Pre-commit**
   - Revisar que no haya credenciales hardcodeadas
   - Verificar que el código compile sin errores
   - Validar que siga las guías de estilo

## 🎨 Guía de Estilo

### JavaScript/Node.js

```javascript
// ✅ Bueno: ES6 modules, async/await
export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    const data = await fetchData(env);
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ❌ Malo: callbacks, var, sin manejo de errores
var handler = function(req, res) {
  getData(function(err, data) {
    res.send(data);
  });
}
```

### Estructura de Funciones Cloudflare

```javascript
// public/functions/api/ejemplo.js
export async function onRequest(context) {
  const { request, env } = context;
  
  // Validación de método HTTP
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Método no permitido' },
      { status: 405 }
    );
  }

  // Lógica de negocio
  try {
    const body = await request.json();
    // ... procesamiento
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error en ejemplo:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### HTML/CSS

- Usar Bootstrap 5.3.2 para estilos
- Mantener responsive design
- Accesibilidad (ARIA labels, contraste de colores)
- Nombres de clases descriptivos

### SQL/Base de Datos

- Usar queries parametrizadas (prevenir SQL injection)
- Nombres de tablas en minúsculas con guiones bajos
- Índices apropiados para queries frecuentes

## 📝 Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos

- `feat`: nueva funcionalidad
- `fix`: corrección de bug
- `docs`: cambios en documentación
- `style`: cambios de formato (no afectan lógica)
- `refactor`: refactorización de código
- `perf`: mejoras de rendimiento
- `test`: agregar o modificar tests
- `chore`: tareas de mantenimiento
- `ci`: cambios en CI/CD

### Ejemplos

```bash
feat(auth): agregar autenticación de dos factores

fix(pagos): corregir cálculo de IVA en facturas

docs(readme): actualizar guía de instalación

refactor(api): migrar endpoints a Cloudflare Functions

chore: actualizar dependencias de Supabase
```

## 🐛 Reportar Bugs

### Template de Bug Report

```markdown
**Descripción del Bug**
Descripción clara y concisa del bug.

**Pasos para Reproducir**
1. Ir a '...'
2. Click en '...'
3. Scroll hasta '...'
4. Ver error

**Comportamiento Esperado**
Qué esperabas que sucediera.

**Screenshots**
Si aplica, agregar screenshots.

**Entorno**
- OS: [e.g. Windows 11]
- Navegador: [e.g. Chrome 120]
- Versión: [e.g. 1.9.0]

**Contexto Adicional**
Cualquier otra información relevante.
```

## ✨ Solicitar Funcionalidades

### Template de Feature Request

```markdown
**¿Tu solicitud está relacionada con un problema?**
Descripción clara del problema. Ej: "Siempre me frustra cuando [...]"

**Solución Propuesta**
Descripción clara de lo que quieres que suceda.

**Alternativas Consideradas**
Descripción de soluciones alternativas que consideraste.

**Contexto Adicional**
Screenshots, mockups, o ejemplos de referencia.
```

## 🔒 Seguridad

- **NUNCA** commitear credenciales, API keys o secrets
- Usar variables de entorno para datos sensibles
- Reportar vulnerabilidades de seguridad a través de [SECURITY.md](SECURITY.md)
- Seguir mejores prácticas de OWASP

## 📞 Contacto

¿Tienes preguntas? Puedes:

- Abrir un issue de discusión
- Contactar al equipo de desarrollo
- Revisar la documentación en [README.md](README.md)

---

**¡Gracias por contribuir a ClinikDent! 🦷💙**
