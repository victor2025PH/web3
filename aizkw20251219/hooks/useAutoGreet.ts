import { useEffect, useRef, useCallback } from 'react';
import { useAIChat } from '../contexts/AIChatContext';

// 業務推薦話術配置
export const GREET_MESSAGES = {
  // 新用戶首次登錄歡迎語
  newUser: `🎉 **歡迎加入 AI 智控王！**

我是您的智能業務顧問，全天候為您服務。

作為新用戶，我為您推薦以下 **熱門服務**：

### 📱 Telegram 矩陣號
100 個高權重賬號，自動群發，到達率 >98%

### 🤖 AI 數字員工
24/7 自動成交，節省 90% 人工成本

### 💰 雲手機農場
批量養號，無限擴展，全球住宅 IP

---

👉 **現在諮詢可享首單 8 折優惠！**

您對哪個服務感興趣？|||Telegram 矩陣詳情|AI 數字員工報價|免費試用申請`,

  // 回訪用戶歡迎語
  returningUser: `👋 **歡迎回來！**

很高興再次見到您。

💬 **快捷選項：**
- 繼續上次的對話
- 查看最新優惠活動
- 諮詢技術支持

今天有什麼我可以幫您的嗎？|||查看最新活動|技術諮詢|聯繫專屬客服`,

  // 瀏覽產品頁後觸發（可擴展）
  productBrowsing: `💡 **看來您正在評估我們的方案！**

小貼士：大部分客戶選擇「流量矩陣 + 小程序」組合包，
因為流量沒有承接載體等於燒錢。

我可以根據您的需求推薦最適合的配置，您每月的發送量大約是多少？|||10 萬以下|10-100 萬|100 萬以上`,
};

// 存儲鍵
const STORAGE_KEYS = {
  lastGreetTime: 'ai_last_greet_time',
  hasEverGreeted: 'ai_has_ever_greeted',
  greetCount: 'ai_greet_count',
};

interface UseAutoGreetOptions {
  // 延遲打開時間（毫秒）
  delay?: number;
  // 是否啟用每日首次登錄限制
  oncePerDay?: boolean;
  // 是否僅對新用戶啟用
  newUserOnly?: boolean;
  // 觸發元素（用於定位彈窗）
  triggerElement?: HTMLElement | null;
}

export const useAutoGreet = (options: UseAutoGreetOptions = {}) => {
  const {
    delay = 3000,
    oncePerDay = true,
    newUserOnly = false,
    triggerElement = null,
  } = options;

  const { openChat, isOpen, messages } = useAIChat();
  const hasGreetedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 檢查是否是新用戶
  const isNewUser = useCallback((): boolean => {
    try {
      const hasEverGreeted = localStorage.getItem(STORAGE_KEYS.hasEverGreeted);
      return !hasEverGreeted;
    } catch {
      return true;
    }
  }, []);

  // 檢查今天是否已經問候過
  const hasGreetedToday = useCallback((): boolean => {
    try {
      const lastGreetTime = localStorage.getItem(STORAGE_KEYS.lastGreetTime);
      if (!lastGreetTime) return false;

      const lastDate = new Date(parseInt(lastGreetTime, 10));
      const today = new Date();
      
      return (
        lastDate.getFullYear() === today.getFullYear() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getDate() === today.getDate()
      );
    } catch {
      return false;
    }
  }, []);

  // 記錄問候時間
  const recordGreet = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.lastGreetTime, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.hasEverGreeted, 'true');
      
      const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.greetCount) || '0', 10);
      localStorage.setItem(STORAGE_KEYS.greetCount, (currentCount + 1).toString());
    } catch (e) {
      console.warn('記錄問候時間失敗:', e);
    }
  }, []);

  // 選擇合適的歡迎語
  const selectGreetMessage = useCallback((): string => {
    // 如果有對話歷史，使用回訪用戶話術
    if (messages.length > 0) {
      return GREET_MESSAGES.returningUser;
    }
    
    // 新用戶使用新用戶話術
    if (isNewUser()) {
      return GREET_MESSAGES.newUser;
    }
    
    // 回訪用戶
    return GREET_MESSAGES.returningUser;
  }, [messages.length, isNewUser]);

  // 執行自動問候
  const triggerGreet = useCallback(() => {
    // 已經打開或已經問候過本次會話
    if (isOpen || hasGreetedRef.current) {
      return;
    }

    // 檢查每日限制
    if (oncePerDay && hasGreetedToday()) {
      console.log('[AutoGreet] 今天已經問候過，跳過');
      return;
    }

    // 檢查新用戶限制
    if (newUserOnly && !isNewUser()) {
      console.log('[AutoGreet] 非新用戶，跳過');
      return;
    }

    // 標記已問候
    hasGreetedRef.current = true;
    recordGreet();

    // 獲取歡迎語並打開聊天
    const greetMessage = selectGreetMessage();
    
    console.log('[AutoGreet] 觸發自動問候');
    openChat('用戶登錄自動問候', greetMessage, triggerElement || undefined);
  }, [
    isOpen,
    oncePerDay,
    hasGreetedToday,
    newUserOnly,
    isNewUser,
    recordGreet,
    selectGreetMessage,
    openChat,
    triggerElement,
  ]);

  // 自動觸發（帶延遲）
  useEffect(() => {
    // 清除之前的定時器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 設置延遲觸發
    timerRef.current = setTimeout(() => {
      triggerGreet();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [delay, triggerGreet]);

  // 手動觸發問候（可用於按鈕點擊等場景）
  const manualGreet = useCallback((customMessage?: string) => {
    if (isOpen) return;
    
    const message = customMessage || selectGreetMessage();
    openChat('手動觸發問候', message, triggerElement || undefined);
  }, [isOpen, selectGreetMessage, openChat, triggerElement]);

  // 重置問候狀態（用於測試）
  const resetGreetState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.lastGreetTime);
      localStorage.removeItem(STORAGE_KEYS.hasEverGreeted);
      localStorage.removeItem(STORAGE_KEYS.greetCount);
      hasGreetedRef.current = false;
    } catch (e) {
      console.warn('重置問候狀態失敗:', e);
    }
  }, []);

  return {
    triggerGreet,
    manualGreet,
    resetGreetState,
    isNewUser: isNewUser(),
    hasGreetedToday: hasGreetedToday(),
  };
};

// 導出話術配置供其他組件使用
export { GREET_MESSAGES as greetMessages };
