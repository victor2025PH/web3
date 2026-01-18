import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Cpu, Activity, ChevronRight, Sparkles, Command, Terminal, Server, Zap, Maximize2, Minimize2, Upload, Mic, Square, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { useAIChat, Message } from '../contexts/AIChatContext';
import { trackEvent } from '../utils/chatAnalytics';
import { useVoiceCloner } from '../contexts/VoiceClonerContext';
import { AudioRecorder } from '../utils/audioRecorder';
import { SpeechToText, textToSpeech, isSpeechRecognitionSupported } from '../utils/voiceChat';
import { StreamingTTSManager } from '../utils/streamingTTS';
import { voiceConfig } from '../src/voiceConfig';
import { ReferenceTextConfirmDialog } from './ReferenceTextConfirmDialog';

// --- Helper: Inline Text Parser ---
const parseInline = (text: string) => {
  const elements: (string | React.ReactNode)[] = [];
  // Regex to match **bold**, *italic*, `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    
    const raw = match[0];
    const key = `inline-${lastIndex}`;

    if (raw.startsWith('**')) {
      elements.push(<strong key={key} className="text-cyan-200 font-bold">{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('`')) {
      elements.push(<code key={key} className="bg-zinc-800/80 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-zinc-700/50">{raw.slice(1, -1)}</code>);
    } else if (raw.startsWith('*')) {
      elements.push(<em key={key} className="text-purple-300 not-italic">{raw.slice(1, -1)}</em>);
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : text;
};

// --- Markdown Renderer Component ---
const MarkdownRenderer: React.FC<{ content: string }> = React.memo(({ content }) => {
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm break-words overflow-wrap-anywhere">
      {parts.map((part, index) => {
        // Handle Code Blocks
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract content and optional language
          const lines = part.slice(3, -3).split('\n');
          let codeContent = lines.join('\n');
          let lang = 'Code';
          
          if (lines.length > 0 && /^[a-z]+$/.test(lines[0].trim())) {
             lang = lines[0].trim();
             codeContent = lines.slice(1).join('\n');
          } else if (codeContent.startsWith('\n')) {
             codeContent = codeContent.slice(1);
          }

          return (
            <div key={index} className="my-3 rounded-md bg-zinc-950 border border-zinc-800/80 overflow-hidden shadow-lg group/code">
               <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">{lang}</span>
                  <div className="flex gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-red-500/20 group-hover/code:bg-red-500/50 transition-colors" />
                     <div className="w-2 h-2 rounded-full bg-yellow-500/20 group-hover/code:bg-yellow-500/50 transition-colors" />
                     <div className="w-2 h-2 rounded-full bg-green-500/20 group-hover/code:bg-green-500/50 transition-colors" />
                  </div>
               </div>
               <div className="p-3 overflow-x-auto custom-scrollbar bg-black/50">
                  <pre className="font-mono text-xs text-cyan-300/90 whitespace-pre-wrap break-all leading-relaxed">
                    {codeContent.trim()}
                  </pre>
               </div>
            </div>
          );
        }

        // Handle Text Formatting (Headers, Lists, Paragraphs)
        return (
          <div key={index} className="space-y-1">
            {part.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-1" />;
                
                // Headers
                if (line.startsWith('### ')) return <h3 key={i} className="text-cyan-400 font-bold text-sm mt-3 mb-1 tracking-wide">{parseInline(line.slice(4))}</h3>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-white font-bold text-base mt-4 mb-2 border-b border-white/10 pb-1">{parseInline(line.slice(3))}</h2>;

                // Lists
                if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-2 ml-1 relative pl-2">
                             <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-cyan-500/80 shrink-0" />
                             <span className="text-zinc-300 leading-relaxed">{parseInline(trimmed.slice(2))}</span>
                        </div>
                    );
                }
                
                // Ordered Lists
                 const orderedMatch = trimmed.match(/^(\d+)\.\s/);
                 if (orderedMatch) {
                   return (
                      <div key={i} className="flex gap-2 ml-1">
                          <span className="text-cyan-500/80 font-mono text-xs mt-0.5 select-none">{orderedMatch[1]}.</span>
                          <span className="text-zinc-300 leading-relaxed">{parseInline(trimmed.slice(orderedMatch[0].length))}</span>
                      </div>
                  );
                 }

                // Standard paragraph
                return <div key={i} className="text-zinc-300 leading-relaxed">{parseInline(line)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
});

// --- Memoized Message Item ---
const ChatMessageItem = React.memo(({ msg }: { msg: Message }) => {
  const messageVariants = {
    userInitial: { opacity: 0, scale: 1.1, x: 20 },
    aiInitial: { opacity: 0, scale: 0.9, x: -20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      x: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      variants={messageVariants}
      initial={msg.role === 'user' ? 'userInitial' : 'aiInitial'}
      animate="visible"
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
        <div className={`max-w-[85%] rounded-lg p-3 relative group shadow-sm break-words ${
          msg.role === 'user' 
            ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-100 rounded-tr-none' 
            : 'bg-zinc-900/90 border border-zinc-700 text-zinc-300 rounded-tl-none'
        }`}>
          {msg.role === 'ai' && (
            <div className="absolute -top-3 -left-3 p-1 bg-zinc-950 border border-zinc-700 rounded-full z-10">
                <Bot className="w-3 h-3 text-cyan-500" />
            </div>
          )}
          
          <div className="leading-relaxed break-words overflow-wrap-anywhere">
            <MarkdownRenderer content={msg.content} />
          </div>

          <div className={`text-[9px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'text-cyan-500/50 text-right' : 'text-zinc-600'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
    </motion.div>
  );
});

export const AIChatTerminal: React.FC = () => {
  const { isOpen, closeChat, messages, sendMessage, isTyping, triggerRect, clearChat, suggestions, aiMode, setAiMode, stopGenerating, streamChunkCallbackRef } = useAIChat();
  const { setReferenceAudio, setReferenceText, referenceAudio, referenceText } = useVoiceCloner();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true); // 默认显示，点击输入框后隐藏
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 录音识别相关状态
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const recognitionRef = useRef<SpeechToText | null>(null);
  
  // 语音对话相关状态
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const speechToTextRef = useRef<SpeechToText | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const streamingTTSRef = useRef<StreamingTTSManager | null>(null);
  
  // 流式語音合成狀態
  const [ttsStatus, setTtsStatus] = useState<string>('');
  
  // 設置流式語音合成回調
  useEffect(() => {
    if (!isVoiceChatMode || !referenceAudio) {
      // 語音模式關閉，清理回調
      streamChunkCallbackRef.current = null;
      if (streamingTTSRef.current) {
        streamingTTSRef.current.stop();
        streamingTTSRef.current = null;
      }
      return;
    }
    
    // 設置流式回調
    streamChunkCallbackRef.current = async (chunk: string, isComplete: boolean) => {
      if (!streamingTTSRef.current) {
        // 創建新的 TTS 管理器
        streamingTTSRef.current = new StreamingTTSManager(
          referenceAudio,
          referenceText || '這是一段參考文本。',
          (status) => setTtsStatus(status),
          (error) => console.error('[StreamingTTS] Error:', error)
        );
        // 預上傳音頻
        await streamingTTSRef.current.preUploadAudio();
        console.log('[StreamingTTS] 管理器已創建並預上傳音頻');
      }
      
      if (isComplete) {
        // 流結束，處理剩餘文本
        await streamingTTSRef.current.flush();
        console.log('[StreamingTTS] 流結束，已 flush');
      } else if (chunk) {
        // 添加新的文本片段
        await streamingTTSRef.current.appendText(chunk);
      }
    };
    
    return () => {
      streamChunkCallbackRef.current = null;
    };
  }, [isVoiceChatMode, referenceAudio, referenceText, streamChunkCallbackRef]);
  
  // 當 AI 回覆完成時重置 TTS 管理器
  useEffect(() => {
    if (!isTyping && streamingTTSRef.current) {
      // AI 回覆完成，等待音頻播放完畢後重置
      const checkAndReset = () => {
        if (streamingTTSRef.current) {
          const status = streamingTTSRef.current.getStatus();
          if (!status.isPlaying && status.pendingCount === 0 && status.synthesizingCount === 0) {
            streamingTTSRef.current = null;
            setTtsStatus('');
          } else {
            setTimeout(checkAndReset, 1000);
          }
        }
      };
      setTimeout(checkAndReset, 2000);
    }
  }, [isTyping]);
  
  // 当有新的suggestions时显示
  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Dynamic Styles State
  const [chatStyle, setChatStyle] = useState<React.CSSProperties>({});
  const [beakStyle, setBeakStyle] = useState<React.CSSProperties>({});
  const [isFixed, setIsFixed] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false); // 用 ref 追蹤調整狀態，避免觸發重新渲染
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    // If input is empty, show all suggestions
    if (!input.trim()) return suggestions;

    // Filter by case-insensitive match
    const lowerInput = input.trim().toLowerCase();
    return suggestions.filter(s => s.toLowerCase().includes(lowerInput));
  }, [input, suggestions]);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [filteredSuggestions]);
  
  // 当有新的suggestions时显示
  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions]);

  // --- Advanced Positioning Logic ---
  useLayoutEffect(() => {
    // 調整大小時不要重新計算佈局（使用 ref 避免依賴問題）
    if (!isOpen || isResizingRef.current) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const mobileBreakpoint = 768;
    const isMobile = viewportW < mobileBreakpoint;
    setIsMobileLayout(isMobile);

    if (isMobile) {
        // Mobile Layout: Bottom Sheet
        setChatStyle({
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '80vh',
            maxHeight: '80vh',
            zIndex: 9999,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderTop: '1px solid rgba(6,182,212,0.4)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.8)'
        });
        setBeakStyle({ display: 'none' });
        setIsFixed(true); 
        return;
    }

    if (!triggerRect) {
      // Desktop: Default Center - 仍然啟用固定模式以支持拖動和調整大小
      setIsFixed(true);
      
      // 使用保存的位置和大小，或默認居中
      const savedSize = customSize || { width: 400, height: 500 };
      const savedPos = customPosition || { 
        x: (viewportW - savedSize.width) / 2, 
        y: (viewportH - savedSize.height) / 2 
      };
      
      setChatStyle({
        position: 'fixed',
        top: savedPos.y,
        left: savedPos.x,
        width: savedSize.width,
        height: savedSize.height,
      });
      setBeakStyle({ display: 'none' });
      return;
    }

    // Desktop: Trigger-based positioning
    setIsFixed(true);
    const GAP = 16;
    const PADDING = 10;
    const IDEAL_W = 400;
    const IDEAL_H = 500;
    const MIN_H = 300;
    const MIN_W = 300;

    const spaceBottom = viewportH - (triggerRect.top + triggerRect.height) - GAP - PADDING;
    const spaceTop = triggerRect.top - GAP - PADDING;
    const spaceRight = viewportW - (triggerRect.left + triggerRect.width) - GAP - PADDING;
    const spaceLeft = triggerRect.left - GAP - PADDING;

    let placement = 'bottom';
    const isWideScreen = viewportW > 800;

    if (spaceBottom >= MIN_H) placement = 'bottom';
    else if (spaceTop >= MIN_H) placement = 'top';
    else if (isWideScreen && spaceRight >= MIN_W) placement = 'right';
    else if (isWideScreen && spaceLeft >= MIN_W) placement = 'left';
    else placement = spaceBottom > spaceTop ? 'bottom' : 'top';

    // Use custom position if available
    let top = customPosition?.y ?? 0;
    let left = customPosition?.x ?? 0;
    let width = customSize?.width || IDEAL_W;
    let height = customSize?.height || IDEAL_H;
    
    // If no custom position, use trigger-based positioning
    if (!customPosition) {
      top = 0;
      left = 0;
    }
    let beakS: React.CSSProperties = {};
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;

    const clampHorizontal = () => {
        left = triggerCenterX - (width / 2);
        if (left < PADDING) left = PADDING;
        if (left + width > viewportW - PADDING) left = viewportW - PADDING - width;
    }

    if (placement === 'bottom') {
      height = Math.min(IDEAL_H, Math.max(MIN_H, spaceBottom));
      top = triggerRect.top + triggerRect.height + GAP;
      width = Math.min(IDEAL_W, viewportW - PADDING * 2);
      clampHorizontal();
      const beakX = triggerCenterX - left;
      beakS = { top: -24, left: Math.max(12, Math.min(width - 12, beakX)) - 12, transform: 'rotate(0deg)' };

    } else if (placement === 'top') {
      height = Math.min(IDEAL_H, Math.max(MIN_H, spaceTop));
      top = triggerRect.top - GAP - height;
      width = Math.min(IDEAL_W, viewportW - PADDING * 2);
      clampHorizontal();
      const beakX = triggerCenterX - left;
      beakS = { bottom: -24, left: Math.max(12, Math.min(width - 12, beakX)) - 12, transform: 'rotate(180deg)' };

    } else if (placement === 'right') {
      width = Math.min(IDEAL_W, Math.max(MIN_W, spaceRight));
      left = triggerRect.left + triggerRect.width + GAP;
      height = Math.min(IDEAL_H, viewportH - PADDING * 2);
      top = triggerCenterY - (height / 2);
      if (top < PADDING) top = PADDING;
      if (top + height > viewportH - PADDING) top = viewportH - PADDING - height;
      const beakY = triggerCenterY - top;
      beakS = { left: -24, top: Math.max(12, Math.min(height - 12, beakY)) - 12, transform: 'rotate(-90deg)' };

    } else if (placement === 'left') {
      width = Math.min(IDEAL_W, Math.max(MIN_W, spaceLeft));
      left = triggerRect.left - GAP - width;
      height = Math.min(IDEAL_H, viewportH - PADDING * 2);
      top = triggerCenterY - (height / 2);
      if (top < PADDING) top = PADDING;
      if (top + height > viewportH - PADDING) top = viewportH - PADDING - height;
      const beakY = triggerCenterY - top;
      beakS = { right: -24, top: Math.max(12, Math.min(height - 12, beakY)) - 12, transform: 'rotate(90deg)' };
    }

    setChatStyle({
      position: 'fixed',
      top: customPosition ? customPosition.y : top,
      left: customPosition ? customPosition.x : left,
      width,
      height,
      maxHeight: 'none',
      zIndex: 9999
    });
    setBeakStyle(customPosition ? { display: 'none' } : beakS);

  }, [isOpen, triggerRect, customSize, customPosition]);

  // Load saved window size and position from localStorage
  useEffect(() => {
    if (!isOpen || isMobileLayout) return;
    try {
      const savedSize = localStorage.getItem('ai_chat_window_size');
      if (savedSize) {
        const { width, height } = JSON.parse(savedSize);
        setCustomSize({ width, height });
      }
      const savedPos = localStorage.getItem('ai_chat_window_position');
      if (savedPos) {
        const { x, y } = JSON.parse(savedPos);
        setCustomPosition({ x, y });
      }
    } catch (error) {
      console.warn('Failed to load window settings:', error);
    }
  }, [isOpen, isMobileLayout]);

  // Handle resize mouse events
  useEffect(() => {
    if (!isResizing || isMobileLayout) return;
    
    console.log('[Resize] 調整大小模式啟動');

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) {
        console.log('[Resize] 容器不存在');
        return;
      }

      const rect = container.getBoundingClientRect();
      const newWidth = Math.max(320, Math.min(1200, e.clientX - rect.left));
      const newHeight = Math.max(350, Math.min(window.innerHeight - 40, e.clientY - rect.top));

      console.log('[Resize] 新尺寸:', newWidth, 'x', newHeight);
      
      const newSize = { width: newWidth, height: newHeight };
      setCustomSize(newSize);
      
      // 直接更新容器樣式
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;
      
      // 同時更新 state
      setChatStyle(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight,
      }));
    };

    const handleMouseUp = () => {
      console.log('[Resize] 調整結束');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const finalSize = { width: Math.round(rect.width), height: Math.round(rect.height) };
        
        // 先保存到 localStorage
        localStorage.setItem('ai_chat_window_size', JSON.stringify(finalSize));
        console.log('[Resize] 保存尺寸:', finalSize);
        
        // 更新 state
        setCustomSize(finalSize);
        
        // 延遲清除 resizing 狀態，確保 customSize 已更新
        setTimeout(() => {
          isResizingRef.current = false;
          setIsResizing(false);
        }, 50);
      } else {
        isResizingRef.current = false;
        setIsResizing(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isMobileLayout]);

  // Save size when it changes
  useEffect(() => {
    if (customSize && !isResizing && !isMobileLayout) {
      localStorage.setItem('ai_chat_window_size', JSON.stringify(customSize));
    }
  }, [customSize, isResizing, isMobileLayout]);

  // Handle drag mouse events
  useEffect(() => {
    if (!isDragging || isMobileLayout) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isFixed) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      const constrainedX = Math.max(0, Math.min(maxX, newX));
      const constrainedY = Math.max(0, Math.min(maxY, newY));
      
      const newPos = { x: constrainedX, y: constrainedY };
      setCustomPosition(newPos);
      
      setChatStyle(prev => ({
        ...prev,
        left: constrainedX,
        top: constrainedY,
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (customPosition) {
        localStorage.setItem('ai_chat_window_position', JSON.stringify(customPosition));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isFixed, isMobileLayout, dragOffset]);

  // Save position when it changes
  useEffect(() => {
    if (customPosition && !isDragging && !isMobileLayout) {
      localStorage.setItem('ai_chat_window_position', JSON.stringify(customPosition));
    }
  }, [customPosition, isDragging, isMobileLayout]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth' 
        });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    if (input === '/clear') {
        clearChat();
        setInput('');
        setShowSuggestions(false);
        return;
    }

    sendMessage(input);
    setInput('');
    setShowSuggestions(false);
  };

  const handleCommandClick = (cmd: string) => {
    // 追蹤建議點擊
    trackEvent('suggestion_click', { suggestion: cmd, isCommand: cmd.startsWith('/') });
    
    if (cmd.startsWith('/')) {
        setInput(cmd);
        inputRef.current?.focus();
    } else {
        sendMessage(cmd);
        setInput('');
        setShowSuggestions(false);
    }
  };

  // 格式化时间（秒转换为 MM:SS）
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.toLowerCase().endsWith('.wav')) {
      alert('请上传 WAV 格式的音频文件');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // 将文件转换为 Blob 并设置到 VoiceCloner Context
      const blob = new Blob([file], { type: 'audio/wav' });
      setReferenceAudio(blob, 'upload');
      
      // 可选：读取文件名作为提示
      console.log('音频文件已上传:', file.name);
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
    } finally {
      setIsUploading(false);
      // 清空文件输入，以便可以再次选择同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 开始录音（同时进行语音识别）
  const handleStartRecording = async () => {
    try {
      // 初始化语音识别
      if (!recognitionRef.current && isSpeechRecognitionSupported()) {
        try {
          recognitionRef.current = new SpeechToText();
        } catch (error) {
          console.warn('语音识别初始化失败，将使用手动输入模式:', error);
        }
      }

      const recorder = new AudioRecorder({
        onStop: async (blob) => {
          setIsRecording(false);
          setRecordingTime(0);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }

          // 保存音频
          setPendingAudioBlob(blob);

          // 显示确认对话框（识别结果已在录音过程中收集）
          setShowConfirmDialog(true);
          setIsRecognizing(false);
        },
        onError: (error) => {
          alert(error.message);
          setIsRecording(false);
          setRecordingTime(0);
          setIsRecognizing(false);
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

      // 开始语音识别（实时识别）
      if (recognitionRef.current) {
        let recognizedContent = '';
        setIsRecognizing(true);
        recognitionRef.current.start(
          (text) => {
            recognizedContent = text;
            setRecognizedText(recognizedContent);
          },
          (error) => {
            console.warn('识别过程中出错:', error);
            setIsRecognizing(false);
          },
          () => {
            // 识别结束
            setIsRecognizing(false);
            if (recognizedContent) {
              setRecognizedText(recognizedContent);
            }
          }
        );
      }

      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('录音启动失败');
      }
    }
  };

  // 停止录音
  const handleStopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    // 停止语音识别
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // 确认参考文本
  const handleConfirmReferenceText = (text: string) => {
    if (pendingAudioBlob) {
      setReferenceAudio(pendingAudioBlob, 'record');
      setReferenceText(text);
      setShowConfirmDialog(false);
      setPendingAudioBlob(null);
      setRecognizedText('');
    }
  };

  // 取消确认对话框
  const handleCancelConfirmDialog = () => {
    setShowConfirmDialog(false);
    setPendingAudioBlob(null);
    setRecognizedText('');
  };

  // 重新识别
  const handleRetryRecognition = () => {
    if (pendingAudioBlob && recognitionRef.current) {
      setIsRecognizing(true);
      try {
        recognitionRef.current.start(
          (text) => {
            setRecognizedText(text);
            setIsRecognizing(false);
          },
          (error) => {
            console.error('重新识别失败:', error);
            setIsRecognizing(false);
            alert('识别失败，请手动输入文本');
          },
          () => {
            setIsRecognizing(false);
          }
        );
      } catch (error) {
        setIsRecognizing(false);
        alert('识别失败，请手动输入文本');
      }
    } else {
      // 如果没有识别支持，提示用户手动输入
      setRecognizedText('');
    }
  };

  // 初始化语音识别
  useEffect(() => {
    if (isVoiceChatMode && isSpeechRecognitionSupported()) {
      try {
        speechToTextRef.current = new SpeechToText();
      } catch (error) {
        console.error('语音识别初始化失败:', error);
        setIsVoiceChatMode(false);
      }
    }
    return () => {
      if (speechToTextRef.current) {
        speechToTextRef.current.stop();
      }
    };
  }, [isVoiceChatMode]);

  // 开始语音输入
  const handleStartVoiceInput = () => {
    if (!speechToTextRef.current) {
      if (!isSpeechRecognitionSupported()) {
        alert('您的浏览器不支持语音识别功能，请使用 Chrome、Edge 或 Safari 浏览器');
        return;
      }
      try {
        speechToTextRef.current = new SpeechToText();
      } catch (error) {
        console.error('语音识别初始化失败:', error);
        alert('语音识别初始化失败');
        return;
      }
    }

    setIsListening(true);
    speechToTextRef.current.start(
      (text) => {
        // 识别成功，发送消息
        setIsListening(false);
        if (text.trim()) {
          sendMessage(text.trim());
          // 如果开启了语音回复模式，等待AI回复后自动转换为语音
        }
      },
      (error) => {
        // 识别失败
        setIsListening(false);
        console.error('语音识别失败:', error);
        alert(error.message);
      },
      () => {
        // 识别结束
        setIsListening(false);
      }
    );
  };

  // 停止语音输入
  const handleStopVoiceInput = () => {
    if (speechToTextRef.current) {
      speechToTextRef.current.stop();
      setIsListening(false);
    }
  };

  // 将AI回复转换为语音并播放
  const handleSpeakAIResponse = async (text: string) => {
    if (!isVoiceChatMode || !text.trim()) return;

    // 检查是否有参考音频
    if (!referenceAudio) {
      console.warn('未设置参考音频，无法进行语音合成');
      return;
    }

    setIsSynthesizing(true);
    setIsSpeaking(true);

    try {
      // 调用TTS API
      const audioBlob = await textToSpeech(text, referenceAudio, referenceText);
      
      // 创建音频URL并播放
      const audioUrl = URL.createObjectURL(audioBlob);
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioPlayerRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('音频播放失败');
      };

      await audioPlayerRef.current.play();
    } catch (error) {
      console.error('语音合成失败:', error);
      setIsSpeaking(false);
      if (error instanceof Error) {
        alert(`语音合成失败: ${error.message}`);
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 跟踪已处理的AI消息ID，避免重复转换
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  // 注意：已改用流式語音合成（StreamingTTSManager）
  // 不再等待完整回覆，而是逐句合成播放
  // 舊的整段合成邏輯已移除

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter') {
        if (activeSuggestionIndex >= 0) {
            e.preventDefault();
            handleCommandClick(filteredSuggestions[activeSuggestionIndex]);
        }
    } else if (e.key === 'Escape') {
        setShowSuggestions(false);
    }
  };

  const containerVariants = useMemo(() => {
     if (isMobileLayout) {
        return {
            hidden: { y: "100%", opacity: 0 },
            visible: { 
                y: 0, 
                opacity: 1, 
                transition: { type: "spring" as const, damping: 25, stiffness: 300 } 
            },
            exit: { y: "100%", opacity: 0, transition: { duration: 0.3 } }
        };
     }
     return {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: { type: "spring" as const, duration: 0.4, bounce: 0.2 }
        },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
     };
  }, [isMobileLayout]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
        <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" onClick={closeChat} />

        <div className={!isFixed ? "fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none" : ""} >
          <motion.div
            ref={containerRef}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={isFixed ? chatStyle : { pointerEvents: 'auto', width: '100%', maxWidth: '400px', height: '500px' }}
            className={`flex flex-col bg-zinc-950 border border-cyan-500/40 rounded-xl shadow-[0_0_80px_-20px_rgba(0,255,255,0.3)] backdrop-blur-xl overflow-visible relative z-[9999] ${!isFixed ? 'pointer-events-auto' : ''}`}
          >
            {isFixed && !isMobileLayout && (
                <svg 
                    className="absolute w-6 h-6 text-cyan-500/40 fill-zinc-950 z-50 pointer-events-none drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]"
                    style={beakStyle}
                    viewBox="0 0 24 24"
                >
                    <path d="M12 0L24 24H0L12 0Z" fill="currentColor" stroke="rgb(6,182,212)" strokeWidth="1" />
                    <path d="M12 2L22 22H2L12 2Z" fill="#09090b" stroke="none" /> 
                </svg>
            )}

            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10 opacity-20 rounded-xl overflow-hidden"></div>

            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/20 bg-gradient-to-r from-zinc-900/80 via-zinc-900/60 to-zinc-900/80 rounded-t-xl shrink-0 cursor-move select-none"
              onMouseDown={(e) => {
                if (isMobileLayout) return;
                e.preventDefault();
                const container = containerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                setDragOffset({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                });
                setIsDragging(true);
              }}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {/* Left: Logo & Title - Single Line */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="relative w-7 h-7 flex items-center justify-center flex-shrink-0">
                  <div className="absolute inset-0 border border-cyan-500/50 rounded-full animate-[spin_4s_linear_infinite]" />
                  <img 
                    src="/logo.png" 
                    alt="Logo"
                    className="w-5 h-5 object-contain relative z-10"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <Bot className="absolute w-3.5 h-3.5 text-cyan-500 z-0" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase whitespace-nowrap">
                    AI 智控王
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">//</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">CORE</span>
                  </div>
                </div>
              </div>

              {/* Center: Mode Buttons */}
              <div className="flex items-center gap-1.5 flex-1 justify-center">
                {/* AI Mode Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAiMode(aiMode === 'remote' ? 'ollama' : 'remote');
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all duration-200 ${
                    aiMode === 'ollama'
                      ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  }`}
                  title={aiMode === 'ollama' ? '切换到远程API模式' : '切换到本地Ollama模式（无审核）'}
                >
                  {aiMode === 'ollama' ? (
                    <>
                      <Server className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wide">本地AI</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wide">远程AI</span>
                    </>
                  )}
                </button>
                
                {/* 语音对话模式切换 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!referenceAudio) {
                      alert('请先上传或录制参考音频以启用语音对话功能\n\n步骤：\n1. 点击"上传音频"或"录音"按钮\n2. 上传/录制参考音频（5-30秒）\n3. 然后即可启用语音对话模式');
                      return;
                    }
                    if (!voiceConfig.apiBaseUrl) {
                      alert('请先配置 GPT-SoVITS API 地址\n\n在 src/voiceConfig.ts 中设置 apiBaseUrl');
                      return;
                    }
                    setIsVoiceChatMode(!isVoiceChatMode);
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all duration-200 ${
                    isVoiceChatMode
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      : referenceAudio && voiceConfig.apiBaseUrl
                      ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300 hover:border-zinc-600/50'
                      : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    !referenceAudio 
                      ? '请先上传或录制参考音频' 
                      : !voiceConfig.apiBaseUrl
                      ? '请先配置 GPT-SoVITS API 地址'
                      : isVoiceChatMode 
                      ? '关闭语音对话模式' 
                      : '开启语音对话模式'
                  }
                >
                  {isVoiceChatMode ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wide">语音对话</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wide">文字对话</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right: Close Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={closeChat}
                  className="p-1.5 hover:bg-red-500/20 rounded-md text-zinc-400 hover:text-red-400 transition-all duration-200 hover:border border-red-500/30"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm custom-scrollbar bg-black/40 scroll-smooth"
              style={{ minHeight: 0 }}
            >
              <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} msg={msg} />
              ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex justify-start w-full"
                >
                   <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900/50 border-l-2 border-cyan-500 rounded-r-md">
                      <div className="flex items-end gap-0.5 h-3">
                        {[...Array(5)].map((_, i) => (
                           <motion.div 
                             key={i}
                             className="w-1 bg-cyan-500"
                             animate={{ 
                               height: ["20%", "100%", "20%"],
                               opacity: [0.3, 1, 0.3]
                             }}
                             transition={{
                               duration: 0.8,
                               repeat: Infinity,
                               delay: i * 0.1,
                               ease: "linear"
                             }}
                           />
                        ))}
                      </div>
                      <span className="text-xs font-mono text-cyan-400 tracking-wider">
                        PROCESSING_REQUEST<span className="animate-pulse">_</span>
                      </span>
                      {/* 停止生成按鈕 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          stopGenerating();
                        }}
                        className="ml-2 px-2 py-1 text-[10px] font-mono font-bold uppercase bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 hover:text-red-300 transition-all flex items-center gap-1"
                        title="停止生成"
                      >
                        <StopCircle className="w-3 h-3" />
                        停止
                      </button>
                   </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-zinc-900/80 border-t border-cyan-500/20 rounded-b-xl shrink-0 relative z-30">
              {/* 智能快速回復按鈕 - 根據內容類型顯示不同樣式 */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex gap-2 mb-3 flex-wrap"
                  >
                    {filteredSuggestions.slice(0, 4).map((suggestion, index) => {
                      // 根據建議內容判斷類型，顯示不同樣式
                      const isCommand = suggestion.startsWith('/');
                      const isPrice = suggestion.includes('價格') || suggestion.includes('報價') || suggestion.includes('詳情');
                      const isTrial = suggestion.includes('試用') || suggestion.includes('體驗') || suggestion.includes('免費');
                      const isContact = suggestion.includes('客服') || suggestion.includes('聯繫') || suggestion.includes('諮詢');
                      
                      let buttonStyle = 'bg-zinc-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-200';
                      let icon = null;
                      
                      if (isCommand) {
                        buttonStyle = 'bg-purple-900/30 border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60 hover:text-purple-200';
                        icon = <Terminal className="w-3 h-3" />;
                      } else if (isTrial) {
                        buttonStyle = 'bg-green-900/30 border-green-500/40 text-green-300 hover:bg-green-500/20 hover:border-green-500/60 hover:text-green-200';
                        icon = <Sparkles className="w-3 h-3" />;
                      } else if (isPrice) {
                        buttonStyle = 'bg-yellow-900/30 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-500/60 hover:text-yellow-200';
                        icon = <Activity className="w-3 h-3" />;
                      } else if (isContact) {
                        buttonStyle = 'bg-orange-900/30 border-orange-500/40 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/60 hover:text-orange-200';
                        icon = <ChevronRight className="w-3 h-3" />;
                      }
                      
                      return (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommandClick(suggestion);
                          }}
                          className={`px-3 py-1.5 text-xs font-mono border rounded-md transition-all flex items-center gap-1.5 ${buttonStyle}`}
                        >
                          {icon}
                          {suggestion}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 语音克隆工具栏 */}
              <div className="flex gap-2 mb-2">
                {/* 上传文件按钮 */}
                <label className="relative">
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
                    className="px-3 py-1.5 text-xs font-mono bg-zinc-800/80 border border-cyan-500/30 text-cyan-300 rounded-md hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    title="上传 WAV 音频文件作为参考"
                  >
                    {isUploading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Upload className="w-3 h-3" />
                        </motion.div>
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        上传音频
                      </>
                    )}
                  </button>
                </label>

                {/* 麦克风录音按钮 */}
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isUploading}
                  className={`px-3 py-1.5 text-xs font-mono border rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                    isRecording
                      ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                      : 'bg-zinc-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-200'
                  }`}
                  title={isRecording ? '停止录音' : '开始录音作为参考音频'}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-3 h-3" />
                      <span className="font-mono">{formatTime(recordingTime)}</span>
                      {isRecognizing && (
                        <span className="text-[10px] text-purple-400 ml-1 font-mono">识别中...</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      录音
                    </>
                  )}
                </button>
              </div>
              
               <form onSubmit={handleSend} className="relative flex items-center gap-2">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Activity className="w-4 h-4 text-cyan-500/50" />
                    {input === '' && !isListening && <span className="w-1.5 h-4 bg-cyan-500/50 animate-pulse ml-0.5" />}
                    {isListening && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-red-500 rounded-full"
                      />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onFocus={() => setShowSuggestions(false)}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isVoiceChatMode ? "语音对话模式：点击麦克风说话..." : "请输入指令..."}
                    className="w-full bg-black/50 border border-white/10 rounded-md py-2.5 pl-10 pr-20 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono text-sm transition-all"
                    autoFocus
                    autoComplete="off"
                    disabled={isListening}
                  />
                  {/* 语音输入按钮 */}
                  {isVoiceChatMode && (
                    <button
                      type="button"
                      onClick={isListening ? handleStopVoiceInput : handleStartVoiceInput}
                      disabled={isTyping || isSynthesizing || isSpeaking}
                      className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                        isListening
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                          : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                      title={isListening ? '停止语音输入' : '开始语音输入'}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* 发送按钮 */}
                  <button 
                    type="submit"
                    disabled={!input.trim() || isTyping || isListening}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-500/10 rounded hover:bg-cyan-500/20 text-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
               </form>
               
               {/* 语音状态提示 */}
               <AnimatePresence>
                 {(isListening || isSynthesizing || isSpeaking || ttsStatus) && (
                   <motion.div
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 5 }}
                     className="mt-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-md text-xs text-purple-400 font-mono flex items-center gap-2"
                   >
                     {isListening && (
                       <>
                         <motion.div
                           animate={{ scale: [1, 1.2, 1] }}
                           transition={{ duration: 0.8, repeat: Infinity }}
                           className="w-2 h-2 bg-red-500 rounded-full"
                         />
                         正在聆听...
                       </>
                     )}
                     {isSynthesizing && (
                       <>
                         <motion.div
                           animate={{ rotate: 360 }}
                           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                         >
                           <Volume2 className="w-3 h-3" />
                         </motion.div>
                         正在合成语音...
                       </>
                     )}
                     {isSpeaking && (
                       <>
                         <motion.div
                           animate={{ scale: [1, 1.1, 1] }}
                           transition={{ duration: 0.6, repeat: Infinity }}
                           className="w-2 h-2 bg-green-500 rounded-full"
                         />
                         AI正在说话...
                       </>
                     )}
                     {ttsStatus && !isListening && !isSynthesizing && !isSpeaking && (
                       <>
                         <motion.div
                           animate={{ scale: [1, 1.1, 1] }}
                           transition={{ duration: 0.6, repeat: Infinity }}
                           className="w-2 h-2 bg-cyan-500 rounded-full"
                         />
                         {ttsStatus}
                       </>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Resize Handle - 始終顯示在桌面模式 */}
            {!isMobileLayout && (
              <div
                ref={resizeRef}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[Resize] 開始調整大小');
                  isResizingRef.current = true;
                  setIsResizing(true);
                  document.body.style.cursor = 'nwse-resize';
                  document.body.style.userSelect = 'none';
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 z-[100] cursor-nwse-resize hover:scale-110 transition-transform"
                title="拖動調整大小"
              >
                {/* 更明顯的調整手柄 */}
                <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full shadow-lg flex items-center justify-center hover:from-cyan-400 hover:to-cyan-500">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* 参考文本确认对话框 */}
        <ReferenceTextConfirmDialog
          isOpen={showConfirmDialog}
          audioBlob={pendingAudioBlob}
          recognizedText={recognizedText}
          onConfirm={handleConfirmReferenceText}
          onCancel={handleCancelConfirmDialog}
          onRetry={handleRetryRecognition}
        />
        </>
      )}
    </AnimatePresence>
  );
};