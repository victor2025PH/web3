# Web3 Sites - 三个展示网站

包含三个独立的展示网站：

1. **aizkw20251219** - AI智控王 (https://aizkw.usdt2026.cc)
2. **tgmini20251220** - Telegram Mini (https://tgmini.usdt2026.cc)
3. **hbwy20251220** - 红包外援 (https://hongbao.usdt2026.cc)

## 技术栈

- **框架**: Vite + React + TypeScript
- **样式**: Tailwind CSS
- **构建工具**: Vite

## 本地开发

```bash
# 进入任意网站目录
cd aizkw20251219

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 部署

每个网站都是独立的静态网站，可以通过以下方式部署：

1. **本地构建后上传**: 使用 `npm run build` 构建，然后上传 `dist/` 目录
2. **使用静态文件服务器**: 如 Nginx, Apache 等
3. **使用 CDN**: 如 Vercel, Netlify 等

## 网站信息

| 网站 | 目录 | 端口 | 说明 |
|------|------|------|------|
| AI智控王 | aizkw20251219/ | 3001 | AI对话、3D场景展示 |
| Telegram Mini | tgmini20251220/ | 3002 | Telegram功能展示 |
| 红包外援 | hbwy20251220/ | 3003 | 红包功能展示 |

## 注意事项

- 每个网站都是独立的，可以单独部署
- 构建后的文件在各自的 `dist/` 目录
- 建议使用 HTTPS 部署

