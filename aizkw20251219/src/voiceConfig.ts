/**
 * GPT-SoVITS V2 语音克隆配置
 */

export const voiceConfig = {
  // API 根地址 - 请填入 Cloudflare 隧道链接
  apiBaseUrl: '', // 例如: 'https://your-tunnel-url.trycloudflare.com'
  
  // 固定参考音频路径
  referWavPath: 'E:\\GPT-SoVITS-v2pro-20250604-nvidia50\\guodegang.wav',
  
  // 参考文本内容 - 请填入 guodegang.txt 里的内容
  promptText: '请在这里填入参考文本内容',
  
  // 语言设置
  promptLanguage: 'zh',
  textLanguage: 'zh',
} as const;
