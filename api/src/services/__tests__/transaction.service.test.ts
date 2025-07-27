import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AnyDatabase } from '../../db'
import { type Transaction, transactions } from '../../db/schema'
import { TransactionService } from '../transaction.service'

describe('TransactionService', () => {
	let db: ReturnType<typeof drizzle>
	let sqlite: Database.Database
	let service: TransactionService

	beforeEach(() => {
		// In-memory SQLiteデータベースを作成
		sqlite = new Database(':memory:')
		db = drizzle(sqlite)

		// マイグレーションを実行
		migrate(db, { migrationsFolder: './drizzle/migrations' })

		// サービスのインスタンスを作成
		service = new TransactionService(db as unknown as AnyDatabase)
	})

	describe('getTransactions', () => {
		beforeEach(async () => {
			// テストデータを挿入
			const testData: Transaction[] = [
				{
					id: 1,
					amount: 1000,
					type: 'expense',
					categoryId: 3,
					description: '食費',
					date: '2025-01-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 2,
					amount: 50000,
					type: 'income',
					categoryId: 101,
					description: '給与',
					date: '2025-01-15',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			for (const tx of testData) {
				await db.insert(transactions).values(tx)
			}
		})

		it('カテゴリ情報付きで取引一覧を取得できる', async () => {
			const result = await service.getTransactions({})
			expect(result).toHaveLength(2)

			// カテゴリ情報が付加されている
			expect(result[0].category).toBeDefined()
			expect(result[0].category?.name).toBe('食費')

			expect(result[1].category).toBeDefined()
			expect(result[1].category?.name).toBe('給与')
		})

		it('フィルタパラメータが正しく適用される', async () => {
			const result = await service.getTransactions({ type: 'income' })
			expect(result).toHaveLength(1)
			expect(result[0].type).toBe('income')
		})
	})

	describe('getTransactionById', () => {
		it('IDで取引を取得できる', async () => {
			// テストデータを挿入
			await db.insert(transactions).values({
				amount: 1000,
				type: 'expense',
				categoryId: 3,
				description: 'テスト取引',
				date: '2025-01-01',
			})

			const result = await service.getTransactionById(1)
			expect(result).toBeDefined()
			expect(result?.amount).toBe(1000)
			expect(result?.category?.name).toBe('食費')
		})

		it('存在しないIDの場合nullを返す', async () => {
			const result = await service.getTransactionById(999)
			expect(result).toBeNull()
		})
	})

	describe('createTransaction', () => {
		it('有効なデータで取引を作成できる', async () => {
			const data = {
				amount: 1000,
				type: 'expense',
				categoryId: 3,
				description: '新規取引',
				date: '2025-01-01',
			}

			const result = await service.createTransaction(data)
			expect(result.success).toBe(true)

			if (result.success) {
				expect(result.data.amount).toBe(1000)
				expect(result.data.category?.name).toBe('食費')
				expect(result.data.id).toBeDefined()
				expect(result.data.createdAt).toBeDefined()
			}
		})

		it('無効なデータの場合エラーを返す', async () => {
			const data = {
				amount: -1000, // 負の金額
				type: 'invalid', // 無効なタイプ
				date: '2025/01/01', // 無効な日付形式
			}

			const result = await service.createTransaction(data)
			expect(result.success).toBe(false)

			if (!result.success) {
				expect(result.errors).toBeDefined()
				expect(result.errors.length).toBeGreaterThan(0)
			}
		})

		it('収入データを作成できる', async () => {
			const data = {
				amount: 100000,
				type: 'income',
				categoryId: 101,
				description: '給与',
				date: '2025-01-25',
			}

			const result = await service.createTransaction(data)
			expect(result.success).toBe(true)

			if (result.success) {
				expect(result.data.type).toBe('income')
				expect(result.data.category?.name).toBe('給与')
			}
		})
	})

	describe('updateTransaction', () => {
		beforeEach(async () => {
			// テストデータを挿入
			await db.insert(transactions).values({
				amount: 1000,
				type: 'expense',
				categoryId: 3,
				description: '初期データ',
				date: '2025-01-01',
			})
		})

		it('既存の取引を更新できる', async () => {
			const updateData = {
				amount: 2000,
				description: '更新後のデータ',
			}

			const result = await service.updateTransaction(1, updateData)
			expect(result.success).toBe(true)

			if (result.success) {
				expect(result.data.amount).toBe(2000)
				expect(result.data.description).toBe('更新後のデータ')
				expect(result.data.type).toBe('expense') // タイプは変更されない
			}
		})

		it('存在しないIDの場合エラーを返す', async () => {
			const result = await service.updateTransaction(999, { amount: 2000 })
			expect(result.success).toBe(false)

			if (!result.success) {
				expect(result.notFound).toBe(true)
			}
		})

		it('無効なデータの場合バリデーションエラーを返す', async () => {
			const result = await service.updateTransaction(1, { amount: -1000 })
			expect(result.success).toBe(false)

			if (!result.success) {
				expect(result.errors).toBeDefined()
			}
		})

		it('収入データの更新時に適切なバリデーションが適用される', async () => {
			// 収入データを作成
			await db.insert(transactions).values({
				amount: 100000,
				type: 'income',
				categoryId: 101,
				description: '給与',
				date: '2025-01-25',
			})

			// 無効なカテゴリIDで更新を試みる
			const result = await service.updateTransaction(2, { categoryId: 3 }) // 支出カテゴリ
			expect(result.success).toBe(false)

			if (!result.success) {
				expect(result.errors).toBeDefined()
			}
		})
	})

	describe('deleteTransaction', () => {
		beforeEach(async () => {
			// テストデータを挿入
			await db.insert(transactions).values({
				amount: 1000,
				type: 'expense',
				categoryId: 3,
				description: '削除対象',
				date: '2025-01-01',
			})
		})

		it('取引を削除できる', async () => {
			const result = await service.deleteTransaction(1)
			expect(result).toBe(true)

			// 削除後に取得を試みる
			const deleted = await service.getTransactionById(1)
			expect(deleted).toBeNull()
		})

		it('存在しないIDの場合falseを返す', async () => {
			const result = await service.deleteTransaction(999)
			expect(result).toBe(false)
		})
	})

	describe('getIncomeStats / getExpenseStats', () => {
		beforeEach(async () => {
			// テストデータを挿入
			await db.insert(transactions).values([
				{
					amount: 100000,
					type: 'income',
					categoryId: 101,
					date: '2025-01-01',
				},
				{
					amount: 50000,
					type: 'income',
					categoryId: 102,
					date: '2025-01-15',
				},
				{
					amount: 10000,
					type: 'expense',
					categoryId: 3,
					date: '2025-01-20',
				},
			])
		})

		it('収入統計を取得できる', async () => {
			const stats = await service.getIncomeStats()
			expect(stats.totalIncome).toBe(150000)
			expect(stats.incomeCount).toBe(2)
		})

		it('支出統計を取得できる', async () => {
			const stats = await service.getExpenseStats()
			expect(stats.totalExpense).toBe(10000)
			expect(stats.transactionCount).toBe(3)
		})
	})

	describe('validateId', () => {
		it('有効な数値IDを受け入れる', () => {
			const result = service.validateId(123)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(123)
			}
		})

		it('文字列IDを数値に変換する', () => {
			const result = service.validateId('456')
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe(456)
			}
		})

		it('無効なIDでエラーを返す', () => {
			const result = service.validateId('abc')
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.errors).toBeDefined()
			}
		})
	})
})
