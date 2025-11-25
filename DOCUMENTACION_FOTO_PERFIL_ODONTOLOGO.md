# Implementación: Actualización de Foto de Perfil para Odontólogos

## 📋 Resumen
Se implementó la funcionalidad para que los odontólogos puedan actualizar su propia foto de perfil desde su panel de control, similar a cómo los administradores pueden actualizar fotos de otros usuarios.

## 🔧 Cambios Realizados

### 1. Frontend - JavaScript (`public/js/dashboard-odontologo.js`)

#### Modificación en Modal de Editar Perfil
Se agregó un campo de entrada de URL para la foto de perfil en el modal de edición:

```javascript
// Nuevo campo agregado al inicio del formulario
<div class="mb-3">
    <label for="editFotoUrl" class="form-label">Foto de Perfil (URL)</label>
    <input type="url" class="form-control" id="editFotoUrl" name="foto_url" 
           value="${usuario.avatar_url || usuario.photo_url || ''}" 
           placeholder="https://ejemplo.com/mi-foto.jpg">
    <small class="text-muted">Ingresa la URL de tu foto de perfil</small>
    <!-- Vista previa de la foto actual si existe -->
</div>
```

#### Actualización en Función `guardarCambiosPerfil`
Se modificó la función para incluir `photo_url` en los datos enviados al servidor:

```javascript
const datos = {
    nombre: document.getElementById('editNombre').value.trim(),
    apellido: document.getElementById('editApellido').value.trim(),
    telefono: document.getElementById('editTelefono').value.trim(),
    direccion: document.getElementById('editDireccion').value.trim(),
    fecha_nacimiento: document.getElementById('editFechaNacimiento').value || null,
    photo_url: document.getElementById('editFotoUrl').value.trim() || null  // ✨ NUEVO
};
```

### 2. Backend - Controlador (`Backend/controllers/usuarioController.js`)

#### Actualización de `obtenerPerfil`
Se modificó la consulta para incluir `photo_url` en la respuesta:

```javascript
SELECT 
    u.id, u.nombre, u.apellido, u.correo, u.telefono, u.direccion, 
    r.nombre as rol, u.fecha_nacimiento, u.tipo_documento, 
    u.numero_documento, u.activo as estado, u.created_at as fecha_registro,
    u.photo_url,
    u.photo_url as avatar_url  -- Alias para compatibilidad
FROM usuarios u
LEFT JOIN roles r ON u.rol_id = r.id
WHERE u.id = $1
```

#### Actualización de `actualizarPerfil`
Se modificó la función para aceptar y guardar `photo_url`:

```javascript
exports.actualizarPerfil = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, telefono, direccion, fecha_nacimiento, photo_url } = req.body;
  
  // ... validaciones ...
  
  await db.query(
    'UPDATE usuarios SET nombre = $1, apellido = $2, telefono = $3, direccion = $4, fecha_nacimiento = $5, photo_url = $6 WHERE id = $7',
    [nombre, apellido, telefono || null, direccion || null, fecha_nacimiento || null, photo_url || null, id]
  );
};
```

### 3. Base de Datos - Migración

#### Script SQL (`scripts/agregar_photo_url_usuarios.sql`)
```sql
ALTER TABLE usuarios ADD COLUMN photo_url VARCHAR(500);
COMMENT ON COLUMN usuarios.photo_url IS 'URL de la foto de perfil del usuario';
```

#### Script Node.js (`scripts/agregar_photo_url_usuarios.js`)
Script ejecutable para aplicar la migración de forma segura:
- Verifica si la columna ya existe
- Agrega la columna si no existe
- Agrega comentario descriptivo

## 🚀 Cómo Ejecutar

### Paso 1: Aplicar Migración de Base de Datos

Ejecuta uno de estos comandos desde la raíz del proyecto:

```powershell
# Opción 1: Usando script Node.js (recomendado)
node scripts/agregar_photo_url_usuarios.js

# Opción 2: Usando psql directamente
psql -U tu_usuario -d tu_base_de_datos -f scripts/agregar_photo_url_usuarios.sql
```

### Paso 2: Reiniciar el Servidor

```powershell
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar
node app.js
# O
.\ARRANCAR_CLINIKDENT.bat
```

### Paso 3: Probar la Funcionalidad

1. Inicia sesión como odontólogo
2. Ve a "Mi Perfil"
3. Haz clic en "Editar Información"
4. Ingresa una URL de imagen en el campo "Foto de Perfil (URL)"
   - Ejemplo: `https://i.pravatar.cc/300`
5. Haz clic en "Guardar Cambios"
6. La foto debe actualizarse en el perfil

## ✅ Características

- ✨ Campo de URL para foto de perfil en modal de edición
- 👁️ Vista previa de la foto actual (si existe)
- 🔒 Validación de URL en el frontend (tipo `url`)
- 💾 Almacenamiento seguro en base de datos (VARCHAR 500)
- 🔄 Compatibilidad con campos `avatar_url` y `photo_url`
- 📱 Responsive y acorde con el diseño existente

## 🔐 Permisos

- Los odontólogos solo pueden actualizar su propia foto de perfil
- La validación de permisos se mantiene a través del sistema de autenticación existente
- El endpoint `/api/usuarios/:id/perfil` (PUT) valida que el usuario autenticado sea el propietario del perfil

## 📝 Notas Técnicas

1. **Compatibilidad**: Se usa tanto `photo_url` como alias `avatar_url` para compatibilidad con código existente
2. **Validación**: El campo acepta URLs de hasta 500 caracteres
3. **Opcional**: El campo `photo_url` es nullable (puede ser NULL)
4. **Seguridad**: No se permite subir archivos directamente, solo URLs (por seguridad y simplicidad)

## 🎯 Próximos Pasos (Opcional)

Si deseas mejorar la funcionalidad:

1. **Subida de Archivos**: Implementar carga directa de imágenes con Multer
2. **Validación de URLs**: Verificar que la URL sea una imagen válida
3. **Optimización**: Implementar un servicio de imágenes (Cloudinary, AWS S3)
4. **Recorte**: Agregar herramienta de recorte de imagen en el frontend

## 🐛 Troubleshooting

### Error: "Column photo_url does not exist"
**Solución**: Ejecuta el script de migración:
```powershell
node scripts/agregar_photo_url_usuarios.js
```

### La foto no se muestra
**Solución**: Verifica que:
- La URL sea válida y accesible públicamente
- La URL apunte a una imagen (jpg, png, gif, etc.)
- No haya errores de CORS

### Los cambios no se guardan
**Solución**: 
- Verifica la consola del navegador para errores
- Revisa los logs del servidor
- Confirma que el usuario tenga permisos adecuados

---

**Autor**: Sistema de IA  
**Fecha**: 2024  
**Versión**: 1.0
