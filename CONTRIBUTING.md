# 🤝 Guía de Contribución - Clinikdent v2.0

¡Gracias por tu interés en contribuir a Clinikdent! Este documento te guiará sobre cómo colaborar de manera efectiva.

## 📋 Proceso de Contribución

### 1. **Fork y Clone**
```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU-USUARIO/clinikdent-v2.git
cd clinikdent-v2
```

### 2. **Crear una Rama**
```bash
# Crear rama para tu feature/fix
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

### 3. **Desarrollo**
- Sigue las convenciones de código existentes
- Escribe código limpio y comentado
- Prueba tu código antes de hacer commit

### 4. **Commit**
Usa commits descriptivos siguiendo la convención:
```bash
git commit -m "✨ feat: Descripción corta del feature"
git commit -m "🐛 fix: Descripción del bug corregido"
git commit -m "📝 docs: Actualización de documentación"
git commit -m "♻️ refactor: Mejora en el código"
git commit -m "🎨 style: Cambios de formato/estilo"
git commit -m "✅ test: Agregar o corregir tests"
```

### 5. **Pull Request**
- Push tu rama al fork
- Crea un Pull Request desde GitHub
- Describe claramente los cambios realizados
- Agrega screenshots si es relevante

## 🏗️ Estructura del Proyecto

```
Clinikdent/
├── Backend/               # Servidor Node.js + Express
│   ├── config/           # Configuración de DB
│   ├── controllers/      # Lógica de negocio
│   ├── routes/          # Rutas de API
│   ├── middleware/      # Middleware personalizado
│   ├── scripts/         # Scripts SQL
│   └── services/        # Servicios externos
├── public/              # Frontend estático
│   ├── css/            # Estilos
│   ├── js/             # JavaScript del frontend
│   └── images/         # Recursos gráficos
└── scripts/            # Scripts de utilidades
```

## 🧪 Pruebas

Antes de hacer commit, ejecuta las pruebas:
```bash
# Pruebas de API
node test_endpoints_completo.js

# Verificación de estructura
node verificacion_final_sistema.js

# Pruebas específicas
node test_inventario_rapido.js
node test_proveedores_completo.js
```

## 📝 Estándares de Código

### **Backend (Node.js)**
- Usa `async/await` en lugar de callbacks
- Maneja errores apropiadamente con try/catch
- Valida datos de entrada
- Usa nombres descriptivos para variables y funciones

### **Frontend (JavaScript)**
- Usa ES6+ cuando sea posible
- Mantén el código modular
- Comenta funciones complejas
- Sigue las convenciones de Bootstrap para CSS

### **Base de Datos**
- Usa nombres descriptivos para tablas y columnas
- Incluye índices apropiados
- Documenta los scripts SQL

## 🐛 Reportar Bugs

Al reportar bugs, incluye:
1. **Descripción clara** del problema
2. **Pasos para reproducir** el error
3. **Comportamiento esperado** vs actual
4. **Entorno** (SO, versión de Node.js, etc.)
5. **Screenshots** si es aplicable

## 💡 Sugerir Features

Para nuevas funcionalidades:
1. **Explica el caso de uso** y por qué es necesario
2. **Describe la solución** propuesta
3. **Considera alternativas** si las hay
4. **Evalúa el impacto** en el sistema actual

## 🚀 Áreas de Contribución

### **Prioritarias**
- ✅ Mejorar cobertura de tests
- 📊 Dashboard de analytics avanzado
- 🔐 Autenticación de dos factores (2FA)
- 📱 Responsive design mejorado
- 🌐 Internacionalización (i18n)

### **Bienvenidas**
- 📝 Mejoras en documentación
- 🐛 Corrección de bugs
- ⚡ Optimizaciones de rendimiento
- 🎨 Mejoras en UX/UI

## 👥 Comunidad

- **Discord**: Canal de desarrolladores
- **GitHub Issues**: Reportes y discussiones
- **Email**: dev@clinikdent.com

## 📜 Código de Conducta

Este proyecto sigue el [Contributor Covenant](https://www.contributor-covenant.org/). Se espera que todos los participantes:

- Sean respetuosos y constructivos
- Mantengan un ambiente profesional
- Ayuden a otros desarrolladores
- Respeten diferentes opiniones y enfoques

---

**¡Gracias por contribuir a Clinikdent! 🦷✨**
