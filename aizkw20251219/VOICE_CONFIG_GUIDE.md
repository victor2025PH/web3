# 语音对话功能配置指南

## 📍 文件位置说明

`src/voiceConfig.ts` 是**本地源代码文件**，位于项目根目录下的 `src` 文件夹中。

- **开发环境**：直接修改此文件
- **生产环境**：修改后需要重新构建（`npm run build`）

## 🚀 快速配置步骤

### 步骤 1：配置 GPT-SoVITS API 地址

打开 `src/voiceConfig.ts` 文件，找到 `apiBaseUrl` 配置项：

```typescript
export const voiceConfig = {
  apiBaseUrl: '', // ⚠️ 请在此处填入您的 GPT-SoVITS API 地址
  // ... 其他配置
}
```

**根据您的部署方式选择：**

#### 方式 A：使用 Cloudflare Tunnel（推荐用于测试）

1. 在服务器上启动 GPT-SoVITS 服务（默认端口 9880）
2. 使用 Cloudflare Tunnel 暴露服务：
   ```bash
   cloudflared tunnel --url http://localhost:9880
   ```
3. 复制生成的 URL，例如：`https://abc-xyz-123.trycloudflare.com`
4. 在 `voiceConfig.ts` 中填入：
   ```typescript
   apiBaseUrl: 'https://abc-xyz-123.trycloudflare.com',
   ```

#### 方式 B：使用本地服务器（仅开发环境）

如果 GPT-SoVITS 运行在本地：

```typescript
apiBaseUrl: 'http://localhost:9880',
```

#### 方式 C：使用远程服务器

如果 GPT-SoVITS 部署在远程服务器：

```typescript
apiBaseUrl: 'https://your-domain.com',
// 或
apiBaseUrl: 'http://your-ip:9880',
```

### 步骤 2：配置参考文本（可选）

如果使用默认参考音频，需要填写参考文本：

```typescript
promptText: '这是参考音频说的文字内容',
```

例如，如果参考音频说的是"大家好，我是张三"，则填入：
```typescript
promptText: '大家好，我是张三',
```

### 步骤 3：重启开发服务器

修改配置后，需要重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm run dev
```

## 🎯 使用语音对话功能

### 1. 上传参考音频（声纹）

在聊天窗口中：
- 点击 **"上传音频"** 按钮，选择 WAV 文件
- 或点击 **"录音"** 按钮，录制参考音频（5-30秒）

### 2. 启用语音对话模式

1. 确保已上传参考音频
2. 确保已配置 `apiBaseUrl`
3. 点击聊天窗口右上角的 **"文字对话"** 按钮
4. 按钮变为 **"语音对话"**（紫色高亮），表示已启用

### 3. 开始语音对话

1. 点击输入框右侧的 **麦克风图标**
2. 开始说话（浏览器会请求麦克风权限）
3. 说话结束后，语音自动转换为文字并发送给AI
4. AI回复会自动转换为语音并播放

## 🔍 验证配置

### 检查 API 是否可访问

在浏览器控制台（F12）中运行：

```javascript
fetch('https://your-api-url.com/voice/synthesis?text=测试&text_language=zh&prompt_text=测试&prompt_language=zh&refer_wav_path=path/to/audio.wav')
  .then(r => console.log('API 状态:', r.status))
  .catch(e => console.error('API 错误:', e));
```

### 检查配置是否正确

在浏览器控制台中运行：

```javascript
import { voiceConfig } from './src/voiceConfig';
console.log('API 地址:', voiceConfig.apiBaseUrl);
console.log('参考文本:', voiceConfig.promptText);
```

## ❓ 常见问题

### Q: 语音对话按钮是灰色的，无法点击？

**A:** 可能的原因：
1. **未上传参考音频**：请先点击"上传音频"或"录音"按钮
2. **未配置 API 地址**：请在 `src/voiceConfig.ts` 中设置 `apiBaseUrl`

### Q: 点击语音对话按钮提示"请先配置 GPT-SoVITS API 地址"？

**A:** 
1. 打开 `src/voiceConfig.ts` 文件
2. 找到 `apiBaseUrl` 配置项
3. 填入您的 GPT-SoVITS API 地址
4. 重启开发服务器

### Q: 语音合成失败，提示"TTS 请求失败"？

**A:** 检查：
1. `apiBaseUrl` 是否正确
2. GPT-SoVITS 服务是否正在运行
3. 网络连接是否正常
4. 浏览器控制台的错误信息

### Q: 如何找到 GPT-SoVITS API 地址？

**A:** 
- **本地运行**：通常是 `http://localhost:9880`
- **使用 Cloudflare Tunnel**：运行 `cloudflared tunnel --url http://localhost:9880` 后显示的 URL
- **远程服务器**：询问服务器管理员或查看服务器配置

### Q: 修改配置后没有生效？

**A:** 
1. 确保已保存文件
2. 重启开发服务器（`npm run dev`）
3. 清除浏览器缓存（Ctrl+Shift+R）

## 📝 配置示例

### 示例 1：使用 Cloudflare Tunnel

```typescript
export const voiceConfig = {
  apiBaseUrl: 'https://gary-barry-discussed-fare.trycloudflare.com',
  referWavPath: 'E:\\GPT-SoVITS-v2pro-20250604-nvidia50\\guodegang.wav',
  promptText: '大家好，我是张三，今天给大家介绍一下我们的产品。',
  promptLanguage: 'zh',
  textLanguage: 'zh',
} as const;
```

### 示例 2：使用本地服务器

```typescript
export const voiceConfig = {
  apiBaseUrl: 'http://localhost:9880',
  referWavPath: 'E:\\GPT-SoVITS-v2pro-20250604-nvidia50\\guodegang.wav',
  promptText: '大家好，我是张三，今天给大家介绍一下我们的产品。',
  promptLanguage: 'zh',
  textLanguage: 'zh',
} as const;
```

### 示例 3：使用远程服务器

```typescript
export const voiceConfig = {
  apiBaseUrl: 'https://voice-api.example.com',
  referWavPath: '/path/to/default.wav',
  promptText: 'Hello, this is a test audio.',
  promptLanguage: 'en',
  textLanguage: 'en',
} as const;
```

## 🛠️ 下一步

配置完成后：
1. ✅ 上传或录制参考音频
2. ✅ 启用语音对话模式
3. ✅ 开始语音对话测试

如有问题，请查看浏览器控制台的错误信息，或参考 `VOICE_CHAT_SETUP.md` 文档。
