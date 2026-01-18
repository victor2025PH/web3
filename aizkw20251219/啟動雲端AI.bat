@echo off
chcp 65001 >nul
title Cloud AI - Cloudflare Tunnel

echo.
echo ========================================
echo   Cloud AI Setup (Cloudflare Tunnel)
echo ========================================
echo.
echo Starting... Please wait for the public URL
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0setup-cloud-ai.ps1"

pause
