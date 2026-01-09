@echo off
chcp 65001 >nul
title AI 智控王 - 永久隧道服务

echo ╔══════════════════════════════════════════════════════════════╗
echo ║           AI 智控王 - 永久隧道服务启动器                      ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  使用 Cloudflare Named Tunnel（永久URL）                     ║
echo ║                                                              ║
echo ║  将启动以下服务:                                             ║
echo ║  1. Ollama 服务        (AI 对话引擎)                         ║
echo ║  2. Ollama CORS 代理   (端口 3002)                           ║
echo ║  3. GPT-SoVITS 服务    (语音合成引擎)                        ║
echo ║  4. GPT-SoVITS CORS 代理 (端口 9881)                         ║
echo ║  5. Cloudflare Tunnel  (永久隧道)                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ========================================
:: 配置区域 - 请修改以下设置
:: ========================================

:: Cloudflare Tunnel Token（从 Cloudflare Dashboard 获取）
:: 格式: eyJhIjoixxxx...（很长的一串）
set TUNNEL_TOKEN=YOUR_TUNNEL_TOKEN_HERE

:: cloudflared.exe 路径
set CLOUDFLARED_PATH=D:\Tunnel\cloudflared.exe

:: GPT-SoVITS 路径
set GPT_SOVITS_PATH=E:\GPT-SOVITS-v3lora-20250228

:: ========================================
:: 检查配置
:: ========================================

if "%TUNNEL_TOKEN%"=="YOUR_TUNNEL_TOKEN_HERE" (
    echo [错误] 请先配置 Tunnel Token！
    echo.
    echo 步骤:
    echo 1. 访问 https://one.dash.cloudflare.com/
    echo 2. 进入 Networks → Tunnels
    echo 3. 创建或选择隧道，复制 Token
    echo 4. 编辑此脚本，将 YOUR_TUNNEL_TOKEN_HERE 替换为你的 Token
    echo.
    pause
    exit /b 1
)

if not exist "%CLOUDFLARED_PATH%" (
    echo [错误] 找不到 cloudflared.exe
    echo 路径: %CLOUDFLARED_PATH%
    pause
    exit /b 1
)

:: ========================================
:: 启动服务
:: ========================================

echo [1/5] 启动 Ollama 服务...
start "Ollama 服务" cmd /k "title Ollama 服务 && ollama serve"
timeout /t 3 /nobreak >nul
echo [OK]

echo [2/5] 启动 Ollama CORS 代理 (端口 3002)...
start "Ollama CORS 代理" cmd /k "title Ollama CORS 代理 && cd /d %~dp0 && node ollama-cors-proxy.cjs"
timeout /t 2 /nobreak >nul
echo [OK]

echo [3/5] 启动 GPT-SoVITS 服务...
if exist "%GPT_SOVITS_PATH%\runtime\python.exe" (
    start "GPT-SoVITS 服务" cmd /k "title GPT-SoVITS 服务 && cd /d %GPT_SOVITS_PATH% && runtime\python.exe api_v2.py"
) else (
    echo [警告] GPT-SoVITS 路径不存在，请手动启动
)
timeout /t 5 /nobreak >nul
echo [OK]

echo [4/5] 启动 GPT-SoVITS CORS 代理 (端口 9881)...
start "GPT-SoVITS CORS 代理" cmd /k "title GPT-SoVITS CORS 代理 && cd /d %~dp0 && node gpt-sovits-cors-proxy.cjs"
timeout /t 2 /nobreak >nul
echo [OK]

echo [5/5] 启动 Cloudflare 永久隧道...
start "Cloudflare Tunnel" cmd /k "title Cloudflare 永久隧道 && %CLOUDFLARED_PATH% tunnel run --token %TUNNEL_TOKEN%"
echo [OK]

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    所有服务已启动！                          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  永久 URL（不会改变）:                                       ║
echo ║  - Ollama:     https://ollama.你的域名.com                   ║
echo ║  - 语音合成:   https://voice.你的域名.com                    ║
echo ║                                                              ║
echo ║  功能说明:                                                   ║
echo ║  - AI 对话: 访问网站即可使用                                 ║
echo ║  - 语音识别 (STT): 点击麦克风按钮                            ║
echo ║  - 语音合成 (TTS): AI 自动语音回复                           ║
echo ║                                                              ║
echo ║  要停止所有服务，请关闭所有打开的窗口                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
