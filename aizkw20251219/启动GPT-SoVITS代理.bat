@echo off
chcp 65001 >nul
title GPT-SoVITS CORS 代理

echo ================================================
echo   GPT-SoVITS CORS 代理启动脚本
echo ================================================
echo.

cd /d "%~dp0"

echo [1/2] 检查 GPT-SoVITS 服务...
curl -s http://localhost:9880/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] GPT-SoVITS 服务未运行！
    echo 请先启动 GPT-SoVITS API 服务
    echo.
) else (
    echo [OK] GPT-SoVITS 服务正在运行
)

echo.
echo [2/2] 启动 CORS 代理服务器...
echo 代理端口: 9881
echo 目标地址: http://localhost:9880
echo.
echo 按 Ctrl+C 停止服务
echo ================================================

node gpt-sovits-cors-proxy.cjs
pause
