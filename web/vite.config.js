import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => ({
  // Builds ALWAYS receive false, even with the flag or NODE_ENV=development.
  define: {
    __LOCAL_MOCK_BILLING__: JSON.stringify(command === 'serve' && mode === 'development' && loadEnv(mode, process.cwd(), '').VITE_LOCAL_MOCK_BILLING === 'true'),
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Optional: proxy custom Express endpoints during development
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
}))
