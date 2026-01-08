# Ollama 连接问题修复指南

## 问题分析

根据您的情况，连接失败的主要原因：

1. **Cloudflare Tunnel URL 失效**：重启电脑后，临时 Tunnel URL (`https://gary-barry-discussed-fare.trycloudflare.com`) 已失效
2. **需要重新创建 Tunnel**：每次重启后都需要重新运行 `cloudflared tunnel` 获取新 URL
3. **配置文件需要更新**：新 URL 需要更新到 `utils/ollamaProxy.ts`

## 快速修复步骤

### 方法 1：使用自动脚本（推荐）

1. **运行诊断脚本**：
   ```powershell
   cd d:\web3-migration\aizkw20251219
   powershell -ExecutionPolicy Bypass -File diagnose-ollama.ps1
   ```

2. **运行 Tunnel 启动脚本**（会自动更新配置）：
   ```powershell
   powershell -ExecutionPolicy Bypass -File start-ollama-tunnel.ps1
   ```

   脚本会：
   - 检查 Ollama 是否运行
   - 下载 cloudflared（如需要）
   - 创建新的 Tunnel
   - 自动更新 `utils/ollamaProxy.ts` 中的 URL

### 方法 2：手动修复

1. **确保 Ollama 运行**：
   ```powershell
   # 检查 Ollama
   curl http://localhost:11434/api/tags
   ```

2. **启动 Cloudflare Tunnel**：
   ```powershell
   cloudflared tunnel --url http://localhost:11434
   ```

3. **复制新的 Tunnel URL**（例如：`https://abc-xyz-123.trycloudflare.com`）

4. **更新配置文件**：
   编辑 `utils/ollamaProxy.ts`，将第 8 行改为：
   ```typescript
   const OLLAMA_URL = 'https://新URL/api/chat';
   ```

5. **重新构建并部署**：
   ```powershell
   npm run build
   git add .
   git commit -m "Update Ollama Tunnel URL"
   git push origin main
   ```

## 重要提示

### ⚠️ 临时 Tunnel 的限制

- **每次重启后失效**：临时 Tunnel URL 在关闭终端或重启电脑后会失效
- **需要保持运行**：必须保持 `cloudflared` 进程运行才能访问
- **不适合生产环境**：临时 Tunnel 不稳定，不适合长期使用

### 💡 解决方案

#### 方案 A：每次重启后重新运行脚本
- 使用 `start-ollama-tunnel.ps1` 自动创建新 Tunnel
- 适合开发/测试环境

#### 方案 B：创建持久化 Tunnel（推荐生产环境）
1. 注册 Cloudflare 账号
2. 创建命名 Tunnel
3. 配置配置文件
4. 设置自动启动

#### 方案 C：使用固定 IP 或域名
- 如果 Ollama 部署在服务器上
- 使用服务器 IP 或域名
- 配置防火墙规则

## 验证连接

运行诊断脚本验证：
```powershell
powershell -ExecutionPolicy Bypass -File diagnose-ollama.ps1
```

应该看到：
- ✓ Ollama 本地服务正常运行
- ✓ Cloudflare Tunnel 连接正常
- ✓ cloudflared 正在运行

## 常见问题

### Q: 为什么重启后连接失败？
A: 临时 Cloudflare Tunnel URL 在进程关闭后失效，需要重新创建。

### Q: 如何让 Tunnel 自动启动？
A: 可以创建 Windows 计划任务或使用 `start-ollama-tunnel.ps1` 脚本。

### Q: Tunnel URL 多久失效？
A: 临时 Tunnel 在进程关闭后立即失效。命名 Tunnel 可以持久化。

### Q: 可以同时运行多个 Tunnel 吗？
A: 可以，但每个 Tunnel 会有不同的 URL。

## 下一步

1. ✅ 运行 `start-ollama-tunnel.ps1` 创建新 Tunnel
2. ✅ 更新配置文件
3. ✅ 重新构建并部署
4. ✅ 测试连接
