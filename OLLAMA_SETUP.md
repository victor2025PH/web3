# 本地 Ollama AI 对接指南

## 📋 概述

网站已支持本地 Ollama AI 模型进行无审核对话。当您切换到"本地AI"模式时，网站会尝试连接您本地运行的 Ollama 服务。

## 🔧 前置要求

### 1. 安装 Ollama

访问 [Ollama 官网](https://ollama.ai) 下载并安装 Ollama：

- **Windows**: 下载 `.exe` 安装包并运行安装程序
- **macOS**: 使用 Homebrew 或下载 `.dmg` 安装包
- **Linux**: 运行安装脚本

### 2. 下载模型

安装完 Ollama 后，需要下载使用的模型：

```bash
ollama pull huihui_ai/qwen2.5-abliterate
```

**注意**: 这个模型约 4.7GB，下载可能需要一些时间。

### 3. 启动 Ollama 服务

Ollama 安装后通常会自动在后台运行。如果没有运行：

- **Windows**: Ollama 应该会自动启动，如果没有，在开始菜单找到 Ollama 并启动
- **macOS/Linux**: 在终端运行 `ollama serve`

## 🚀 使用方法

### 步骤 1: 确保 Ollama 正在运行

**快速检查方法：**
打开浏览器，访问：http://localhost:11434/api/tags

如果能看到 JSON 响应（显示已安装的模型列表），说明 Ollama 服务正常运行。

### 步骤 2: 在网站上切换到本地AI模式

1. 打开任意网站（aizkw、hbwy、tgmini）
2. 点击机器人图标打开 AI 对话
3. 在对话框头部找到模式切换按钮
4. 点击切换到"本地AI"模式（按钮会显示红色，标识为"本地AI"）

### 步骤 3: 开始对话

切换到本地AI模式后，您就可以开始无审核对话了。

## ⚠️ 常见问题

### 问题 1: 连接失败，显示"本地 Ollama 连接失败"

**可能原因：**
- Ollama 服务未运行
- 模型未下载
- 端口被占用

**解决方法：**
1. 检查 Ollama 是否运行：
   ```bash
   # Windows (PowerShell)
   Get-Process ollama -ErrorAction SilentlyContinue
   
   # macOS/Linux
   ps aux | grep ollama
   ```

2. 如果未运行，启动 Ollama：
   ```bash
   ollama serve
   ```

3. 确保模型已下载：
   ```bash
   ollama list
   # 如果看不到 huihui_ai/qwen2.5-abliterate，运行：
   ollama pull huihui_ai/qwen2.5-abliterate
   ```

4. 测试连接：
   访问 http://localhost:11434/api/tags

### 问题 2: 模型下载失败

**解决方法：**
- 检查网络连接
- 如果下载缓慢，可以尝试使用代理
- 确保有足够的磁盘空间（模型约 4.7GB）

### 问题 3: 端口 11434 被占用

**解决方法：**
1. 查找占用端口的进程：
   ```bash
   # Windows
   netstat -ano | findstr :11434
   
   # macOS/Linux
   lsof -i :11434
   ```

2. 如果端口被其他程序占用，可以：
   - 停止占用端口的程序
   - 或配置 Ollama 使用其他端口（需要修改代码中的配置）

### 问题 4: 浏览器 CORS 错误

**解决方法：**
如果遇到 CORS 错误，可能需要配置 Ollama 允许跨域请求。但通常情况下，Ollama 默认允许本地访问，不会出现 CORS 问题。

## 🔒 安全说明

- 本地 Ollama 模式仅在您的本地机器上运行
- 数据不会上传到任何远程服务器
- 完全无审核、无内容限制
- 请负责任地使用此功能

## 📝 技术说明

- **默认地址**: `http://localhost:11434`
- **默认模型**: `huihui_ai/qwen2.5-abliterate`
- **API 端点**: `/api/chat`

如需使用自定义配置，可以在项目根目录创建 `.env` 文件：

```env
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=huihui_ai/qwen2.5-abliterate
```

## 💡 提示

- 首次使用建议先测试连接，确保 Ollama 正常运行
- 如果本地AI连接失败，可以随时切换回"远程AI"模式使用云端服务
- 本地AI模式适合需要隐私保护或无审核需求的场景

## 🆘 需要帮助？

如果遇到问题：
1. 检查浏览器控制台的错误信息
2. 确认 Ollama 服务状态
3. 尝试切换到远程AI模式
4. 查看错误提示中的详细说明
