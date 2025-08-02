import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  plugins: [cloudflare()],
  optimizeDeps: {
    exclude: []
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src')
    }
  }
})
