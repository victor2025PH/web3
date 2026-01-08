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
    this.recognition.continuous = false; // 单次识别
    this.recognition.interimResults = false; // 不返回中间结果
    this.recognition.lang = 'zh-CN'; // 默认中文

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.onResultCallback?.(transcript);
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
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
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
 */
export async function textToSpeech(
  text: string,
  referenceAudio: Blob | null,
  referenceText: string
): Promise<Blob> {
  if (!voiceConfig.apiBaseUrl) {
    throw new Error('请先配置 GPT-SoVITS API 地址（在 src/voiceConfig.ts 中）');
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

  let apiUrl = `${voiceConfig.apiBaseUrl}/voice/synthesis`;
  let requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'audio/wav, audio/*, */*',
    },
  };

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

  const response = await fetch(apiUrl, requestOptions);

  if (!response.ok) {
    throw new Error(`TTS 请求失败: ${response.status}`);
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
