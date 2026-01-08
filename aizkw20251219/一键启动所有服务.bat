@echo off
chcp 65001 >nul
title 一键启动所有服务

echo ╔══════════════════════════════════════════════════════════════╗
echo ║           AI 智控王 - 一键启动所有服务                       ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  将启动以下服务:                                             ║
echo ║  1. Ollama 服务                                              ║
echo ║  2. Ollama CORS 代理                                         ║
echo ║  3. Ollama Cloudflare Tunnel                                 ║
echo ║  4. GPT-SoVITS 服务                                          ║
echo ║  5. GPT-SoVITS CORS 代理                                     ║
echo ║  6. GPT-SoVITS Cloudflare Tunnel                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/6] 启动 Ollama 服务...
start "Ollama 服务" cmd /k "title Ollama 服务 && ollama serve"
timeout /t 3 /nobreak >nul

echo [2/6] 启动 Ollama CORS 代理...
start "Ollama CORS 代理" cmd /k "title Ollama CORS 代理 && cd /d %~dp0 && node ollama-cors-proxy.cjs"
timeout /t 2 /nobreak >nul

echo [3/6] 启动 Ollama Cloudflare Tunnel...
start "Ollama Tunnel" cmd /k "title Ollama Cloudflare Tunnel && D:\Tunnel\cloudflared.exe tunnel --url http://localhost:3002"
timeout /t 2 /nobreak >nul

echo [4/6] 启动 GPT-SoVITS 服务...
start "GPT-SoVITS 服务" cmd /k "title GPT-SoVITS 服务 && cd /d E:\GPT-SOVITS-v3lora-20250228 && runtime\python.exe api_v2.py"
timeout /t 5 /nobreak >nul

echo [5/6] 启动 GPT-SoVITS CORS 代理...
start "GPT-SoVITS CORS 代理" cmd /k "title GPT-SoVITS CORS 代理 && cd /d %~dp0 && node gpt-sovits-cors-proxy.cjs"
timeout /t 2 /nobreak >nul

echo [6/6] 启动 GPT-SoVITS Cloudflare Tunnel...
start "GPT-SoVITS Tunnel" cmd /k "title GPT-SoVITS Cloudflare Tunnel && D:\Tunnel\cloudflared.exe tunnel --url http://localhost:9881"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    所有服务已启动！                          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  请等待约 30 秒让所有服务完全启动                            ║
echo ║                                                              ║
echo ║  重要提示:                                                   ║
echo ║  1. 查看 "Ollama Cloudflare Tunnel" 窗口获取 Ollama URL      ║
echo ║  2. 查看 "GPT-SoVITS Cloudflare Tunnel" 窗口获取语音 URL     ║
echo ║  3. 将两个 URL 更新到配置文件中                              ║
echo ║                                                              ║
echo ║  要停止所有服务，请关闭所有打开的窗口                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
