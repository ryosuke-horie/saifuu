import { beforeEach, describe, expect, it } from 'vitest'
import { transactions } from '../../db/schema'
import type { ErrorResponse } from '../../types/api'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, createTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * 収入統計APIレスポンスの型定義
 * Issue #403の技術詳細に基づく
 */
interface IncomeStatsResponse {
	currentMonth: number
	lastMonth: number
	currentYear: number
	monthOverMonth: number
	categoryBreakdown: Array<{
		categoryId: number
		name: string
		amount: number
		percentage: number
	}>
}

/**
 * テスト用の収入データを生成するヘルパー関数
 */
function createIncomeData(
	overrides: Partial<{
		amount: number
		categoryId: number
		description?: string
		date: string
	}> = {}
) {
	const defaults = {
		amount: 100000,
		type: 'income' as const,
		categoryId: 101, // 給与
		date: new Date().toISOString().split('T')[0],
	}
	return { ...defaults, ...overrides }
}

/**
 * 現在の日付情報を取得するヘルパー関数
 */
function getDateInfo() {
	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth() + 1
	const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
	const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

	return {
		currentYear,
		currentMonth,
		lastMonth,
		lastMonthYear,
		currentMonthStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
		lastMonthStr: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`,
		currentYearStr: String(currentYear),
	}
}

describe('収入統計API統合テスト', () => {
	const app = testProductionApp
	const db = createTestDatabase()

	beforeEach(async () => {
		await setupTestDatabase()
		await cleanupTestDatabase()
	})

	describe('GET /api/transactions/stats?type=income', () => {
		it('収入データが存在しない場合、すべて0の統計情報を返す', async () => {
			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body).toEqual({
				currentMonth: 0,
				lastMonth: 0,
				currentYear: 0,
				monthOverMonth: 0,
				categoryBreakdown: [],
			})
		})

		it('今月の収入合計を正しく計算する', async () => {
			const dateInfo = getDateInfo()

			// 今月の収入データを挿入
			await db.insert(transactions).values([
				createIncomeData({ amount: 300000, date: `${dateInfo.currentMonthStr}-10` }),
				createIncomeData({
					amount: 50000,
					date: `${dateInfo.currentMonthStr}-20`,
					categoryId: 102,
				}), // ボーナス
			])

			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body.currentMonth).toBe(350000)
		})

		it('先月の収入合計を正しく計算する', async () => {
			const dateInfo = getDateInfo()

			// 先月の収入データを挿入
			await db.insert(transactions).values([
				createIncomeData({ amount: 280000, date: `${dateInfo.lastMonthStr}-10` }),
				createIncomeData({ amount: 20000, date: `${dateInfo.lastMonthStr}-25`, categoryId: 103 }), // 副業
			])

			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body.lastMonth).toBe(300000)
		})

		it('今年の収入合計を正しく計算する', async () => {
			const dateInfo = getDateInfo()

			// 今年の各月の収入データを挿入
			const yearData = []
			for (let month = 1; month <= 12; month++) {
				yearData.push(
					createIncomeData({
						amount: 300000,
						date: `${dateInfo.currentYear}-${String(month).padStart(2, '0')}-15`,
					})
				)
			}
			await db.insert(transactions).values(yearData)

			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body.currentYear).toBe(3600000) // 300000 * 12
		})

		it('前月比増減率を正しく計算する', async () => {
			const dateInfo = getDateInfo()

			// 先月: 400,000円、今月: 450,000円の場合、12.5%増
			await db
				.insert(transactions)
				.values([
					createIncomeData({ amount: 400000, date: `${dateInfo.lastMonthStr}-15` }),
					createIncomeData({ amount: 450000, date: `${dateInfo.currentMonthStr}-15` }),
				])

			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body.monthOverMonth).toBe(12.5)
		})

		it('先月の収入が0の場合、前月比は0として扱う', async () => {
			const dateInfo = getDateInfo()

			// 今月のみ収入データを挿入
			await db
				.insert(transactions)
				.values([createIncomeData({ amount: 300000, date: `${dateInfo.currentMonthStr}-15` })])

			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body.currentMonth).toBe(300000)
			expect(body.lastMonth).toBe(0)
			expect(body.monthOverMonth).toBe(0) // 0で除算を避ける
		})

		it('カテゴリ別内訳を正しく集計する', async () => {
			const dateInfo = getDateInfo()

			// 複数カテゴリの収入データを挿入
			await db.insert(transactions).values([
				createIncomeData({
					amount: 300000,
					categoryId: 101,
					date: `${dateInfo.currentMonthStr}-10`,
				}), // 給与
				createIncomeData({
					amount: 150000,
					categoryId: 102,
					date: `${dateInfo.currentMonthStr}-20`,
				}), // ボーナス
				createIncomeData({
					amount: 50000,
					categoryId: 103,
					date: `${dateInfo.currentMonthStr}-25`,
				}), // 副業
			])

			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body.categoryBreakdown).toHaveLength(3)

			// カテゴリIDでソートして検証
			const sortedBreakdown = body.categoryBreakdown.sort((a, b) => a.categoryId - b.categoryId)

			expect(sortedBreakdown[0]).toEqual({
				categoryId: 101,
				name: '給与',
				amount: 300000,
				percentage: 60, // 300000 / 500000 * 100
			})
			expect(sortedBreakdown[1]).toEqual({
				categoryId: 102,
				name: 'ボーナス',
				amount: 150000,
				percentage: 30, // 150000 / 500000 * 100
			})
			expect(sortedBreakdown[2]).toEqual({
				categoryId: 103,
				name: '副業',
				amount: 50000,
				percentage: 10, // 50000 / 500000 * 100
			})
		})

		it('支出データは収入統計に含まれない', async () => {
			const dateInfo = getDateInfo()

			// 収入と支出データを混在させて挿入
			await db.insert(transactions).values([
				createIncomeData({ amount: 300000, date: `${dateInfo.currentMonthStr}-10` }),
				{
					amount: 50000,
					type: 'expense' as const,
					categoryId: 1,
					date: `${dateInfo.currentMonthStr}-15`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			])

			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const body = (await getResponseJson(res)) as IncomeStatsResponse

			expect(res.status).toBe(200)
			expect(body.currentMonth).toBe(300000) // 支出の50000は含まれない
		})

		it('パフォーマンス要件: レスポンス時間が500ms以内', async () => {
			const dateInfo = getDateInfo()

			// 大量のデータを挿入（1年分の日次データ）
			const bulkData = []
			for (let month = 1; month <= 12; month++) {
				for (let day = 1; day <= 28; day++) {
					bulkData.push(
						createIncomeData({
							amount: 10000,
							categoryId: 101 + (day % 5), // カテゴリをローテーション
							date: `${dateInfo.currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
						})
					)
				}
			}
			await db.insert(transactions).values(bulkData)

			const startTime = Date.now()
			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=income')
			const endTime = Date.now()
			const responseTime = endTime - startTime

			expect(res.status).toBe(200)
			expect(responseTime).toBeLessThan(500) // 500ms以内
		})

		it('無効なtypeパラメータの場合、400エラーを返す', async () => {
			const res = await createTestRequest(app, 'GET', '/api/transactions/stats?type=invalid')
			const body = (await getResponseJson(res)) as ErrorResponse

			expect(res.status).toBe(400)
			expect(body.error).toBeDefined()
		})
	})
})
