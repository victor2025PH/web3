# 语音对话功能故障排除指南

## 问题：仍然使用旧配置（127.0.0.1:9880）

### 症状
- 浏览器控制台显示：`http://127.0.0.1:9880/voice/synthesis`
- 错误：`Failed to fetch` 或 `CORS policy`
- 错误：`404 Not Found`

### 原因
浏览器缓存了旧版本的 JavaScript 代码，即使 GitHub Actions 已部署新版本。

### 解决方案

#### 方法 1：强制刷新（推荐）

**Chrome/Edge：**
1. 按 `Ctrl + Shift + R`（Windows）或 `Cmd + Shift + R`（Mac）
2. 或按 `F12` 打开开发者工具
3. 右键点击刷新按钮
4. 选择"清空缓存并硬性重新加载"

**Firefox：**
1. 按 `Ctrl + Shift + Delete`
2. 选择"缓存"
3. 点击"立即清除"
4. 刷新页面

**Safari：**
1. 按 `Cmd + Option + E` 清除缓存
2. 按 `Cmd + Shift + R` 强制刷新

#### 方法 2：清除浏览器缓存

1. 打开浏览器设置
2. 清除浏览数据
3. 选择"缓存的图片和文件"
4. 清除后刷新页面

#### 方法 3：使用无痕模式

1. 打开无痕/隐私模式窗口
2. 访问网站测试
3. 如果无痕模式正常，说明是缓存问题

## 问题：API 端点 404 错误

### 症状
- 错误：`404 Not Found`
- URL：`https://tunnel-url.trycloudflare.com/tts`

### 原因
GPT-SoVITS API 端点路径可能不是 `/tts`

### 解决方案

#### 步骤 1：检查 GPT-SoVITS API 文档

访问：`https://represents-supplier-river-competitions.trycloudflare.com/docs`

查看实际的 API 端点路径。

#### 步骤 2：测试常见端点

在浏览器控制台运行：

```javascript
// 测试 /tts
fetch('https://represents-supplier-river-competitions.trycloudflare.com/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: '测试' })
}).then(r => console.log('tts:', r.status));

// 测试 /api/tts
fetch('https://represents-supplier-river-competitions.trycloudflare.com/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: '测试' })
}).then(r => console.log('api/tts:', r.status));

// 测试 /voice
fetch('https://represents-supplier-river-competitions.trycloudflare.com/voice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: '测试' })
}).then(r => console.log('voice:', r.status));
```

#### 步骤 3：更新端点路径

如果找到正确的端点，更新 `utils/voiceChat.ts`：

```typescript
let apiUrl = `${voiceConfig.apiBaseUrl}/正确的端点路径`;
```

## 问题：CORS 错误

### 症状
- 错误：`Access to fetch ... has been blocked by CORS policy`

### 原因
GPT-SoVITS API 没有设置 CORS 头

### 解决方案

#### 方案 1：使用 CORS 代理（推荐）

创建一个代理服务器（类似 Ollama 的 CORS 代理）：

1. 创建 `gpt-sovits-cors-proxy.cjs`
2. 添加 CORS 头
3. 通过 Cloudflare Tunnel 暴露代理

#### 方案 2：配置 GPT-SoVITS 添加 CORS

如果 GPT-SoVITS 支持配置 CORS，添加：

```python
# 在 GPT-SoVITS API 代码中添加
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 问题：Chrome 警告"危险网站"

### 症状
- Chrome 显示："危险网站"警告
- 无法访问 Cloudflare Tunnel URL

### 原因
临时 Cloudflare Tunnel URL 可能被标记为危险（正常现象）

### 解决方案

1. 点击"隐藏详细信息"
2. 点击"返回安全连接"
3. 在地址栏输入 Tunnel URL 直接访问
4. 或使用其他浏览器（Edge、Firefox）测试

## 验证配置

### 检查当前配置

在浏览器控制台运行：

```javascript
// 检查 voiceConfig
import { voiceConfig } from './src/voiceConfig';
console.log('API Base URL:', voiceConfig.apiBaseUrl);
```

### 检查网络请求

1. 打开开发者工具（F12）
2. 切换到"Network"标签
3. 尝试语音合成
4. 查看实际请求的 URL

### 检查构建版本

查看页面源代码，检查 JavaScript 文件名：
- 旧版本：`index-XXX.js`
- 新版本：`index-YYY.js`（文件名会变化）

## 快速诊断步骤

1. ✅ **清除浏览器缓存**（Ctrl+Shift+R）
2. ✅ **检查控制台日志**（查看实际使用的 API URL）
3. ✅ **检查 Network 标签**（查看实际请求）
4. ✅ **验证 GPT-SoVITS 服务运行**
5. ✅ **验证 Cloudflare Tunnel 运行**
6. ✅ **测试 API 端点**（访问 `/docs` 查看文档）

## 常见端点路径

根据 GPT-SoVITS 版本，可能的端点：

- `/tts` - GPT-SoVITS V2（标准）
- `/api/tts` - 某些版本
- `/voice` - 某些版本
- `/voice/synthesis` - 旧版本
- `/api/voice/synthesis` - 某些版本

## 获取帮助

如果问题仍然存在：

1. 检查浏览器控制台的完整错误信息
2. 检查 Network 标签中的请求详情
3. 检查 GPT-SoVITS 服务日志
4. 检查 Cloudflare Tunnel 日志
