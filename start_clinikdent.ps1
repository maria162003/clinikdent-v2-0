# Script PowerShell para iniciar Clinikdent con Supabase
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "      INICIANDO CLINIKDENT CON SUPABASE" -ForegroundColor Cyan
Write-Host "      Puerto: 3001 (para evitar conflictos)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 Navegando al directorio correcto..." -ForegroundColor Yellow
Set-Location "C:\Users\CAMILA\Desktop\Clinikdent-supabase\Clinikdent"
Write-Host ""

Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 El sistema estará disponible en:" -ForegroundColor White
Write-Host "   - http://localhost:3001" -ForegroundColor Green
Write-Host "   - http://127.0.0.1:3001" -ForegroundColor Green
Write-Host ""
Write-Host "🛑 Para detener el servidor: Ctrl + C" -ForegroundColor Red
Write-Host ""

node app.js
Read-Host "Presiona Enter para continuar"
