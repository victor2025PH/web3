import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Mic, TrendingUp, Zap } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  color: string;
}

export const LiveStatsBar: React.FC = () => {
  const [stats, setStats] = useState({
    activeUsers: 127,
    messagestoday: 8542,
    voiceClones: 342,
    savedCost: 2847000,
  });

  // 模擬實時數據更新
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        messagestoday: prev.messagestoday + Math.floor(Math.random() * 10),
        voiceClones: prev.voiceClones + (Math.random() > 0.7 ? 1 : 0),
        savedCost: prev.savedCost + Math.floor(Math.random() * 500),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statItems: StatItem[] = [
    {
      icon: <Users className="w-4 h-4" />,
      label: '在線用戶',
      value: stats.activeUsers,
      suffix: '',
      color: 'text-green-400',
    },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      label: '今日對話',
      value: stats.messagestoday,
      suffix: '+',
      color: 'text-cyan-400',
    },
    {
      icon: <Mic className="w-4 h-4" />,
      label: '語音克隆',
      value: stats.voiceClones,
      suffix: '',
      color: 'text-purple-400',
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: '節省成本',
      value: stats.savedCost,
      suffix: '$',
      color: 'text-yellow-400',
    },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed top-16 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-6 md:gap-12 overflow-x-auto">
          {statItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <div className={`${item.color}`}>
                {item.icon}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`font-bold ${item.color}`}>
                  {item.suffix === '$' && '$'}
                  {formatNumber(item.value)}
                  {item.suffix !== '$' && item.suffix}
                </span>
                <span className="text-xs text-zinc-500 hidden sm:inline">
                  {item.label}
                </span>
              </div>
            </motion.div>
          ))}
          
          {/* 實時指示器 */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400">LIVE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
