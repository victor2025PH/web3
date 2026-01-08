import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Edit2, RotateCcw, Play, Square, Volume2 } from 'lucide-react';

interface ReferenceTextConfirmDialogProps {
  isOpen: boolean;
  audioBlob: Blob | null;
  recognizedText: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
  onRetry: () => void;
}

export const ReferenceTextConfirmDialog: React.FC<ReferenceTextConfirmDialogProps> = ({
  isOpen,
  audioBlob,
  recognizedText,
  onConfirm,
  onCancel,
  onRetry,
}) => {
  const [editedText, setEditedText] = useState(recognizedText);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  // 更新编辑文本当识别结果变化时
  useEffect(() => {
    setEditedText(recognizedText);
  }, [recognizedText]);

  // 创建音频 URL
  useEffect(() => {
    if (audioBlob && isOpen) {
      audioUrlRef.current = URL.createObjectURL(audioBlob);
      return () => {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
      };
    }
  }, [audioBlob, isOpen]);

  const handlePlay = () => {
    if (!audioRef.current || !audioUrlRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleConfirm = () => {
    if (editedText.trim()) {
      onConfirm(editedText.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* 对话框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-zinc-950/95 border border-cyan-500/40 rounded-xl shadow-[0_0_80px_-20px_rgba(0,255,255,0.3)] backdrop-blur-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-zinc-900/80 via-zinc-900/60 to-zinc-900/80">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    确认参考文本
                  </h3>
                </div>
                <button
                  onClick={onCancel}
                  className="p-1 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* 音频播放器 */}
                {audioBlob && (
                  <div className="flex items-center gap-2 p-3 bg-zinc-900/50 border border-zinc-700/50 rounded-lg">
                    <button
                      onClick={handlePlay}
                      className={`p-2 rounded-md transition-all ${
                        isPlaying
                          ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
                          : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                      }`}
                    >
                      {isPlaying ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-xs text-zinc-400 font-mono flex-1">
                      {isPlaying ? '正在播放...' : '点击播放音频'}
                    </span>
                    <audio
                      ref={audioRef}
                      src={audioUrlRef.current || undefined}
                      onEnded={handleAudioEnded}
                      onPause={() => setIsPlaying(false)}
                    />
                  </div>
                )}

                {/* 识别结果提示 */}
                <div className="text-xs text-zinc-500 font-mono">
                  📝 识别结果（可编辑）：
                </div>

                {/* 文本编辑区域 */}
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  placeholder="请输入参考文本内容..."
                  className="w-full h-32 px-3 py-2 bg-black/50 border border-zinc-700/50 rounded-md text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono text-sm resize-none"
                  autoFocus
                />

                {/* 提示信息 */}
                <div className="text-xs text-zinc-500 font-mono space-y-1">
                  <div>💡 提示：</div>
                  <div>• 请确认文本与录音内容一致</div>
                  <div>• 可以手动编辑文本内容</div>
                  <div>• 文本将用于声音克隆</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-cyan-500/20 bg-zinc-900/50">
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 rounded-md hover:bg-zinc-700/50 hover:text-zinc-300 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重新识别
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-mono bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 rounded-md hover:bg-zinc-700/50 hover:text-zinc-300 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!editedText.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-md hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    确认使用
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
