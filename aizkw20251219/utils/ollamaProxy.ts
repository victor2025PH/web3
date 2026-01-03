/**
 * Ollama 本地 API 代理
 * 用于无审核、无道德约束的本地对话
 */

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'huihui_ai/qwen2.5-abliterate';

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
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || OLLAMA_MODEL,
        messages: request.messages,
        stream: true,
        options: {
          temperature: 0.9,
          top_p: 0.95,
          ...request.options,
        },
      }),
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
    console.error('Ollama 流式请求失败:', error);
    throw error;
  }
}

/**
 * 发送本地 Ollama 聊天请求（非流式）
 */
export async function sendOllamaRequest(request: OllamaChatRequest): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || OLLAMA_MODEL,
        messages: request.messages,
        stream: false,
        options: {
          temperature: 0.9,
          top_p: 0.95,
          ...request.options,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama 请求失败: ${response.status} - ${errorText}`);
    }

    const data: OllamaChatResponse = await response.json();
    return data.message?.content || '';
  } catch (error) {
    console.error('Ollama 请求失败:', error);
    throw error;
  }
}

/**
 * 检查 Ollama 服务是否可用
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
