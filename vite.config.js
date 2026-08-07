import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    proxy: {
      '/wp-json': {
        target: 'http://127.0.0.1',
        changeOrigin: true,
        secure: false,
        headers: {
          Host: 'modena.local',
        },
      },
      '/wp-content': {
        target: 'http://127.0.0.1',
        changeOrigin: true,
        secure: false,
        headers: {
          Host: 'modena.local',
        },
      },
    },
  },
})
