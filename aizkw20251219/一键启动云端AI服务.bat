@echo off
chcp 65001 >nul
title AI 智控王 - 雲端 AI 服務 (支援網頁調用)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║       AI 智控王 - 雲端 AI 服務 (支援公開網頁調用)           ║
echo ║                                                              ║
echo ║   功能：                                                     ║
echo ║   - 啟動 Ollama AI 服務 (支援 CORS 跨域)                    ║
echo ║   - 啟動 Tailscale Funnel (公開 HTTPS 訪問)                 ║
echo ║   - 讓 https://aizkw.usdt2026.co 可以調用本機 AI            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ============================================
:: 1. 檢查 Tailscale
:: ============================================
echo [1/4] 檢查 Tailscale 狀態...
where tailscale >nul 2>&1
if %errorlevel% neq 0 (
    "C:\Program Files\Tailscale\tailscale.exe" status >nul 2>&1
    if %errorlevel% neq 0 (
        echo       [錯誤] 未檢測到 Tailscale！
        echo       請先安裝: https://tailscale.com/download/windows
        pause
        exit /b 1
    )
    set "TAILSCALE_CMD=C:\Program Files\Tailscale\tailscale.exe"
) else (
    set "TAILSCALE_CMD=tailscale"
)

:: 確保 Tailscale 已連接
"%TAILSCALE_CMD%" status >nul 2>&1
if %errorlevel% neq 0 (
    echo       正在連接 Tailscale...
    "%TAILSCALE_CMD%" up
    timeout /t 3 /nobreak >nul
)
echo       Tailscale 已連接
echo.

:: ============================================
:: 2. 停止現有 Ollama 並重新啟動 (配置 CORS)
:: ============================================
echo [2/4] 啟動 Ollama AI 服務 (配置 CORS 跨域)...

:: 停止現有的 Ollama
taskkill /F /IM ollama.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: 啟動 Ollama，允許所有來源的跨域請求
echo       正在啟動 Ollama (CORS 已啟用)...
start "Ollama AI 服務" cmd /k "title Ollama AI 服務 (CORS 已啟用) && set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve"
echo       等待 Ollama 啟動...
timeout /t 5 /nobreak >nul

:: 驗證 Ollama 是否正確啟動
netstat -an | find "0.0.0.0:11434" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       Ollama 已成功啟動，監聽 0.0.0.0:11434
) else (
    echo       [警告] Ollama 可能未正確啟動，請檢查 Ollama 窗口
)
echo.

:: ============================================
:: 3. 啟動 Tailscale Funnel (公開 HTTPS 訪問)
:: ============================================
echo [3/4] 啟動 Tailscale Funnel (公開 HTTPS 訪問)...

:: 獲取 Tailscale Funnel URL
for /f "tokens=*" %%a in ('"%TAILSCALE_CMD%" status --json 2^>nul ^| findstr "DNSName"') do (
    set "DNS_LINE=%%a"
)

:: 啟動 Funnel (會在新窗口運行)
echo       正在啟動 Tailscale Funnel...
start "Tailscale Funnel" cmd /k "title Tailscale Funnel (11434) && tailscale funnel 11434"
timeout /t 3 /nobreak >nul
echo       Tailscale Funnel 已啟動
echo.

:: ============================================
:: 4. 獲取並顯示公開訪問地址
:: ============================================
echo [4/4] 獲取公開訪問地址...

:: 獲取 Funnel URL
for /f "tokens=*" %%a in ('tailscale funnel status 2^>nul ^| findstr "https://"') do (
    set "FUNNEL_URL=%%a"
)

:: 獲取 Tailscale IP (備用)
for /f "tokens=*" %%a in ('tailscale ip -4 2^>nul') do set "TAILSCALE_IP=%%a"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    服務已成功啟動！                          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  【公開訪問地址】(任何人都可以訪問)                         ║
echo ║                                                              ║
echo ║  Funnel URL: https://ms-defysomwqybz.tail05a567.ts.net      ║
echo ║                                                              ║
echo ║  API 端點:                                                   ║
echo ║  - 聊天: https://ms-defysomwqybz.tail05a567.ts.net/api/chat ║
echo ║  - 標籤: https://ms-defysomwqybz.tail05a567.ts.net/api/tags ║
echo ║                                                              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  【Tailscale 內網訪問】(需登入同一帳戶)                     ║
echo ║                                                              ║
echo ║  Tailscale IP: %TAILSCALE_IP%                              
echo ║  API 端點: http://%TAILSCALE_IP%:11434/api/chat            
echo ║                                                              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  【本機訪問】                                                ║
echo ║                                                              ║
echo ║  API 端點: http://localhost:11434/api/chat                  ║
echo ║                                                              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  網頁配置 (ollamaProxy.ts):                                 ║
echo ║  OLLAMA_URL = 'https://ms-defysomwqybz.tail05a567.ts.net/api/chat'
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 注意事項:
echo   1. 請保持此窗口和 Ollama、Funnel 窗口開啟
echo   2. 關閉窗口會停止服務
echo   3. Funnel URL 是固定的，不會變化
echo.
echo 按任意鍵退出此窗口（服務會繼續運行）
pause >nul
