import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Mail, Phone, Building, MessageSquare, Check, Loader2 } from 'lucide-react';

interface ContactSalesFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  interest: string;
  message: string;
}

export const ContactSalesForm: React.FC<ContactSalesFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    interest: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const interests = [
    '語音克隆',
    'Telegram 自動化',
    'WhatsApp API',
    '雲手機集群',
    'AI 數字員工',
    '企業定制方案',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 模擬提交
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // 3秒後關閉
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        interest: '',
        message: '',
      });
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-cyan-500/30 rounded-2xl max-w-lg w-full shadow-2xl shadow-cyan-500/10 overflow-hidden"
        >
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">提交成功！</h3>
              <p className="text-zinc-400">
                我們的銷售團隊會在 24 小時內聯繫您
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="relative p-6 border-b border-zinc-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-1">聯繫銷售團隊</h2>
                <p className="text-zinc-400 text-sm">獲取專屬方案和報價</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      <User className="w-4 h-4 inline mr-1" />
                      姓名 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="您的姓名"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      <Phone className="w-4 h-4 inline mr-1" />
                      電話 *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+86 xxx xxxx xxxx"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    <Mail className="w-4 h-4 inline mr-1" />
                    郵箱 *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    <Building className="w-4 h-4 inline mr-1" />
                    公司名稱
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="您的公司名稱（選填）"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    感興趣的產品 *
                  </label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  >
                    <option value="">請選擇...</option>
                    {interests.map((interest) => (
                      <option key={interest} value={interest}>
                        {interest}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    補充說明
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    placeholder="請描述您的需求和預算（選填）"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      提交諮詢
                    </>
                  )}
                </button>

                <p className="text-xs text-zinc-500 text-center">
                  提交即表示您同意我們的隱私政策，我們會保護您的信息安全
                </p>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing contact form
export const useContactForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openContactForm = () => setIsOpen(true);
  const closeContactForm = () => setIsOpen(false);
  
  return { isOpen, openContactForm, closeContactForm };
};
