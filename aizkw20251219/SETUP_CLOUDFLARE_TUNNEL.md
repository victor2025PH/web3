# Cloudflare Tunnel 设置指南

## 问题
`cloudflared` 命令未找到，需要先安装 Cloudflare Tunnel 客户端。

## 安装 Cloudflare Tunnel（Windows）

### 方法 1：使用 Chocolatey（推荐）

如果您已安装 Chocolatey：
```powershell
choco install cloudflared
```

### 方法 2：手动下载安装

1. **下载 cloudflared**
   - 访问：https://github.com/cloudflare/cloudflared/releases/latest
   - 下载 `cloudflared-windows-amd64.exe`
   - 或直接下载：https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe

2. **安装到系统路径**
   - 将 `cloudflared-windows-amd64.exe` 重命名为 `cloudflared.exe`
   - 移动到 `C:\Windows\System32\` 或添加到系统 PATH

3. **或者直接使用（无需安装）**
   - 将 `cloudflared.exe` 放在项目目录中
   - 使用完整路径运行：`.\cloudflared.exe tunnel --url http://127.0.0.1:9880`

## 快速安装脚本（PowerShell）

在 PowerShell 中运行（以管理员身份）：

```powershell
# 下载 cloudflared
$url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$output = "$env:TEMP\cloudflared.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# 移动到 System32（需要管理员权限）
Move-Item -Path $output -Destination "C:\Windows\System32\cloudflared.exe" -Force

# 验证安装
cloudflared --version
```

## 使用 Cloudflare Tunnel

### 启动 Tunnel

在 GPT-SoVITS 项目目录中运行：

```powershell
cd E:\GPT-SOVITS-v3lora-20250228
cloudflared tunnel --url http://127.0.0.1:9880
```

### 获取 Tunnel URL

运行后会显示类似以下内容：
```
Your quick Tunnel has been created! Visit it at:
https://abc-xyz-123.trycloudflare.com
```

### 更新配置

将获取的 URL 更新到 `src/voiceConfig.ts`：

```typescript
apiBaseUrl: 'https://abc-xyz-123.trycloudflare.com',
```

## 注意事项

1. **临时 Tunnel**：使用 `--url` 参数创建的 Tunnel 是临时的，关闭终端后 Tunnel 会断开
2. **持久化 Tunnel**：如果需要持久化，需要创建命名 Tunnel（需要 Cloudflare 账号）
3. **端口**：确保 GPT-SoVITS 服务正在运行在 `http://127.0.0.1:9880`

## 替代方案

如果不想使用 Cloudflare Tunnel，可以考虑：

1. **使用 ngrok**：类似的隧道服务
2. **直接使用服务器 IP**：如果 GPT-SoVITS 部署在服务器上
3. **本地开发**：如果前端也在本地，可以直接使用 `http://127.0.0.1:9880`
