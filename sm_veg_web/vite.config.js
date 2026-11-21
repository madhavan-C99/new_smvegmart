import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 1. Backend APIs
      '^/adm/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '^/api/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // 2. Media file proxy (category & product images from backend)
      '^/media/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '^/category_snap/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '^/product_snap/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // 3. WebSocket proxy
      '^/ws/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
