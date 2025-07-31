import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type NewTransaction, transactions } from '../../db/schema'
import { cleanupTestDatabase, createTestDatabase, setupTestDatabase } from '../helpers/test-db'
import { createTestProductionApp } from '../helpers/test-production-app'

/**
 * トランザクションAPIのパフォーマンステスト
 *
 * Issue #412の受け入れ条件:
 * - API応答500ms以内
 */
describe('Transactions API Performance', () => {
	const db = createTestDatabase()
	// biome-ignore lint/suspicious/noExplicitAny: テスト環境でのDrizzle ORMのデータベース型互換性問題のため
	const app = createTestProductionApp(db as any)

	beforeEach(async () => {
		await setupTestDatabase()

		// パフォーマンステスト用の大量データを生成
		const testData: NewTransaction[] = []
		const baseDate = new Date('2024-01-01')

		// 10,000件のテストデータを生成（支出8,000件、収入2,000件）
		for (let i = 0; i < 10000; i++) {
			const isIncome = i % 5 === 0 // 20%が収入
			const date = new Date(baseDate)
			date.setDate(date.getDate() + (i % 365)) // 1年分のデータ

			testData.push({
				amount: Math.floor(Math.random() * 100000) + 1000,
				type: isIncome ? 'income' : 'expense',
				categoryId: isIncome ? 101 + (i % 5) : 1 + (i % 11), // カテゴリをランダムに割り当て
				description: `Test transaction ${i}`,
				date: date.toISOString().split('T')[0],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})
		}

		// バッチインサート（SQLiteの制限を考慮して100件ずつ）
		const batchSize = 100
		for (let i = 0; i < testData.length; i += batchSize) {
			const batch = testData.slice(i, i + batchSize)
			await db.insert(transactions).values(batch)
		}
	})

	afterEach(async () => {
		await cleanupTestDatabase()
	})

	it('収入データのみを取得する際に500ms以内に応答すること', async () => {
		const startTime = performance.now()

		const response = await app.request('/api/transactions?type=income')

		const endTime = performance.now()
		const responseTime = endTime - startTime

		expect(response.status).toBe(200)
		const data = (await response.json()) as unknown[]
		expect(data.length).toBe(2000) // 20%が収入

		// API応答時間が500ms以内であることを確認
		expect(responseTime).toBeLessThan(500)
		console.log(`収入データ取得時間: ${responseTime.toFixed(2)}ms`)
	})

	it('今月の収入データを取得する際に500ms以内に応答すること', async () => {
		const currentDate = new Date()
		const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
		const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

		const startTime = performance.now()

		const response = await app.request(
			`/api/transactions?type=income&startDate=${startOfMonth.toISOString().split('T')[0]}&endDate=${endOfMonth.toISOString().split('T')[0]}`
		)

		const endTime = performance.now()
		const responseTime = endTime - startTime

		expect(response.status).toBe(200)

		// API応答時間が500ms以内であることを確認
		expect(responseTime).toBeLessThan(500)
		console.log(`今月の収入データ取得時間: ${responseTime.toFixed(2)}ms`)
	})

	it('統計情報を取得する際に500ms以内に応答すること', async () => {
		const startTime = performance.now()

		const response = await app.request('/api/transactions/stats')

		const endTime = performance.now()
		const responseTime = endTime - startTime

		expect(response.status).toBe(200)
		const stats = (await response.json()) as { totalIncome: number; totalExpense: number }
		expect(stats.totalIncome).toBeGreaterThan(0)
		expect(stats.totalExpense).toBeGreaterThan(0)

		// API応答時間が500ms以内であることを確認
		expect(responseTime).toBeLessThan(500)
		console.log(`統計情報取得時間: ${responseTime.toFixed(2)}ms`)
	})

	it('カテゴリ別収入データを取得する際に500ms以内に応答すること', async () => {
		const startTime = performance.now()

		const response = await app.request('/api/transactions?type=income&categoryId=101')

		const endTime = performance.now()
		const responseTime = endTime - startTime

		expect(response.status).toBe(200)

		// API応答時間が500ms以内であることを確認
		expect(responseTime).toBeLessThan(500)
		console.log(`カテゴリ別収入データ取得時間: ${responseTime.toFixed(2)}ms`)
	})
})
