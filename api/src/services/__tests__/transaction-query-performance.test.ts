import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { transactions } from '../../db/schema'
import { TransactionQueryService } from '../transaction-query.service'

describe('TransactionQueryService - Performance Optimization', () => {
	let db: ReturnType<typeof drizzle>
	let sqlite: Database.Database
	let service: TransactionQueryService

	beforeEach(() => {
		// テスト用のインメモリデータベースを作成
		sqlite = new Database(':memory:')
		db = drizzle(sqlite)

		// テーブルを手動で作成
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

		// サービスのインスタンスを作成
		service = new TransactionQueryService(db)
	})

	describe('収入統計の計算', () => {
		it('SQLの集約関数を使用して効率的に統計を計算する', async () => {
			// 大量のテストデータを作成
			const testData = []
			for (let i = 1; i <= 1000; i++) {
				testData.push({
					amount: i * 100,
					type: i % 2 === 0 ? 'income' : 'expense',
					date: '2024-01-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})
			}
			await db.insert(transactions).values(testData)

			// SQLクエリをスパイ
			const querySpy = vi.spyOn(db, 'select')

			// 統計を計算
			const stats = await service.calculateIncomeStats()

			// 期待される結果を検証
			expect(stats.totalIncome).toBe(25_050_000) // 500件 * (2+4+6+...+1000) * 100
			expect(stats.incomeCount).toBe(500)

			// クエリが効率的に実行されていることを確認
			// 全データを取得するのではなく、集約クエリを使用すべき
			expect(querySpy).toHaveBeenCalledTimes(1)
		})

		it('収入が0件の場合でも正しく動作する', async () => {
			// 支出のみのデータを作成
			await db.insert(transactions).values({
				amount: 1000,
				type: 'expense',
				date: '2024-01-01',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})

			const stats = await service.calculateIncomeStats()

			expect(stats.totalIncome).toBe(0)
			expect(stats.incomeCount).toBe(0)
		})
	})

	describe('支出統計の計算', () => {
		it('SQLの集約関数を使用して効率的に統計を計算する', async () => {
			// テストデータを作成
			const testData = []
			for (let i = 1; i <= 100; i++) {
				testData.push({
					amount: i * 100,
					type: 'expense',
					date: '2024-01-01',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})
			}
			await db.insert(transactions).values(testData)

			const stats = await service.calculateExpenseStats()

			expect(stats.totalExpense).toBe(505_000) // (1+2+3+...+100) * 100
			expect(stats.transactionCount).toBe(100)
		})
	})

	describe('パフォーマンステスト', () => {
		it('大量データでも効率的に動作する', async () => {
			// 10,000件のテストデータを作成
			const batchSize = 1000
			for (let batch = 0; batch < 10; batch++) {
				const testData = []
				for (let i = 1; i <= batchSize; i++) {
					testData.push({
						amount: Math.floor(Math.random() * 10000) + 1,
						type: Math.random() > 0.5 ? 'income' : 'expense',
						date: '2024-01-01',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					})
				}
				await db.insert(transactions).values(testData)
			}

			// 実行時間を計測
			const startTime = performance.now()
			
			const incomeStats = await service.calculateIncomeStats()
			const expenseStats = await service.calculateExpenseStats()
			
			const endTime = performance.now()
			const executionTime = endTime - startTime

			// 統計が正しく計算されていることを確認
			expect(incomeStats.incomeCount).toBeGreaterThan(0)
			expect(expenseStats.transactionCount).toBeGreaterThan(0)

			// 実行時間が合理的な範囲内であることを確認（100ms以下）
			expect(executionTime).toBeLessThan(100)
		})
	})
})