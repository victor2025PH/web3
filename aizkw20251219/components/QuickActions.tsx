import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MessageSquare, Phone, FileText, Zap, Users, TrendingUp, Crown } from 'lucide-react';
import { useAIChat } from '../contexts/AIChatContext';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  message: string;
  color: string;
  bgColor: string;
}

export const QuickActions: React.FC = () => {
  const { openChat } = useAIChat();

  const actions: QuickAction[] = [
    {
      icon: <Mic className="w-5 h-5" />,
      label: '語音克隆',
      description: '5秒克隆任何聲音',
      message: '我想試試語音克隆功能，需要怎麼操作？🎤',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: '自動獲客',
      description: 'Telegram/WhatsApp 批量觸達',
      message: '我想了解自動獲客方案，每天能觸達多少人？💬',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: '雲手機集群',
      description: '萬人群控，一人管理',
      message: '雲手機集群是怎麼運作的？能管理多少台設備？📱',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 hover:bg-green-500/20',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: '查看報價',
      description: '獲取專屬方案',
      message: '我想了解具體的價格和套餐方案 💰',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, index) => (
        <motion.button
          key={index}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openChat(`用戶想了解${action.label}`, action.message)}
          className={`p-4 rounded-xl border border-zinc-800 ${action.bgColor} transition-all text-left group`}
        >
          <div className={`${action.color} mb-2 group-hover:scale-110 transition-transform`}>
            {action.icon}
          </div>
          <h4 className="text-white font-bold text-sm mb-1">{action.label}</h4>
          <p className="text-zinc-500 text-xs">{action.description}</p>
        </motion.button>
      ))}
    </div>
  );
};

// 浮動版本的快速行動
export const FloatingQuickActions: React.FC = () => {
  const { openChat, isOpen } = useAIChat();

  if (isOpen) return null;

  const quickButtons = [
    { icon: <Mic className="w-4 h-4" />, label: '試語音', message: '我想試試語音克隆 🎤', color: 'from-purple-500 to-purple-600' },
    { icon: <Crown className="w-4 h-4" />, label: '開VIP', message: '我想了解VIP會員權益 👑', color: 'from-yellow-500 to-yellow-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1 }}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-[70] flex flex-col gap-2"
    >
      {quickButtons.map((btn, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openChat('', btn.message)}
          className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${btn.color} text-white text-xs font-bold rounded-l-full shadow-lg`}
        >
          {btn.icon}
          <span className="hidden md:inline">{btn.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};
