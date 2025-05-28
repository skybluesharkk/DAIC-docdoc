
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: process.env.VITE_SOLAR_API_URL,  // ex: 'https://api.upstage.ai'
        changeOrigin: true,                      // Host 헤더를 타겟 서버에 맞춰 바꿔줌
        secure: true,                            // https를 그대로 쓸 경우 true
      }
    }
  }
})
