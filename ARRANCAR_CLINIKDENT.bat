@echo off
echo ========================================
echo     CLINIKDENT - ARRANQUE AUTOMATICO
echo ========================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

echo [1/4] Verificando directorio actual...
echo Directorio: %CD%
echo.

echo [2/4] Verificando archivos principales...
if not exist "app.js" (
    echo ❌ ERROR: No se encontro app.js
    echo Asegurate de estar en el directorio correcto
    pause
    exit /b 1
)

if not exist ".env" (
    echo ❌ ADVERTENCIA: No se encontro .env
    echo Es posible que la conexion a la base de datos falle
    echo.
)

echo ✅ Archivos principales encontrados
echo.

echo [3/4] Instalando dependencias (si es necesario)...
if not exist "node_modules" (
    echo Instalando node_modules...
    npm install
) else (
    echo ✅ node_modules ya existe
)
echo.

echo [4/4] Iniciando servidor Clinikdent...
echo.
echo ========================================
echo  Servidor iniciando en: http://localhost:3001
echo  Presiona Ctrl+C para detener
echo ========================================
echo.

node app.js

echo.
echo ========================================
echo  Servidor detenido
echo ========================================
pause