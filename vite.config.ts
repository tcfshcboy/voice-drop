import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ [修正] 因為您的倉庫名稱是 voice-drop，這裡必須設定為 '/voice-drop/'
  // 這樣 GitHub Pages 才能正確讀取到 CSS 和 JS 檔案
  base: '/voice-drop/', 
  server: {
    host: true
  }
})