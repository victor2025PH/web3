# Ollama 连接问题分析与解决方案

## 问题原因

根据诊断结果，连接失败的主要原因：

### 1. **Cloudflare Tunnel URL 失效**
- **原因**：重启电脑后，临时 Tunnel URL (`https://gary-barry-discussed-fare.trycloudflare.com`) 已失效
- **表现**：虽然 `cloudflared` 进程可能还在运行，但旧的 URL 已经无法访问
- **解决**：需要重新创建 Tunnel 获取新 URL

### 2. **临时 Tunnel 的特性**
- Cloudflare 的临时 Tunnel（使用 `--url` 参数）在以下情况会失效：
  - 关闭终端窗口
  - 重启电脑
  - 进程崩溃
  - 网络断开重连

### 3. **配置文件未更新**
- 即使创建了新 Tunnel，如果 `utils/ollamaProxy.ts` 中的 URL 没有更新，前端仍会使用旧 URL

## 解决方案

### ✅ 方案 1：使用自动修复脚本（推荐）

运行自动修复脚本，它会：
1. 检查 Ollama 是否运行
2. 停止旧的 cloudflared 进程
3. 创建新的 Tunnel
4. 自动更新配置文件

```powershell
cd d:\web3-migration\aizkw20251219
powershell -ExecutionPolicy Bypass -File fix-ollama-connection.ps1
```

**重要**：保持脚本窗口打开，关闭窗口会断开 Tunnel。

### ✅ 方案 2：手动修复

1. **停止旧的 cloudflared**：
   ```powershell
   Get-Process cloudflared | Stop-Process -Force
   ```

2. **创建新 Tunnel**：
   ```powershell
   cloudflared tunnel --url http://localhost:11434
   ```

3. **复制新 URL**（例如：`https://abc-xyz-123.trycloudflare.com`）

4. **更新配置文件** `utils/ollamaProxy.ts`：
   ```typescript
   const OLLAMA_URL = 'https://新URL/api/chat';
   ```
   
   同时更新 `checkOllamaAvailable` 函数中的 URL：
   ```typescript
   const response = await fetch('https://新URL/api/tags', {
   ```

5. **重新构建并部署**：
   ```powershell
   npm run build
   git add .
   git commit -m "Update Ollama Tunnel URL"
   git push origin main
   ```

## 验证连接

运行诊断脚本：
```powershell
powershell -ExecutionPolicy Bypass -File diagnose-ollama.ps1
```

应该看到：
- ✅ Ollama 本地服务正常运行
- ✅ Cloudflare Tunnel 连接正常
- ✅ cloudflared 正在运行

## 长期解决方案

### 选项 A：创建 Windows 计划任务（自动启动）

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：系统启动时
4. 操作：启动程序 `fix-ollama-connection.ps1`
5. 设置：以管理员身份运行

### 选项 B：使用命名 Tunnel（需要 Cloudflare 账号）

1. 注册 Cloudflare 账号
2. 创建命名 Tunnel：
   ```powershell
   cloudflared tunnel create ollama-tunnel
   ```
3. 配置路由
4. 设置自动启动

### 选项 C：使用服务器部署

如果 Ollama 部署在服务器上：
- 使用服务器 IP 或域名
- 配置防火墙规则
- 使用 HTTPS（推荐）

## 常见问题

### Q: 为什么每次重启都要重新创建 Tunnel？
A: 临时 Tunnel URL 在进程关闭后失效。这是 Cloudflare 临时 Tunnel 的设计特性。

### Q: Tunnel URL 多久失效？
A: 临时 Tunnel 在进程关闭后立即失效。命名 Tunnel 可以持久化。

### Q: 可以同时运行多个 Tunnel 吗？
A: 可以，但每个 Tunnel 会有不同的 URL。

### Q: 如何检查 Tunnel 是否正常工作？
A: 访问 `https://你的TunnelURL/api/tags`，应该返回 Ollama 模型列表。

### Q: 前端部署后还能访问本地 Ollama 吗？
A: 可以，通过 Cloudflare Tunnel。但需要保持 Tunnel 进程运行。

## 当前状态检查清单

- [ ] Ollama 服务运行在 `localhost:11434`
- [ ] cloudflared 进程正在运行
- [ ] Tunnel URL 可以访问（测试 `/api/tags`）
- [ ] `utils/ollamaProxy.ts` 中的 URL 已更新
- [ ] 前端已重新构建并部署

## 下一步操作

1. ✅ 运行 `fix-ollama-connection.ps1` 创建新 Tunnel
2. ✅ 等待脚本更新配置文件
3. ✅ 重新构建前端：`npm run build`
4. ✅ 提交并推送到 GitHub
5. ✅ 测试网页连接
