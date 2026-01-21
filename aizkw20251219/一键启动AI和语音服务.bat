@echo off
chcp 65001 >nul
title AI + Voice Service - Complete Startup

echo.
echo ============================================================
echo        AI + Voice Service - Complete Startup
echo ============================================================
echo.
echo   This script starts:
echo   [1] Ollama AI (with CORS, port 11434)
echo   [2] GPT-SoVITS Voice Service (port 9880)
echo   [3] CORS Proxy for Voice (port 9881)
echo   [4] Tailscale Funnel (Public HTTPS access)
echo.
echo ============================================================
echo.

cd /d "%~dp0"

:: ============================================
:: 1. Check and Connect Tailscale
:: ============================================
echo [1/6] Checking Tailscale...
where tailscale >nul 2>&1
if %errorlevel% neq 0 (
    "C:\Program Files\Tailscale\tailscale.exe" status >nul 2>&1
    if %errorlevel% neq 0 (
        echo       WARNING: Tailscale not found!
        echo       Funnel will not be available.
        echo       Local services will still start.
        set "TAILSCALE_AVAILABLE=0"
    ) else (
        set "TAILSCALE_CMD=C:\Program Files\Tailscale\tailscale.exe"
        set "TAILSCALE_AVAILABLE=1"
    )
) else (
    set "TAILSCALE_CMD=tailscale"
    set "TAILSCALE_AVAILABLE=1"
)

if "%TAILSCALE_AVAILABLE%"=="1" (
    "%TAILSCALE_CMD%" status >nul 2>&1
    if %errorlevel% neq 0 (
        echo       Connecting Tailscale...
        "%TAILSCALE_CMD%" up
        timeout /t 3 /nobreak >nul
    )
    for /f "tokens=*" %%a in ('tailscale ip -4 2^>nul') do set "TAILSCALE_IP=%%a"
    echo       OK: Tailscale connected, IP: %TAILSCALE_IP%
)
echo.

:: ============================================
:: 2. Open Firewall Ports
:: ============================================
echo [2/6] Opening firewall ports...
netsh advfirewall firewall add rule name="Ollama AI" dir=in action=allow protocol=tcp localport=11434 >nul 2>&1
netsh advfirewall firewall add rule name="GPT-SoVITS" dir=in action=allow protocol=tcp localport=9880 >nul 2>&1
netsh advfirewall firewall add rule name="GPT-SoVITS CORS" dir=in action=allow protocol=tcp localport=9881 >nul 2>&1
echo       OK: Firewall rules added
echo.

:: ============================================
:: 3. Start Ollama AI with CORS
:: ============================================
echo [3/6] Starting Ollama AI (with CORS)...

:: Force stop existing Ollama
taskkill /F /IM ollama.exe >nul 2>&1
taskkill /F /IM ollama_llama_server.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Check if port is free
netstat -an | find ":11434" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       Port 11434 still in use, waiting...
    timeout /t 5 /nobreak >nul
    taskkill /F /IM ollama.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Start Ollama with CORS
start "Ollama AI (CORS)" cmd /k "title Ollama AI (CORS) && set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve"
echo       Waiting for Ollama to start...
timeout /t 5 /nobreak >nul

:: Verify
netstat -an | find "0.0.0.0:11434" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       OK: Ollama listening on 0.0.0.0:11434
) else (
    echo       WARNING: Ollama may not have started correctly
)
echo.

:: ============================================
:: 4. Start GPT-SoVITS Voice Service
:: ============================================
echo [4/6] Starting GPT-SoVITS Voice Service...

