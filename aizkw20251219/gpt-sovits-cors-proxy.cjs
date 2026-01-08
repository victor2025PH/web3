/**
 * GPT-SoVITS CORS 代理服务器
 * 解决跨域请求问题
 */

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 9881; // 使用不同的端口
const GPT_SOVITS_URL = 'http://127.0.0.1:9880';

// 启用 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// 处理 OPTIONS 预检请求
app.options('*', cors());

// 代理所有请求到 GPT-SoVITS
app.use('/', createProxyMiddleware({
  target: GPT_SOVITS_URL,
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    // 添加 CORS 头
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept';
  },
  onError: function (err, req, res) {
    console.error('代理错误:', err);
    res.status(500).json({ error: 'GPT-SoVITS 连接失败', message: err.message });
  },
}));

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('GPT-SoVITS CORS 代理服务器');
  console.log('='.repeat(50));
  console.log(`代理地址: http://localhost:${PORT}`);
  console.log(`目标地址: ${GPT_SOVITS_URL}`);
  console.log('');
  console.log('按 Ctrl+C 停止服务');
  console.log('='.repeat(50));
});
