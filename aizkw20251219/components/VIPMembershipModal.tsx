import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Rocket, MessageSquare, Mic, Globe, Shield, Clock, Headphones, Star } from 'lucide-react';

interface VIPMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlanType = 'free' | 'pro' | 'enterprise';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
  ctaText: string;
  ctaStyle: string;
}

export const VIPMembershipModal: React.FC<VIPMembershipModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [isAnnual, setIsAnnual] = useState(true);

  const plans: Plan[] = [
    {
      id: 'free',
      name: '免費版',
      price: '$0',
      period: '永久免費',
      description: '適合個人體驗',
      icon: <MessageSquare className="w-6 h-6" />,
      features: [
        { text: '每日 10 次 AI 對話', included: true },
        { text: '30秒語音克隆試用', included: true },
        { text: '基礎功能', included: true },
        { text: '無限對話', included: false },
        { text: '完整語音克隆', included: false },
        { text: 'API 接口', included: false },
        { text: '優先客服', included: false },
      ],
      ctaText: '當前方案',
      ctaStyle: 'bg-zinc-700 text-zinc-400 cursor-not-allowed',
    },
    {
      id: 'pro',
      name: '專業版',
      price: isAnnual ? '$79' : '$99',
      originalPrice: isAnnual ? '$99' : undefined,
      period: isAnnual ? '/月（年付）' : '/月',
      description: '適合個人創業者',
      icon: <Zap className="w-6 h-6" />,
      popular: true,
      features: [
        { text: '無限 AI 對話', included: true, highlight: true },
        { text: '完整語音克隆', included: true, highlight: true },
        { text: '多語言支持', included: true },
        { text: '對話記錄雲端同步', included: true },
        { text: '5個自定義聲音', included: true },
        { text: '優先客服支持', included: true },
        { text: 'API 接口（1萬次/月）', included: true },
      ],
      ctaText: '立即開通',
      ctaStyle: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-400 hover:to-cyan-500',
    },
    {
      id: 'enterprise',
      name: '企業版',
      price: '$499',
      period: '/月起',
      description: '適合團隊和企業',
      icon: <Crown className="w-6 h-6" />,
      features: [
        { text: '專業版所有功能', included: true },
        { text: '私有化部署', included: true, highlight: true },
        { text: '無限 API 調用', included: true, highlight: true },
        { text: '多團隊成員', included: true },
        { text: '自定義模型訓練', included: true },
        { text: '專屬技術顧問', included: true },
        { text: 'SLA 保障', included: true },
      ],
      ctaText: '聯繫銷售',
      ctaStyle: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500',
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-cyan-500/20 rounded-2xl max-w-5xl w-full shadow-2xl shadow-cyan-500/10 my-8"
        >
          {/* Header */}
          <div className="relative p-6 border-b border-zinc-800">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-medium mb-4">
                <Star className="w-4 h-4" />
                限時優惠 · 年付享 8 折
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                選擇適合你的方案
              </h2>
              <p className="text-zinc-400">
                解鎖全部 AI 能力，讓科技為你賺錢
              </p>
            </div>

            {/* 年付/月付切換 */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>月付</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isAnnual ? 'bg-cyan-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isAnnual ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                年付 <span className="text-cyan-400">省 20%</span>
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-cyan-500 bg-cyan-500/5'
                    : 'border-zinc-800 hover:border-zinc-700'
                } ${plan.popular ? 'ring-2 ring-cyan-500/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-bold rounded-full">
                    最受歡迎
                  </div>
                )}

                <div className={`inline-flex p-3 rounded-xl mb-4 ${
                  plan.id === 'pro' ? 'bg-cyan-500/10 text-cyan-400' :
                  plan.id === 'enterprise' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {plan.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {plan.originalPrice && (
                      <span className="text-lg text-zinc-500 line-through">{plan.originalPrice}</span>
                    )}
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-zinc-500">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          feature.highlight ? 'text-cyan-400' : 'text-green-400'
                        }`} />
                      ) : (
                        <X className="w-5 h-5 mt-0.5 flex-shrink-0 text-zinc-600" />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? feature.highlight ? 'text-white font-medium' : 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-bold transition-all ${plan.ctaStyle}`}
                  disabled={plan.id === 'free'}
                >
                  {plan.ctaText}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="p-6 border-t border-zinc-800">
            <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>安全支付</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>7天無理由退款</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <span>24/7 技術支持</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-yellow-400" />
                <span>5,000+ 企業信賴</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing VIP modal
export const useVIPModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openVIPModal = () => setIsOpen(true);
  const closeVIPModal = () => setIsOpen(false);
  
  return { isOpen, openVIPModal, closeVIPModal };
};
