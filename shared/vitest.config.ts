import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
		// テスト環境でタイムゾーンを固定
		env: {
			TZ: 'Asia/Tokyo',
		},
	},
})
