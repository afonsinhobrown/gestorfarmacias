# Script para matar todos os processos Python e reiniciar o backend corretamente

Write-Host "Parando todos os processos Python..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Aguardando 2 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Verificando se a porta 8000 está livre..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "Porta 8000 ainda ocupada. Matando processo..." -ForegroundColor Red
    $processId = $port8000.OwningProcess
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 1
}

Write-Host "Iniciando servidor Django em 0.0.0.0:8000..." -ForegroundColor Green
Set-Location "c:\Users\Acer\Documents\tecnologias\gestorfarmacias\backend"
python manage.py runserver 0.0.0.0:8000
