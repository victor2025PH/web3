# 遠程訪問 AI 服務指南

本指南介紹如何讓其他電腦調用本機部署的 AI 和語音服務。

## 方案比較

| 方案 | 是否需要域名 | 網絡要求 | 難度 | 穩定性 |
|------|-------------|----------|------|--------|
| 局域網直接訪問 | ❌ 不需要 | 同一網絡 | ⭐ | 最穩定 |
| Tailscale | ❌ 不需要 | 任何網絡 | ⭐⭐ | 非常穩定 |
| ZeroTier | ❌ 不需要 | 任何網絡 | ⭐⭐ | 穩定 |
| ngrok | ❌ 不需要 | 任何網絡 | ⭐⭐ | 一般 |
| Cloudflare Tunnel | ✅ 需要 | 任何網絡 | ⭐⭐⭐ | 穩定 |

---

## 方案一：局域網直接訪問（最簡單）

### 適用場景
- 兩台電腦連接同一個 WiFi
- 兩台電腦在同一個公司/家庭網絡

### 本機（服務器）設置

1. **運行啟動腳本**
   ```
   雙擊：一键启动局域网服务.bat
   ```

2. **記錄顯示的 IP 地址**
   腳本會顯示類似：`192.168.1.100`

### 遠程電腦設置

1. **修改配置文件** `src/voiceConfig.ts`
   ```typescript
   export const voiceConfig = {
     apiBaseUrl: 'http://192.168.1.100:9881',  // 替換為服務器 IP
     // ...
   };
   ```

2. **修改 AI 配置** `utils/ollamaProxy.ts`
   ```typescript
   const OLLAMA_URL = 'http://192.168.1.100:11434/api/chat';  // 替換為服務器 IP
   ```

3. **或直接訪問網頁**
   瀏覽器打開：`http://192.168.1.100:5173`

---

## 方案二：Tailscale 虛擬局域網（推薦）

### 優點
- 不需要域名
- 不需要端口轉發
- 加密安全
- 跨越任何網絡

### 安裝步驟

#### 1. 兩台電腦都安裝 Tailscale

**Windows:**
```
下載地址：https://tailscale.com/download/windows
```

**安裝後登錄同一個 Tailscale 帳戶**

#### 2. 獲取 Tailscale IP

在本機（服務器）運行：
```powershell
tailscale ip -4
```
會得到類似 `100.x.x.x` 的 IP

#### 3. 配置服務

本機運行：`一键启动局域网服务.bat`

#### 4. 遠程電腦訪問

使用 Tailscale IP 替換配置：
- 語音服務：`http://100.x.x.x:9881`
- AI 服務：`http://100.x.x.x:11434`
- 網頁：`http://100.x.x.x:5173`

---

## 方案三：ZeroTier 虛擬局域網

### 安裝步驟

#### 1. 創建 ZeroTier 網絡

1. 訪問 https://my.zerotier.com/
2. 創建帳戶並登錄
3. 點擊 "Create A Network"
4. 記錄 Network ID（16位字符）

#### 2. 兩台電腦安裝 ZeroTier

**Windows:**
```
下載地址：https://www.zerotier.com/download/
```

安裝後加入網絡：
```powershell
zerotier-cli join [Network ID]
```

#### 3. 授權設備

在 ZeroTier 網頁控制台勾選兩台電腦

#### 4. 獲取 ZeroTier IP

```powershell
zerotier-cli listnetworks
```
會得到類似 `10.x.x.x` 的 IP

#### 5. 使用方式

與方案二相同，使用 ZeroTier IP 替換配置

---

## 方案四：ngrok（臨時分享）

### 安裝

```powershell
# 使用 winget 安裝
winget install ngrok.ngrok

# 或下載：https://ngrok.com/download
```

### 使用

1. **註冊帳戶並獲取 authtoken**
   https://dashboard.ngrok.com/get-started/your-authtoken

2. **配置 authtoken**
   ```powershell
   ngrok config add-authtoken YOUR_TOKEN
   ```

3. **啟動隧道**
   ```powershell
   # 終端1：語音服務
   ngrok http 9881
   
   # 終端2：AI 服務
   ngrok http 11434
   ```

4. **使用顯示的 URL**
   ngrok 會提供類似 `https://xxxx.ngrok-free.app` 的地址

---

## 快速對照表

### 需要修改的配置文件

| 文件 | 用途 | 範例 |
|------|------|------|
| `src/voiceConfig.ts` | 語音合成 | `apiBaseUrl: 'http://IP:9881'` |
| `utils/ollamaProxy.ts` | AI 對話 | `OLLAMA_URL: 'http://IP:11434/api/chat'` |

### 端口說明

| 端口 | 服務 |
|------|------|
| 9880 | GPT-SoVITS 原始服務 |
| 9881 | GPT-SoVITS CORS 代理 |
| 11434 | Ollama AI 服務 |
| 5173 | Vite 開發服務器（網頁） |

---

## 常見問題

### Q: 訪問不了怎麼辦？

1. **檢查防火牆**
   ```powershell
   # 允許端口
   netsh advfirewall firewall add rule name="AI Services" dir=in action=allow protocol=tcp localport=9881,11434,5173
   ```

2. **檢查服務是否運行**
   ```powershell
   netstat -an | findstr "9881 11434 5173"
   ```

### Q: Tailscale vs ZeroTier 選哪個？

- **Tailscale**：更簡單，開箱即用，推薦新手
- **ZeroTier**：更靈活，可自建控制器

### Q: 為什麼要用 CORS 代理？

瀏覽器安全策略要求跨域請求必須有正確的 CORS 頭，
CORS 代理會自動添加這些頭部。

---

## 一鍵啟動腳本

- `一键启动局域网服务.bat` - 局域網訪問（方案一）
- `一键启动所有服务.bat` - 本地服務
- `一键启动远程AI服务.bat` - Cloudflare Tunnel

