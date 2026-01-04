/**
 * 音频录制工具函数
 */

export interface AudioRecorderOptions {
  onDataAvailable?: (blob: Blob) => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = options;
  }

  /**
   * 开始录音
   */
  async start(): Promise<void> {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      // 创建 MediaRecorder，使用 WAV 格式（如果支持）
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.options.onDataAvailable?.(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.options.onStop?.(audioBlob);
        this.stopStream();
      };

      this.mediaRecorder.onerror = (event) => {
        this.options.onError?.(new Error('录音过程中发生错误'));
        this.stopStream();
      };

      this.mediaRecorder.start(1000); // 每1秒收集一次数据
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('未检测到麦克风设备');
        } else {
          throw new Error(`录音启动失败: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * 停止录音
   */
  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * 获取录音状态
   */
  getState(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * 停止音频流
   */
  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * 获取支持的 MIME 类型
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ''; // 使用浏览器默认格式
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stop();
    this.stopStream();
  }

  /**
   * 将 Blob 转换为 WAV 格式（如果需要）
   */
  async convertToWav(blob: Blob): Promise<Blob> {
    // 如果已经是 WAV 格式，直接返回
    if (blob.type === 'audio/wav') {
      return blob;
    }

    // 否则尝试转换（这里简化处理，实际可能需要更复杂的转换）
    // 注意：完整的格式转换需要 AudioContext 和解码/编码
    // 对于演示目的，我们可以返回原始 blob，后端可能需要处理格式转换
    return blob;
  }
}
