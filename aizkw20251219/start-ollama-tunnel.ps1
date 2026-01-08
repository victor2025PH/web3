# 启动 Ollama Cloudflare Tunnel 并自动更新配置

Write-Host "=== 启动 Ollama Cloudflare Tunnel ===" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Ollama 是否运行
Write-Host "1. 检查 Ollama 服务..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✓ Ollama 服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Ollama 服务未运行" -ForegroundColor Red
    Write-Host "   请先启动 Ollama: ollama serve" -ForegroundColor Yellow
    exit 1
}

# 2. 检查 cloudflared
Write-Host "2. 检查 cloudflared..." -ForegroundColor Yellow
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "   ✗ cloudflared 未安装" -ForegroundColor Red
    Write-Host "   正在下载 cloudflared..." -ForegroundColor Yellow
    
    $cloudflaredUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    $cloudflaredPath = Join-Path $PSScriptRoot "cloudflared.exe"
    
    try {
        Invoke-WebRequest -Uri $cloudflaredUrl -OutFile $cloudflaredPath -UseBasicParsing
        Write-Host "   ✓ cloudflared 下载完成" -ForegroundColor Green
        $cloudflaredCmd = $cloudflaredPath
    } catch {
        Write-Host "   ✗ 下载失败: $_" -ForegroundColor Red
        Write-Host "   请手动下载: $cloudflaredUrl" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   ✓ cloudflared 已安装" -ForegroundColor Green
    $cloudflaredCmd = "cloudflared"
}

# 3. 停止现有的 cloudflared 进程
Write-Host "3. 停止现有 Tunnel..." -ForegroundColor Yellow
$existingProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($existingProcess) {
    Stop-Process -Name "cloudflared" -Force
    Start-Sleep -Seconds 2
    Write-Host "   ✓ 已停止现有进程" -ForegroundColor Green
}

# 4. 启动新的 Tunnel（后台运行）
Write-Host "4. 启动新的 Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "   正在创建 Tunnel，请稍候..." -ForegroundColor Gray

# 创建临时日志文件
$logFile = Join-Path $env:TEMP "cloudflared-tunnel-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# 启动 cloudflared 并捕获输出
$process = Start-Process -FilePath $cloudflaredCmd -ArgumentList "tunnel", "--url", "http://localhost:11434" -NoNewWindow -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile

Start-Sleep -Seconds 5

# 5. 从日志中提取 Tunnel URL
Write-Host "5. 提取 Tunnel URL..." -ForegroundColor Yellow
$logContent = Get-Content $logFile -ErrorAction SilentlyContinue
$tunnelUrl = $null

foreach ($line in $logContent) {
    if ($line -match "https://([a-z0-9-]+)\.trycloudflare\.com") {
        $tunnelUrl = $matches[0]
        break
    }
}

if ($tunnelUrl) {
    Write-Host "   ✓ Tunnel URL: $tunnelUrl" -ForegroundColor Green
    
    # 6. 更新配置文件
    Write-Host "6. 更新配置文件..." -ForegroundColor Yellow
    $configFile = Join-Path $PSScriptRoot "utils\ollamaProxy.ts"
    
    if (Test-Path $configFile) {
        $configContent = Get-Content $configFile -Raw
        $newConfigContent = $configContent -replace "const OLLAMA_URL = '[^']+';", "const OLLAMA_URL = '$tunnelUrl/api/chat';"
        
        Set-Content -Path $configFile -Value $newConfigContent -NoNewline
        Write-Host "   ✓ 配置文件已更新" -ForegroundColor Green
        Write-Host "   新 URL: $tunnelUrl/api/chat" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ 配置文件不存在: $configFile" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== Tunnel 启动成功 ===" -ForegroundColor Green
    Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Cyan
    Write-Host "日志文件: $logFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠ 重要提示:" -ForegroundColor Yellow
    Write-Host "1. 保持此窗口打开以维持 Tunnel 连接" -ForegroundColor Yellow
    Write-Host "2. 关闭此窗口会断开 Tunnel" -ForegroundColor Yellow
    Write-Host "3. 重启电脑后需要重新运行此脚本" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "按 Ctrl+C 停止 Tunnel" -ForegroundColor Gray
    
    # 保持进程运行
    $process.WaitForExit()
} else {
    Write-Host "   ✗ 无法从日志中提取 Tunnel URL" -ForegroundColor Red
    Write-Host "   请查看日志文件: $logFile" -ForegroundColor Yellow
    Write-Host "   或手动运行: $cloudflaredCmd tunnel --url http://localhost:11434" -ForegroundColor Yellow
}
