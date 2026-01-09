/**
 * 流式語音合成管理器
 * 實現逐句合成和播放，不等待整段話生成完成
 */

import { textToSpeech } from './voiceChat';

// 句子結束標記
const SENTENCE_ENDINGS = /[。！？.!?\n]/;
const MIN_SENTENCE_LENGTH = 5; // 最小句子長度，避免太短的片段

interface AudioQueueItem {
  text: string;
  audioBlob?: Blob;
  status: 'pending' | 'synthesizing' | 'ready' | 'playing' | 'done' | 'error';
}

export class StreamingTTSManager {
  private referenceAudio: Blob | null = null;
  private referenceText: string = '';
  private audioQueue: AudioQueueItem[] = [];
  private currentBuffer: string = '';
  private isPlaying: boolean = false;
  private audioPlayer: HTMLAudioElement | null = null;
  private onStatusChange?: (status: string) => void;
  private onError?: (error: Error) => void;
  private isStopped: boolean = false;
  private uploadedAudioPath: string | null = null;

  constructor(
    referenceAudio: Blob | null,
    referenceText: string,
    onStatusChange?: (status: string) => void,
    onError?: (error: Error) => void
  ) {
    this.referenceAudio = referenceAudio;
    this.referenceText = referenceText;
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    this.audioPlayer = new Audio();
    
    // 設置音頻播放結束事件
    this.audioPlayer.onended = () => {
      this.playNextInQueue();
    };
    
    this.audioPlayer.onerror = (e) => {
      console.error('[StreamingTTS] 音頻播放錯誤:', e);
      this.playNextInQueue();
    };
  }

