# 直接连接设置指南

## ✅ 已完成的更改

代码已重写为**直接连接模式**，不再使用代理：

- **硬编码URL**: `http://127.0.0.1:11434/api/chat`
- **CORS模式**: 所有fetch请求使用 `mode: 'cors'`
- **调试日志**: 添加了连接尝试和错误日志
- **简化代码**: 移除了代理相关配置

## 🔧 前置要求

### 1. 设置 Ollama CORS 环境变量

为了让浏览器能够直接连接本地 Ollama，需要设置环境变量：

**Windows (PowerShell)**:
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

**Windows (CMD)**:
```cmd
set OLLAMA_ORIGINS=*
ollama serve
```

**macOS/Linux**:
```bash
export OLLAMA_ORIGINS="*"
ollama serve
```

**永久设置（Windows）**:
1. 打开系统环境变量设置
2. 添加新的环境变量：
   - 名称: `OLLAMA_ORIGINS`
   - 值: `*`

### 2. 启动 Ollama

确保 Ollama 服务正在运行：

```bash
# 检查Ollama是否运行
curl http://127.0.0.1:11434/api/tags

# 如果未运行，启动Ollama（确保先设置OLLAMA_ORIGINS）
ollama serve
```

### 3. 下载模型

```bash
ollama pull huihui_ai/qwen2.5-abliterate
```

## 🚀 使用方法

1. **设置环境变量**（如果还没设置）:
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ```

2. **启动 Ollama**:
   ```bash
   ollama serve
   ```

3. **启动前端开发服务器**:
   ```bash
   cd aizkw20251219
   npm run dev
   ```

4. **访问网站并测试**:
   - 打开浏览器访问开发服务器
   - 点击机器人图标
   - 切换到"本地AI"模式
   - 发送消息
   - 查看浏览器控制台日志

## 🐛 调试

### 查看连接日志

打开浏览器控制台（F12），你会看到：

**成功连接时**:
```
Attempting direct connection to Ollama at 127.0.0.1:11434...
Payload: {...}
Ollama Response received, length: XXX
```

**连接失败时**:
```
Connection Failed. Make sure OLLAMA_ORIGINS=* is set in your environment variables.
Ollama request error: ...
```

### 常见问题

**问题1: CORS错误**
- **原因**: `OLLAMA_ORIGINS` 环境变量未设置
- **解决**: 设置 `OLLAMA_ORIGINS=*` 并重启 Ollama

**问题2: 连接被拒绝**
- **原因**: Ollama 服务未运行
- **解决**: 运行 `ollama serve`

**问题3: 模型不存在**
- **原因**: 模型未下载
- **解决**: 运行 `ollama pull huihui_ai/qwen2.5-abliterate`

## 📝 技术细节

- **连接方式**: 直接连接，不使用代理
- **URL**: `http://127.0.0.1:11434/api/chat`（硬编码）
- **CORS**: 使用 `mode: 'cors'`，需要 Ollama 设置 `OLLAMA_ORIGINS=*`
- **模型**: `huihui_ai/qwen2.5-abliterate`（硬编码）
- **系统提示**: Z-CORE 模式自动注入

## ⚠️ 重要提示

1. **必须设置 OLLAMA_ORIGINS**: 否则浏览器会阻止跨域请求
2. **直接连接**: 代码直接连接到 `127.0.0.1:11434`，不经过任何代理
3. **本地环境**: 这种方式只适用于本地开发，生产环境需要其他方案
