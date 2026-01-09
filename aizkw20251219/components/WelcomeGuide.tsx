import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Mic, Sparkles, ChevronRight, Play } from 'lucide-react';

interface WelcomeGuideProps {
  onComplete: () => void;
  onTryDemo: () => void;
}

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onComplete, onTryDemo }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      icon: <MessageSquare className="w-12 h-12 text-cyan-400" />,
      title: "智能AI對話",
      description: "無審核、無限制，直接幫你解決問題",
      highlight: "點擊機器人開始對話 👇"
    },
    {
      icon: <Mic className="w-12 h-12 text-purple-400" />,
      title: "5秒語音克隆",
      description: "錄製3-10秒語音，AI就能用你的聲音說話",
      highlight: "上傳音頻即可體驗 🎤"
    },
    {
      icon: <Sparkles className="w-12 h-12 text-yellow-400" />,
      title: "自動化成交",
      description: "AI 24/7 自動銷售，節省90%人工成本",
      highlight: "現在開通VIP享8折 🔥"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('welcome_guide_completed', 'true');
    setTimeout(() => onComplete(), 300);
  };

  const handleTryDemo = () => {
    handleComplete();
    onTryDemo();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-cyan-500/10"
        >
          {/* 關閉按鈕 */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 步驟指示器 */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-cyan-400' : 'w-2 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* 內容 */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              {steps[step].icon}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {steps[step].title}
            </h2>
            <p className="text-zinc-400 mb-4">
              {steps[step].description}
            </p>
            <p className="text-cyan-400 font-medium">
              {steps[step].highlight}
            </p>
          </motion.div>

          {/* 按鈕區 */}
          <div className="mt-8 flex gap-3">
            {step === steps.length - 1 ? (
              <>
                <button
                  onClick={handleTryDemo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/30"
                >
                  <Play className="w-5 h-5" />
                  一鍵體驗
                </button>
                <button
                  onClick={handleComplete}
                  className="px-4 py-3 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-all"
                >
                  跳過
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/30"
              >
                下一步
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 社交證明 */}
          <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">
              已有 <span className="text-cyan-400 font-bold">5,000+</span> 企業使用
              · 節省成本 <span className="text-green-400 font-bold">$2,000,000+</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook 用於檢查是否需要顯示引導
export const useWelcomeGuide = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('welcome_guide_completed');
    if (!completed) {
      // 延遲顯示，讓頁面先加載
      setTimeout(() => setShouldShow(true), 1500);
    }
  }, []);

  const hideGuide = () => setShouldShow(false);

  return { shouldShow, hideGuide };
};
