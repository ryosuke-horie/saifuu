import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AnyDatabase } from '../../db'
import { type Transaction, transactions } from '../../db/schema'
import { TransactionQueryService } from '../transaction-query.service'

describe('TransactionQueryService', () => {
	let db: ReturnType<typeof drizzle>
	let sqlite: Database.Database
	let service: TransactionQueryService

	beforeEach(() => {
		// In-memory SQLiteデータベースを作成
		sqlite = new Database(':memory:')
		db = drizzle(sqlite)

		// テーブルを手動で作成（マイグレーションの代替）
		// 本番環境のスキーマとの一貫性を保つため、Drizzleスキーマ定義に基づく
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS transactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				amount INTEGER NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
				category_id INTEGER,
				description TEXT,
				date TEXT NOT NULL,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`)

		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`)

		// サービスのインスタンスを作成
		service = new TransactionQueryService(db as unknown as AnyDatabase)
	})

	describe('findTransactions', () => {
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
				{
					id: 3,
					amount: 2000,
					type: 'expense',
					categoryId: 2,
					description: '交通費',
					date: '2025-01-20',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			for (const tx of testData) {
				await db.insert(transactions).values(tx)
			}
		})

		it('全ての取引を取得できる', async () => {
			const result = await service.findTransactions({})
			expect(result).toHaveLength(3)
		})

		it('typeでフィルタリングできる', async () => {
			const expenses = await service.findTransactions({ type: 'expense' })
			expect(expenses).toHaveLength(2)
			expect(expenses.every((tx) => tx.type === 'expense')).toBe(true)

			const incomes = await service.findTransactions({ type: 'income' })
			expect(incomes).toHaveLength(1)
			expect(incomes[0].type).toBe('income')
		})

		it('categoryIdでフィルタリングできる', async () => {
			const result = await service.findTransactions({ categoryId: 3 })
			expect(result).toHaveLength(1)
			expect(result[0].categoryId).toBe(3)
		})

		it('日付範囲でフィルタリングできる', async () => {
			const result = await service.findTransactions({
				startDate: '2025-01-10',
				endDate: '2025-01-20',
			})
			expect(result).toHaveLength(2)
			expect(result.every((tx) => tx.date >= '2025-01-10' && tx.date <= '2025-01-20')).toBe(true)
		})

		it('開始日のみでフィルタリングできる', async () => {
			const result = await service.findTransactions({
				startDate: '2025-01-15',
			})
			expect(result).toHaveLength(2)
			expect(result.every((tx) => tx.date >= '2025-01-15')).toBe(true)
		})

		it('終了日のみでフィルタリングできる', async () => {
			const result = await service.findTransactions({
				endDate: '2025-01-15',
			})
			expect(result).toHaveLength(2)
			expect(result.every((tx) => tx.date <= '2025-01-15')).toBe(true)
		})

		it('複数の条件でフィルタリングできる', async () => {
			const result = await service.findTransactions({
				type: 'expense',
				startDate: '2025-01-01',
				endDate: '2025-01-10',
			})
			expect(result).toHaveLength(1)
			expect(result[0].id).toBe(1)
		})

		it('limitとoffsetでページネーションできる', async () => {
			const page1 = await service.findTransactions({ limit: 2, offset: 0 })
			expect(page1).toHaveLength(2)

			const page2 = await service.findTransactions({ limit: 2, offset: 2 })
			expect(page2).toHaveLength(1)
		})
	})

	describe('calculateIncomeStats', () => {
		beforeEach(async () => {
			// テストデータを挿入
			const testData: Transaction[] = [
				{
					id: 1,
					amount: 100000,
					type: 'income',
					categoryId: 101,
					description: '給与',
					date: '2025-01-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 2,
					amount: 50000,
					type: 'income',
					categoryId: 102,
					description: 'ボーナス',
					date: '2025-01-15',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 3,
					amount: 10000,
					type: 'expense',
					categoryId: 3,
					description: '食費',
					date: '2025-01-20',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			for (const tx of testData) {
				await db.insert(transactions).values(tx)
			}
		})

		it('収入の合計と件数を正しく計算できる', async () => {
			const stats = await service.calculateIncomeStats()
			expect(stats.totalIncome).toBe(150000)
			expect(stats.incomeCount).toBe(2)
		})

		it('収入データがない場合は0を返す', async () => {
			// 全データを削除
			await db.delete(transactions)
			await db.insert(transactions).values({
				amount: 1000,
				type: 'expense',
				categoryId: 3,
				date: '2025-01-01',
			})

			const stats = await service.calculateIncomeStats()
			expect(stats.totalIncome).toBe(0)
			expect(stats.incomeCount).toBe(0)
		})
	})

	describe('calculateExpenseStats', () => {
		beforeEach(async () => {
			// テストデータを挿入
			const testData: Transaction[] = [
				{
					id: 1,
					amount: 5000,
					type: 'expense',
					categoryId: 3,
					description: '食費',
					date: '2025-01-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 2,
					amount: 3000,
					type: 'expense',
					categoryId: 2,
					description: '交通費',
					date: '2025-01-15',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: 3,
					amount: 100000,
					type: 'income',
					categoryId: 101,
					description: '給与',
					date: '2025-01-20',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			for (const tx of testData) {
				await db.insert(transactions).values(tx)
			}
		})

		it('支出の合計と全取引件数を正しく計算できる', async () => {
			const stats = await service.calculateExpenseStats()
			expect(stats.totalExpense).toBe(8000)
			expect(stats.transactionCount).toBe(3) // 全取引数
		})

		it('支出データがない場合は0を返す', async () => {
			// 全データを削除
			await db.delete(transactions)
			await db.insert(transactions).values({
				amount: 100000,
				type: 'income',
				categoryId: 101,
				date: '2025-01-01',
			})

			const stats = await service.calculateExpenseStats()
			expect(stats.totalExpense).toBe(0)
			expect(stats.transactionCount).toBe(1)
		})
	})
})
