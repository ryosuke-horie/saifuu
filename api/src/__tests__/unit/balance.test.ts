import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { type Context, Hono, type Next } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase, Env } from '../../db'
import * as schema from '../../db/schema'
import { testLogger } from '../../logger/factory'
import type { LoggingVariables } from '../../middleware/logging'
import { createBalanceApp } from '../../routes/balance'
import type { BalanceSummaryResponse } from '../../types/api'

// logWithContextとgetLoggerのモック
vi.mock('../../middleware/logging', () => ({
	logWithContext: vi.fn(),
	getLogger: vi.fn(() => testLogger),
	getRequestId: vi.fn(() => 'test-request-id'),
}))

describe('Balance API', () => {
	let db: ReturnType<typeof drizzle>
	let sqlite: Database.Database
	let app: Hono<{
		Bindings: Env
		Variables: { db: AnyDatabase } & LoggingVariables
	}>

	beforeEach(() => {
		// In-memory SQLiteデータベースを作成
		sqlite = new Database(':memory:')
		db = drizzle(sqlite, { schema })

		// マイグレーションを実行
		migrate(db, { migrationsFolder: './drizzle/migrations' })

		// テスト用のアプリケーションインスタンスを作成
		const balanceApp = createBalanceApp({ testDatabase: db as unknown as AnyDatabase })
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

		// ルートを登録
		app.route('/api/balance', balanceApp)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('GET /api/balance/summary', () => {
		it('現在月の収支サマリーを正しく返す', async () => {
			// テストデータの準備
			const now = new Date()
			const currentMonth = now.toISOString().substring(0, 7) // YYYY-MM形式

			// 現在月の収入と支出を作成
			await db.insert(schema.transactions).values([
				{
					type: 'income',
					amount: 450000,
					date: `${currentMonth}-05T00:00:00.000Z`,
					categoryId: 1,
					description: '給与',
				},
				{
					type: 'expense',
					amount: 200000,
					date: `${currentMonth}-10T00:00:00.000Z`,
					categoryId: 2,
					description: '家賃',
				},
				{
					type: 'expense',
					amount: 120000,
					date: `${currentMonth}-15T00:00:00.000Z`,
					categoryId: 3,
					description: '食費',
				},
			])

			// APIリクエスト
			const res = await app.request('/api/balance/summary')

			// レスポンスの検証
			if (res.status !== 200) {
				const error = await res.json()
				console.error('Error response:', error)
			}
			expect(res.status).toBe(200)
			const data: BalanceSummaryResponse = await res.json()

			expect(data).toEqual({
				income: 450000,
				expense: 320000,
				balance: 130000,
				savingsRate: 28.9,
				trend: 'positive',
			})
		})

		it('収入がない場合の貯蓄率を0として返す', async () => {
			// 支出のみのデータを作成
			const now = new Date()
			const currentMonth = now.toISOString().substring(0, 7)

			await db.insert(schema.transactions).values([
				{
					type: 'expense',
					amount: 50000,
					date: `${currentMonth}-10T00:00:00.000Z`,
					categoryId: 2,
					description: '支出',
				},
			])

			const res = await app.request('/api/balance/summary')

			expect(res.status).toBe(200)
			const data: BalanceSummaryResponse = await res.json()

			expect(data).toEqual({
				income: 0,
				expense: 50000,
				balance: -50000,
				savingsRate: 0,
				trend: 'negative',
			})
		})

		it('取引がない場合は全て0でneutralトレンドを返す', async () => {
			const res = await app.request('/api/balance/summary')

			expect(res.status).toBe(200)
			const data: BalanceSummaryResponse = await res.json()

			expect(data).toEqual({
				income: 0,
				expense: 0,
				balance: 0,
				savingsRate: 0,
				trend: 'neutral',
			})
		})

		it('過去の月の取引は含まれない', async () => {
			const now = new Date()
			const currentMonth = now.toISOString().substring(0, 7)

			// 前月の日付を計算
			const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
			const lastMonthStr = lastMonth.toISOString()

			await db.insert(schema.transactions).values([
				// 前月の取引（含まれない）
				{
					type: 'income',
					amount: 100000,
					date: lastMonthStr,
					categoryId: 1,
					description: '前月の収入',
				},
				// 今月の取引（含まれる）
				{
					type: 'income',
					amount: 50000,
					date: `${currentMonth}-10T00:00:00.000Z`,
					categoryId: 1,
					description: '今月の収入',
				},
			])

			const res = await app.request('/api/balance/summary')

			expect(res.status).toBe(200)
			const data: BalanceSummaryResponse = await res.json()

			expect(data.income).toBe(50000)
			expect(data.expense).toBe(0)
		})

		it('小数点第1位まで正しく貯蓄率を計算する', async () => {
			const now = new Date()
			const currentMonth = now.toISOString().substring(0, 7)

			await db.insert(schema.transactions).values([
				{
					type: 'income',
					amount: 300000,
					date: `${currentMonth}-01T00:00:00.000Z`,
					categoryId: 1,
					description: '収入',
				},
				{
					type: 'expense',
					amount: 123456,
					date: `${currentMonth}-10T00:00:00.000Z`,
					categoryId: 2,
					description: '支出',
				},
			])

			const res = await app.request('/api/balance/summary')

			expect(res.status).toBe(200)
			const data: BalanceSummaryResponse = await res.json()

			// (300000 - 123456) / 300000 * 100 = 58.848
			expect(data.savingsRate).toBe(58.8)
		})

		it('エラーハンドリングが正しく動作する', async () => {
			// エラーを発生させるモックDBを作成
			const errorDb = {
				select: () => {
					throw new Error('Database connection failed')
				},
			} as any

			// エラーアプリケーションを作成
			const errorBalanceApp = createBalanceApp({ testDatabase: errorDb })
			const errorApp = new Hono<{
				Bindings: Env
				Variables: { db: AnyDatabase } & LoggingVariables
			}>()

			errorApp.use(
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
					c.set('db', errorDb)
					await next()
				}
			)

			errorApp.route('/api/balance', errorBalanceApp)

			const res = await errorApp.request('/api/balance/summary')

			expect(res.status).toBe(500)
			const error = (await res.json()) as { error: string }
			expect(error).toHaveProperty('error')
			// エラーメッセージは汎用的なメッセージに変換される
			expect(error.error).toBe('予期しないエラーが発生しました')
		})
	})
})
