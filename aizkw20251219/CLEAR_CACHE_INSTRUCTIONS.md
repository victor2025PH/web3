# 清除浏览器缓存指南

## ⚠️ 重要提示

如果遇到以下问题：
- 仍然使用 `http://127.0.0.1:9880`（本地地址）
- 仍然使用 `/voice/synthesis` 端点（旧端点）
- 出现 CORS 错误或 404 错误

**这是浏览器缓存问题！** 需要清除缓存。

---

## 🚀 快速解决方案（推荐）

### Chrome / Edge（Windows）

**方法 1：强制刷新（最快）**
1. 按 `Ctrl + Shift + R`
2. 或按 `F12` 打开开发者工具
3. 右键点击刷新按钮 🔄
4. 选择 **"清空缓存并硬性重新加载"**

**方法 2：清除缓存**
1. 按 `Ctrl + Shift + Delete`
2. 选择 **"缓存的图片和文件"**
3. 时间范围选择 **"全部时间"**
4. 点击 **"清除数据"**
5. 刷新页面

**方法 3：开发者工具设置**
1. 按 `F12` 打开开发者工具
2. 点击右上角设置图标 ⚙️
3. 勾选 **"Disable cache (while DevTools is open)"**
4. 保持开发者工具打开
5. 刷新页面

### Firefox

**方法 1：强制刷新**
- 按 `Ctrl + Shift + R`

**方法 2：清除缓存**
1. 按 `Ctrl + Shift + Delete`
2. 选择 **"缓存"**
3. 点击 **"立即清除"**
4. 刷新页面

### Safari（Mac）

**方法 1：强制刷新**
- 按 `Cmd + Shift + R`

**方法 2：清除缓存**
1. 按 `Cmd + Option + E`（清除缓存）
2. 按 `Cmd + Shift + R`（强制刷新）

---

## 🔍 验证是否成功

清除缓存后，打开浏览器控制台（F12），应该看到：

```
[TTS] ========== 语音合成请求 ==========
[TTS] API Base URL: https://represents-supplier-river-competitions.trycloudflare.com
[TTS] API Endpoint: /tts
[TTS] Full API URL: https://represents-supplier-river-competitions.trycloudflare.com/tts
```

**如果仍然显示 `http://127.0.0.1:9880`，说明缓存未清除！**

---

## 🧪 使用无痕模式测试

如果清除缓存后仍有问题，使用无痕模式测试：

1. **Chrome/Edge**: `Ctrl + Shift + N`
2. **Firefox**: `Ctrl + Shift + P`
3. **Safari**: `Cmd + Shift + N`

在无痕模式下访问网站，如果正常，说明是缓存问题。

---

## 📋 检查清单

清除缓存前，请确认：

- [ ] GPT-SoVITS 服务正在运行（`http://localhost:9880`）
- [ ] Cloudflare Tunnel 正在运行
- [ ] `src/voiceConfig.ts` 已更新为 Tunnel URL
- [ ] GitHub Actions 部署已完成（绿色 ✅）

清除缓存后，请检查：

- [ ] 控制台显示正确的 API URL（Tunnel URL）
- [ ] 控制台显示 `/tts` 端点（不是 `/voice/synthesis`）
- [ ] 没有 CORS 错误
- [ ] 没有 404 错误

---

## 🆘 如果仍然不行

### 检查构建版本

1. 打开页面源代码（`Ctrl + U`）
2. 查找 JavaScript 文件名，例如：
   - `index-CXe_gJne.js`（旧版本）
   - `index-XXX.js`（新版本，文件名会变化）

如果文件名没有变化，说明 GitHub Actions 可能没有成功部署。

### 检查 Network 请求

1. 按 `F12` 打开开发者工具
2. 切换到 **"Network"** 标签
3. 尝试语音合成
4. 查看实际请求的 URL

应该看到：
- URL: `https://represents-supplier-river-competitions.trycloudflare.com/tts`
- Method: `POST`
- Status: `200`（成功）或 `400/500`（API 错误，但不是 404）

---

## 💡 常见问题

### Q: 为什么需要清除缓存？

A: 浏览器会缓存 JavaScript 文件以提高加载速度。当代码更新后，浏览器可能仍使用旧版本，导致配置不生效。

### Q: 清除缓存会影响其他网站吗？

A: 如果只清除"缓存的图片和文件"，不会影响登录状态或其他数据。但建议使用"强制刷新"（Ctrl+Shift+R），只清除当前网站的缓存。

### Q: 每次更新都需要清除缓存吗？

A: 通常不需要。但如果遇到配置不生效的问题，清除缓存是最快的解决方法。

### Q: 可以禁用缓存吗？

A: 可以！在开发者工具中勾选 "Disable cache"，但只在开发者工具打开时生效。

---

## 📞 获取帮助

如果清除缓存后问题仍然存在：

1. 截图浏览器控制台的完整错误信息
2. 截图 Network 标签中的请求详情
3. 检查 `src/voiceConfig.ts` 文件内容
4. 检查 GitHub Actions 部署状态
