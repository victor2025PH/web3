/**
 * 聊天分析追蹤工具
 * 用於追蹤用戶與 AI 機器人的互動行為
 */

// 事件類型
export type ChatEventType = 
  | 'chat_open'           // 打開聊天窗口
  | 'chat_close'          // 關閉聊天窗口
  | 'message_sent'        // 發送消息
  | 'message_received'    // 收到 AI 回覆
  | 'suggestion_click'    // 點擊快速回復建議
  | 'stop_generating'     // 點擊停止生成
  | 'voice_start'         // 開始語音輸入
  | 'voice_end'           // 結束語音輸入
  | 'auto_greet_shown'    // 顯示自動問候
  | 'auto_greet_interact' // 與自動問候互動
  | 'mode_switch'         // 切換 AI 模式
  | 'clear_chat'          // 清除對話
  | 'error_occurred';     // 發生錯誤

// 事件數據接口
interface ChatEvent {
  type: ChatEventType;
  timestamp: number;
  sessionId: string;
  data?: Record<string, unknown>;
}

// 存儲鍵
const STORAGE_KEY = 'chat_analytics_events';
const SESSION_KEY = 'chat_analytics_session';
const MAX_EVENTS = 500; // 最多保存 500 條事件

// 獲取或創建會話 ID
const getSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `session_${Date.now()}`;
  }
};

// 獲取所有事件
export const getEvents = (): ChatEvent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// 保存事件
const saveEvents = (events: ChatEvent[]): void => {
  try {
    // 只保留最近的 MAX_EVENTS 條
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('保存分析事件失敗:', e);
  }
};

/**
 * 追蹤聊天事件
 */
export const trackEvent = (
  type: ChatEventType,
  data?: Record<string, unknown>
): void => {
  const event: ChatEvent = {
    type,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    data,
  };

  // 保存到 localStorage
  const events = getEvents();
  events.push(event);
  saveEvents(events);

  // 開發環境下輸出日誌
  if (process.env.NODE_ENV === 'development') {
    console.log('[ChatAnalytics]', type, data);
  }

  // 未來可以在這裡添加遠程上報邏輯
  // sendToAnalyticsServer(event);
};

/**
 * 獲取統計摘要
 */
export const getAnalyticsSummary = (): {
  totalEvents: number;
  messagesSent: number;
  messagesReceived: number;
  suggestionClicks: number;
  avgSessionDuration: string;
  mostUsedSuggestions: string[];
} => {
  const events = getEvents();
  
  const messagesSent = events.filter(e => e.type === 'message_sent').length;
  const messagesReceived = events.filter(e => e.type === 'message_received').length;
  const suggestionClicks = events.filter(e => e.type === 'suggestion_click').length;
  
  // 統計最常用的建議
  const suggestionCounts: Record<string, number> = {};
  events
    .filter(e => e.type === 'suggestion_click' && e.data?.suggestion)
    .forEach(e => {
      const suggestion = e.data?.suggestion as string;
      suggestionCounts[suggestion] = (suggestionCounts[suggestion] || 0) + 1;
    });
  
  const mostUsedSuggestions = Object.entries(suggestionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([suggestion]) => suggestion);

  // 計算平均會話時長
  const sessions: Record<string, { start: number; end: number }> = {};
  events.forEach(e => {
    if (!sessions[e.sessionId]) {
      sessions[e.sessionId] = { start: e.timestamp, end: e.timestamp };
    } else {
      sessions[e.sessionId].end = Math.max(sessions[e.sessionId].end, e.timestamp);
    }
  });
  
  const durations = Object.values(sessions).map(s => s.end - s.start);
  const avgDuration = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;
  
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  return {
    totalEvents: events.length,
    messagesSent,
    messagesReceived,
    suggestionClicks,
    avgSessionDuration: formatDuration(avgDuration),
    mostUsedSuggestions,
  };
};

/**
 * 清除所有分析數據
 */
export const clearAnalytics = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('清除分析數據失敗:', e);
  }
};

/**
 * 導出分析數據（用於調試或報告）
 */
export const exportAnalytics = (): string => {
  const events = getEvents();
  const summary = getAnalyticsSummary();
  
  return JSON.stringify({
    exportTime: new Date().toISOString(),
    summary,
    events,
  }, null, 2);
};
