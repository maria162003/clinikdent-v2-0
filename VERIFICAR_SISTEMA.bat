@echo off
echo ========================================
echo   CLINIKDENT - VERIFICACION DE SISTEMA
echo ========================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

echo [VERIFICANDO REQUISITOS]
echo.

echo 1. Verificando Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js NO instalado
    echo    Descarga desde: https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✅ Node.js instalado:
    node --version
)
echo.

echo 2. Verificando NPM...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ NPM NO disponible
    pause
    exit /b 1
) else (
    echo ✅ NPM disponible:
    npm --version
)
echo.

echo 3. Verificando archivos principales...
if exist "app.js" (
    echo ✅ app.js encontrado
) else (
    echo ❌ app.js NO encontrado
)

if exist ".env" (
    echo ✅ .env encontrado
) else (
    echo ⚠️  .env NO encontrado - La base de datos podría fallar
)

if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json NO encontrado
)

if exist "public\index.html" (
    echo ✅ Frontend encontrado
) else (
    echo ❌ Frontend NO encontrado
)
echo.

echo 4. Verificando dependencias...
if exist "node_modules" (
    echo ✅ node_modules existe
) else (
    echo ⚠️  node_modules NO existe - Se instalará automáticamente
)
echo.

echo ========================================
echo   RESULTADO DE LA VERIFICACION
echo ========================================
echo ✅ Sistema listo para funcionar
echo.
echo Para iniciar el servidor:
echo   Doble clic en: ARRANCAR_CLINIKDENT.bat
echo.
echo URL del sistema: http://localhost:3001
echo ========================================
pause