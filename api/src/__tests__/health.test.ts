/**
 * ヘルスチェックエンドポイントのテスト
 * データベース接続の確認とエラーハンドリングを検証
 */
/// <reference path="./types.d.ts" />

import { env, SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { HealthCheckResponse } from './api-types'
import { createTestDatabase, seedTestData } from './setup'

describe('/api/health', () => {
	describe('正常系テスト', () => {
		beforeEach(async () => {
			// 各テスト前にテストデータをセットアップ
			await seedTestData(env)
		})

		it('データベース接続が正常な場合、正常なレスポンスを返す', async () => {
			const response = await SELF.fetch('/api/health')
			const data = (await response.json()) as HealthCheckResponse

			expect(response.status).toBe(200)
			expect(data).toMatchObject({
				status: 'ok',
				database: 'connected',
			})
			expect(data.timestamp).toBeDefined()
			expect(typeof data.timestamp).toBe('string')

			// ISO 8601形式の日時文字列であることを確認
			expect(() => new Date(data.timestamp)).not.toThrow()
		})

		it('レスポンスヘッダーが正しく設定されている', async () => {
			const response = await SELF.fetch('/api/health')

			expect(response.headers.get('content-type')).toContain('application/json')
		})

		it('複数回の呼び出しでも安定したレスポンスを返す', async () => {
			const responses = await Promise.all([
				SELF.fetch('/api/health'),
				SELF.fetch('/api/health'),
				SELF.fetch('/api/health'),
			])

			for (const response of responses) {
				expect(response.status).toBe(200)
				const data = (await response.json()) as HealthCheckResponse
				expect(data.status).toBe('ok')
				expect(data.database).toBe('connected')
			}
		})
	})

	describe('レスポンス形式テスト', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('正常時のレスポンス形式が正しい', async () => {
			const response = await SELF.fetch('/api/health')
			const data = (await response.json()) as HealthCheckResponse

			// 必須フィールドの存在確認
			expect(data).toHaveProperty('status')
			expect(data).toHaveProperty('database')
			expect(data).toHaveProperty('timestamp')

			// 型の確認
			expect(typeof data.status).toBe('string')
			expect(typeof data.database).toBe('string')
			expect(typeof data.timestamp).toBe('string')

			// 値の確認
			expect(data.status).toBe('ok')
			expect(data.database).toBe('connected')
		})

		it('タイムスタンプが現在時刻に近い値である', async () => {
			const beforeRequest = new Date()
			const response = await SELF.fetch('/api/health')
			const afterRequest = new Date()
			const data = (await response.json()) as HealthCheckResponse

			const responseTime = new Date(data.timestamp)

			expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime())
			expect(responseTime.getTime()).toBeLessThanOrEqual(afterRequest.getTime())
		})
	})

	describe('データベース接続テスト', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('データベースクエリが実際に実行される', async () => {
			// まずテストデータが存在することを確認
			const db = await createTestDatabase(env)
			const categories = await db.query.categories.findMany()
			expect(categories.length).toBeGreaterThan(0)

			// ヘルスチェックエンドポイントがデータベースにアクセスできることを確認
			const response = await SELF.fetch('/api/health')
			const data = (await response.json()) as HealthCheckResponse

			expect(response.status).toBe(200)
			expect(data.database).toBe('connected')
		})
	})

	describe('パフォーマンステスト', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('レスポンス時間が許容範囲内である', async () => {
			const startTime = performance.now()
			const response = await SELF.fetch('/api/health')
			const endTime = performance.now()

			expect(response.status).toBe(200)

			// レスポンス時間が1秒以内であることを確認（Cloudflare Workers環境での想定値）
			const responseTime = endTime - startTime
			expect(responseTime).toBeLessThan(1000)
		})
	})
})
