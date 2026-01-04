# Cloudflare Tunnel 配置

## ✅ 已更新

代码已更新为使用 Cloudflare Tunnel 公共URL：

- **Tunnel URL**: `https://spokesman-authorized-trunk-techno.trycloudflare.com`
- **API 端点**: `/api/chat`
- **完整URL**: `https://spokesman-authorized-trunk-techno.trycloudflare.com/api/chat`

## 🔧 配置详情

### Ollama 连接
- **URL**: `https://spokesman-authorized-trunk-techno.trycloudflare.com/api/chat`
- **模式**: HTTPS (安全连接)
- **CORS**: 通过 Cloudflare Tunnel 处理
- **系统提示**: Z-CORE 模式自动注入（保持不变）

### 健康检查
- **端点**: `https://spokesman-authorized-trunk-techno.trycloudflare.com/api/tags`
- **用途**: 检查 Ollama 服务状态

## 🚀 优势

1. **公共访问**: 部署的网站（.cc 域名）可以直接访问本地 AI
2. **安全连接**: HTTPS 加密传输
3. **无需 CORS 配置**: Cloudflare Tunnel 处理跨域问题
4. **无防火墙问题**: 无需开放端口

## 📝 注意事项

1. **Tunnel 必须运行**: 确保 Cloudflare Tunnel 服务正在运行
2. **本地 Ollama**: 确保本地 Ollama 服务在 `127.0.0.1:11434` 运行
3. **Tunnel 重启**: 如果 Tunnel 重启，URL 可能会改变（如果是临时 Tunnel）

## 🐛 调试

查看浏览器控制台日志：
- 成功: `"Attempting connection to Ollama via Cloudflare Tunnel..."`
- 失败: `"Connection Failed. Check Cloudflare Tunnel status and Ollama service."`

## 📚 相关文件

- `utils/ollamaProxy.ts` - Ollama 连接配置
- Z-CORE 系统提示已自动注入，无需额外配置
