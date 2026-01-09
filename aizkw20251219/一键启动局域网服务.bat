@echo off
chcp 65001 >nul
title AI 智控王 - 局域網服務

echo ========================================
echo   AI 智控王 - 局域網遠程訪問服務
echo ========================================
echo.

cd /d "%~dp0"

:: 獲取本機 IP 地址
echo [信息] 正在獲取本機 IP 地址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  本機 IP 地址: %LOCAL_IP%
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  遠程電腦請使用以下地址:                                     ║
echo ║                                                              ║
echo ║  Ollama AI:     http://%LOCAL_IP%:11434                    
echo ║  語音合成:      http://%LOCAL_IP%:9881                     
echo ║  網頁界面:      http://%LOCAL_IP%:5173                     
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 開放防火牆端口
echo [1/4] 開放防火牆端口...
netsh advfirewall firewall add rule name="Ollama AI" dir=in action=allow protocol=tcp localport=11434 >nul 2>&1
netsh advfirewall firewall add rule name="GPT-SoVITS" dir=in action=allow protocol=tcp localport=9880 >nul 2>&1
netsh advfirewall firewall add rule name="GPT-SoVITS CORS" dir=in action=allow protocol=tcp localport=9881 >nul 2>&1
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=tcp localport=5173 >nul 2>&1
echo     防火牆規則已添加

:: 啟動 Ollama（如果未運行）
echo [2/4] 檢查 Ollama 服務...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo     啟動 Ollama...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
) else (
    echo     Ollama 已在運行
)

:: 設置 Ollama 環境變量允許遠程訪問
set OLLAMA_HOST=0.0.0.0:11434
set OLLAMA_ORIGINS=*

:: 啟動 GPT-SoVITS CORS 代理
echo [3/4] 啟動語音合成代理...
start "GPT-SoVITS CORS 代理" cmd /k "title GPT-SoVITS CORS 代理 (局域網) && cd /d %~dp0 && node gpt-sovits-cors-proxy.cjs"
timeout /t 2 /nobreak >nul

:: 啟動 Vite 開發服務器（允許局域網訪問）
echo [4/4] 啟動網頁服務器...
start "Vite Dev Server" cmd /k "title 網頁服務器 (局域網) && cd /d %~dp0 && npm run dev -- --host 0.0.0.0"

echo.
echo ========================================
echo   所有服務已啟動！
echo ========================================
echo.
echo 重要提示:
echo 1. 確保兩台電腦在同一個 WiFi/局域網
echo 2. 遠程電腦訪問: http://%LOCAL_IP%:5173
echo 3. 如果無法訪問，請檢查防火牆設置
echo.
echo 按任意鍵退出此窗口（服務會繼續運行）
pause >nul
