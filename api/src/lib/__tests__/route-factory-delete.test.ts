import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { type Context, Hono, type Next } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase, Env } from '../../db'
import { transactions } from '../../db/schema'
import type { LoggingVariables } from '../../middleware/logging'
import { createCrudHandlers } from '../route-factory'

// logWithContextとgetLoggerのモック
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

describe('Route Factory - DELETE endpoint', () => {
	let db: ReturnType<typeof drizzle>
	let sqlite: Database.Database
	let app: Hono<{
		Bindings: Env
		Variables: { db: AnyDatabase } & LoggingVariables
	}>

	beforeEach(() => {
		// テスト用のインメモリデータベースを作成
		sqlite = new Database(':memory:')
		db = drizzle(sqlite)

		// テーブルを手動で作成（マイグレーションの代わり）
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS transactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				amount INTEGER NOT NULL,
				type TEXT NOT NULL,
				category_id INTEGER,
				description TEXT,
				date TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			)
		`)

		// アプリケーション初期化
		app = new Hono<{
			Bindings: Env
			Variables: { db: AnyDatabase } & LoggingVariables
		}>()
		app.use('*', async (c: Context, next: Next) => {
			c.set('db', db as unknown as AnyDatabase)
			await next()
		})

		// CRUDハンドラーを作成
		const handlers = createCrudHandlers({
			table: transactions,
			resourceName: 'transaction',
			validateCreate: () => ({ success: true, data: {} }),
			validateUpdate: () => ({ success: true, data: {} }),
			validateId: (id: string) => {
				const parsed = Number.parseInt(id, 10)
				if (Number.isNaN(parsed) || parsed <= 0) {
					return { success: false, errors: [{ message: 'Invalid ID format' }] }
				}
				return { success: true, data: parsed }
			},
		})

		app.delete('/:id', handlers.delete)
	})

	describe('HTTPステータスコードの互換性', () => {
		it('正常な削除時は204 No Contentを返す', async () => {
			// まずデータを作成
			const [created] = await db
				.insert(transactions)
				.values({
					amount: 1000,
					type: 'expense',
					date: '2024-01-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})
				.returning()

			// 削除リクエスト
			const response = await app.request(`/${created.id}`, {
				method: 'DELETE',
			})

			expect(response.status).toBe(204)
			expect(await response.text()).toBe('')
		})

		it('存在しないリソースの削除時は404を返す', async () => {
			const response = await app.request('/999999', {
				method: 'DELETE',
			})

			expect(response.status).toBe(404)
			const result = await response.json()
			expect(result).toHaveProperty('error')
		})

		it('無効なIDでの削除時は400を返す', async () => {
			const response = await app.request('/invalid-id', {
				method: 'DELETE',
			})

			expect(response.status).toBe(400)
			const result = await response.json()
			expect(result).toHaveProperty('error')
		})
	})

	describe('クライアント互換性の確認', () => {
		it('204レスポンスはボディを含まない', async () => {
			// データ作成
			const [created] = await db
				.insert(transactions)
				.values({
					amount: 1000,
					type: 'expense',
					date: '2024-01-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})
				.returning()

			// 削除リクエスト
			const response = await app.request(`/${created.id}`, {
				method: 'DELETE',
			})

			expect(response.status).toBe(204)
			// Content-Lengthヘッダーは設定されない場合もある
			const contentLength = response.headers.get('Content-Length')
			if (contentLength !== null) {
				expect(contentLength).toBe('0')
			}
			expect(await response.text()).toBe('')
		})

		it('エラー時は適切なJSONレスポンスを返す', async () => {
			const response = await app.request('/not-found', {
				method: 'DELETE',
			})

			// 'not-found'は無効なIDなので400エラーになる
			expect(response.status).toBe(400)
			expect(response.headers.get('Content-Type')).toContain('application/json')

			const result = await response.json()
			expect(result).toMatchObject({
				error: expect.any(String),
			})
		})
	})
})
