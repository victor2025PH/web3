@echo off
chcp 65001 >nul
title 一键启动 Ollama 服务

echo ========================================
echo   一键启动 Ollama 完整服务
echo ========================================
echo.

cd /d "%~dp0"

echo [步骤 1/3] 检查 Ollama 服务...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo [警告] Ollama 服务未运行
    echo 请先启动 Ollama 服务
    echo.
    echo 如果已安装 Ollama，请运行：
    echo   ollama serve
    echo.
    pause
    exit /b 1
)
echo [OK] Ollama 服务正常运行
echo.

echo [步骤 2/3] 启动 CORS 代理服务器...
start "Ollama CORS 代理" cmd /k "cd /d %~dp0 && node ollama-cors-proxy.cjs"
timeout /t 3 /nobreak >nul
echo [OK] CORS 代理服务器已启动（新窗口）
echo.

echo [步骤 3/3] 启动 Cloudflare Tunnel...
set CLOUDFLARED_PATH=D:\Tunnel\cloudflared.exe
if not exist "%CLOUDFLARED_PATH%" (
    echo [错误] 找不到 cloudflared.exe
    echo 路径: %CLOUDFLARED_PATH%
    echo.
    echo 请手动运行 Cloudflare Tunnel：
    echo   D:\Tunnel\cloudflared.exe tunnel --url http://localhost:3002
    echo.
    pause
    exit /b 1
)

start "Cloudflare Tunnel" cmd /k "cd /d D:\Tunnel && cloudflared.exe tunnel --url http://localhost:3002"
echo [OK] Cloudflare Tunnel 已启动（新窗口）
echo.

echo ========================================
echo   启动完成！
echo ========================================
echo.
echo 已启动的服务：
echo 1. Ollama 服务: http://localhost:11434
echo 2. CORS 代理服务器: http://localhost:3002
echo 3. Cloudflare Tunnel: 查看新窗口获取 URL
echo.
echo 下一步：
echo 1. 等待 Cloudflare Tunnel 显示 URL
echo 2. 复制 Tunnel URL
echo 3. 更新 utils/ollamaProxy.ts 中的 URL
echo 4. 运行: npm run build
echo 5. 提交并推送到 GitHub
echo.
pause
