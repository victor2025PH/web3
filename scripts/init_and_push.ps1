# Initialize Git repository and push to GitHub
# Usage: .\scripts\init_and_push.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $ScriptDir

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Initialize Git Repository" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .git exists
if (Test-Path .git) {
    Write-Host "Git repository already exists" -ForegroundColor Yellow
    Write-Host "Removing existing .git directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
    Write-Host "[OK] Removed" -ForegroundColor Green
}

# Initialize Git
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
git init
Write-Host "[OK] Git initialized" -ForegroundColor Green

# Add all files
Write-Host ""
Write-Host "Adding files..." -ForegroundColor Yellow
git add .
Write-Host "[OK] Files added" -ForegroundColor Green

# Initial commit
Write-Host ""
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Three websites only (aizkw, tgmini, hongbao)"
Write-Host "[OK] Initial commit created" -ForegroundColor Green

# Add remote
Write-Host ""
Write-Host "Configuring remote repository..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/victor2025PH/web3.git"

# Remove existing remote if exists (ignore error if it doesn't exist)
$remoteExists = git remote | Select-String -Pattern "^origin$"
if ($remoteExists) {
    git remote remove origin
    Write-Host "[OK] Removed existing remote" -ForegroundColor Green
}

# Add remote
git remote add origin $remoteUrl
Write-Host "[OK] Remote added: $remoteUrl" -ForegroundColor Green

# Rename branch to main
Write-Host ""
Write-Host "Renaming branch to main..." -ForegroundColor Yellow
git branch -M main
Write-Host "[OK] Branch renamed to main" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Ready to Push" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Push to GitHub" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Force push (will overwrite GitHub repository)" -ForegroundColor White
Write-Host "  git push -f origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Normal push (if repository is empty)" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "Warning: Force push will delete all existing files on GitHub!" -ForegroundColor Red
Write-Host ""

