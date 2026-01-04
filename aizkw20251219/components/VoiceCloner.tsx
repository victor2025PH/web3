import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Square, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { voiceConfig } from '../src/voiceConfig';

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

    // 初始化 AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      // 连接音频元素到分析器
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

export const VoiceCloner: React.FC = () => {
  const [text, setText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  // 清理音频 URL
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
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

    setIsSynthesizing(true);
    setError(null);
    setIsPlaying(false);

    try {
      // 构建 GET 请求参数
      const params = new URLSearchParams({
        text: text.trim(),
        text_language: voiceConfig.textLanguage,
        refer_wav_path: voiceConfig.referWavPath,
        prompt_text: voiceConfig.promptText,
        prompt_language: voiceConfig.promptLanguage,
      });

      const apiUrl = `${voiceConfig.apiBaseUrl}/voice/synthesis?${params.toString()}`;
      
      console.log('发起语音合成请求:', apiUrl);

      // 发起 GET 请求获取音频流
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'audio/wav, audio/*, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取音频 Blob 数据
      const audioBlob = await response.blob();
      
      // 创建本地 URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = URL.createObjectURL(audioBlob);

      // 设置音频源并自动播放
      if (audioRef.current && audioUrlRef.current) {
        audioRef.current.src = audioUrlRef.current;
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

  // 停止播放
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-900/50 border border-cyan-500/30 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Volume2 className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-white">GPT-SoVITS V2 语音克隆</h3>
      </div>

      {/* 输入框 */}
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
              合成
            </>
          )}
        </Button>

        {audioUrlRef.current && (
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
