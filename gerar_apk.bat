@echo off
setlocal
set "MOBILE_DIR=%~dp0mobile"
set "APK_DEST=%~dp0gestorfarma_builds"

echo ==========================================
echo    GESTORFARMA - GERADOR DE APK
echo ==========================================
echo.

:: Verificar se a pasta mobile existe
if not exist "%MOBILE_DIR%" (
    echo [ERRO] Pasta 'mobile' nao encontrada em %MOBILE_DIR%
    pause
    exit /b 1
)

:: Criar pasta de destino se não existir
if not exist "%APK_DEST%" (
    mkdir "%APK_DEST%"
)

cd /d "%MOBILE_DIR%"

echo [1/3] Limpando build anterior...
call flutter clean

echo.
echo [2/3] Baixando dependencias...
call flutter pub get

echo.
echo [3/3] Gerando APK (Release)...
echo Isso pode levar alguns minutos...
call flutter build apk --release

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao gerar APK. Verifique se o Flutter SDK esta no PATH.
    pause
    exit /b 1
)

:: Copiar APK gerada para a pasta de builds na raiz
copy "build\app\outputs\flutter-apk\app-release.apk" "%APK_DEST%\GestorFarma_v1_0.apk" /Y

echo.
echo ==========================================
echo [SUCESSO] APK Gerada com sucesso!
echo Local: %APK_DEST%\GestorFarma_v1_0.apk
echo ==========================================
echo.
pause
