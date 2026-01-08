# 语音对话功能使用指南

## 功能概述

语音对话功能允许用户通过语音与AI进行交互，AI会使用克隆的声音进行回复。

### 功能特点

1. **语音输入（STT）**：使用浏览器原生 Web Speech API 将语音转换为文字
2. **语音输出（TTS）**：使用 GPT-SoVITS V2 API 将AI回复转换为语音并播放
3. **实时状态反馈**：显示语音识别、合成、播放状态
4. **无缝切换**：可在文字对话和语音对话模式之间切换

## 使用步骤

### 1. 准备参考音频（声纹）

在启用语音对话之前，需要先提交参考音频：

**方法一：上传音频文件**
- 点击聊天窗口中的"上传音频"按钮
- 选择 WAV 格式的音频文件（建议 5-30 秒，清晰无噪音）
- 文件大小不超过 10MB

**方法二：录制音频**
- 点击聊天窗口中的"录音"按钮
- 允许浏览器访问麦克风权限
- 录制参考音频（建议 5-30 秒）
- 点击"停止"完成录制

**方法三：在语音克隆演示面板中设置**
- 访问语音克隆演示面板
- 按照步骤上传或录制参考音频
- 填写参考文本内容

### 2. 启用语音对话模式

1. 确保已设置参考音频（参考音频状态会显示在聊天窗口）
2. 点击聊天窗口右上角的"文字对话"按钮
3. 按钮变为"语音对话"（紫色高亮），表示已启用

### 3. 开始语音对话

**语音输入：**
1. 点击输入框右侧的麦克风图标
2. 开始说话（浏览器会请求麦克风权限）
3. 说话结束后，语音会自动转换为文字并发送给AI
4. 也可以点击麦克风图标停止语音输入

**AI语音回复：**
- AI收到消息后会自动生成文字回复
- 如果启用了语音对话模式，AI回复会自动转换为语音并播放
- 播放过程中会显示"AI正在说话..."状态提示

### 4. 切换回文字对话

- 点击"语音对话"按钮切换回"文字对话"模式
- 在文字模式下，AI回复不会自动转换为语音

## 技术实现

### 语音转文字（STT）

- **技术**：Web Speech API（浏览器原生）
- **支持浏览器**：Chrome、Edge、Safari
- **语言**：默认中文（zh-CN），可在代码中修改
- **文件位置**：`utils/voiceChat.ts` - `SpeechToText` 类

### 文字转语音（TTS）

- **技术**：GPT-SoVITS V2 API
- **配置**：需要在 `src/voiceConfig.ts` 中配置 API 地址
- **文件位置**：`utils/voiceChat.ts` - `textToSpeech` 函数

## 配置要求

### 1. GPT-SoVITS API 配置

在 `src/voiceConfig.ts` 中配置：

```typescript
export const voiceConfig = {
  apiBaseUrl: 'https://your-tunnel-url.trycloudflare.com', // GPT-SoVITS API 地址
  referWavPath: 'E:\\path\\to\\default.wav', // 默认参考音频路径（可选）
  promptText: '参考文本内容', // 参考文本
  promptLanguage: 'zh', // 参考文本语言
  textLanguage: 'zh', // 合成文本语言
} as const;
```

### 2. 浏览器要求

- **Chrome**：完全支持
- **Edge**：完全支持
- **Safari**：支持（需要 macOS/iOS）
- **Firefox**：不支持 Web Speech API

## 状态指示

聊天窗口会显示以下状态：

- **正在聆听...**：正在接收语音输入（红色脉冲动画）
- **正在合成语音...**：正在将AI回复转换为语音（紫色旋转动画）
- **AI正在说话...**：正在播放AI语音回复（绿色脉冲动画）

## 常见问题

### Q: 为什么无法启用语音对话模式？

A: 请确保已上传或录制参考音频。语音对话功能需要参考音频才能进行语音合成。

### Q: 语音识别不工作？

A: 
1. 检查浏览器是否支持 Web Speech API（Chrome、Edge、Safari）
2. 检查是否允许了麦克风权限
3. 确保网络连接正常（语音识别可能需要网络）

### Q: AI语音回复没有声音？

A:
1. 检查是否已设置参考音频
2. 检查 GPT-SoVITS API 配置是否正确
3. 检查浏览器控制台是否有错误信息
4. 确保浏览器音量未静音

### Q: 如何更改语音识别语言？

A: 在 `utils/voiceChat.ts` 中修改 `SpeechToText` 类的 `lang` 属性：

```typescript
this.recognition.lang = 'zh-CN'; // 改为其他语言代码，如 'en-US'
```

## 文件结构

```
aizkw20251219/
├── utils/
│   └── voiceChat.ts          # 语音对话工具函数（STT + TTS）
├── components/
│   └── AIChatTerminal.tsx    # AI聊天终端（集成语音对话功能）
├── contexts/
│   └── VoiceClonerContext.tsx # 声纹上下文（管理参考音频）
└── src/
    └── voiceConfig.ts         # GPT-SoVITS 配置
```

## 开发说明

### 添加新功能

1. **修改语音识别语言**：编辑 `utils/voiceChat.ts` 中的 `SpeechToText` 类
2. **修改TTS参数**：编辑 `utils/voiceChat.ts` 中的 `textToSpeech` 函数
3. **自定义UI**：编辑 `components/AIChatTerminal.tsx` 中的语音对话相关UI

### 调试

- 打开浏览器开发者工具（F12）
- 查看 Console 标签页的错误信息
- 查看 Network 标签页的 API 请求状态

## 注意事项

1. **隐私**：语音识别数据会发送到浏览器厂商的服务器（Web Speech API）
2. **网络**：语音识别和语音合成都需要网络连接
3. **性能**：语音合成可能需要几秒钟时间，请耐心等待
4. **浏览器兼容性**：Firefox 不支持 Web Speech API，请使用 Chrome 或 Edge
