@echo off
chcp 65001 >nul
title Ollama CORS 代理服务器

echo ========================================
echo   Ollama CORS 代理服务器
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 检查 Ollama 服务...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo [错误] Ollama 服务未运行！
    echo 请先启动 Ollama 服务
    echo.
    pause
    exit /b 1
)
echo [OK] Ollama 服务正常运行
echo.

echo [2/2] 启动 CORS 代理服务器...
echo 代理服务器将运行在: http://localhost:3002
echo.
echo 重要提示：
echo 1. 保持此窗口打开
echo 2. 在另一个窗口运行 Cloudflare Tunnel
echo 3. 命令: D:\Tunnel\cloudflared.exe tunnel --url http://localhost:3002
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

node ollama-cors-proxy.cjs

pause
