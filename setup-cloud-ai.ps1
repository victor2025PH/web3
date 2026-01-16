# ============================================
# Cloud AI Setup - Cloudflare Tunnel
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cloud AI Setup (Cloudflare Tunnel)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Ollama
Write-Host "[1/2] Checking Ollama..." -ForegroundColor Yellow
$ollamaOK = $false
try { 
    $ver = Invoke-RestMethod -Uri "http://localhost:11434/api/version" -TimeoutSec 3
    $ollamaOK = $true 
    Write-Host "      Ollama v$($ver.version) running" -ForegroundColor Green
} catch { 
    Write-Host "      Starting Ollama..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    try {
        $ver = Invoke-RestMethod -Uri "http://localhost:11434/api/version" -TimeoutSec 3
        Write-Host "      Ollama v$($ver.version) started" -ForegroundColor Green
    } catch {
        Write-Host "      Failed to start Ollama" -ForegroundColor Red
    }
}

# 2. Start Cloudflare Tunnel
Write-Host ""
Write-Host "[2/2] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "      This will create a public URL accessible from anywhere!" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Keep this window open!" -ForegroundColor Yellow
Write-Host "  The public URL will appear below" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start cloudflared
$cloudflaredPath = "$PSScriptRoot\aizkw20251219\cloudflared.exe"
if (-not (Test-Path $cloudflaredPath)) {
    $cloudflaredPath = "D:\web3-migration\aizkw20251219\cloudflared.exe"
}

if (Test-Path $cloudflaredPath) {
    & $cloudflaredPath tunnel --url http://localhost:11434
} else {
    Write-Host "cloudflared.exe not found!" -ForegroundColor Red
    Write-Host "Please download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
}
