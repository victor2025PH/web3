@echo off
chcp 65001 >nul
title AI 智控王 - 停止所有服務

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║          AI 智控王 - 停止所有服務                            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/4] 停止網頁服務器...
taskkill /F /FI "WINDOWTITLE eq 網頁服務器*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Vite*" >nul 2>&1
echo       已停止

echo [2/4] 停止 CORS 代理...
taskkill /F /FI "WINDOWTITLE eq GPT-SoVITS CORS*" >nul 2>&1
echo       已停止

echo [3/4] 停止 GPT-SoVITS...
taskkill /F /FI "WINDOWTITLE eq GPT-SoVITS 語音*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq GPT-SoVITS*" >nul 2>&1
echo       已停止

echo [4/4] 停止 Ollama...
taskkill /F /FI "WINDOWTITLE eq Ollama*" >nul 2>&1
taskkill /F /IM ollama.exe >nul 2>&1
echo       已停止

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    所有服務已停止！                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 按任意鍵退出...
pause >nul
