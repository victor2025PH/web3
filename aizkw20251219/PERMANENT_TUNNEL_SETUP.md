# Cloudflare 永久隧道設置指南

## 前提條件
1. Cloudflare 帳號（免費）
2. 一個域名（可以是任何域名，如 yourdomain.com）
3. 域名已添加到 Cloudflare（使用 Cloudflare DNS）

---

## 步驟 1：創建 Cloudflare Tunnel

### 1.1 登錄 Cloudflare Dashboard
訪問: https://one.dash.cloudflare.com/

### 1.2 進入 Zero Trust
左側菜單 → Networks → Tunnels

### 1.3 創建隧道
點擊 "Create a tunnel" → 選擇 "Cloudflared"

### 1.4 命名隧道
- 隧道名稱: `ai-smart-control`（或任意名稱）
- 點擊 "Save tunnel"

### 1.5 安裝連接器
Cloudflare 會給你一個安裝命令，類似：
```bash
cloudflared.exe service install eyJhIjoixxxx...
```

複製這個 Token（`eyJa...` 部分），後面要用！

### 1.6 配置公共主機名
添加兩個服務：

**服務 1 - Ollama AI 對話:**
| 欄位 | 值 |
|------|-----|
| Subdomain | `ollama` |
| Domain | 選擇你的域名 |
| Type | HTTP |
| URL | `localhost:3002` |

**服務 2 - GPT-SoVITS 語音:**
| 欄位 | 值 |
|------|-----|
| Subdomain | `voice` |
| Domain | 選擇你的域名 |
| Type | HTTP |
| URL | `localhost:9881` |

---

## 步驟 2：獲取隧道 Token

在 Cloudflare Dashboard 的隧道頁面，點擊你創建的隧道：
- 點擊 "Configure"
- 複製 Tunnel Token（一長串以 `eyJ` 開頭的字符串）

---

## 步驟 3：使用永久 URL

設置完成後，你的永久 URL 將是：
- **Ollama**: `https://ollama.yourdomain.com`
- **GPT-SoVITS**: `https://voice.yourdomain.com`

這些 URL **永遠不會改變**！

---

## 步驟 4：更新代碼配置

### 更新 voiceConfig.ts
```typescript
apiBaseUrl: 'https://voice.yourdomain.com',
```

### 更新 ollamaProxy.ts
```typescript
const OLLAMA_URL = 'https://ollama.yourdomain.com/api/chat';
```

---

## 常見問題

### Q: 我沒有域名怎麼辦？
A: 可以購買便宜的域名（如 .xyz 約 $1/年），或使用免費的 Freenom 域名。

### Q: 免費額度夠用嗎？
A: Cloudflare Tunnel 完全免費，無限流量！

### Q: 安全嗎？
A: 是的，所有流量都通過 HTTPS 加密，且不需要開放任何端口。
