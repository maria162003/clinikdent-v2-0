# 🦷 CLINIKDENT - SISTEMA DE GESTIÓN DENTAL

## 🚀 ARRANQUE RÁPIDO

### ⚡ **MÉTODO FÁCIL (Recomendado)**
1. **Doble clic** en: `ARRANCAR_CLINIKDENT.bat`
2. **Esperar** que instale dependencias (primera vez)
3. **Abrir navegador** en: http://localhost:3001

### 🛠️ **MÉTODO MANUAL**
```bash
# 1. Abrir terminal en esta carpeta
# 2. Instalar dependencias (solo primera vez)
npm install

# 3. Iniciar servidor
node app.js
```

## 🔧 **SOLUCIÓN A PROBLEMAS COMUNES**

### ❌ **Error: "Cannot find module"**
**Causa:** Terminal en directorio incorrecto
**Solución:** 
- Usar el archivo `ARRANCAR_CLINIKDENT.bat`
- O asegurarse de estar en la carpeta que contiene `app.js`

### ❌ **Error: "ECONNREFUSED PostgreSQL"**
**Causa:** Variables de entorno no cargadas
**Solución:**
- Verificar que existe el archivo `.env`
- Usar el script de arranque automático

### ❌ **Error 404 en CSS/JS/Imágenes**
**Causa:** Servidor iniciado desde directorio incorrecto
**Solución:**
- **SIEMPRE** usar `ARRANCAR_CLINIKDENT.bat`
- O iniciar desde la carpeta que contiene la carpeta `public/`

## 📋 **REQUISITOS DEL SISTEMA**

- ✅ **Node.js** v18+ instalado
- ✅ **NPM** incluido con Node.js
- ✅ **Conexión a Internet** (para Supabase)

## 🌐 **ACCESO AL SISTEMA**

- **URL:** http://localhost:3001
- **Admin:** camilafontalvolopez@gmail.com / 123456
- **Puerto:** 3001 (configurable en .env)

## 🛡️ **CARACTERÍSTICAS DE SEGURIDAD**

- ✅ **Alertas profesionales** con Bootstrap
- ✅ **Bloqueo progresivo** de cuentas (3 intentos)
- ✅ **Notificaciones automáticas** a administrador
- ✅ **Recuperación inteligente** con tokens
- ✅ **Multi-usuario** familiar en mismo dispositivo

## 📧 **SOPORTE**

Si tienes problemas:
1. Usar `ARRANCAR_CLINIKDENT.bat`
2. Verificar que Node.js esté instalado
3. Contactar al desarrollador con captura del error

---
**Desarrollado con ❤️ para Clinikdent**