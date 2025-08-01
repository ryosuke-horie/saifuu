import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    rollupOptions: {
      external: ['@shared/config/categories', '@shared/types', '@shared/validation']
    }
  },
  optimizeDeps: {
    exclude: []
  }
})