  /**
   * 預上傳參考音頻（只需要上傳一次）
   */
  async preUploadAudio(): Promise<void> {
    if (!this.referenceAudio || this.uploadedAudioPath) return;

    try {
      const { voiceConfig } = await import('../src/voiceConfig');
      const apiBaseUrl = voiceConfig.apiBaseUrl;
      
      console.log('[StreamingTTS] 預上傳參考音頻...');
      const uploadFormData = new FormData();
      uploadFormData.append('audio', this.referenceAudio, 'reference.wav');
      
      const uploadResponse = await fetch(`${apiBaseUrl}/upload_audio`, {
        method: 'POST',
        body: uploadFormData,
      });
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        this.uploadedAudioPath = result.filepath;
        console.log('[StreamingTTS] 參考音頻已上傳:', this.uploadedAudioPath);
      }
    } catch (error) {
      console.error('[StreamingTTS] 預上傳失敗:', error);
    }
  }

  /**
   * 接收流式文本
   * @param chunk 新的文本片段
   */
  async appendText(chunk: string): Promise<void> {
    if (this.isStopped) return;
    
    this.currentBuffer += chunk;
    
    // 檢查是否有完整的句子
    const sentences = this.extractCompleteSentences();
    
    for (const sentence of sentences) {
      if (sentence.trim().length >= MIN_SENTENCE_LENGTH) {
        this.addToQueue(sentence.trim());
      }
    }
  }

  /**
   * 從緩衝區提取完整的句子
   */
  private extractCompleteSentences(): string[] {
    const sentences: string[] = [];
    let lastIndex = 0;
    
    for (let i = 0; i < this.currentBuffer.length; i++) {
      if (SENTENCE_ENDINGS.test(this.currentBuffer[i])) {
        const sentence = this.currentBuffer.substring(lastIndex, i + 1);
        if (sentence.trim().length > 0) {
          sentences.push(sentence);
        }
        lastIndex = i + 1;
      }
    }
    
    // 保留未完成的部分
    this.currentBuffer = this.currentBuffer.substring(lastIndex);
    
    return sentences;
  }

  /**
   * 添加句子到隊列並開始合成
   */
  private async addToQueue(text: string): Promise<void> {
    const item: AudioQueueItem = {
      text,
      status: 'pending',
    };
    
    this.audioQueue.push(item);
    console.log(`[StreamingTTS] 添加到隊列: "${text.substring(0, 20)}..." (隊列長度: ${this.audioQueue.length})`);
    
    // 開始合成
    this.synthesizeNext();
  }

  /**
   * 合成隊列中的下一個待處理項
   */
  private async synthesizeNext(): Promise<void> {
    // 找到第一個待處理的項
    const pendingItem = this.audioQueue.find(item => item.status === 'pending');
    if (!pendingItem || this.isStopped) return;
    
    pendingItem.status = 'synthesizing';
    this.onStatusChange?.('正在合成語音...');
    
    try {
      console.log(`[StreamingTTS] 開始合成: "${pendingItem.text.substring(0, 20)}..."`);
      
      // 使用已上傳的音頻路徑進行快速合成
      const audioBlob = await this.synthesizeSentence(pendingItem.text);
      
      if (this.isStopped) return;
      
      pendingItem.audioBlob = audioBlob;
      pendingItem.status = 'ready';
      
      console.log(`[StreamingTTS] 合成完成: "${pendingItem.text.substring(0, 20)}..."`);
      
      // 如果沒有正在播放，開始播放
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
      
      // 繼續合成下一個
      this.synthesizeNext();
    } catch (error) {
      console.error('[StreamingTTS] 合成失敗:', error);
      pendingItem.status = 'error';
      this.onError?.(error instanceof Error ? error : new Error('合成失敗'));
      
      // 跳過失敗的項，繼續下一個
      this.synthesizeNext();
    }
  }

  /**
   * 合成單個句子
   */
  private async synthesizeSentence(text: string): Promise<Blob> {
    const { voiceConfig } = await import('../src/voiceConfig');
    const apiBaseUrl = voiceConfig.apiBaseUrl;
    
    // 如果有預上傳的路徑，直接使用
    if (this.uploadedAudioPath) {
      const requestBody = {
        text: text,
        text_lang: voiceConfig.textLanguage,
        ref_audio_path: this.uploadedAudioPath,
        prompt_lang: voiceConfig.promptLanguage,
        prompt_text: this.referenceText,
        text_split_method: 'cut5',
        media_type: 'wav',
        streaming_mode: false,
        temperature: 0.8,
        top_p: 0.9,
        top_k: 15,
        speed_factor: 1.0,
        repetition_penalty: 1.2,
      };
      
      const response = await fetch(`${apiBaseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/wav, audio/*, */*',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`TTS 請求失敗: ${response.status}`);
      }
      
      return await response.blob();
    } else {
      // 降級到完整流程
      return await textToSpeech(text, this.referenceAudio, this.referenceText);
    }
  }

  /**
   * 播放隊列中的下一個就緒項
   */
  private playNextInQueue(): void {
    if (this.isStopped) {
      this.isPlaying = false;
      return;
    }
    
    // 找到第一個就緒的項
    const readyItem = this.audioQueue.find(item => item.status === 'ready');
    
    if (!readyItem || !readyItem.audioBlob) {
      this.isPlaying = false;
      this.onStatusChange?.('');
      return;
    }
    
    readyItem.status = 'playing';
    this.isPlaying = true;
    this.onStatusChange?.('AI 正在說話...');
    
    const audioUrl = URL.createObjectURL(readyItem.audioBlob);
    
    if (this.audioPlayer) {
      this.audioPlayer.src = audioUrl;
      this.audioPlayer.play().then(() => {
        console.log(`[StreamingTTS] 播放中: "${readyItem.text.substring(0, 20)}..."`);
      }).catch(err => {
        console.error('[StreamingTTS] 播放失敗:', err);
        readyItem.status = 'done';
        URL.revokeObjectURL(audioUrl);
        this.playNextInQueue();
      });
      
      this.audioPlayer.onended = () => {
        readyItem.status = 'done';
        URL.revokeObjectURL(audioUrl);
        this.playNextInQueue();
      };
    }
  }

  /**
   * 流結束時調用，處理剩餘的緩衝區
   */
  async flush(): Promise<void> {
    if (this.isStopped) return;
    
    // 處理緩衝區中剩餘的文本
    if (this.currentBuffer.trim().length >= MIN_SENTENCE_LENGTH) {
      this.addToQueue(this.currentBuffer.trim());
      this.currentBuffer = '';
    }
  }

  /**
   * 停止所有播放和合成
   */
  stop(): void {
    this.isStopped = true;
    
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.src = '';
    }
    
    this.audioQueue = [];
    this.currentBuffer = '';
    this.isPlaying = false;
    this.onStatusChange?.('');
  }

  /**
   * 獲取當前狀態
   */
  getStatus(): {
    queueLength: number;
    isPlaying: boolean;
    pendingCount: number;
    synthesizingCount: number;
  } {
    return {
      queueLength: this.audioQueue.length,
      isPlaying: this.isPlaying,
      pendingCount: this.audioQueue.filter(i => i.status === 'pending').length,
      synthesizingCount: this.audioQueue.filter(i => i.status === 'synthesizing').length,
    };
  }
}
