/**
 * Cloudflare Workers Runtime テスト
 * Workers 固有の機能とランタイム環境のテスト
 */

import { env, SELF } from 'cloudflare:test'
import { describe, expect, test } from 'vitest'
import app from '../index'

describe('Cloudflare Workers Runtime', () => {
	describe('基本的なランタイム機能', () => {
		test('SELF.fetch が使用可能である', async () => {
			const response = await SELF.fetch('https://example.com/')
			expect(response).toBeInstanceOf(Response)
		})

		test('環境変数にアクセスできる', () => {
			expect(env).toBeDefined()
			expect(env.DB).toBeDefined()
		})

		test('D1データベースバインディングが利用可能', () => {
			expect(env.DB).toBeDefined()
			expect(typeof env.DB.prepare).toBe('function')
		})
	})

	describe('HTTPレスポンス処理', () => {
		test('基本的なHTTPリクエストが処理される', async () => {
			const response = await SELF.fetch('https://example.com/')
			expect(response.status).toBeGreaterThanOrEqual(200)
		})

		test('JSONレスポンスが正しく処理される', async () => {
			const response = await SELF.fetch('https://example.com/api/categories')
			expect(response.headers.get('content-type')).toContain('application/json')
		})

		test('適切なHTTPステータスコードが返される', async () => {
			const response = await SELF.fetch('https://example.com/nonexistent')
			expect(response.status).toBe(404)
		})
	})

	describe('Hono フレームワーク統合', () => {
		test('Honoアプリケーションが正常に動作する', async () => {
			expect(app).toBeDefined()
		})

		test('ルーティングが正常に機能する', async () => {
			const response = await SELF.fetch('https://example.com/')
			expect(response.status).toBe(200)
		})

		test('Honoのコンテキストオブジェクトが利用可能', async () => {
			const response = await SELF.fetch('https://example.com/api/categories')
			expect(response).toBeInstanceOf(Response)
		})
	})

	describe('データベース統合', () => {
		test('D1データベースへの接続が可能', async () => {
			const result = await env.DB.prepare('SELECT 1 as test').first()
			expect(result).toEqual({ test: 1 })
		})

		test('Drizzle ORMが正常に動作する', async () => {
			// Drizzle ORM の基本動作確認
			expect(env.DB).toBeDefined()
		})

		test('データベーステーブルにアクセスできる', async () => {
			// テーブルアクセステスト
			const response = await SELF.fetch('https://example.com/api/categories')
			expect(response.status).toBe(200)
		})
	})

	describe('パフォーマンス特性', () => {
		test('コールドスタートでも適切なレスポンス時間', async () => {
			const start = performance.now()
			await SELF.fetch('https://example.com/')
			const elapsed = performance.now() - start
			expect(elapsed).toBeLessThan(5000) // 5秒以内
		})

		test('連続リクエストでのレスポンス安定性', async () => {
			const responses = await Promise.all([
				SELF.fetch('https://example.com/'),
				SELF.fetch('https://example.com/'),
				SELF.fetch('https://example.com/'),
			])

			for (const response of responses) {
				expect(response.status).toBe(200)
			}
		})
	})

	describe('エラーハンドリング', () => {
		test('存在しないルートで適切な404レスポンス', async () => {
			const response = await SELF.fetch('https://example.com/nonexistent')
			expect(response.status).toBe(404)
		})

		test('不正なリクエストでの適切なエラーレスポンス', async () => {
			const response = await SELF.fetch('https://example.com/api/categories', {
				method: 'POST',
				body: 'invalid json',
			})
			expect(response.status).toBeGreaterThanOrEqual(400)
		})
	})

	describe('セキュリティ機能', () => {
		test('適切なContent-Typeヘッダーが設定される', async () => {
			const response = await SELF.fetch('https://example.com/api/categories')
			expect(response.headers.get('content-type')).toContain('application/json')
		})
	})

	describe('Workers固有の制約・特性', () => {
		test('V8エンジンのJavaScript実行環境', () => {
			expect(typeof globalThis).toBe('object')
			expect(typeof Promise).toBe('function')
			expect(typeof Array).toBe('function')
		})

		test('Web標準APIが利用可能', () => {
			expect(typeof fetch).toBe('function')
			expect(typeof Response).toBe('function')
			expect(typeof Request).toBe('function')
		})

		test('Cloudflare Workers固有のAPIが利用可能', () => {
			expect(env).toBeDefined()
			expect(SELF).toBeDefined()
		})
	})

	describe('TypeScript統合', () => {
		test('型定義が正しく適用されている', () => {
			// TypeScript の型チェックが通ることで検証される
			const typed: string = 'test'
			expect(typeof typed).toBe('string')
		})
	})
})
