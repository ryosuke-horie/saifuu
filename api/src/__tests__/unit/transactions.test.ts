import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { type Context, Hono, type Next } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase, Env } from '../../db'
import { testLogger } from '../../logger/factory'
import type { LoggingVariables } from '../../middleware/logging'
import { createTransactionsApp } from '../../routes/transactions'

// APIレスポンスの型定義
interface TransactionResponse {
	id: number
	amount: number
	type: string
	categoryId?: number
	categoryName?: string
	description?: string
	date: string
	createdAt: string
	updatedAt: string
}

interface ErrorResponse {
	error: string
	details?: Array<{
		field: string
		message: string
		code?: string
	}>
}

// logWithContextのモック
vi.mock('../../middleware/logging', () => ({
	logWithContext: vi.fn(),
}))

describe('Transactions API with Zod - Unit Tests', () => {
	let db: ReturnType<typeof drizzle>
	let sqlite: Database.Database
	let app: Hono<{
		Bindings: Env
		Variables: { db: AnyDatabase } & LoggingVariables
	}>

	beforeEach(() => {
		// In-memory SQLiteデータベースを作成
		sqlite = new Database(':memory:')
		db = drizzle(sqlite)

		// マイグレーションを実行
		migrate(db, { migrationsFolder: './drizzle/migrations' })

		// テスト用のアプリケーションインスタンスを作成
		const transactionsApp = createTransactionsApp({ testDatabase: db as unknown as AnyDatabase })
		app = new Hono<{
			Bindings: Env
			Variables: { db: AnyDatabase } & LoggingVariables
		}>()

		// ミドルウェアのモック（テストでは必要最小限）
		app.use(
			'*',
			async (
				c: Context<{
					Bindings: Env
					Variables: { db: AnyDatabase } & LoggingVariables
				}>,
				next: Next
			) => {
				c.set('requestId', 'test-request-id')
				c.set('logger', testLogger)
				c.set('db', db as unknown as AnyDatabase)
				await next()
			}
		)

		app.route('/api/transactions', transactionsApp)
	})

	describe('POST /transactions', () => {
		it('should create a new transaction', async () => {
			const transactionData = {
				amount: 1000,
				type: 'expense',
				categoryId: 1,
				description: 'テスト取引',
				date: '2024-01-01',
			}

			const response = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(transactionData),
			})

			expect(response.status).toBe(201)
			const result = (await response.json()) as TransactionResponse
			expect(result).toMatchObject({
				amount: 1000,
				type: 'expense',
				categoryId: 1,
				description: 'テスト取引',
				date: '2024-01-01',
			})
			expect(result.id).toBeDefined()
		})

		it('should reject with Japanese error messages for validation failures', async () => {
			const invalidData = {
				amount: -100,
				type: 'invalid',
				date: '2024/01/01', // 無効なフォーマット
			}

			const response = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invalidData),
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(result.error).toBeDefined()
			expect(result.details).toBeDefined()

			// エラーメッセージが日本語であることを確認
			const errors = result.details!
			expect(errors.some((e) => e.field === 'amount' && e.message.includes('正の数値'))).toBe(true)
			expect(
				errors.some((e) => e.field === 'type' && e.message.includes('expenseまたはincome'))
			).toBe(true)
			expect(errors.some((e) => e.field === 'date' && e.message.includes('ISO 8601形式'))).toBe(
				true
			)
		})

		it('should handle missing required fields', async () => {
			const incompleteData = {
				amount: 1000,
				type: 'expense',
				// dateが欠落
			}

			const response = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(incompleteData),
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(result.details!.some((e) => e.field === 'date' && e.message.includes('必須'))).toBe(
				true
			)
		})
	})

	describe('PUT /transactions/:id', () => {
		it('should update a transaction', async () => {
			// まず取引を作成
			const createResponse = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: 1000,
					type: 'expense',
					categoryId: 1,
					description: '初期データ',
					date: '2024-01-01',
				}),
			})

			const created = (await createResponse.json()) as TransactionResponse

			// 更新
			const updateData = {
				amount: 2000,
				description: '更新後のデータ',
			}

			const response = await app.request(`/api/transactions/${created.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData),
			})

			expect(response.status).toBe(200)
			const result = (await response.json()) as TransactionResponse
			expect(result.amount).toBe(2000)
			expect(result.description).toBe('更新後のデータ')
		})

		it('should validate update data with Zod', async () => {
			const invalidUpdate = {
				amount: 10_000_001, // 上限を超える
			}

			const response = await app.request('/api/transactions/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invalidUpdate),
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			expect(
				result.details!.some((e) => e.field === 'amount' && e.message.includes('10000000円以下'))
			).toBe(true)
		})
	})

	describe('ID validation', () => {
		it('should reject invalid ID formats', async () => {
			const response = await app.request('/api/transactions/abc', {
				method: 'GET',
			})

			expect(response.status).toBe(400)
			const result = (await response.json()) as ErrorResponse
			// デバッグ用
			console.log('Error result:', JSON.stringify(result, null, 2))
			expect(result.error).toBeDefined()
			expect(result.details).toBeDefined()
			expect(result.details!.length).toBeGreaterThan(0)
		})

		it('should accept string IDs that can be converted to numbers', async () => {
			// まず取引を作成
			const createResponse = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: 1000,
					type: 'expense',
					date: '2024-01-01',
				}),
			})

			const created = (await createResponse.json()) as TransactionResponse

			// 文字列IDでアクセス
			const response = await app.request(`/api/transactions/${created.id}`, {
				method: 'GET',
			})

			expect(response.status).toBe(200)
		})
	})
})
