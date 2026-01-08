@echo off
chcp 65001 >nul
title 停止所有服务

echo ╔══════════════════════════════════════════════════════════════╗
echo ║           AI 智控王 - 停止所有服务                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 正在停止 Ollama...
taskkill /f /im ollama.exe 2>nul
taskkill /f /im ollama_llama_server.exe 2>nul

echo 正在停止 Node.js 代理服务...
taskkill /f /im node.exe 2>nul

echo 正在停止 Cloudflare Tunnel...
taskkill /f /im cloudflared.exe 2>nul

echo 正在停止 Python (GPT-SoVITS)...
REM 注意：这会停止所有 Python 进程，如果有其他 Python 程序运行请小心
REM taskkill /f /im python.exe 2>nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    服务已停止！                              ║
echo ║  注意: GPT-SoVITS (Python) 需要手动关闭窗口                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
