# Add SSH public key to server
# Usage: .\add_ssh_key.ps1

$pubKeyFile = "$env:USERPROFILE\.ssh\web3_deploy_key.pub"
$serverHost = "165.154.242.216"
$serverUser = "ubuntu"

Write-Host "Reading public key..." -ForegroundColor Yellow
$pubKey = Get-Content $pubKeyFile -Raw
$pubKey = $pubKey.Trim()

Write-Host "Public key:" -ForegroundColor Cyan
Write-Host $pubKey -ForegroundColor White
Write-Host ""

Write-Host "Connecting to server to add public key..." -ForegroundColor Yellow
Write-Host "Please enter server password when prompted." -ForegroundColor Yellow
Write-Host ""

# Create a temporary script file to execute on server
$remoteScript = @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
grep -Fxq '$pubKey' ~/.ssh/authorized_keys 2>/dev/null || echo '$pubKey' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "Public key added successfully!"
"@

# Write script to temp file
$tempScript = [System.IO.Path]::GetTempFileName()
$remoteScript | Out-File -FilePath $tempScript -Encoding utf8 -NoNewline

# Copy script to server and execute
Write-Host "Uploading and executing setup script..." -ForegroundColor Yellow
$pubKeyEscaped = $pubKey -replace "'", "'\''"
ssh $serverUser@$serverHost "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKeyEscaped' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Public key added successfully!'"

# Clean up
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Testing passwordless login..." -ForegroundColor Yellow
ssh -o BatchMode=yes -o ConnectTimeout=5 $serverUser@$serverHost "echo 'Passwordless login successful!'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Passwordless login is working!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Passwordless login failed. Please check:" -ForegroundColor Red
    Write-Host "  1. Server password was entered correctly" -ForegroundColor Yellow
    Write-Host "  2. Public key was added to ~/.ssh/authorized_keys" -ForegroundColor Yellow
    Write-Host "  3. File permissions are correct (700 for .ssh, 600 for authorized_keys)" -ForegroundColor Yellow
}

