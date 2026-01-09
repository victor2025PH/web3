@echo off
chcp 65001 >nul
title 一键启动远程AI服务

echo ========================================
echo   远程AI服务启动器
echo ========================================
echo.

:: 检查 cloudflared
set CLOUDFLARED_PATH=D:\Tunnel\cloudflared.exe
if not exist "%CLOUDFLARED_PATH%" (
    echo [错误] 找不到 cloudflared.exe
    echo 请将 cloudflared.exe 放到 D:\Tunnel\ 目录
    pause
    exit /b 1
)

:: 步骤1: 启动 CORS 代理
echo [1/3] 启动 CORS 代理服务器 (端口 9881)...
start "CORS代理" cmd /c "cd /d %~dp0 && node gpt-sovits-cors-proxy.cjs"
timeout /t 2 /nobreak >nul
echo [OK] CORS 代理已启动
echo.

:: 步骤2: 检查 GPT-SoVITS
echo [2/3] 检查 GPT-SoVITS 服务 (端口 9880)...
curl -s http://127.0.0.1:9880/ >nul 2>&1
if errorlevel 1 (
    echo [警告] GPT-SoVITS 未运行！
    echo 请手动启动 GPT-SoVITS，然后重新运行此脚本
    echo.
    pause
    exit /b 1
)
echo [OK] GPT-SoVITS 正常运行
echo.

:: 步骤3: 启动 Cloudflare Tunnel
echo [3/3] 启动 Cloudflare Tunnel...
echo.
echo ========================================
echo   等待 Tunnel URL 生成...
echo ========================================
echo.
echo 生成的 URL 格式: https://xxx-xxx-xxx.trycloudflare.com
echo.
echo 远程电脑使用方法:
echo 1. 复制下方显示的 Tunnel URL
echo 2. 在前端配置中使用该 URL
echo.
echo 保持此窗口打开，按 Ctrl+C 停止服务
echo ========================================
echo.

"%CLOUDFLARED_PATH%" tunnel --url http://127.0.0.1:9881

pause
