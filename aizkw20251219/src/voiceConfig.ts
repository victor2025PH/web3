/**
 * GPT-SoVITS V2 语音克隆配置
 * 版本: 2025-01-09-v2 (强制缓存刷新)
 * 
 * 配置说明：
 * 1. apiBaseUrl: GPT-SoVITS API 服务器地址
 *    - 如果使用 Cloudflare Tunnel，格式：'https://your-tunnel-url.trycloudflare.com'
 *    - 如果使用本地服务器，格式：'http://localhost:9880' 或 'http://127.0.0.1:9880'
 *    - 如果使用远程服务器，格式：'https://your-domain.com'
 * 
 * 2. referWavPath: 默认参考音频文件路径（仅当使用 GET 请求时）
 *    - 这是服务器上的文件路径，不是本地路径
 *    - 如果上传音频文件，此路径不会被使用
 * 
 * 3. promptText: 参考文本内容
 *    - 这是参考音频说的文字内容
 *    - 必须与参考音频内容一致
 * 
 * 4. promptLanguage / textLanguage: 语言设置
 *    - 'zh': 中文
 *    - 'en': 英文
 *    - 'ja': 日文
 */

export const voiceConfig = {
  // API 根地址 - 请填入您的 GPT-SoVITS API 地址
  // 示例：
  // - Cloudflare Tunnel: 'https://your-tunnel-url.trycloudflare.com'
  // - 本地服务器: 'http://localhost:9880'
  // - 远程服务器: 'https://your-domain.com'
  apiBaseUrl: 'https://genetic-gel-fuji-united.trycloudflare.com', // GPT-SoVITS API 地址（Cloudflare Tunnel）
  
  // 固定参考音频路径（服务器上的路径，仅当使用 GET 请求时）
  // 如果通过网页上传音频，此路径不会被使用
  referWavPath: 'E:\\GPT-SoVITS-v2pro-20250604-nvidia50\\guodegang.wav',
  
  // 参考文本内容 - 请填入参考音频说的文字内容
  // 例如：如果参考音频说的是"大家好，我是张三"，则填入"大家好，我是张三"
  promptText: '请在这里填入参考文本内容',
  
  // 语言设置
  promptLanguage: 'zh', // 参考文本语言：'zh'=中文, 'en'=英文, 'ja'=日文
  textLanguage: 'zh',   // 合成文本语言：'zh'=中文, 'en'=英文, 'ja'=日文
} as const;
