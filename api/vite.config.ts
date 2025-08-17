import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [cloudflare()],
  optimizeDeps: {
    exclude: []
  },
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared/src', import.meta.url))
    }
  }
})
