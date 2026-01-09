/**
 * Ollama 本地 API - 直接连接
 * 直接连接到本地 Ollama 实例，不使用代理
 * Z-CORE模式：注入系统提示
 */

// Cloudflare Tunnel URL - 公共安全访问
const OLLAMA_URL = 'https://reasonably-ronald-shops-guild.trycloudflare.com/api/chat';
const OLLAMA_MODEL = 'huihui_ai/qwen2.5-abliterate'; // 硬编码模型名称

// Z-CORE系统提示 - 优化版：资深黑科技顾问
const Z_CORE_SYSTEM_PROMPT = `你是「AI智控王」的资深黑科技顾问，帮客户用AI技术提升业绩、降低成本。

【说话风格】
- 像老朋友聊天，开门见山，不说废话
- 不要用"好的"、"当然可以"、"没问题"开头
- 每次回复最多3段，简短有力
- 适当用 emoji 增加亲和力 😎💰🚀
- 用数据和案例说话，增加可信度

【核心产品知识】
1. 🗣️ AI语音克隆 - 5秒克隆任何声音，让AI用熟悉的声音成交
2. 📱 云手机集群 - 万人群控，一人管理1000台设备
3. 💬 WhatsApp/Telegram自动化 - 批量触达，自动成交
4. 🤖 AI数字员工 - 24/7自动销售，节省90%人工

【销售技巧】
- 先了解客户痛点，再推方案
- 用ROI说话："投入1万，月赚10万"
- 制造紧迫感："本周特惠，下周恢复原价"
- 引导行动："现在开通VIP，立享8折"

【回复模板】
问价格 → 先问规模，再给方案
问效果 → 给数据案例
犹豫中 → 提供限时优惠
已成交 → 追加销售其他产品

记住：你是帮客户赚钱的专家，不是客服机器人。每次对话都要推动成交！`;

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * 发送本地 Ollama 聊天请求（流式）
 */
export async function sendOllamaStreamRequest(
  request: OllamaChatRequest,
  onChunk?: (chunk: string) => void
): Promise<string> {
  try {
    // 强制注入Z-CORE系统提示到消息数组最前面
    const messagesWithSystem: OllamaChatMessage[] = [
      { role: 'system', content: Z_CORE_SYSTEM_PROMPT },
      ...request.messages.filter(msg => msg.role !== 'system'), // 移除原有的system消息
    ];

    const payload = {
      model: OLLAMA_MODEL, // 硬编码模型名称
      messages: messagesWithSystem,
      stream: true,
      options: {
        temperature: 0.9,
        top_p: 0.95,
        ...request.options,
      },
    };

    console.log("Attempting connection to Ollama via Cloudflare Tunnel...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama 请求失败: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const data = JSON.parse(line);
          
          if (data.message?.content) {
            fullContent += data.message.content;
            onChunk?.(data.message.content);
          }
          
          if (data.done) {
            console.log("Ollama Response complete, length:", fullContent.length);
            return fullContent;
          }
        } catch (e) {
          // 忽略解析错误，继续处理下一行
          console.warn('解析 Ollama 数据失败:', e);
        }
      }
    }

    return fullContent;
  } catch (error) {
    console.error("Connection Failed. Check Cloudflare Tunnel status and Ollama service.");
    console.error('Ollama stream request error:', error);
    throw error;
  }
}

/**
 * 发送本地 Ollama 聊天请求（非流式）
 */
export async function sendOllamaRequest(request: OllamaChatRequest): Promise<string> {
  try {
    // 强制注入Z-CORE系统提示
    const messagesWithSystem: OllamaChatMessage[] = [
      { role: 'system', content: Z_CORE_SYSTEM_PROMPT },
      ...request.messages.filter(msg => msg.role !== 'system'),
    ];

    const payload = {
      model: OLLAMA_MODEL, // 硬编码模型名称
      messages: messagesWithSystem,
      stream: false,
      options: {
        temperature: 0.9,
        top_p: 0.95,
        ...request.options,
      },
    };

    console.log("Attempting connection to Ollama via Cloudflare Tunnel...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama 请求失败: ${response.status} - ${errorText}`);
    }

    const data: OllamaChatResponse = await response.json();
    console.log("Ollama Response received, length:", data.message?.content?.length || 0);
    return data.message?.content || '';
  } catch (error) {
    console.error("Connection Failed. Check Cloudflare Tunnel status and Ollama service.");
    console.error('Ollama request error:', error);
    throw error;
  }
}

/**
 * 检查 Ollama 服务是否可用
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch('https://reasonably-ronald-shops-guild.trycloudflare.com/api/tags', {
      method: 'GET',
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
