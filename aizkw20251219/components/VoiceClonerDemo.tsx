import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Square, Zap, Upload, Mic, FileAudio, Clock, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { voiceConfig } from '../src/voiceConfig';
import { useVoiceCloner } from '../contexts/VoiceClonerContext';
import { AudioRecorder } from '../utils/audioRecorder';

// 音频可视化组件（从 VoiceCloner 移过来，保持一致性）
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
  const { referenceAudio, referenceText, referenceSource, setReferenceText } = useVoiceCloner();
  const [text, setText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [synthesizedAudioUrl, setSynthesizedAudioUrl] = useState<string | null>(null);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const referenceAudioRef = useRef<HTMLAudioElement>(null);

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

    // 检查是否有参考音频
    if (!referenceAudio && referenceSource === 'default') {
      setError('请先上传或录制参考音频');
      return;
    }

    setIsSynthesizing(true);
    setError(null);
    setIsPlaying(false);

    try {
      // 构建请求参数
      // 注意：如果使用动态参考音频，可能需要通过 FormData 上传
      // 这里假设 API 支持通过文件上传或 URL 传递参考音频
      const params = new URLSearchParams({
        text: text.trim(),
        text_language: voiceConfig.textLanguage,
        prompt_text: referenceText,
        prompt_language: voiceConfig.promptLanguage,
      });

      // 如果有参考音频，需要通过 FormData 上传
      let apiUrl = `${voiceConfig.apiBaseUrl}/voice/synthesis`;
      let requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Accept': 'audio/wav, audio/*, */*',
        },
      };

      if (referenceAudio) {
        // 使用 FormData 上传参考音频
        const formData = new FormData();
        formData.append('text', text.trim());
        formData.append('text_language', voiceConfig.textLanguage);
        formData.append('prompt_text', referenceText);
        formData.append('prompt_language', voiceConfig.promptLanguage);
        formData.append('refer_wav', referenceAudio, 'reference.wav');
        requestOptions.body = formData;
      } else {
        // 使用默认参考音频路径（GET 请求）
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

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-zinc-900/50 border border-cyan-500/30 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Volume2 className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-white">GPT-SoVITS V2 语音克隆演示</h3>
      </div>

      {/* 参考音频设置区 */}
      <div className="mb-6 p-4 bg-zinc-950/50 rounded-lg border border-zinc-700/50">
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
            <div className="flex items-center gap-2 p-3 bg-black/50 border border-white/10 rounded-md">
              {referenceAudioUrl ? (
                <>
                  <FileAudio className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-zinc-300 flex-1">
                    {referenceSource === 'default' ? '默认音频' : referenceSource === 'upload' ? '已上传音频' : '已录制音频'}
                  </span>
                  <button
                    onClick={handlePlayReference}
                    className="px-3 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded transition-colors"
                  >
                    {isPlayingReference ? '暂停' : '播放'}
                  </button>
                </>
              ) : (
                <>
                  <FileAudio className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-500">使用默认音频</span>
                </>
              )}
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
      <div className="mb-4">
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
        <div className="text-xs text-zinc-500 mt-1 text-right">{text.length} 字</div>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 控制按钮 */}
      <div className="flex gap-3 mb-4">
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
            className="mb-4"
          >
            <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
