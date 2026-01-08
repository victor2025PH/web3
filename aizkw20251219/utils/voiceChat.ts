/**
 * 语音对话工具函数
 * 包含语音转文字（STT）和文字转语音（TTS）功能
 */

import { voiceConfig } from '../src/voiceConfig';

/**
 * 语音转文字（使用 Web Speech API）
 */
export class SpeechToText {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback?: (text: string) => void;
  private onErrorCallback?: (error: Error) => void;
  private onEndCallback?: () => void;

  constructor() {
    // 检查浏览器是否支持 Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('浏览器不支持语音识别功能，请使用 Chrome、Edge 或 Safari 浏览器');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; // 持续识别
    this.recognition.interimResults = true; // 返回中间结果（实时显示）
    this.recognition.lang = 'zh-CN'; // 默认中文
    this.recognition.maxAlternatives = 1;

    // 累积所有识别结果
    let fullTranscript = '';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // 更新完整文本
      if (finalTranscript) {
        fullTranscript += finalTranscript;
      }

      // 返回当前识别结果（最终结果 + 临时结果）
      const currentText = fullTranscript + interimTranscript;
      console.log('[STT] 识别结果:', currentText);
      this.onResultCallback?.(currentText);
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = '语音识别失败';
      if (event.error === 'no-speech') {
        errorMessage = '未检测到语音，请重试';
      } else if (event.error === 'audio-capture') {
        errorMessage = '无法访问麦克风';
      } else if (event.error === 'not-allowed') {
        errorMessage = '麦克风权限被拒绝';
      }
      this.onErrorCallback?.(new Error(errorMessage));
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEndCallback?.();
    };
  }

  /**
   * 开始语音识别
   */
  start(
    onResult: (text: string) => void,
    onError?: (error: Error) => void,
    onEnd?: () => void
  ): void {
    if (this.isListening) {
      this.stop();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      console.log('[STT] 开始语音识别...');
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('[STT] 启动失败:', error);
      if (error instanceof Error) {
        this.onErrorCallback?.(error);
      }
    }
  }

  /**
   * 停止语音识别
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 检查是否正在监听
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * 设置识别语言
   */
  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}

/**
 * 文字转语音（使用 GPT-SoVITS API）
 * 版本: 2025-01-09-v2 (强制缓存刷新)
 */
export async function textToSpeech(
  text: string,
  referenceAudio: Blob | null,
  referenceText: string
): Promise<Blob> {
  // 强制使用最新配置（避免缓存问题）
  const apiBaseUrl = voiceConfig.apiBaseUrl;
  
  if (!apiBaseUrl) {
    throw new Error('请先配置 GPT-SoVITS API 地址（在 src/voiceConfig.ts 中）');
  }

  // 验证配置是否正确（不允许使用本地地址）
  if (apiBaseUrl.includes('127.0.0.1') || apiBaseUrl.includes('localhost')) {
    console.error('[TTS] ❌ 错误：检测到本地地址！前端部署在远程服务器时无法访问本地地址！');
    console.error('[TTS] 当前配置:', apiBaseUrl);
    console.error('[TTS] 请使用 Cloudflare Tunnel URL 更新 src/voiceConfig.ts');
    throw new Error('配置错误：请使用 Cloudflare Tunnel URL，不能使用本地地址（127.0.0.1 或 localhost）');
  }

  if (!text.trim()) {
    throw new Error('文本内容不能为空');
  }

  const params = new URLSearchParams({
    text: text.trim(),
    text_language: voiceConfig.textLanguage,
    prompt_text: referenceText,
    prompt_language: voiceConfig.promptLanguage,
  });

  // GPT-SoVITS API 端点路径
  // 根据 Swagger UI 文档，正确的端点是 /tts
  // 支持 GET 和 POST 两种方式
  const apiEndpoint = '/tts';
  let apiUrl = `${apiBaseUrl}${apiEndpoint}`;
  
  console.log('[TTS] ========== 语音合成请求 ==========');
  console.log('[TTS] API Base URL:', apiBaseUrl);
  console.log('[TTS] API Endpoint:', apiEndpoint);
  console.log('[TTS] Full API URL:', apiUrl);
  console.log('[TTS] Reference Audio:', referenceAudio ? '已提供' : '未提供');
  console.log('[TTS] Reference Text:', referenceText || '未设置');
  let requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'audio/wav, audio/*, */*',
    },
  };

  console.log('[TTS] API Base URL:', voiceConfig.apiBaseUrl);
  console.log('[TTS] Full API URL:', apiUrl);

  if (referenceAudio) {
    const formData = new FormData();
    formData.append('text', text.trim());
    formData.append('text_language', voiceConfig.textLanguage);
    formData.append('prompt_text', referenceText);
    formData.append('prompt_language', voiceConfig.promptLanguage);
    formData.append('refer_wav', referenceAudio, 'reference.wav');
    requestOptions.body = formData;
  } else {
    params.append('refer_wav_path', voiceConfig.referWavPath);
    apiUrl = `${apiUrl}?${params.toString()}`;
    requestOptions.method = 'GET';
  }

  console.log('[TTS] Request options:', {
    method: requestOptions.method,
    headers: requestOptions.headers,
    hasBody: !!requestOptions.body,
  });

  const response = await fetch(apiUrl, requestOptions);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '无法读取错误信息');
    console.error('[TTS] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
      error: errorText,
    });
    
    // 如果是 404，尝试其他可能的端点
    if (response.status === 404) {
      throw new Error(`TTS API 端点不存在 (404)。请检查 GPT-SoVITS API 端点路径。当前尝试: ${apiUrl}`);
    }
    
    throw new Error(`TTS 请求失败: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const audioBlob = await response.blob();
  return audioBlob;
}

/**
 * 检查浏览器是否支持语音识别
 */
export function isSpeechRecognitionSupported(): boolean {
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}
