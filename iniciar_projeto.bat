@echo off
TITLE GestorFarma - Inicializador Geral
COLOR 0A

echo =======================================================
echo           GESTOR FARMA - INICIALIZADOR
echo =======================================================
echo.

:: 1. INICIALIZACAO OBRIGATORIA (BACKEND)
echo [+] Iniciando Backend Django (0.0.0.0:8000)...
start "BACKEND - Django" cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"

:: 2. INICIALIZACAO OBRIGATORIA (FRONTEND WEB)
echo [+] Iniciando Frontend Web (Next.js)...
start "FRONTEND - Next.js" cmd /k "cd frontend-web && npm run dev"

timeout /t 2 >nul

echo.
echo Servidores em processo de inicializacao...
echo -------------------------------------------------------
echo Escolha o destino para o aplicativo mobile:
echo [1] Iniciar App no WINDOWS
echo [2] Iniciar App no ANDROID (USB)
echo [3] Nao iniciar App (Apenas servidores)
echo -------------------------------------------------------
echo.

set /p choice="Digite sua opcao: "

if "%choice%"=="1" goto run_windows
if "%choice%"=="2" goto run_android
goto finish

:run_windows
echo.
echo [!] Abrindo App para Windows...
cd mobile && flutter run -d windows
goto finish

:run_android
echo.
echo [!] Abrindo App para Android...
echo Certifique-se que o cabo USB esta conectado.
cd mobile && flutter run
goto finish

:finish
echo.
echo Processo concluido. Verifique as outras janelas para o Backend e Frontend.
pause
