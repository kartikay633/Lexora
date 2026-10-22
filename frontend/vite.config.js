import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // Follow the backend's PORT (default 3002) so a custom port works for both.
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT || 3002}`,
        changeOrigin: true,
      },
    },
  },
})
