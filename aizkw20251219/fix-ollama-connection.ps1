# Fix Ollama Connection - Auto recreate Tunnel and update config

Write-Host "=== Fixing Ollama Connection ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Ollama
Write-Host "[1/5] Checking Ollama service..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "  [OK] Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Ollama is not running!" -ForegroundColor Red
    Write-Host "  Please start Ollama first: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Step 2: Stop existing cloudflared
Write-Host "[2/5] Stopping existing cloudflared..." -ForegroundColor Yellow
$existing = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($existing) {
    Stop-Process -Name "cloudflared" -Force
    Start-Sleep -Seconds 2
    Write-Host "  [OK] Stopped existing cloudflared" -ForegroundColor Green
} else {
    Write-Host "  [OK] No existing cloudflared process" -ForegroundColor Gray
}

# Step 3: Find or download cloudflared
Write-Host "[3/5] Checking cloudflared..." -ForegroundColor Yellow
$cloudflaredCmd = $null

# Check if cloudflared is in PATH
if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
    $cloudflaredCmd = "cloudflared"
    Write-Host "  [OK] cloudflared found in PATH" -ForegroundColor Green
} else {
    # Check if cloudflared.exe exists in current directory
    $localCloudflared = Join-Path $PSScriptRoot "cloudflared.exe"
    if (Test-Path $localCloudflared) {
        $cloudflaredCmd = $localCloudflared
        Write-Host "  [OK] cloudflared found locally" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Downloading cloudflared..." -ForegroundColor Yellow
        $cloudflaredUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        try {
            Invoke-WebRequest -Uri $cloudflaredUrl -OutFile $localCloudflared -UseBasicParsing
            $cloudflaredCmd = $localCloudflared
            Write-Host "  [OK] cloudflared downloaded" -ForegroundColor Green
        } catch {
            Write-Host "  [ERROR] Failed to download cloudflared" -ForegroundColor Red
            Write-Host "  Please download manually: $cloudflaredUrl" -ForegroundColor Yellow
            exit 1
        }
    }
}

# Step 4: Create new tunnel and extract URL
Write-Host "[4/5] Creating new Cloudflare Tunnel..." -ForegroundColor Yellow
$logFile = Join-Path $env:TEMP "cloudflared-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Start cloudflared in background
$process = Start-Process -FilePath $cloudflaredCmd -ArgumentList "tunnel", "--url", "http://localhost:11434" -NoNewWindow -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile

# Wait and extract URL
Start-Sleep -Seconds 8

$tunnelUrl = $null
$maxAttempts = 10
$attempt = 0

while ($attempt -lt $maxAttempts -and -not $tunnelUrl) {
    if (Test-Path $logFile) {
        $logContent = Get-Content $logFile -ErrorAction SilentlyContinue
        foreach ($line in $logContent) {
            if ($line -match "https://([a-z0-9-]+)\.trycloudflare\.com") {
                $tunnelUrl = $matches[0]
                break
            }
        }
    }
    
    if (-not $tunnelUrl) {
        Start-Sleep -Seconds 2
        $attempt++
    }
}

if (-not $tunnelUrl) {
    Write-Host "  [ERROR] Failed to extract Tunnel URL" -ForegroundColor Red
    Write-Host "  Log file: $logFile" -ForegroundColor Yellow
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "  [OK] Tunnel created: $tunnelUrl" -ForegroundColor Green

# Step 5: Update config file
Write-Host "[5/5] Updating configuration..." -ForegroundColor Yellow
$configFile = Join-Path $PSScriptRoot "utils\ollamaProxy.ts"

if (Test-Path $configFile) {
    $configContent = Get-Content $configFile -Raw -Encoding UTF8
    $newUrl = "$tunnelUrl/api/chat"
    $newConfigContent = $configContent -replace "const OLLAMA_URL = '[^']+';", "const OLLAMA_URL = '$newUrl';"
    
    # Also update checkOllamaAvailable function
    $newConfigContent = $newConfigContent -replace "('https://[^']+\.trycloudflare\.com/api/tags')", "'$tunnelUrl/api/tags'"
    
    Set-Content -Path $configFile -Value $newConfigContent -NoNewline -Encoding UTF8
    Write-Host "  [OK] Configuration updated" -ForegroundColor Green
    Write-Host "  New URL: $newUrl" -ForegroundColor Cyan
} else {
    Write-Host "  [ERROR] Config file not found: $configFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Cyan
Write-Host "Process ID: $($process.Id)" -ForegroundColor Gray
Write-Host "Log file: $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "1. Keep this window open to maintain the tunnel" -ForegroundColor Yellow
Write-Host "2. The tunnel will close when you close this window" -ForegroundColor Yellow
Write-Host "3. After restarting, run this script again" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Rebuild: npm run build" -ForegroundColor White
Write-Host "2. Commit and push to GitHub" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Gray

# Keep process running
try {
    $process.WaitForExit()
} catch {
    Write-Host "`nTunnel stopped." -ForegroundColor Yellow
}
