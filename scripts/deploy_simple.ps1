# Simple deployment script for three websites
# Usage: .\scripts\deploy_simple.ps1

$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $ScriptDir

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Build All Three Websites" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$sites = @(
    @{Name="aizkw"; Dir="aizkw20251219"; Port=3001},
    @{Name="tgmini"; Dir="tgmini20251220"; Port=3002},
    @{Name="hongbao"; Dir="hbwy20251220"; Port=3003}
)

foreach ($site in $sites) {
    Write-Host "Building $($site.Name)..." -ForegroundColor Yellow
    $sitePath = Join-Path $ScriptDir $site.Dir
    
    if (-not (Test-Path $sitePath)) {
        Write-Host "  [ERROR] Directory not found: $sitePath" -ForegroundColor Red
        continue
    }
    
    Set-Location $sitePath
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Cyan
        npm install
    }
    
    # Build
    Write-Host "  Building..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Build successful" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Build failed" -ForegroundColor Red
    }
    
    Set-Location $ScriptDir
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Build Complete" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build outputs are in:" -ForegroundColor Yellow
foreach ($site in $sites) {
    Write-Host "  $($site.Dir)/dist/" -ForegroundColor White
}

