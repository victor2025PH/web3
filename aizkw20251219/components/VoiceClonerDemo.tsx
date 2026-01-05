import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Square, Zap, Upload, Mic, FileAudio, Clock, Download, Settings, Sparkles, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { voiceConfig } from '../src/voiceConfig';
import { useVoiceCloner } from '../contexts/VoiceClonerContext';
import { AudioRecorder } from '../utils/audioRecorder';

// 音频可视化组件
const AudioVisualizer: React.FC<{ isPlaying: boolean; audioRef: React.RefObject<HTMLAudioElement> }> = ({ isPlaying, audioRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    const draw = () => {
      if (!isPlaying) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / dataArray.length * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, audioRef]);

  if (!isPlaying) return null;

  return (
    <div className="w-full h-24 bg-zinc-950/50 rounded-lg border border-cyan-500/20 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={96}
        className="w-full h-full"
      />
    </div>
  );
};

export const VoiceClonerDemo: React.FC = () => {
  const { referenceAudio, referenceText, referenceSource, setReferenceAudio, setReferenceText } = useVoiceCloner();
  const [text, setText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [synthesizedAudioUrl, setSynthesizedAudioUrl] = useState<string | null>(null);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [mode, setMode] = useState<'guide' | 'advanced'>(() => {
    // 从 localStorage 读取用户偏好
    try {
      const saved = localStorage.getItem('voice_cloner_mode');
      return (saved === 'advanced' ? 'advanced' : 'guide') as 'guide' | 'advanced';
    } catch {
      return 'guide';
    }
  });
  
  // 录音相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const referenceAudioRef = useRef<HTMLAudioElement>(null);

  // 保存模式偏好
  useEffect(() => {
    try {
      localStorage.setItem('voice_cloner_mode', mode);
    } catch (error) {
      console.warn('Failed to save mode preference:', error);
    }
  }, [mode]);

  // 更新参考音频 URL
  useEffect(() => {
    if (referenceAudio) {
      const url = URL.createObjectURL(referenceAudio);
      setReferenceAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setReferenceAudioUrl(null);
    }
  }, [referenceAudio]);

  // 清理音频 URL
  useEffect(() => {
    return () => {
      if (referenceAudioUrl) URL.revokeObjectURL(referenceAudioUrl);
      if (synthesizedAudioUrl) URL.revokeObjectURL(synthesizedAudioUrl);
    };
  }, []);

  // 清理录音资源
  useEffect(() => {
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.dispose();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.wav')) {
      setError('请上传 WAV 格式的音频文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const blob = new Blob([file], { type: 'audio/wav' });
      setReferenceAudio(blob, 'upload');
    } catch (error) {
      console.error('文件上传失败:', error);
      setError('文件上传失败，请重试');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 开始录音
  const handleStartRecording = async () => {
    try {
      const recorder = new AudioRecorder({
        onStop: (blob) => {
          setReferenceAudio(blob, 'record');
          setIsRecording(false);
          setRecordingTime(0);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        },
        onError: (error) => {
          setError(error.message);
          setIsRecording(false);
          setRecordingTime(0);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        },
      });

      audioRecorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('录音启动失败');
      }
    }
  };

  // 停止录音
  const handleStopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
  };

  // 合成函数
  const handleSynthesis = async () => {
    if (!text.trim()) {
      setError('请输入要合成的文本');
      return;
    }

    if (!voiceConfig.apiBaseUrl) {
      setError('请先配置 API 地址（在 src/voiceConfig.ts 中）');
      return;
    }

    if (!referenceAudio && referenceSource === 'default') {
      setError('请先上传或录制参考音频');
      return;
    }

    setIsSynthesizing(true);
    setError(null);
    setIsPlaying(false);

    try {
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

      console.log('发起语音合成请求:', apiUrl);

      const response = await fetch(apiUrl, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();

      if (synthesizedAudioUrl) {
        URL.revokeObjectURL(synthesizedAudioUrl);
      }
      const url = URL.createObjectURL(audioBlob);
      setSynthesizedAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onplay = () => setIsPlaying(true);
        audioRef.current.onpause = () => setIsPlaying(false);

        try {
          await audioRef.current.play();
        } catch (playError) {
          console.error('自动播放失败:', playError);
          setError('音频加载成功，但自动播放被浏览器阻止。请手动点击播放按钮。');
        }
      }

    } catch (err) {
      console.error('语音合成失败:', err);
      setError(err instanceof Error ? err.message : '语音合成失败，请检查 API 配置');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 下载合成的音频
  const handleDownload = () => {
    if (synthesizedAudioUrl && audioRef.current) {
      const a = document.createElement('a');
      a.href = synthesizedAudioUrl;
      a.download = `synthesized_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // 停止播放
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // 播放参考音频
  const handlePlayReference = () => {
    if (referenceAudioRef.current) {
      if (isPlayingReference) {
        referenceAudioRef.current.pause();
      } else {
        referenceAudioRef.current.play();
      }
      setIsPlayingReference(!isPlayingReference);
    }
  };

  // 判断步骤完成状态
  const step1Completed = referenceAudio !== null || referenceSource !== 'default';
  const step2Completed = referenceText.trim() !== '' && referenceText !== '请在这里填入参考文本内容';
  const step3Completed = text.trim() !== '';

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-zinc-900/50 border border-cyan-500/30 rounded-xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Volume2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">GPT-SoVITS V2 语音克隆演示</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">5秒克隆任意声音</p>
          </div>
        </div>
        <button
          onClick={() => setMode(mode === 'guide' ? 'advanced' : 'guide')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-zinc-800/80 border border-cyan-500/30 text-cyan-300 rounded-md hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
          title={mode === 'guide' ? '切换到高级模式' : '切换到引导模式'}
        >
          {mode === 'guide' ? (
            <>
              <Settings className="w-4 h-4" />
              高级模式
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              引导模式
            </>
          )}
        </button>
      </div>

      {/* 分步引导式界面（方案A） */}
      {mode === 'guide' && (
        <div className="space-y-6">
          {/* 步骤 1：准备参考音频 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 bg-zinc-950/50 rounded-lg border-2 transition-all ${
              step1Completed
                ? 'border-green-500/50 bg-green-950/10'
                : 'border-zinc-700/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {step1Completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-500" />
              )}
              <h4 className="text-base font-bold text-white font-mono">
                步骤 1/3：准备参考音频
              </h4>
              {step1Completed && (
                <span className="text-xs text-green-400 font-mono">✓ 已完成</span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <label className="relative cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".wav,audio/wav"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading || isRecording}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isRecording}
                  className="w-full px-4 py-3 bg-zinc-800/80 border border-cyan-500/30 text-cyan-300 rounded-md hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono text-sm"
                >
                  {isUploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Upload className="w-4 h-4" />
                      </motion.div>
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      上传音频
                    </>
                  )}
                </button>
              </label>

              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isUploading}
                className={`w-full px-4 py-3 border rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono text-sm ${
                  isRecording
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                    : 'bg-zinc-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4" />
                    停止录音 ({formatTime(recordingTime)})
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    录音
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 p-3 bg-black/50 border border-white/10 rounded-md">
              {referenceAudioUrl ? (
                <>
                  <FileAudio className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-zinc-300 flex-1 font-mono">
                    {referenceSource === 'upload' ? '已上传音频' : referenceSource === 'record' ? '已录制音频' : '默认音频'}
                  </span>
                  <button
                    onClick={handlePlayReference}
                    className="px-3 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded transition-colors font-mono"
                  >
                    {isPlayingReference ? '暂停' : '播放'}
                  </button>
                </>
              ) : (
                <>
                  <FileAudio className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-500 font-mono">请上传或录制参考音频（建议 5-30 秒，清晰无噪音）</span>
                </>
              )}
            </div>
            <audio
              ref={referenceAudioRef}
              src={referenceAudioUrl || undefined}
              onEnded={() => setIsPlayingReference(false)}
              className="hidden"
            />
          </motion.div>

          {/* 步骤 2：填写参考文本 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 bg-zinc-950/50 rounded-lg border-2 transition-all ${
              step2Completed
                ? 'border-green-500/50 bg-green-950/10'
                : 'border-zinc-700/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {step2Completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-500" />
              )}
              <h4 className="text-base font-bold text-white font-mono">
                步骤 2/3：填写参考文本
              </h4>
              {step2Completed && (
                <span className="text-xs text-green-400 font-mono">✓ 已完成</span>
              )}
            </div>

            <textarea
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="请输入参考音频说的文字内容..."
              className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono text-sm resize-none"
              rows={3}
            />
            <p className="text-xs text-zinc-500 mt-2 font-mono">
              提示：输入参考音频说的文字内容，例如参考音频说的是"大家好，我是张三"，则输入相同文字
            </p>
          </motion.div>

          {/* 步骤 3：输入目标文本并合成 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6 bg-zinc-950/50 rounded-lg border-2 transition-all ${
              step3Completed && synthesizedAudioUrl
                ? 'border-green-500/50 bg-green-950/10'
                : 'border-zinc-700/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {step3Completed && synthesizedAudioUrl ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-500" />
              )}
              <h4 className="text-base font-bold text-white font-mono">
                步骤 3/3：输入目标文本并合成
              </h4>
              {step3Completed && synthesizedAudioUrl && (
                <span className="text-xs text-green-400 font-mono">✓ 合成完成</span>
              )}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要合成的文本内容..."
              className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono text-sm resize-none mb-4"
              rows={4}
              disabled={isSynthesizing}
            />
            <div className="text-xs text-zinc-500 mb-4 text-right font-mono">{text.length} 字</div>

            <div className="flex gap-3 mb-4">
              <Button
                variant="primary"
                onClick={handleSynthesis}
                disabled={isSynthesizing || !text.trim() || !step1Completed || !step2Completed}
                className="flex items-center gap-2 flex-1"
              >
                {isSynthesizing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-4 h-4" />
                    </motion.div>
                    正在注入声纹...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    合成语音
                  </>
                )}
              </Button>

              {synthesizedAudioUrl && (
                <>
                  <Button
                    variant="secondary"
                    onClick={isPlaying ? handleStop : () => audioRef.current?.play()}
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-4 h-4" />
                        停止
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        播放
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </Button>
                </>
              )}
            </div>

            {/* 音频可视化 */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 错误提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/20 border border-red-500/50 rounded-md text-red-400 text-sm font-mono"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 一体化界面（方案B - 高级模式） */}
      {mode === 'advanced' && (
        <div className="space-y-6">
          {/* 参考音频设置区 */}
          <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-700/50">
            <h4 className="text-sm font-mono text-cyan-400 mb-4 uppercase">参考音频设置</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* 参考文本 */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-mono">
                  参考文本内容
                </label>
                <textarea
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  placeholder="请输入参考文本..."
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* 参考音频预览 */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2 font-mono">
                  参考音频状态
                </label>
                <div className="flex items-center gap-2 p-3 bg-black/50 border border-white/10 rounded-md mb-2">
                  {referenceAudioUrl ? (
                    <>
                      <FileAudio className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-zinc-300 flex-1 font-mono">
                        {referenceSource === 'default' ? '默认音频' : referenceSource === 'upload' ? '已上传音频' : '已录制音频'}
                      </span>
                      <button
                        onClick={handlePlayReference}
                        className="px-3 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded transition-colors font-mono"
                      >
                        {isPlayingReference ? '暂停' : '播放'}
                      </button>
                    </>
                  ) : (
                    <>
                      <FileAudio className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-500 font-mono">使用默认音频</span>
                    </>
                  )}
                </div>
                
                {/* 上传和录音按钮 */}
                <div className="flex gap-2">
                  <label className="relative flex-1 cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".wav,audio/wav"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading || isRecording}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isRecording}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-800/80 border border-cyan-500/30 text-cyan-300 rounded-md hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isUploading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </motion.div>
                          上传中...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          上传
                        </>
                      )}
                    </button>
                  </label>

                  <button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isUploading}
                    className={`flex-1 px-3 py-1.5 text-xs font-mono border rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                      isRecording
                        ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                        : 'bg-zinc-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        停止 ({formatTime(recordingTime)})
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        录音
                      </>
                    )}
                  </button>
                </div>
                <audio
                  ref={referenceAudioRef}
                  src={referenceAudioUrl || undefined}
                  onEnded={() => setIsPlayingReference(false)}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* 文本输入与合成区 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2 font-mono">
              输入要合成的文本
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要合成的文本内容..."
              className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono text-sm resize-none"
              rows={4}
              disabled={isSynthesizing}
            />
            <div className="text-xs text-zinc-500 mt-1 text-right font-mono">{text.length} 字</div>
          </div>

          {/* 错误提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-400 text-sm font-mono"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 控制按钮 */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleSynthesis}
              disabled={isSynthesizing || !text.trim()}
              className="flex items-center gap-2"
            >
              {isSynthesizing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-4 h-4" />
                  </motion.div>
                  正在注入声纹...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  合成语音
                </>
              )}
            </Button>

            {synthesizedAudioUrl && (
              <>
                <Button
                  variant="secondary"
                  onClick={isPlaying ? handleStop : () => audioRef.current?.play()}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-4 h-4" />
                      停止
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      播放
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载
                </Button>
              </>
            )}
          </div>

          {/* 音频可视化 */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
