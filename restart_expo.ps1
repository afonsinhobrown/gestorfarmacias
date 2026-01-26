# Script para reiniciar o Expo com cache limpo

Write-Host "Parando processos do Expo..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*expo*"} | Stop-Process -Force

Write-Host "Limpando cache do Metro Bundler..." -ForegroundColor Yellow
Set-Location "c:\Users\Acer\Documents\tecnologias\gestorfarmacias\mobile-app"

# Limpar cache
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo"
    Write-Host "Cache .expo removido" -ForegroundColor Green
}

Write-Host "`nIniciando Expo com cache limpo..." -ForegroundColor Green
npx expo start --clear
