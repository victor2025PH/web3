@echo off
chcp 65001 >nul
title AI 智控王 - Tailscale 遠程服務

echo ========================================
echo   AI 智控王 - Tailscale 遠程訪問服務
echo ========================================
echo.

cd /d "%~dp0"

:: 檢查 Tailscale 是否安裝
where tailscale >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 未檢測到 Tailscale！
    echo.
    echo 請先安裝 Tailscale:
    echo   下載地址: https://tailscale.com/download/windows
    echo.
    echo 安裝完成後重新運行此腳本
    pause
    exit /b 1
)

:: 獲取 Tailscale IP
echo [信息] 正在獲取 Tailscale IP...
for /f "tokens=*" %%a in ('tailscale ip -4 2^>nul') do set "TAILSCALE_IP=%%a"

if "%TAILSCALE_IP%"=="" (
    echo [錯誤] 無法獲取 Tailscale IP
    echo 請確保 Tailscale 已連接
    echo.
    echo 嘗試運行: tailscale up
    pause
    exit /b 1
)

:: 同時獲取本機局域網 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Tailscale IP: %TAILSCALE_IP%
echo ║  局域網 IP:    %LOCAL_IP%
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  遠程電腦請使用以下地址（任選一個可用的）:                   ║
echo ║                                                              ║
echo ║  【Tailscale 網絡】（推薦，跨網絡）                          ║
echo ║  Ollama AI:     http://%TAILSCALE_IP%:11434                
echo ║  語音合成:      http://%TAILSCALE_IP%:9881                 
echo ║  網頁界面:      http://%TAILSCALE_IP%:5173                 
echo ║                                                              ║
echo ║  【局域網】（同一 WiFi）                                     ║
echo ║  Ollama AI:     http://%LOCAL_IP%:11434                    
echo ║  語音合成:      http://%LOCAL_IP%:9881                     
echo ║  網頁界面:      http://%LOCAL_IP%:5173                     
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 開放防火牆端口
echo [1/5] 開放防火牆端口...
netsh advfirewall firewall add rule name="Ollama AI" dir=in action=allow protocol=tcp localport=11434 >nul 2>&1
netsh advfirewall firewall add rule name="GPT-SoVITS" dir=in action=allow protocol=tcp localport=9880 >nul 2>&1
netsh advfirewall firewall add rule name="GPT-SoVITS CORS" dir=in action=allow protocol=tcp localport=9881 >nul 2>&1
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=tcp localport=5173 >nul 2>&1
echo     防火牆規則已添加

:: 設置 Ollama 環境變量
echo [2/5] 配置 Ollama 環境變量...
set OLLAMA_HOST=0.0.0.0:11434
set OLLAMA_ORIGINS=*

:: 啟動 Ollama
echo [3/5] 檢查 Ollama 服務...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo     啟動 Ollama...
    start "" cmd /k "title Ollama 服務 && set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve"
    timeout /t 3 /nobreak >nul
) else (
    echo     Ollama 已在運行
)

:: 啟動 GPT-SoVITS CORS 代理
echo [4/5] 啟動語音合成代理...
start "GPT-SoVITS CORS 代理" cmd /k "title GPT-SoVITS CORS 代理 && cd /d %~dp0 && node gpt-sovits-cors-proxy.cjs"
timeout /t 2 /nobreak >nul

:: 啟動 Vite 開發服務器
echo [5/5] 啟動網頁服務器...
start "Vite Dev Server" cmd /k "title 網頁服務器 && cd /d %~dp0 && npm run dev -- --host 0.0.0.0"

echo.
echo ========================================
echo   所有服務已啟動！
echo ========================================
echo.
echo 遠程電腦設置步驟:
echo 1. 安裝 Tailscale: https://tailscale.com/download
echo 2. 登錄同一個 Tailscale 帳戶
echo 3. 瀏覽器訪問: http://%TAILSCALE_IP%:5173
echo.
echo 或修改遠程電腦的配置文件:
echo   src/voiceConfig.ts   → apiBaseUrl: 'http://%TAILSCALE_IP%:9881'
echo   utils/ollamaProxy.ts → OLLAMA_URL: 'http://%TAILSCALE_IP%:11434/api/chat'
echo.
echo 按任意鍵退出此窗口（服務會繼續運行）
pause >nul
