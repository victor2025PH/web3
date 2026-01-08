@echo off
chcp 65001 >nul
title Cloudflare Tunnel - Ollama 代理

echo ========================================
echo   Cloudflare Tunnel - Ollama 代理
echo ========================================
echo.

set CLOUDFLARED_PATH=D:\Tunnel\cloudflared.exe

if not exist "%CLOUDFLARED_PATH%" (
    echo [错误] 找不到 cloudflared.exe
    echo 路径: %CLOUDFLARED_PATH%
    echo.
    echo 请确保 cloudflared.exe 存在于 D:\Tunnel\ 目录
    echo.
    pause
    exit /b 1
)

echo [1/2] 检查 CORS 代理服务器...
curl -s http://localhost:3002/health >nul 2>&1
if errorlevel 1 (
    echo [警告] CORS 代理服务器未运行！
    echo 请先运行: 启动Ollama代理.bat
    echo.
    pause
    exit /b 1
)
echo [OK] CORS 代理服务器正常运行
echo.

echo [2/2] 启动 Cloudflare Tunnel...
echo 正在连接到代理服务器: http://localhost:3002
echo.
echo 重要提示：
echo 1. 保持此窗口打开
echo 2. 等待显示 Tunnel URL（例如: https://xxx.trycloudflare.com）
echo 3. 复制 URL 并更新 utils/ollamaProxy.ts
echo.
echo 按 Ctrl+C 停止 Tunnel
echo ========================================
echo.

"%CLOUDFLARED_PATH%" tunnel --url http://localhost:3002

pause
