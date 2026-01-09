import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MessageSquare, Phone, TrendingUp } from 'lucide-react';
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

