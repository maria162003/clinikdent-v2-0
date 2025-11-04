@echo off
taskkill /F /IM node.exe >nul 2>&1
echo Procesos Node terminados
timeout /t 2 /nobreak >nul
echo Iniciando debug...
cd /d "c:\Users\CAMILA\Downloads\Clinikdent\Clinikdent"
node debug_citas.js
pause
     