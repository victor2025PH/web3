import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, MessageSquare, Mic, Phone, Users, TrendingUp, Zap, Check } from 'lucide-react';
import { useAIChat } from '../contexts/AIChatContext';

interface PricingOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  basePrice: number;
  unit: string;
  description: string;
}

export const PricingCalculator: React.FC = () => {
  const { openChat } = useAIChat();
  
  const [selections, setSelections] = useState({
    messages: 10000,      // 消息數量
    voiceClones: 5,       // 語音克隆數
    cloudPhones: 0,       // 雲手機數量
    teamMembers: 1,       // 團隊成員
  });

  const options: PricingOption[] = [
    {
      id: 'messages',
      name: 'AI 對話消息',
      icon: <MessageSquare className="w-5 h-5" />,
      basePrice: 0.001,
      unit: '條',
      description: '無審核、無限制的 AI 對話',
    },
    {
      id: 'voiceClones',
      name: '語音克隆',
      icon: <Mic className="w-5 h-5" />,
      basePrice: 10,
      unit: '個聲音',
      description: '5秒克隆，永久使用',
    },
    {
      id: 'cloudPhones',
      name: '雲手機',
      icon: <Phone className="w-5 h-5" />,
      basePrice: 15,
      unit: '台/月',
      description: '24/7 在線，自動化操作',
    },
    {
      id: 'teamMembers',
      name: '團隊成員',
      icon: <Users className="w-5 h-5" />,
      basePrice: 20,
      unit: '人/月',
      description: '共享資源，協同工作',
    },
  ];

  const totalPrice = useMemo(() => {
    let total = 0;
    total += selections.messages * 0.001;
    total += selections.voiceClones * 10;
    total += selections.cloudPhones * 15;
    total += selections.teamMembers * 20;
    return total;
  }, [selections]);

  const monthlyValue = useMemo(() => {
    // 假設每條消息能帶來 $0.1 的價值
    const messageValue = selections.messages * 0.05;
    // 語音克隆節省的客服成本
    const voiceValue = selections.voiceClones * 500;
    // 雲手機帶來的自動化價值
    const phoneValue = selections.cloudPhones * 200;
    // 團隊協作效率提升
    const teamValue = selections.teamMembers * 100;
    
    return messageValue + voiceValue + phoneValue + teamValue;
  }, [selections]);

  const roi = useMemo(() => {
    if (totalPrice === 0) return 0;
    return ((monthlyValue - totalPrice) / totalPrice * 100).toFixed(0);
  }, [totalPrice, monthlyValue]);

  const handleSliderChange = (id: string, value: number) => {
    setSelections(prev => ({ ...prev, [id]: value }));
  };

  const sliderConfigs: Record<string, { min: number; max: number; step: number }> = {
    messages: { min: 1000, max: 100000, step: 1000 },
    voiceClones: { min: 1, max: 50, step: 1 },
    cloudPhones: { min: 0, max: 100, step: 5 },
    teamMembers: { min: 1, max: 20, step: 1 },
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 標題 */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium mb-4"
        >
          <Calculator className="w-4 h-4" />
          價格計算器
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          計算你的投資回報
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400"
        >
          拖動滑塊，看看你能省多少錢、賺多少錢
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：選項滑塊 */}
        <div className="space-y-6">
          {options.map((option) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    {option.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{option.name}</h4>
                    <p className="text-zinc-500 text-xs">{option.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-cyan-400">
                    {selections[option.id as keyof typeof selections].toLocaleString()}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1">{option.unit}</span>
                </div>
              </div>
              
              <input
                type="range"
                min={sliderConfigs[option.id].min}
                max={sliderConfigs[option.id].max}
                step={sliderConfigs[option.id].step}
                value={selections[option.id as keyof typeof selections]}
                onChange={(e) => handleSliderChange(option.id, parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              
              <div className="flex justify-between mt-2 text-xs text-zinc-600">
                <span>{sliderConfigs[option.id].min.toLocaleString()}</span>
                <span>{sliderConfigs[option.id].max.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 右側：結果展示 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-cyan-500/30 rounded-2xl p-6 sticky top-24"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            投資回報預估
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <span className="text-zinc-400">每月投入</span>
              <span className="text-2xl font-bold text-white">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <span className="text-zinc-400">預估月收益</span>
              <span className="text-2xl font-bold text-green-400">${monthlyValue.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-zinc-400">投資回報率</span>
              <span className="text-3xl font-bold text-cyan-400">{roi}%</span>
            </div>
          </div>

          {/* ROI 可視化 */}
          <div className="bg-zinc-900 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Number(roi) / 10)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-center text-sm text-zinc-400 mt-2">
              投入 $1 → 回報 ${(Number(roi) / 100 + 1).toFixed(2)}
            </p>
          </div>

          {/* 包含的功能 */}
          <div className="space-y-2 mb-6">
            {[
              '無限 AI 對話',
              '語音克隆永久使用',
              '24/7 技術支持',
              '7天無理由退款',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                <Check className="w-4 h-4 text-green-400" />
                {feature}
              </div>
            ))}
          </div>

          <button
            onClick={() => openChat(
              '用戶使用了價格計算器',
              `我計算了一下，每月投入 $${totalPrice.toFixed(2)}，想了解具體的方案和優惠 💰`
            )}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/30"
          >
            獲取專屬方案
          </button>
        </motion.div>
      </div>
    </div>
  );
};
