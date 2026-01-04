# GPT-SoVITS V2 语音克隆模块集成说明

## 配置文件

配置文件位置：`src/voiceConfig.ts`

### 需要配置的项：

1. **API 根地址** (`apiBaseUrl`)
   - 请填入您的 Cloudflare 隧道链接
   - 例如：`https://your-tunnel-url.trycloudflare.com`

2. **参考文本内容** (`promptText`)
   - 请填入 `guodegang.txt` 文件中的参考文本内容
   - 这是用于声音克隆的参考文本

3. **参考音频路径** (`referWavPath`)
   - 当前设置为：`E:\\GPT-SoVITS-v2pro-20250604-nvidia50\\guodegang.wav`
   - 如果路径不同，请修改此配置

## API 接口说明

### 请求方式
- **方法**: GET
- **端点**: `/voice/synthesis`

### 请求参数
- `text`: 要合成的文本内容（用户在网页输入框输入）
- `text_language`: 文本语言（默认：'zh'）
- `refer_wav_path`: 参考音频路径（固定路径）
- `prompt_text`: 参考文本内容（固定文本）
- `prompt_language`: 参考文本语言（默认：'zh'）

### 响应
- **格式**: 音频流（WAV 格式）
- **处理**: 自动转换为 Blob 并使用 HTML5 Audio 播放

## 使用说明

1. 打开 `src/voiceConfig.ts` 文件
2. 填入 Cloudflare 隧道链接到 `apiBaseUrl`
3. 填入参考文本内容到 `promptText`
4. 确认参考音频路径是否正确
5. 保存文件并重新构建项目

## 功能特性

- ✅ GET 请求语音合成
- ✅ 音频流自动处理和播放
- ✅ 合成状态提示（"正在注入声纹..."）
- ✅ 音频波动可视化动画
- ✅ 错误处理和用户提示

## 组件位置

VoiceCloner 组件已创建在 `components/VoiceCloner.tsx`，可以集成到任何需要的地方。
