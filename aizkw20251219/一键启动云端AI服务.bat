@echo off
chcp 65001 >nul
title AI Cloud Service - Ollama + Tailscale Funnel

echo.
echo ============================================================
echo        AI Cloud Service - Public Web Access
echo ============================================================
echo.
echo   Features:
echo   - Start Ollama AI with CORS enabled
echo   - Start Tailscale Funnel (Public HTTPS)
echo   - Allow https://aizkw.usdt2026.co to access local AI
echo.
echo ============================================================
echo.

cd /d "%~dp0"

:: ============================================
:: 1. Check Tailscale
:: ============================================
echo [1/4] Checking Tailscale status...
where tailscale >nul 2>&1
if %errorlevel% neq 0 (
    "C:\Program Files\Tailscale\tailscale.exe" status >nul 2>&1
    if %errorlevel% neq 0 (
        echo       ERROR: Tailscale not found!
        echo       Please install: https://tailscale.com/download/windows
        pause
        exit /b 1
    )
    set "TAILSCALE_CMD=C:\Program Files\Tailscale\tailscale.exe"
) else (
    set "TAILSCALE_CMD=tailscale"
)

:: Ensure Tailscale is connected
"%TAILSCALE_CMD%" status >nul 2>&1
if %errorlevel% neq 0 (
    echo       Connecting Tailscale...
    "%TAILSCALE_CMD%" up
    timeout /t 3 /nobreak >nul
)
echo       Tailscale connected
echo.

:: ============================================
:: 2. Stop and restart Ollama with CORS
:: ============================================
echo [2/4] Starting Ollama AI with CORS...

:: Force kill ALL Ollama processes
echo       Stopping existing Ollama...
taskkill /F /IM ollama.exe >nul 2>&1
taskkill /F /IM ollama_llama_server.exe >nul 2>&1
:: Wait for port to be released
timeout /t 3 /nobreak >nul

:: Double check port is free
netstat -an | find ":11434" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       Port 11434 still in use, waiting...
    timeout /t 5 /nobreak >nul
    taskkill /F /IM ollama.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Start Ollama with CORS enabled
echo       Starting Ollama with CORS enabled...
start "Ollama AI (CORS)" cmd /k "title Ollama AI (CORS) && set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve"
echo       Waiting for Ollama to start...
timeout /t 5 /nobreak >nul

:: Verify Ollama started correctly
netstat -an | find "0.0.0.0:11434" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       OK: Ollama listening on 0.0.0.0:11434
) else (
    echo       WARNING: Ollama may not have started correctly
)
echo.

:: ============================================
:: 3. Start Tailscale Funnel (Public HTTPS)
:: ============================================
echo [3/4] Checking Tailscale Funnel...

:: Check if Funnel is already running
tailscale funnel status >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       Tailscale Funnel already running
) else (
    echo       Starting Tailscale Funnel...
    start "Tailscale Funnel" cmd /k "title Tailscale Funnel && tailscale funnel 11434"
    timeout /t 3 /nobreak >nul
)
echo       Funnel URL: https://ms-defysomwqybz.tail05a567.ts.net
echo.

:: ============================================
:: 4. Display Service Info
:: ============================================
echo [4/4] Getting service info...

:: Get Tailscale IP
for /f "tokens=*" %%a in ('tailscale ip -4 2^>nul') do set "TAILSCALE_IP=%%a"

echo.
echo ============================================================
echo                   ALL SERVICES STARTED!
echo ============================================================
echo.
echo   PUBLIC ACCESS (Anyone can access):
echo   ----------------------------------
echo   Funnel URL: https://ms-defysomwqybz.tail05a567.ts.net
echo.
echo   API Endpoints:
echo     Chat: https://ms-defysomwqybz.tail05a567.ts.net/api/chat
echo     Tags: https://ms-defysomwqybz.tail05a567.ts.net/api/tags
echo.
echo   TAILSCALE NETWORK (Same account only):
echo   --------------------------------------
echo   Tailscale IP: %TAILSCALE_IP%
echo   API: http://%TAILSCALE_IP%:11434/api/chat
echo.
echo   LOCAL ACCESS:
echo   -------------
echo   API: http://localhost:11434/api/chat
echo.
echo ============================================================
echo.
echo   IMPORTANT:
echo   - Keep Ollama and Funnel windows open
echo   - Closing windows will stop services
echo   - Funnel URL is permanent (will not change)
echo.
echo Press any key to exit (services will keep running)...
pause >nul
