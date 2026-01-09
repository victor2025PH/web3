import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, MessageSquare, Mic, Gift } from 'lucide-react';
import { useAIChat } from '../contexts/AIChatContext';

export const FloatingCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { openChat, isOpen } = useAIChat();

  // 滾動一段距離後顯示
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500 && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  // 聊天打開時隱藏
  if (isOpen || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        className="fixed bottom-24 right-6 z-[80]"
      >
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 w-72"
          >
            {/* 關閉按鈕 */}
            <button
              onClick={() => {
                setIsExpanded(false);
                setIsDismissed(true);
                setIsVisible(false);
              }}
              className="absolute top-2 right-2 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 限時優惠標籤 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full animate-pulse">
                🔥 限時優惠
              </span>
              <span className="text-xs text-zinc-500">僅剩 3 天</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              立即開通 VIP
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              現在開通享 <span className="text-cyan-400 font-bold">8折優惠</span>
              <br />+ 免費語音克隆額度 x10
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  openChat('用戶對VIP感興趣', '我想了解 VIP 會員的具體權益和價格 💰');
                  setIsExpanded(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all"
              >
                <Gift className="w-4 h-4" />
                了解 VIP 權益
              </button>
              <button
                onClick={() => {
                  openChat('用戶想體驗語音克隆', '我想試試語音克隆功能 🎤');
                  setIsExpanded(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-all"
              >
                <Mic className="w-4 h-4" />
                免費試用語音克隆
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
          >
            <Zap className="w-5 h-5" />
            <span>開通 VIP 享 8 折</span>
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
