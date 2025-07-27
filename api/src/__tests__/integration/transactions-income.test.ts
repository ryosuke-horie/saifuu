import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { type Context, Hono, type Next } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase, Env } from '../../db'
import type { Transaction } from '../../db/schema'
import { transactions } from '../../db/schema'
import { testLogger } from '../../logger/factory'
import type { LoggingVariables } from '../../middleware/logging'
import { createTransactionsApp } from '../../routes/transactions'

// APIレスポンスの型定義
interface TransactionResponse {
	id: number
	amount: number
	type: string
	categoryId?: number
	category?: {
		id: number
		name: string
		type: string
		color: string
		createdAt: string
		updatedAt: string
	} | null
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

// logWithContext、getLogger、getRequestIdのモック
vi.mock('../../middleware/logging', () => ({
	logWithContext: vi.fn(),
	getLogger: vi.fn(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})),
	getRequestId: vi.fn(() => 'test-request-id'),
}))

describe('Transaction API - Income Endpoints', () => {
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

		// テーブルを手動で作成（テスト用）
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS transactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				amount REAL NOT NULL,
				type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
				category_id INTEGER,
				description TEXT,
				date TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			)
		`)

		// カスタムミドルウェアでデータベースを注入
		const testApp = new Hono<{
			Bindings: Env
			Variables: { db: AnyDatabase } & LoggingVariables
		}>()

		// データベースミドルウェア
		testApp.use('*', async (c: Context, next: Next) => {
			c.set('db', db)
			c.set('logger', testLogger)
			await next()
		})

		// トランザクションエンドポイントをマウント
		const transactionsApp = createTransactionsApp({ testDatabase: db as unknown as AnyDatabase })
		testApp.route('/api/transactions', transactionsApp)

		app = testApp
	})

	describe('GET /api/transactions?type=income', () => {
		it('収入タイプでフィルタされた取引一覧を返すこと', async () => {
			// Arrange: テストデータに収入と支出の両方を含める
			const testTransactions: Transaction[] = [
				{
					id: 1,
					amount: 300000,
					type: 'income',
					categoryId: 101, // 給与カテゴリ
					description: '1月分給与',
					date: '2025-01-25',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 2,
					amount: 50000,
					type: 'expense',
					categoryId: 1, // 食費カテゴリ
					description: '食材購入',
					date: '2025-01-25',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 3,
					amount: 100000,
					type: 'income',
					categoryId: 102, // ボーナスカテゴリ
					description: '業績ボーナス',
					date: '2025-01-20',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			// テストデータをデータベースに挿入
			for (const tx of testTransactions) {
				await db.insert(transactions).values(tx)
			}

			// Act
			const res = await app.request('/api/transactions?type=income')

			// Assert
			expect(res.status).toBe(200)
			const data = (await res.json()) as TransactionResponse[]
			expect(data).toHaveLength(2)
			expect(data.every((t) => t.type === 'income')).toBe(true)
			expect(data[0]).toMatchObject({
				id: 1,
				amount: 300000,
				type: 'income',
				categoryId: 101,
			})
			expect(data[1]).toMatchObject({
				id: 3,
				amount: 100000,
				type: 'income',
				categoryId: 102,
			})
		})

		it('フィルタパラメータと組み合わせて収入を取得できること', async () => {
			// Arrange
			const testTransactions: Transaction[] = [
				{
					id: 1,
					amount: 300000,
					type: 'income',
					categoryId: 101,
					description: '1月分給与',
					date: '2025-01-25',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 2,
					amount: 100000,
					type: 'income',
					categoryId: 102,
					description: '業績ボーナス',
					date: '2025-01-15',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 3,
					amount: 50000,
					type: 'income',
					categoryId: 103,
					description: '副業収入',
					date: '2025-02-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			// テストデータをデータベースに挿入
			for (const tx of testTransactions) {
				await db.insert(transactions).values(tx)
			}

			// Act
			const res = await app.request(
				'/api/transactions?type=income&categoryId=101&startDate=2025-01-01&endDate=2025-01-31'
			)

			// Assert
			expect(res.status).toBe(200)
			const data = (await res.json()) as TransactionResponse[]
			expect(data).toHaveLength(1)
			expect(data[0]).toMatchObject({
				id: 1,
				categoryId: 101,
				date: '2025-01-25',
			})
		})
	})

	describe('POST /api/transactions (収入データ)', () => {
		it('新しい収入データを作成できること', async () => {
			// Arrange
			const newIncome = {
				amount: 300000,
				type: 'income',
				categoryId: 101,
				description: '1月分給与',
				date: '2025-01-25',
			}

			// Act
			const res = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newIncome),
			})

			// Assert
			expect(res.status).toBe(201)
			const data = (await res.json()) as TransactionResponse
			expect(data).toMatchObject({
				...newIncome,
				id: expect.any(Number),
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			})
		})

		it('収入固有のバリデーションが機能すること', async () => {
			// Arrange: 負の金額の収入データ
			const invalidIncome = {
				amount: -50000,
				type: 'income',
				categoryId: 101,
				description: '不正な収入',
				date: '2025-01-25',
			}

			// Act
			const res = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invalidIncome),
			})

			// Assert
			expect(res.status).toBe(400)
			const data = (await res.json()) as ErrorResponse
			expect(data.error).toContain('収入金額は0より大きい必要があります')
		})

		it('収入カテゴリIDの範囲検証が機能すること', async () => {
			// Arrange: 無効な収入カテゴリID
			const invalidCategoryIncome = {
				amount: 100000,
				type: 'income',
				categoryId: 50, // 収入カテゴリは101-105の範囲
				description: '不正なカテゴリ',
				date: '2025-01-25',
			}

			// Act
			const res = await app.request('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invalidCategoryIncome),
			})

			// Assert
			expect(res.status).toBe(400)
			const data = (await res.json()) as ErrorResponse
			expect(data.error).toContain('収入カテゴリは101-105の範囲で指定してください')
		})
	})

	describe('PUT /api/transactions/:id (収入データ)', () => {
		it('既存の収入データを更新できること', async () => {
			// Arrange
			const existingIncome: Transaction = {
				id: 1,
				amount: 300000,
				type: 'income',
				categoryId: 101,
				description: '1月分給与',
				date: '2025-01-25',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			// テストデータをデータベースに挿入
			await db.insert(transactions).values(existingIncome)

			const updateData = {
				amount: 320000,
				description: '1月分給与（残業代込み）',
			}

			// Act
			const res = await app.request('/api/transactions/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData),
			})

			// Assert
			expect(res.status).toBe(200)
			const data = (await res.json()) as TransactionResponse
			expect(data).toMatchObject({
				id: 1,
				amount: 320000,
				type: 'income',
				categoryId: 101,
				description: '1月分給与（残業代込み）',
			})
		})

		it('収入データの更新時にバリデーションが機能すること', async () => {
			// Arrange
			const existingIncome: Transaction = {
				id: 1,
				amount: 300000,
				type: 'income',
				categoryId: 101,
				description: '1月分給与',
				date: '2025-01-25',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			// テストデータをデータベースに挿入
			await db.insert(transactions).values(existingIncome)

			const updateData = {
				amount: -100000, // 負の金額
			}

			// Act
			const res = await app.request('/api/transactions/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData),
			})

			// Assert
			expect(res.status).toBe(400)
			const data = (await res.json()) as ErrorResponse
			expect(data.error).toContain('収入金額は0より大きい必要があります')
		})
	})

	describe('DELETE /api/transactions/:id (収入データ)', () => {
		it('収入データを削除できること', async () => {
			// Arrange
			const incomeToDelete: Transaction = {
				id: 1,
				amount: 300000,
				type: 'income',
				categoryId: 101,
				description: '1月分給与',
				date: '2025-01-25',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			// テストデータをデータベースに挿入
			await db.insert(transactions).values(incomeToDelete)

			// Act
			const res = await app.request('/api/transactions/1', {
				method: 'DELETE',
			})

			// Assert
			expect(res.status).toBe(204)

			// 削除後の確認
			const getRes = await app.request('/api/transactions/1')
			expect(getRes.status).toBe(404)
		})
	})

	describe('GET /api/transactions/stats?type=income', () => {
		it('収入の統計情報を取得できること', async () => {
			// Arrange
			const testTransactions: Transaction[] = [
				{
					id: 1,
					amount: 300000,
					type: 'income',
					categoryId: 101,
					description: '1月分給与',
					date: '2025-01-25',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 2,
					amount: 100000,
					type: 'income',
					categoryId: 102,
					description: 'ボーナス',
					date: '2025-01-20',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 3,
					amount: 50000,
					type: 'expense',
					categoryId: 1,
					description: '食費',
					date: '2025-01-15',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]
			// テストデータをデータベースに挿入
			for (const tx of testTransactions) {
				await db.insert(transactions).values(tx)
			}

			// Act
			const res = await app.request('/api/transactions/stats?type=income')

			// Assert
			expect(res.status).toBe(200)
			const data = (await res.json()) as { totalIncome: number; incomeCount: number }
			expect(data).toMatchObject({
				totalIncome: 400000,
				incomeCount: 2,
			})
		})
	})
})
