/**
 * APIサーバーのCORS設定テスト
 * 本番環境でのCORSエラーを防ぐための設定確認
 */

import { describe, expect, it } from 'vitest'
import app from './index'

describe('CORS設定', () => {
	describe('許可されたヘッダー', () => {
		it('X-Request-IDヘッダーが許可されていること', async () => {
			// プリフライトリクエスト（OPTIONS）を送信
			const response = await app.request('/api/test', {
				method: 'OPTIONS',
				headers: {
					Origin: 'https://saifuu.ryosuke-horie37.workers.dev',
					'Access-Control-Request-Method': 'GET',
					'Access-Control-Request-Headers': 'X-Request-ID',
				},
			})

			// CORSプリフライトが成功することを確認
			expect(response.status).toBe(204)

			// Access-Control-Allow-Headersにx-request-idが含まれていることを確認
			const allowedHeaders = response.headers.get('Access-Control-Allow-Headers')
			expect(allowedHeaders).toBeTruthy()
			expect(allowedHeaders?.toLowerCase()).toContain('x-request-id')
		})

		it('他の必要なヘッダーも引き続き許可されていること', async () => {
			const response = await app.request('/api/test', {
				method: 'OPTIONS',
				headers: {
					Origin: 'https://saifuu.ryosuke-horie37.workers.dev',
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'Content-Type, Authorization',
				},
			})

			expect(response.status).toBe(204)
			const allowedHeaders = response.headers.get('Access-Control-Allow-Headers')
			expect(allowedHeaders?.toLowerCase()).toContain('content-type')
			expect(allowedHeaders?.toLowerCase()).toContain('authorization')
		})
	})

	describe('許可されたオリジン', () => {
		it('本番環境のオリジンが許可されていること', async () => {
			const response = await app.request('/api/test', {
				method: 'OPTIONS',
				headers: {
					Origin: 'https://saifuu.ryosuke-horie37.workers.dev',
					'Access-Control-Request-Method': 'GET',
				},
			})

			expect(response.status).toBe(204)
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
				'https://saifuu.ryosuke-horie37.workers.dev'
			)
		})

		it('開発環境のオリジンも許可されていること', async () => {
			const response = await app.request('/api/test', {
				method: 'OPTIONS',
				headers: {
					Origin: 'http://localhost:3000',
					'Access-Control-Request-Method': 'GET',
				},
			})

			expect(response.status).toBe(204)
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
		})
	})

	describe('実際のリクエストでのCORS動作', () => {
		it('X-Request-IDヘッダーを含むGETリクエストが成功すること', async () => {
			// 実際のエンドポイントがない場合でも、CORSは機能するはず
			const response = await app.request('/api/health', {
				method: 'GET',
				headers: {
					Origin: 'https://saifuu.ryosuke-horie37.workers.dev',
					'X-Request-ID': 'test-request-id-123',
				},
			})

			// CORSヘッダーが正しく設定されていることを確認
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
				'https://saifuu.ryosuke-horie37.workers.dev'
			)
		})
	})
})
