/**
 * GPT-SoVITS CORS 代理服务器 v2
 * 解决跨域请求问题 - 更robust的实现
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 9881;
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 9880;

// CORS 头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// 添加 CORS 头到响应
function addCorsHeaders(res) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

// 创建代理服务器
const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  // 添加 CORS 头到所有响应
  addCorsHeaders(res);

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    console.log(`[${timestamp}] 处理 OPTIONS 预检请求`);
    res.writeHead(204);
    res.end();
    return;
  }

  // 准备代理请求选项
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers },
  };

  // 修改 Host 头
  options.headers.host = `${TARGET_HOST}:${TARGET_PORT}`;
  
  // 删除可能导致问题的头
  delete options.headers['origin'];
  delete options.headers['referer'];

  console.log(`[${timestamp}] 代理到: http://${TARGET_HOST}:${TARGET_PORT}${req.url}`);

  // 创建代理请求
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`[${timestamp}] 收到响应: ${proxyRes.statusCode}`);

    // 复制响应头（但不覆盖 CORS 头）
    const headers = { ...proxyRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];

    // 写入响应头
    res.writeHead(proxyRes.statusCode, {
      ...headers,
      ...CORS_HEADERS,
    });

    // 管道响应数据
    proxyRes.pipe(res);
  });

  // 处理代理请求错误
  proxyReq.on('error', (err) => {
    console.error(`[${timestamp}] 代理错误:`, err.message);
    
    // 确保 CORS 头已添加
    addCorsHeaders(res);
    
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message: `无法连接到 GPT-SoVITS 服务: ${err.message}`,
      target: `http://${TARGET_HOST}:${TARGET_PORT}`,
    }));
  });

  // 设置超时
  proxyReq.setTimeout(60000, () => {
    console.error(`[${timestamp}] 请求超时`);
    proxyReq.destroy();
    
    addCorsHeaders(res);
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Gateway Timeout',
      message: '请求超时',
    }));
  });

  // 管道请求数据
  req.pipe(proxyReq);
});

// 错误处理
server.on('error', (err) => {
  console.error('服务器错误:', err);
});

// 启动服务器
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('GPT-SoVITS CORS 代理服务器 v2');
  console.log('='.repeat(60));
  console.log(`代理地址: http://localhost:${PORT}`);
  console.log(`目标地址: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log('');
  console.log('功能:');
  console.log('  ✓ 自动添加 CORS 头到所有响应');
  console.log('  ✓ 处理 OPTIONS 预检请求');
  console.log('  ✓ 错误响应也包含 CORS 头');
  console.log('  ✓ 60秒请求超时');
  console.log('');
  console.log('按 Ctrl+C 停止服务');
  console.log('='.repeat(60));
  console.log('');
});
