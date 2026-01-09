@echo off
chcp 65001 >nul
title AI 智控王 - 一鍵啟動所有服務

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║          AI 智控王 - 一鍵啟動所有服務                        ║
echo ║                                                              ║
echo ║          包含：Tailscale + Ollama + GPT-SoVITS + 網頁        ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ============================================
:: 1. 檢查並啟動 Tailscale
:: ============================================
echo [1/5] 檢查 Tailscale 連接狀態...
"C:\Program Files\Tailscale\tailscale.exe" status >nul 2>&1
if %errorlevel% neq 0 (
    echo       正在連接 Tailscale...
    "C:\Program Files\Tailscale\tailscale.exe" up
) else (
    echo       Tailscale 已連接
)

:: 獲取 Tailscale IP
for /f "tokens=*" %%a in ('"C:\Program Files\Tailscale\tailscale.exe" ip -4 2^>nul') do set "TAILSCALE_IP=%%a"
echo       Tailscale IP: %TAILSCALE_IP%
echo.

:: ============================================
:: 2. 設置環境變量並啟動 Ollama
:: ============================================
echo [2/5] 啟動 Ollama AI 服務...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo       正在啟動 Ollama...
    start "Ollama AI 服務" cmd /k "title Ollama AI 服務 && set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve"
    timeout /t 3 /nobreak >nul
) else (
    echo       Ollama 已在運行
)
echo.

:: ============================================
:: 3. 啟動 GPT-SoVITS 原始服務
:: ============================================
echo [3/5] 啟動 GPT-SoVITS 語音服務...

:: 檢查 9880 端口是否已被佔用
netstat -an | find "9880" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       GPT-SoVITS 已在運行 ^(端口 9880^)
) else (
    echo       正在啟動 GPT-SoVITS...
    
    :: 嘗試多個可能的路徑
    if exist "E:\GPT-SoVITS-v3lora-20250228\api_v2.py" (
        start "GPT-SoVITS 服務" cmd /k "title GPT-SoVITS 語音服務 && cd /d E:\GPT-SoVITS-v3lora-20250228 && runtime\python.exe api_v2.py -a 0.0.0.0 -p 9880"
    ) else if exist "E:\GPT-SoVITS-v2pro-20250604-nvidia50\api_v2.py" (
        start "GPT-SoVITS 服務" cmd /k "title GPT-SoVITS 語音服務 && cd /d E:\GPT-SoVITS-v2pro-20250604-nvidia50 && runtime\python.exe api_v2.py -a 0.0.0.0 -p 9880"
    ) else (
        echo       [警告] 未找到 GPT-SoVITS，請手動啟動
    )
    
    echo       等待 GPT-SoVITS 啟動...
    timeout /t 10 /nobreak >nul
)
echo.

:: ============================================
:: 4. 啟動 GPT-SoVITS CORS 代理
:: ============================================
echo [4/5] 啟動 CORS 代理服務...

:: 檢查 9881 端口是否已被佔用
netstat -an | find "9881" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       CORS 代理已在運行 ^(端口 9881^)
) else (
    echo       正在啟動 CORS 代理...
    start "GPT-SoVITS CORS 代理" cmd /k "title GPT-SoVITS CORS 代理 && cd /d %~dp0 && node gpt-sovits-cors-proxy.cjs"
    timeout /t 2 /nobreak >nul
)
echo.

:: ============================================
:: 5. 啟動 Vite 網頁服務器
:: ============================================
echo [5/5] 啟動網頁服務器...

:: 檢查 3000 或 5173 端口是否已被佔用
netstat -an | find "3000" | find "LISTENING" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo       網頁服務器已在運行
) else (
    netstat -an | find "5173" | find "LISTENING" >nul 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo       網頁服務器已在運行
    ) else (
        echo       正在啟動網頁服務器...
        start "Vite 網頁服務器" cmd /k "title 網頁服務器 && cd /d %~dp0 && npm run dev -- --host 0.0.0.0"
    )
)
echo.

:: ============================================
:: 顯示服務狀態
:: ============================================
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    所有服務已啟動！                          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  Tailscale IP: %TAILSCALE_IP%                              
echo ║                                                              ║
echo ║  服務地址：                                                  ║
echo ║  ├── AI 對話:    http://%TAILSCALE_IP%:11434              
echo ║  ├── 語音合成:   http://%TAILSCALE_IP%:9881               
echo ║  └── 網頁界面:   http://%TAILSCALE_IP%:3000               
echo ║                                                              ║
echo ║  本地訪問：                                                  ║
echo ║  └── http://localhost:3000                                   ║
echo ║                                                              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  遠程電腦配置：                                              ║
echo ║  AI 端點:  http://%TAILSCALE_IP%:11434/v1/chat/completions
echo ║  TTS 端點: http://%TAILSCALE_IP%:9881/                    
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 按任意鍵退出此窗口（服務會繼續運行）
pause >nul
