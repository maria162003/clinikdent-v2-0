@echo off
echo ===============================================
echo       INICIANDO CLINIKDENT CON SUPABASE
echo       Puerto: 3001 (para evitar conflictos)
echo ===============================================
echo.
echo 🔄 Navegando al directorio correcto...
cd /d "C:\Users\CAMILA\Desktop\Clinikdent-supabase\Clinikdent"
echo.
echo 🚀 Iniciando servidor...
echo.
echo 📋 El sistema estará disponible en:
echo    - http://localhost:3001
echo    - http://127.0.0.1:3001
echo.
echo 🛑 Para detener el servidor: Ctrl + C
echo.
node app.js
pause
