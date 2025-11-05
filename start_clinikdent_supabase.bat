@echo off
echo 🚀 Iniciando Clinikdent en puerto 3001...
echo.
echo 📍 URL del frontend: http://localhost:3001
echo 📍 API base: http://localhost:3001/api
echo.
echo ⚠️  IMPORTANTE: Tu otro proyecto MySQL debe estar en puerto 3000
echo ⚠️  Este proyecto Supabase funcionará en puerto 3001
echo.
cd /d "%~dp0"
set PORT=3001
node app.js
pause
