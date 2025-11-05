@echo off
title ClinikDent Server Simple - Solo APIs Mock
echo ================================================
echo     ClinikDent - Servidor Simplificado
echo ================================================
echo.
echo ✅ Iniciando servidor sin base de datos...
echo 🔧 Puerto: 3001
echo 📊 Solo APIs mock para testing
echo.

:start
node server-simple.js
echo.
echo ⚠️ El servidor se cerró. Reiniciando en 3 segundos...
timeout /t 3 /nobreak >nul
goto start