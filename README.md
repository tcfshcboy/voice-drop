# 靠北臺中一中 🍡 投稿系統 (TCFSH CBOY Submission Form)

> 2026 全新改版 - 專為 Gen Z 打造的匿名投稿平台。
> Powered by 🍡 Dango Power.

![Project Preview](https://i.meee.com.tw/xqGCQbQ.png)

## 🌟 特色 (Features)

*   **沉浸式 UI/UX**：採用暗黑模式 (Dark Mode) 與高對比霓虹配色，符合現代審美。
*   **動態吉祥物**：可愛的 Dango 糰子會根據你選擇的分類改變表情 (🍡✨, 🍡🤥, 🍡📜)。
*   **分類引導**：針對靠北、告白、詩文等不同需求提供專屬提示與字數限制。
*   **即時驗證**：
    *   強制驗證 Google 帳號或 `tc.edu.tw` 教育信箱。
    *   智慧識別「一中生」與「一般投稿」身份。
    *   字數與圖片大小防呆機制。
*   **圖片上傳**：支援圖片附件，自動轉碼 Base64 傳送。
*   **RWD 響應式**：手機、平板、電腦完美支援。

## 🛠️ 技術棧 (Tech Stack)

*   **Core**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (CDN)
*   **Animation**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Backend**: Google Apps Script (Serverless)

## 🚀 快速開始 (Quick Start)

### 1. 安裝依賴 (Install)

請確保您的電腦已安裝 [Node.js](https://nodejs.org/)。

```bash
npm install
```

### 2. 開發模式 (Dev)

啟動本地伺服器，即時預覽修改。

```bash
npm run dev
```

### 3. 建置專案 (Build)

打包成靜態檔案，準備部署。

```bash
npm run build
```

建置完成後的檔案會位於 `dist/` 資料夾中。

## 📦 部署 (Deployment)

本專案為純靜態網頁 (SPA)，可輕鬆部署於任何靜態託管服務：

*   **Vercel / Netlify**: 連結 GitHub Repo，設定 Build Command 為 `npm run build`，Output Directory 為 `dist` 即可。
*   **GitHub Pages**: 可透過 GitHub Actions 自動部署。

## ⚠️ 注意事項

*   **Google Script URL**: 請確保 `App.tsx` 中的 `GOOGLE_SCRIPT_URL` 已替換為您實際部署的 Google Apps Script 網址。
*   **跨域問題 (CORS)**: 由於使用 Google Apps Script 作為後端，前端 fetch 請求設定為 `mode: "no-cors"`，這是正常現象，伺服器端仍會收到資料。

## 📜 版權 (License)

Designed by [TCFSH_CBOY](https://www.instagram.com/tcfsh_cboy/).
MIT License.