:: Check if already running
netstat -an | find ":9880" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       OK: GPT-SoVITS already running (port 9880)
) else (
    :: Try multiple possible paths
    if exist "E:\GPT-SoVITS-v3lora-20250228\api_v2.py" (
        echo       Starting from E:\GPT-SoVITS-v3lora-20250228...
        start "GPT-SoVITS Voice" cmd /k "title GPT-SoVITS Voice Service && cd /d E:\GPT-SoVITS-v3lora-20250228 && runtime\python.exe api_v2.py -a 0.0.0.0 -p 9880"
    ) else if exist "E:\GPT-SoVITS-v2pro-20250604-nvidia50\api_v2.py" (
        echo       Starting from E:\GPT-SoVITS-v2pro-20250604-nvidia50...
        start "GPT-SoVITS Voice" cmd /k "title GPT-SoVITS Voice Service && cd /d E:\GPT-SoVITS-v2pro-20250604-nvidia50 && runtime\python.exe api_v2.py -a 0.0.0.0 -p 9880"
    ) else if exist "D:\GPT-SoVITS\api_v2.py" (
        echo       Starting from D:\GPT-SoVITS...
        start "GPT-SoVITS Voice" cmd /k "title GPT-SoVITS Voice Service && cd /d D:\GPT-SoVITS && runtime\python.exe api_v2.py -a 0.0.0.0 -p 9880"
    ) else (
        echo       WARNING: GPT-SoVITS not found!
        echo       Please start it manually or set the correct path.
    )
    echo       Waiting for GPT-SoVITS to start (this may take 30+ seconds)...
    timeout /t 15 /nobreak >nul
)
echo.

:: ============================================
:: 5. Start CORS Proxy for Voice
:: ============================================
echo [5/6] Starting CORS Proxy for Voice...

:: Check if already running
netstat -an | find ":9881" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       OK: CORS Proxy already running (port 9881)
) else (
    if exist "%~dp0gpt-sovits-cors-proxy.cjs" (
        start "CORS Proxy" cmd /k "title GPT-SoVITS CORS Proxy && cd /d %~dp0 && node gpt-sovits-cors-proxy.cjs"
        timeout /t 2 /nobreak >nul
        echo       OK: CORS Proxy started (port 9881)
    ) else (
        echo       WARNING: gpt-sovits-cors-proxy.cjs not found!
    )
)
echo.

:: ============================================
:: 6. Start Tailscale Funnel (Optional)
:: ============================================
echo [6/6] Starting Tailscale Funnel (Public HTTPS)...

if "%TAILSCALE_AVAILABLE%"=="1" (
    tailscale funnel status >nul 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo       OK: Tailscale Funnel already running
    ) else (
        start "Tailscale Funnel" cmd /k "title Tailscale Funnel (11434) && tailscale funnel 11434"
        timeout /t 3 /nobreak >nul
        echo       OK: Tailscale Funnel started
    )
) else (
    echo       SKIP: Tailscale not available
)
echo.

:: ============================================
:: Display Service Summary
:: ============================================
echo.
echo ============================================================
echo                   ALL SERVICES STARTED!
echo ============================================================
echo.
echo   LOCAL ACCESS:
echo   -------------
echo   Ollama AI:    http://localhost:11434/api/chat
echo   Voice TTS:    http://localhost:9881/tts
echo   Voice Tags:   http://localhost:9880/
echo.
if "%TAILSCALE_AVAILABLE%"=="1" (
echo   TAILSCALE NETWORK (Same account):
echo   ----------------------------------
echo   Ollama AI:    http://%TAILSCALE_IP%:11434/api/chat
echo   Voice TTS:    http://%TAILSCALE_IP%:9881/tts
echo.
echo   PUBLIC ACCESS (Anyone can access):
echo   -----------------------------------
echo   Funnel URL:   https://ms-defysomwqybz.tail05a567.ts.net
echo   AI Chat:      https://ms-defysomwqybz.tail05a567.ts.net/api/chat
echo   AI Tags:      https://ms-defysomwqybz.tail05a567.ts.net/api/tags
)
echo.
echo ============================================================
echo.
echo   SERVICES STARTED:
echo   -----------------
echo   [x] Ollama AI (CORS enabled, port 11434)
echo   [x] GPT-SoVITS Voice (port 9880)
echo   [x] CORS Proxy (port 9881)
if "%TAILSCALE_AVAILABLE%"=="1" (
echo   [x] Tailscale Funnel (HTTPS public access)
) else (
echo   [ ] Tailscale Funnel (not available)
)
echo.
echo   IMPORTANT:
echo   - Keep all command windows open
echo   - Closing windows will stop services
echo   - GPT-SoVITS may take 30+ seconds to fully load
echo.
echo Press any key to exit (services will keep running)...
pause >nul
