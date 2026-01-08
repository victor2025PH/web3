# Cloudflare Tunnel 安装脚本

Write-Host "检查 cloudflared 是否已安装..." -ForegroundColor Cyan

if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
    Write-Host "✓ cloudflared 已安装" -ForegroundColor Green
    cloudflared --version
    exit 0
}

Write-Host "cloudflared 未安装，正在下载..." -ForegroundColor Yellow

# 下载 cloudflared
$url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$tempPath = Join-Path $env:TEMP "cloudflared.exe"
$system32Path = "C:\Windows\System32\cloudflared.exe"

try {
    Write-Host "正在从 GitHub 下载 cloudflared..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $tempPath -UseBasicParsing
    
    Write-Host "✓ 下载完成: $tempPath" -ForegroundColor Green
    
    # 尝试移动到 System32（需要管理员权限）
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if ($isAdmin) {
        Write-Host "正在安装到 System32..." -ForegroundColor Cyan
        Copy-Item -Path $tempPath -Destination $system32Path -Force
        Write-Host "✓ 已安装到 System32" -ForegroundColor Green
        Write-Host "现在可以在任何位置使用 'cloudflared' 命令" -ForegroundColor Green
    } else {
        Write-Host "⚠ 需要管理员权限才能安装到 System32" -ForegroundColor Yellow
        Write-Host "当前下载位置: $tempPath" -ForegroundColor Yellow
        Write-Host "您可以：" -ForegroundColor Yellow
        Write-Host "  1. 以管理员身份运行此脚本" -ForegroundColor Yellow
        Write-Host "  2. 或手动将 $tempPath 复制到 C:\Windows\System32\" -ForegroundColor Yellow
        Write-Host "  3. 或直接使用完整路径运行: $tempPath tunnel --url http://127.0.0.1:9880" -ForegroundColor Yellow
    }
    
    # 验证安装
    if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
        Write-Host "`n✓ cloudflared 安装成功！" -ForegroundColor Green
        cloudflared --version
    } else {
        Write-Host "`n⚠ cloudflared 已下载但未添加到 PATH" -ForegroundColor Yellow
        Write-Host "文件位置: $tempPath" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "✗ 下载失败: $_" -ForegroundColor Red
    Write-Host "请手动下载: $url" -ForegroundColor Yellow
    exit 1
}
