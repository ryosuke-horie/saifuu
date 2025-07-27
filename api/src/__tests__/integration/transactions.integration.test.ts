import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { transactions } from '../../db/schema'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, createTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

// トランザクションレスポンスの型定義
interface TransactionResponse {
	id: number
	amount: number
	type: 'income' | 'expense'
	categoryId?: number
	categoryName?: string
	description?: string
	date: string
	createdAt: string
	updatedAt: string
}

// 統計レスポンスの型定義
interface StatsResponse {
	totalExpense: number
	totalIncome: number
	balance: number
	transactionCount: number
	expenseCount: number
	incomeCount: number
}

describe('Transactions Integration Tests', () => {
	const app = testProductionApp
	const db = createTestDatabase()

	beforeEach(async () => {
		await setupTestDatabase()
		// カテゴリはconfigで管理されているため、テーブルへの追加は不要
	})

	describe('収入データCRUD操作', () => {
		describe('POST /api/transactions - 収入データの作成', () => {
			it('収入データを正常に作成できる', async () => {
				const incomeData = {
					amount: 300000,
					type: 'income',
					categoryId: 101,
					description: '月給',
					date: '2024-01-15',
				}

				const res = await createTestRequest(app, 'POST', '/api/transactions', incomeData)
				const body = (await getResponseJson(res)) as TransactionResponse

				expect(res.status).toBe(201)
				expect(body.amount).toBe(300000)
				expect(body.type).toBe('income')
				expect(body.categoryId).toBe(101)
				expect(body.description).toBe('月給')
			})

			it('収入データのバリデーションが正しく動作する', async () => {
				const invalidIncomeData = {
					amount: -100, // 収入は負の値を許可しない
					type: 'income',
					categoryId: 999, // 存在しないカテゴリ
					date: '2024-01-15',
				}

				const res = await createTestRequest(app, 'POST', '/api/transactions', invalidIncomeData)
				const body = (await getResponseJson(res)) as { error: string }

				expect(res.status).toBe(400)
				expect(body.error).toBeDefined()
			})
		})

		describe('GET /api/transactions - 収入データの取得', () => {
			beforeEach(async () => {
				// テストデータの準備
				const now = new Date().toISOString()
				await db.insert(transactions).values([
					{
						amount: 1000,
						type: 'expense',
						categoryId: 1,
						date: '2024-01-10',
						createdAt: now,
						updatedAt: now,
					},
					{
						amount: 2000,
						type: 'expense',
						categoryId: 1,
						date: '2024-01-11',
						createdAt: now,
						updatedAt: now,
					},
					{
						amount: 300000,
						type: 'income',
						categoryId: 101,
						date: '2024-01-15',
						createdAt: now,
						updatedAt: now,
					},
					{
						amount: 50000,
						type: 'income',
						categoryId: 101,
						date: '2024-01-20',
						createdAt: now,
						updatedAt: now,
					},
				])
			})

			it('type=incomeフィルターで収入データのみ取得できる', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions?type=income')
				const body = (await getResponseJson(res)) as TransactionResponse[]

				expect(res.status).toBe(200)
				expect(body).toHaveLength(2)
				expect(body.every((t) => t.type === 'income')).toBe(true)
			})

			it('typeパラメータなしの場合は全データを取得する', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions')
				const body = (await getResponseJson(res)) as TransactionResponse[]

				expect(res.status).toBe(200)
				expect(body).toHaveLength(4)
				expect(body.some((t: TransactionResponse) => t.type === 'expense')).toBe(true)
				expect(body.some((t: TransactionResponse) => t.type === 'income')).toBe(true)
			})

			it('無効なtypeパラメータはエラーを返す', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions?type=invalid')
				const body = (await getResponseJson(res)) as { error: string }

				expect(res.status).toBe(400)
				expect(body.error).toContain('Invalid type filter')
			})
		})

		describe('PUT /api/transactions/:id - 収入データの更新', () => {
			it('収入データを正常に更新できる', async () => {
				// 収入データを作成
				const now = new Date().toISOString()
				const [transaction] = await db
					.insert(transactions)
					.values({
						amount: 300000,
						type: 'income',
						categoryId: 101,
						description: '月給',
						date: '2024-01-15',
						createdAt: now,
						updatedAt: now,
					})
					.returning()

				const updateData = {
					amount: 500000,
					categoryId: 102,
					description: '夏季ボーナス',
				}

				const res = await createTestRequest(
					app,
					'PUT',
					`/api/transactions/${transaction.id}`,
					updateData
				)
				const body = (await getResponseJson(res)) as TransactionResponse

				expect(res.status).toBe(200)
				expect(body.amount).toBe(500000)
				expect(body.categoryId).toBe(102)
				expect(body.description).toBe('夏季ボーナス')
				expect(body.type).toBe('income') // typeは変更されない
			})

			it('収入データの更新時にバリデーションが動作する', async () => {
				// 収入データを作成
				const now = new Date().toISOString()
				const [transaction] = await db
					.insert(transactions)
					.values({
						amount: 300000,
						type: 'income',
						categoryId: 101,
						date: '2024-01-15',
						createdAt: now,
						updatedAt: now,
					})
					.returning()

				const invalidUpdate = {
					amount: -1000, // 負の値は無効
				}

				const res = await createTestRequest(
					app,
					'PUT',
					`/api/transactions/${transaction.id}`,
					invalidUpdate
				)

				expect(res.status).toBe(400)
			})
		})

		describe('DELETE /api/transactions/:id - 収入データの削除', () => {
			it('収入データを正常に削除できる', async () => {
				// 収入データを作成
				const now = new Date().toISOString()
				const [transaction] = await db
					.insert(transactions)
					.values({
						amount: 300000,
						type: 'income',
						categoryId: 101,
						date: '2024-01-15',
						createdAt: now,
						updatedAt: now,
					})
					.returning()

				const deleteRes = await createTestRequest(
					app,
					'DELETE',
					`/api/transactions/${transaction.id}`
				)
				expect(deleteRes.status).toBe(200)

				// 削除確認
				const getRes = await createTestRequest(app, 'GET', `/api/transactions/${transaction.id}`)
				expect(getRes.status).toBe(404)
			})
		})

		describe('GET /api/transactions/stats - 収入を含む統計情報', () => {
			it('収入・支出・残高の統計情報を正しく計算する', async () => {
				// テストデータの準備
				const now = new Date().toISOString()
				await db.insert(transactions).values([
					{
						amount: 5000,
						type: 'expense',
						categoryId: 1,
						date: '2024-01-10',
						createdAt: now,
						updatedAt: now,
					},
					{
						amount: 3000,
						type: 'expense',
						categoryId: 2,
						date: '2024-01-11',
						createdAt: now,
						updatedAt: now,
					},
					{
						amount: 2000,
						type: 'expense',
						categoryId: 1,
						date: '2024-01-12',
						createdAt: now,
						updatedAt: now,
					},
					{
						amount: 300000,
						type: 'income',
						categoryId: 101,
						date: '2024-01-15',
						createdAt: now,
						updatedAt: now,
					},
					{
						amount: 100000,
						type: 'income',
						categoryId: 102,
						date: '2024-01-20',
						createdAt: now,
						updatedAt: now,
					},
				])

				const res = await createTestRequest(app, 'GET', '/api/transactions/stats')
				const body = (await getResponseJson(res)) as StatsResponse

				expect(res.status).toBe(200)
				expect(body.totalExpense).toBe(10000) // 5000 + 3000 + 2000
				expect(body.totalIncome).toBe(400000) // 300000 + 100000
				expect(body.balance).toBe(390000) // 400000 - 10000
				expect(body.transactionCount).toBe(5)
				expect(body.expenseCount).toBe(3)
				expect(body.incomeCount).toBe(2)
			})

			it('データがない場合は0を返す', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions/stats')
				const body = (await getResponseJson(res)) as StatsResponse

				expect(res.status).toBe(200)
				expect(body.totalExpense).toBe(0)
				expect(body.totalIncome).toBe(0)
				expect(body.balance).toBe(0)
				expect(body.transactionCount).toBe(0)
			})
		})
	})

	describe('後方互換性の確認', () => {
		it('typeパラメータを省略した場合、支出・収入の両方を取得する', async () => {
			const now = new Date().toISOString()
			await db.insert(transactions).values([
				{
					amount: 1000,
					type: 'expense',
					categoryId: 1,
					date: '2024-01-10',
					createdAt: now,
					updatedAt: now,
				},
				{
					amount: 300000,
					type: 'income',
					categoryId: 101,
					date: '2024-01-15',
					createdAt: now,
					updatedAt: now,
				},
			])

			const res = await createTestRequest(app, 'GET', '/api/transactions')
			const body = (await getResponseJson(res)) as TransactionResponse[]

			expect(res.status).toBe(200)
			expect(body).toHaveLength(2)
		})

		it('既存の支出データのCRUD操作は影響を受けない', async () => {
			// 支出データの作成
			const createRes = await createTestRequest(app, 'POST', '/api/transactions', {
				amount: 1000,
				type: 'expense',
				categoryId: 1,
				date: '2024-01-15',
			})
			expect(createRes.status).toBe(201)

			// type=expenseでのフィルタリング
			const getRes = await createTestRequest(app, 'GET', '/api/transactions?type=expense')
			const body = (await getResponseJson(getRes)) as TransactionResponse[]

			expect(getRes.status).toBe(200)
			expect(body.every((t: TransactionResponse) => t.type === 'expense')).toBe(true)
		})
	})

	// クリーンアップ
	afterEach(async () => {
		await cleanupTestDatabase()
	})
})
