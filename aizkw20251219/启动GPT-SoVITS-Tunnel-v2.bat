@echo off
chcp 65001 >nul
title Cloudflare Tunnel - GPT-SoVITS CORS 代理

echo ================================================
echo   Cloudflare Tunnel - GPT-SoVITS CORS 代理
echo ================================================
echo.

set CLOUDFLARED_PATH=D:\Tunnel\cloudflared.exe

echo [1/3] 检查 GPT-SoVITS 服务...
curl -s http://localhost:9880/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] GPT-SoVITS 服务未运行！
    echo 请先启动 GPT-SoVITS API 服务
    echo.
) else (
    echo [OK] GPT-SoVITS 服务正在运行
)

echo.
echo [2/3] 检查 CORS 代理...
curl -s http://localhost:9881/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] CORS 代理未运行！
    echo 请先在另一个窗口运行: 启动GPT-SoVITS代理.bat
    echo.
    pause
    exit
) else (
    echo [OK] CORS 代理正在运行
)

echo.
echo [3/3] 启动 Cloudflare Tunnel...
echo 正在连接到 CORS 代理: http://localhost:9881
echo.
echo 重要提示:
echo 1. 等待显示 Tunnel URL (例如: https://xxx.trycloudflare.com)
echo 2. 复制 URL 并更新 src/voiceConfig.ts
echo 3. 重新构建并部署
echo.
echo 按 Ctrl+C 停止 Tunnel
echo ================================================

"%CLOUDFLARED_PATH%" tunnel --url http://localhost:9881
pause
