/**
 * GPT-SoVITS CORS 代理服務器 v3
 * 支持音頻文件上傳和 TTS 請求代理
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 9881;
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 9880;

// 音頻文件保存目錄（GPT-SoVITS 可訪問的路徑）
const AUDIO_UPLOAD_DIR = path.join(__dirname, 'uploaded_audio');

// 確保上傳目錄存在
if (!fs.existsSync(AUDIO_UPLOAD_DIR)) {
  fs.mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true });
  console.log('創建音頻上傳目錄:', AUDIO_UPLOAD_DIR);
}

// CORS 頭
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// 添加 CORS 頭到響應
function addCorsHeaders(res) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

// 解析 multipart/form-data
function parseMultipart(buffer, boundary) {
  const parts = {};
  const boundaryBuffer = Buffer.from('--' + boundary);
  
  let start = buffer.indexOf(boundaryBuffer);
  while (start !== -1) {
    const end = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (end === -1) break;
    
    const part = buffer.slice(start + boundaryBuffer.length, end);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) {
      start = end;
      continue;
    }
    
    const headerStr = part.slice(0, headerEnd).toString();
    const body = part.slice(headerEnd + 4, part.length - 2); // 去掉結尾的 \r\n
    
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    
    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        parts[name] = {
          filename: filenameMatch[1],
          data: body,
        };
      } else {
        parts[name] = body.toString();
      }
    }
    
    start = end;
  }
  
  return parts;
}

// 處理音頻上傳
async function handleAudioUpload(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 處理音頻上傳...`);
  
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  
  if (!boundaryMatch) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({ error: 'Missing boundary in content-type' }));
    return;
  }
  
  const boundary = boundaryMatch[1];
  const chunks = [];
  
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const parts = parseMultipart(buffer, boundary);
    
    if (!parts.audio || !parts.audio.data) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'No audio file provided' }));
      return;
    }
    
    // 生成唯一文件名
    const filename = `ref_audio_${Date.now()}.wav`;
    const filepath = path.join(AUDIO_UPLOAD_DIR, filename);
    
    // 保存音頻文件
    fs.writeFileSync(filepath, parts.audio.data);
    console.log(`[${timestamp}] 音頻已保存: ${filepath}`);
    console.log(`[${timestamp}] 文件大小: ${parts.audio.data.length} bytes`);
    
    // 返回文件路徑
    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    res.end(JSON.stringify({
      success: true,
      filepath: filepath,
      filename: filename,
    }));
  });
}

// 代理請求到 GPT-SoVITS
function proxyRequest(req, res, bodyBuffer) {
  const timestamp = new Date().toISOString();
  
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers },
  };
  
  options.headers.host = `${TARGET_HOST}:${TARGET_PORT}`;
  delete options.headers['origin'];
  delete options.headers['referer'];
  
  if (bodyBuffer) {
    options.headers['content-length'] = bodyBuffer.length;
  }
  
  console.log(`[${timestamp}] 代理到: http://${TARGET_HOST}:${TARGET_PORT}${req.url}`);
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`[${timestamp}] 收到響應: ${proxyRes.statusCode}`);
    
    const headers = { ...proxyRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];
    
    res.writeHead(proxyRes.statusCode, { ...headers, ...CORS_HEADERS });
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error(`[${timestamp}] 代理錯誤:`, err.message);
    addCorsHeaders(res);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message: `無法連接到 GPT-SoVITS 服務: ${err.message}`,
    }));
  });
  
  proxyReq.setTimeout(120000, () => {
    console.error(`[${timestamp}] 請求超時`);
    proxyReq.destroy();
    addCorsHeaders(res);
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Gateway Timeout' }));
  });
  
  if (bodyBuffer) {
    proxyReq.write(bodyBuffer);
  }
  proxyReq.end();
}

// 創建服務器
const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  addCorsHeaders(res);
  
  // OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // 音頻上傳端點
  if (req.url === '/upload_audio' && req.method === 'POST') {
    handleAudioUpload(req, res);
    return;
  }
  
  // 其他請求代理到 GPT-SoVITS
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const bodyBuffer = Buffer.concat(chunks);
      proxyRequest(req, res, bodyBuffer);
    });
  } else {
    proxyRequest(req, res, null);
  }
});

server.on('error', (err) => {
  console.error('服務器錯誤:', err);
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('GPT-SoVITS CORS 代理服務器 v3');
  console.log('='.repeat(60));
  console.log(`代理地址: http://localhost:${PORT}`);
  console.log(`目標地址: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`音頻上傳目錄: ${AUDIO_UPLOAD_DIR}`);
  console.log('');
  console.log('端點:');
  console.log('  POST /upload_audio  - 上傳參考音頻');
  console.log('  POST /tts           - 語音合成（代理）');
  console.log('  GET  /set_refer_audio - 設置參考音頻（代理）');
  console.log('');
  console.log('按 Ctrl+C 停止服務');
  console.log('='.repeat(60));
});
