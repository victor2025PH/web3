import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Clock, ChevronLeft, ChevronRight, Quote, Star, MessageSquare, Mic, Phone } from 'lucide-react';

interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  logo: string;
  avatar: string;
  name: string;
  title: string;
  quote: string;
  metrics: {
    label: string;
    before: string;
    after: string;
    improvement: string;
  }[];
  products: string[];
  color: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: '1',
    company: 'CryptoTrade Pro',
    industry: '加密貨幣交易',
    logo: '🪙',
    avatar: '👨‍💼',
    name: 'Michael Chen',
    title: '創始人 & CEO',
    quote: '使用 AI 智控王的語音克隆功能後，我們的客服效率提升了 300%。AI 用我的聲音 24/7 回覆客戶，客戶完全分辨不出是 AI 還是真人！',
    metrics: [
      { label: '客服成本', before: '$15,000/月', after: '$2,000/月', improvement: '-87%' },
      { label: '響應時間', before: '2小時', after: '5秒', improvement: '-99%' },
      { label: '客戶滿意度', before: '72%', after: '94%', improvement: '+31%' },
    ],
    products: ['語音克隆', 'AI 客服'],
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: '2',
    company: 'GameFi Studio',
    industry: '遊戲工作室',
    logo: '🎮',
    avatar: '👩‍💻',
    name: 'Sarah Wang',
    title: '市場總監',
    quote: '通過 Telegram 自動化 + 雲手機集群，我們的遊戲在一個月內獲得了 50 萬用戶。ROI 達到 1:15，這在以前是不可想象的！',
    metrics: [
      { label: '新用戶獲取', before: '2,000/月', after: '500,000/月', improvement: '+24900%' },
      { label: '獲客成本', before: '$5/人', after: '$0.3/人', improvement: '-94%' },
      { label: '月收入', before: '$50,000', after: '$800,000', improvement: '+1500%' },
    ],
    products: ['Telegram 自動化', '雲手機集群'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: '3',
    company: 'E-Commerce Giant',
    industry: '跨境電商',
    logo: '🛒',
    avatar: '👨‍🔧',
    name: 'David Liu',
    title: '運營總監',
    quote: 'WhatsApp 批量觸達 + AI 自動成交，讓我們的銷售團隊從 20 人縮減到 3 人，業績反而翻了 5 倍。這就是科技的力量！',
    metrics: [
      { label: '銷售人力', before: '20人', after: '3人', improvement: '-85%' },
      { label: '日成交量', before: '100單', after: '500單', improvement: '+400%' },
      { label: '人均產出', before: '$5,000/月', after: '$80,000/月', improvement: '+1500%' },
    ],
    products: ['WhatsApp API', 'AI 銷售'],
    color: 'from-green-500 to-emerald-500',
  },
];

export const CaseStudies: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentCase = caseStudies[currentIndex];

  const nextCase = () => {
    setCurrentIndex((prev) => (prev + 1) % caseStudies.length);
  };

  const prevCase = () => {
    setCurrentIndex((prev) => (prev - 1 + caseStudies.length) % caseStudies.length);
  };

  return (
    <div className="relative">
      {/* 標題 */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-medium mb-4"
        >
          <Star className="w-4 h-4" />
          真實案例
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          他們的成功，你也可以複製
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 max-w-2xl mx-auto"
        >
          看看其他企業如何用我們的解決方案實現業績飛躍
        </motion.p>
      </div>

      {/* 案例卡片 */}
      <div className="relative max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCase.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden"
          >
            {/* 頭部 */}
            <div className={`bg-gradient-to-r ${currentCase.color} p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{currentCase.logo}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentCase.company}</h3>
                    <p className="text-white/80 text-sm">{currentCase.industry}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {currentCase.products.map((product, i) => (
                    <span key={i} className="px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 內容 */}
            <div className="p-6">
              {/* 引言 */}
              <div className="relative mb-8">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-cyan-500/20" />
                <p className="text-lg text-zinc-300 italic pl-6">
                  "{currentCase.quote}"
                </p>
                <div className="flex items-center gap-3 mt-4 pl-6">
                  <span className="text-3xl">{currentCase.avatar}</span>
                  <div>
                    <p className="text-white font-medium">{currentCase.name}</p>
                    <p className="text-zinc-500 text-sm">{currentCase.title}</p>
                  </div>
                </div>
              </div>

              {/* 數據指標 */}
              <div className="grid grid-cols-3 gap-4">
                {currentCase.metrics.map((metric, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-zinc-500 text-xs mb-2">{metric.label}</p>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-zinc-600 text-sm line-through">{metric.before}</span>
                      <span className="text-white font-bold">{metric.after}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      metric.improvement.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.improvement}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 導航按鈕 */}
        <button
          onClick={prevCase}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextCase}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* 指示器 */}
        <div className="flex justify-center gap-2 mt-6">
          {caseStudies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'w-8 bg-cyan-400' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
