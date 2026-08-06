import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/gas': {
        target: 'https://script.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gas/, '/macros/s/AKfycbyFsOFjOTpNOdfI-y4gcoGVI1mctSFQPgA7BSYnYj6MqCoHN7wbDUCOpyWj83fXPMLN-Q/exec'),
        followRedirects: true
      }
    }
  }
})
