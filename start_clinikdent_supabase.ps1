# 🚀 Iniciar Clinikdent (Supabase)
Write-Host "🚀 Iniciando Clinikdent en puerto 3001..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 URL del frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📍 API base: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Tu otro proyecto MySQL debe estar en puerto 3000" -ForegroundColor Yellow
Write-Host "⚠️  Este proyecto Supabase funcionará en puerto 3001" -ForegroundColor Yellow
Write-Host ""

# Establecer variables de entorno
$env:PORT = "3001"

# Ejecutar aplicación
node app.js
