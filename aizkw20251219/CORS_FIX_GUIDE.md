# CORS 问题修复指南

## 问题原因

前端部署在 `https://aizkw.usdt2026.cc`，通过 Cloudflare Tunnel (`https://gary-barry-discussed-fare.trycloudflare.com`) 访问本地 Ollama，但 Ollama 服务器没有设置 CORS 头，导致浏览器阻止跨域请求。

错误信息：
```
Access to fetch at 'https://gary-barry-discussed-fare.trycloudflare.com/api/chat' 
from origin 'https://aizkw.usdt2026.cc' has been blocked by CORS policy
```

## 解决方案

创建一个 CORS 代理服务器，添加必要的 CORS 头，然后通过 Cloudflare Tunnel 暴露。

## 自动修复步骤

### 1. 启动 CORS 代理服务器

在项目目录打开 PowerShell 或 CMD，运行：

```powershell
cd d:\web3-migration\aizkw20251219
npm run proxy
```

或者直接运行：

```powershell
node ollama-cors-proxy.js
```

应该看到：
```
🚀 Ollama CORS Proxy Server running on http://localhost:3002
📡 Proxying to Ollama at http://127.0.0.1:11434
🔓 Z-CORE system prompt enabled
🌐 CORS headers enabled for all origins
```

**重要**：保持这个窗口打开！

### 2. 启动 Cloudflare Tunnel（新窗口）

打开**新的** PowerShell 或 CMD 窗口，运行：

```powershell
cloudflared tunnel --url http://localhost:3002
```

等待几秒，会显示新的 Tunnel URL，例如：
```
Your quick Tunnel has been created! Visit it at:
https://abc-xyz-123.trycloudflare.com
```

**重要**：保持这个窗口打开！

### 3. 更新配置文件

编辑 `utils/ollamaProxy.ts`，将第 8 行改为新的 Tunnel URL：

```typescript
const OLLAMA_URL = 'https://新TunnelURL/api/chat';
```

同时更新第 182 行的 `checkOllamaAvailable` 函数：

```typescript
const response = await fetch('https://新TunnelURL/api/tags', {
```

### 4. 重新构建并部署

```powershell
npm run build
git add .
git commit -m "Fix CORS issue with Ollama proxy"
git push origin main
```

## 手动命令（如果自动方案不行）

### 方案 A：使用 CORS 代理（推荐）

**窗口 1 - 启动代理服务器：**
```powershell
cd d:\web3-migration\aizkw20251219
node ollama-cors-proxy.js
```

**窗口 2 - 启动 Cloudflare Tunnel：**
```powershell
cloudflared tunnel --url http://localhost:3002
```

**窗口 3 - 更新配置并部署：**
```powershell
cd d:\web3-migration\aizkw20251219
# 编辑 utils/ollamaProxy.ts，更新 Tunnel URL
npm run build
git add .
git commit -m "Fix CORS"
git push origin main
```

### 方案 B：直接配置 Ollama CORS（需要修改 Ollama）

如果 Ollama 支持环境变量配置 CORS：

**窗口 1 - 启动 Ollama（带 CORS）：**
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

**窗口 2 - 启动 Cloudflare Tunnel：**
```powershell
cloudflared tunnel --url http://localhost:11434
```

然后更新 `utils/ollamaProxy.ts` 中的 URL。

### 方案 C：使用 nginx 反向代理（高级）

如果需要更稳定的方案，可以使用 nginx：

1. 安装 nginx
2. 配置 nginx 添加 CORS 头
3. 代理到 `http://localhost:11434`
4. 通过 Cloudflare Tunnel 暴露 nginx

## 验证连接

1. 访问代理服务器健康检查：`http://localhost:3002/health`
2. 访问 Tunnel URL：`https://你的TunnelURL/health`
3. 测试 Ollama API：`https://你的TunnelURL/api/tags`

## 常见问题

### Q: 代理服务器启动失败？
A: 确保端口 3002 未被占用，或修改 `ollama-cors-proxy.js` 中的 `PROXY_PORT`。

### Q: Tunnel 连接失败？
A: 确保代理服务器正在运行，然后重新启动 Tunnel。

### Q: 前端仍然报 CORS 错误？
A: 检查 Tunnel URL 是否正确更新，清除浏览器缓存，重新加载页面。

### Q: 如何保持服务运行？
A: 使用 PM2 或 Windows 服务管理器来保持代理服务器和 Tunnel 运行。

## 保持服务运行（可选）

### 使用 PM2（推荐）

```powershell
npm install -g pm2
pm2 start ollama-cors-proxy.js --name ollama-proxy
pm2 save
pm2 startup
```

### 使用 Windows 计划任务

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：系统启动时
4. 操作：启动程序 `node`，参数：`d:\web3-migration\aizkw20251219\ollama-cors-proxy.js`
5. 设置：以管理员身份运行
