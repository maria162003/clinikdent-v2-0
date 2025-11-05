# 🤖 GUÍA PARA CONFIGURAR reCAPTCHA REAL

## 📋 PASO 1: REGISTRAR EN GOOGLE reCAPTCHA

1. **Ir a:** https://www.google.com/recaptcha/admin/create
2. **Iniciar sesión** con cuenta Google
3. **Crear nuevo sitio:**
   - **Label:** Clinikdent
   - **Tipo:** reCAPTCHA v3
   - **Dominios:** 
     - localhost (para desarrollo)
     - tu-dominio.com (para producción)

## 🔑 OBTIENES DOS CLAVES:

### **Site Key (Pública)** - Para el frontend
```
Ejemplo: 6LfXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### **Secret Key (Privada)** - Para el backend  
```
Ejemplo: 6LfYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

## ⚠️ IMPORTANTE:
- **NUNCA** pongas la Secret Key en el frontend
- **SIEMPRE** guarda las claves en .env
- **CAMBIA** las claves entre desarrollo y producción