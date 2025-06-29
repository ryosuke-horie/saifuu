/**
 * Cloudflare Workers ランタイム環境のテスト
 * Workers特有の機能とAPIの動作を検証
 */
/// <reference path="./types.d.ts" />

import { env, SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import type {
	CategoriesListResponse,
	D1QueryResult,
	HealthCheckResponse,
	SqliteMaster,
} from './api-types'

describe('Cloudflare Workers Runtime', () => {
	describe('基本的なランタイム機能', () => {
		it('SELF.fetch が使用可能である', async () => {
			expect(SELF.fetch).toBeDefined()
			expect(typeof SELF.fetch).toBe('function')
		})

		it('環境変数にアクセスできる', () => {
			expect(env).toBeDefined()
			expect(env.DB).toBeDefined()
		})

		it('D1データベースバインディングが利用可能', () => {
			expect(env.DB).toBeDefined()
			expect(typeof env.DB.prepare).toBe('function')
			expect(typeof env.DB.exec).toBe('function')
		})
	})

	describe('HTTPレスポンス処理', () => {
		it('基本的なHTTPリクエストが処理される', async () => {
			const response = await SELF.fetch('https://example.com/')

			expect(response).toBeDefined()
			expect(response.status).toBeDefined()
			expect(typeof response.status).toBe('number')
		})

		it('JSONレスポンスが正しく処理される', async () => {
			const response = await SELF.fetch('https://example.com/api/health')

			expect(response.headers.get('content-type')).toContain('application/json')

			const data = (await response.json()) as HealthCheckResponse
			expect(data).toBeDefined()
			expect(typeof data).toBe('object')
		})

		it('適切なHTTPステータスコードが返される', async () => {
			const healthResponse = await SELF.fetch('https://example.com/api/health')
			expect(healthResponse.status).toBe(200)

			const notFoundResponse = await SELF.fetch('https://example.com/nonexistent')
			expect(notFoundResponse.status).toBe(404)
		})
	})

	describe('Hono フレームワーク統合', () => {
		it('Honoアプリケーションが正常に動作する', async () => {
			const response = await SELF.fetch('https://example.com/')

			expect(response.status).toBe(200)
			const html = await response.text()
			expect(html).toContain('Saifuu API')
		})

		it('ルーティングが正常に機能する', async () => {
			const healthResponse = await SELF.fetch('https://example.com/api/health')
			expect(healthResponse.status).toBe(200)

			const categoriesResponse = await SELF.fetch('https://example.com/api/categories')
			expect(categoriesResponse.status).toBe(200)
		})

		it('Honoのコンテキストオブジェクトが利用可能', async () => {
			// コンテキストオブジェクトの機能確認（間接的）
			const response = await SELF.fetch('https://example.com/api/health')
			const data = (await response.json()) as HealthCheckResponse

			// c.json() メソッドが正常に動作していることを確認
			expect(data).toBeDefined()
			expect(typeof data).toBe('object')
		})
	})

	describe('データベース統合', () => {
		it('D1データベースへの接続が可能', async () => {
			const response = await SELF.fetch('https://example.com/api/health')
			const data = (await response.json()) as HealthCheckResponse

			expect(response.status).toBe(200)
			expect(data.database).toBe('connected')
		})

		it('Drizzle ORMが正常に動作する', async () => {
			// カテゴリエンドポイントでDrizzle ORMの動作を確認
			const response = await SELF.fetch('https://example.com/api/categories')

			expect(response.status).toBe(200)
			const data = (await response.json()) as CategoriesListResponse
			expect(Array.isArray(data)).toBe(true)
		})

		it('データベーステーブルにアクセスできる', async () => {
			// 実際にDBクエリが実行されることを確認
			const db = env.DB
			const result = (await db
				.prepare('SELECT name FROM sqlite_master WHERE type="table"')
				.all()) as D1QueryResult<SqliteMaster>

			expect(result.success).toBe(true)
			expect(result.results).toBeDefined()
		})
	})

	describe('パフォーマンス特性', () => {
		it('コールドスタートでも適切なレスポンス時間', async () => {
			const startTime = performance.now()
			const response = await SELF.fetch('https://example.com/api/health')
			const endTime = performance.now()

			expect(response.status).toBe(200)

			// Workers環境でのコールドスタート時間の想定値（2秒以内）
			const responseTime = endTime - startTime
			expect(responseTime).toBeLessThan(2000)
		})

		it('連続リクエストでのレスポンス安定性', async () => {
			const requests = Array.from({ length: 5 }, () => SELF.fetch('https://example.com/api/health'))

			const responses = await Promise.all(requests)

			for (const response of responses) {
				expect(response.status).toBe(200)
			}
		})
	})

	describe('エラーハンドリング', () => {
		it('存在しないルートで適切な404レスポンス', async () => {
			const response = await SELF.fetch('https://example.com/nonexistent/route')

			expect(response.status).toBe(404)
		})

		it('不正なHTTPメソッドでの適切なエラーレスポンス', async () => {
			const response = await SELF.fetch('https://example.com/api/categories', {
				method: 'INVALID_METHOD',
			})

			// 405 Method Not Allowed または 404 Not Found が返されることを確認
			expect([404, 405].includes(response.status)).toBe(true)
		})
	})

	describe('Workers固有の制約・特性', () => {
		it('V8エンジンのJavaScript実行環境', () => {
			// V8エンジンでサポートされているJavaScript機能の確認
			expect(typeof Promise).toBe('function')
			expect(typeof (async () => {})).toBe('function')
			expect(Array.isArray).toBeDefined()
		})

		it('Web標準APIが利用可能', () => {
			expect(typeof fetch).toBe('function')
			expect(typeof Request).toBe('function')
			expect(typeof Response).toBe('function')
			expect(typeof URL).toBe('function')
		})

		it('Cloudflare Workers固有のAPIが利用可能', () => {
			// テスト環境で利用可能なWorkersのAPIを確認
			expect(env).toBeDefined()
		})
	})

	describe('セキュリティ機能', () => {
		it('環境変数が適切に分離されている', () => {
			// 環境変数へのアクセスが制限されていることを確認
			expect(env.DB).toBeDefined()

			// processオブジェクトが存在しないことを確認（Node.js環境との分離）
			expect(typeof process === 'undefined' || !process.env).toBe(true)
		})

		it('適切なContent-Typeヘッダーが設定される', async () => {
			const response = await SELF.fetch('https://example.com/api/health')

			expect(response.headers.get('content-type')).toContain('application/json')
		})
	})

	describe('TypeScript統合', () => {
		it('型定義が正しく適用されている', async () => {
			// TypeScriptコンパイルが成功していることを間接的に確認
			const response = await SELF.fetch('https://example.com/api/health')

			expect(response.status).toBe(200)

			// 型安全性の恩恵を受けているコードが正常に動作することを確認
			const data = (await response.json()) as HealthCheckResponse
			expect(data.status).toBeDefined()
		})
	})
})
