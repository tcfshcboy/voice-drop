# 🍡靠北臺中一中投稿系統 v3.0

> 2026 全新改版 - 這是一中生為一中生打造的校園投稿平台。
> Powered by 🍡 Dango Power & Google Cloud.

## 🌟 核心特色 (Core Features)

### 🎨 沉浸式體驗 (UI/UX)
*   **Gen Z 美學**：採用暗黑模式 (Dark Mode) 與高對比霓虹配色 (Lime/Cyan/Fuchsia)。
*   **動態吉祥物**：可愛的 Dango 糰子會根據你選擇的分類改變表情 (🍡✨, 🍡🤥, 🍡📜)。
*   **RWD 響應式**：手機、平板、電腦完美支援。

### 🔐 身分驗證與安全 (Security)
*   **Google Sign-In 整合**：捨棄傳統表單，改用 Google 官方登入 API，杜絕機器人濫用。
*   **自動身分標註**：
    *   **一中生投稿**：系統自動偵測 `@std.tcfsh.tc.edu.tw` 網域，自動標記。
    *   **一般投稿**：其他 Google 帳號自動標記為一般身分。
*   **隱私保護**：前端介面承諾不公開個資，僅後台留存以供審核查證。

### 📝 投稿功能 (Submission)
*   **詳細審稿細則**：內建分類明確的紅/綠/橘燈規則卡片，涵蓋歧視、仇恨言論與虛假訊息規範。
*   **圖片上傳**：支援圖片附件，透過 GAS 自動轉碼 Base64 並上傳至 Google Drive。
*   **分類引導**：針對靠北、告白、詩文等 8 大分類提供專屬字數限制與提示。

## 🛠️ 技術棧 (Tech Stack)

*   **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (CDN via index.html)
*   **Animation**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Backend**: Google Apps Script (Serverless) + Google Sheets + Google Drive

## 🚀 快速開始 (Quick Start)

### 1. 安裝依賴 (Install)

請確保您的電腦已安裝 [Node.js](https://nodejs.org/) (建議 v20+)。

```bash
npm install
```

### 2. 環境設定 (Configuration)

打開 `App.tsx`，修改以下兩個關鍵變數：

```typescript
// Google Apps Script 部署網址
const GOOGLE_SCRIPT_URL = "YOUR_GAS_WEB_APP_URL";

// Google Cloud Console 憑證 ID
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
```

### 3. 開發模式 (Dev)

啟動本地伺服器。
*注意：本地開發時 (`localhost`) Google Sign-In 可能會顯示「授權錯誤」，這是正常的，需部署到與 Google Cloud Console 設定相符的網域才能正常登入。*

```bash
npm run dev
```

### 4. 建置專案 (Build)

```bash
npm run build
```

## 📦 Google Apps Script 設定 (Backend Setup)

本專案依賴 Google Apps Script 接收資料。請確保您的 Google Sheet 具有以下欄位順序：

| 欄位順序 | 欄位名稱 | 說明 |
| :--- | :--- | :--- |
| 1 | 時間 | 自動記錄 |
| 2 | 同意規則 | 是/否 |
| 3 | 分類 | 靠北/告白/詩文... |
| 4 | 內容 | 投稿內文 |
| 5 | 有無圖片 | 有/沒有 |
| 6 | 圖片連結 | Google Drive 連結 |
| 7 | Email | 投稿者 Google 信箱 |
| 8 | 身分標籤 | 一中生投稿 / 一般投稿 |

**部署提醒：**
每次修改 GAS 程式碼後，必須執行 **「部署」 -> 「管理部署」 -> 「建立新版本」**，更新後的程式碼才會生效。

## ⚠️ Google Cloud Console 設定注意

為了讓 Google Sign-In 正常運作，請至 [Google Cloud Console](https://console.cloud.google.com/):
1.  建立 OAuth 2.0 用戶端 ID。
2.  在 **「已授權的 JavaScript 來源」** 加入您的部署網址 (例如 `https://tcfshcboy.github.io`)。
3.  **不要**在「已授權的重新導向 URI」填寫任何內容 (除非您有特殊後端需求)。

## 📜 版權 (License)

Designed by [TCFSH_CBOY](https://www.instagram.com/tcfsh_cboy/).
MIT License.
