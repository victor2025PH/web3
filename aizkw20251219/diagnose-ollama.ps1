# Ollama Connection Diagnostic Script

Write-Host "=== Ollama Connection Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check local Ollama service
Write-Host "1. Checking local Ollama service..." -ForegroundColor Yellow
try {
    $ollamaLocal = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    if ($ollamaLocal.StatusCode -eq 200) {
        Write-Host "   [OK] Ollama local service is running" -ForegroundColor Green
        $models = ($ollamaLocal.Content | ConvertFrom-Json).models
        Write-Host "   Installed models:" -ForegroundColor Gray
        foreach ($model in $models) {
            Write-Host "     - $($model.name)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   [ERROR] Ollama local service is not running or inaccessible" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Please run: ollama serve" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check current Cloudflare Tunnel URL configuration
Write-Host "2. Checking current configuration..." -ForegroundColor Yellow
$configFile = "utils\ollamaProxy.ts"
if (Test-Path $configFile) {
    $configContent = Get-Content $configFile -Raw
    if ($configContent -match "const OLLAMA_URL = '([^']+)'") {
        $currentUrl = $matches[1]
        Write-Host "   Current configured URL: $currentUrl" -ForegroundColor Gray
        
        # Test the configured URL
        Write-Host "   Testing configured URL..." -ForegroundColor Yellow
        try {
            $testUrl = $currentUrl -replace "/api/chat", "/api/tags"
            $tunnelTest = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 10
            if ($tunnelTest.StatusCode -eq 200) {
                Write-Host "   [OK] Cloudflare Tunnel connection is working" -ForegroundColor Green
            }
        } catch {
            Write-Host "   [ERROR] Cloudflare Tunnel connection failed" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
            Write-Host "   Need to recreate Tunnel" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   [ERROR] Config file not found: $configFile" -ForegroundColor Red
}

Write-Host ""

# 3. Check if cloudflared is running
Write-Host "3. Checking cloudflared process..." -ForegroundColor Yellow
$cloudflaredProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($cloudflaredProcess) {
    Write-Host "   [OK] cloudflared is running (PID: $($cloudflaredProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] cloudflared is not running" -ForegroundColor Red
    Write-Host "   Need to start: cloudflared tunnel --url http://localhost:11434" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
