import { fileURLToPath, URL } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [cloudflare()],
	optimizeDeps: {
		exclude: [],
	},
	resolve: {
		alias: {
			'@shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
		},
	},
})
