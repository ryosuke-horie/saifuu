import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { transactions } from '../../db/schema'
import type { ErrorResponse, StatsResponse, Transaction } from '../../types'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, createTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * テスト用の取引データを生成するヘルパー関数
 * 重複を避け、一貫したテストデータを作成する
 */
function createTestTransactionData(
	overrides: Partial<{
		amount: number
		type: 'income' | 'expense'
		categoryId: number
		description?: string
		date: string
	}> = {}
) {
	const defaults = {
		amount: 1000,
		type: 'expense' as const,
		categoryId: 1,
		date: '2024-01-15',
	}
	return { ...defaults, ...overrides }
}

/**
 * DBに挿入するためのタイムスタンプ付きデータを生成
 */
function createTransactionWithTimestamps(data: ReturnType<typeof createTestTransactionData>) {
	const now = new Date().toISOString()
	return {
		...data,
		createdAt: now,
		updatedAt: now,
	}
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
				const body = (await getResponseJson(res)) as Transaction

				expect(res.status).toBe(201)
				expect(body.amount).toBe(300000)
				expect(body.type).toBe('income')
				expect(body.category?.id).toBe(101)
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
				const body = (await getResponseJson(res)) as ErrorResponse

				expect(res.status).toBe(400)
				expect(body.error).toBeDefined()
			})

			// 境界値テスト
			it('Given: 最大金額(10,000,000円), When: POSTリクエスト送信, Then: 正常に作成される', async () => {
				const maxAmountData = createTestTransactionData({
					amount: 10000000,
					type: 'income',
					categoryId: 101,
				})

				const res = await createTestRequest(app, 'POST', '/api/transactions', maxAmountData)
				const body = (await getResponseJson(res)) as Transaction

				expect(res.status).toBe(201)
				expect(body.amount).toBe(10000000)
			})

			it('Given: 最小金額(1円), When: POSTリクエスト送信, Then: 正常に作成される', async () => {
				const minAmountData = createTestTransactionData({
					amount: 1,
					type: 'income',
					categoryId: 101,
				})

				const res = await createTestRequest(app, 'POST', '/api/transactions', minAmountData)
				const body = (await getResponseJson(res)) as Transaction

				expect(res.status).toBe(201)
				expect(body.amount).toBe(1)
			})

			it('Given: 0円の金額, When: POSTリクエスト送信, Then: 400エラーが返される', async () => {
				const zeroAmountData = createTestTransactionData({
					amount: 0,
					type: 'income',
					categoryId: 101,
				})

				const res = await createTestRequest(app, 'POST', '/api/transactions', zeroAmountData)
				const body = (await getResponseJson(res)) as ErrorResponse

				expect(res.status).toBe(400)
				expect(body.error).toBeDefined()
			})

			it('Given: 負の金額, When: POSTリクエスト送信, Then: 400エラーが返される', async () => {
				const negativeAmountData = createTestTransactionData({
					amount: -1000,
					type: 'income',
					categoryId: 101,
				})

				const res = await createTestRequest(app, 'POST', '/api/transactions', negativeAmountData)
				const body = (await getResponseJson(res)) as ErrorResponse

				expect(res.status).toBe(400)
				expect(body.error).toBeDefined()
			})

			it('Given: 無効な日付形式, When: POSTリクエスト送信, Then: 400エラーが返される', async () => {
				const invalidDateData = createTestTransactionData({
					type: 'income',
					categoryId: 101,
					date: 'invalid-date',
				})

				const res = await createTestRequest(app, 'POST', '/api/transactions', invalidDateData)
				const body = (await getResponseJson(res)) as ErrorResponse

				expect(res.status).toBe(400)
				expect(body.error).toBeDefined()
			})
		})

		describe('GET /api/transactions - 収入データの取得', () => {
			beforeEach(async () => {
				// テストデータの準備
				await db.insert(transactions).values([
					createTransactionWithTimestamps(
						createTestTransactionData({ amount: 1000, date: '2024-01-10' })
					),
					createTransactionWithTimestamps(
						createTestTransactionData({ amount: 2000, date: '2024-01-11' })
					),
					createTransactionWithTimestamps(
						createTestTransactionData({
							amount: 300000,
							type: 'income',
							categoryId: 101,
							date: '2024-01-15',
						})
					),
					createTransactionWithTimestamps(
						createTestTransactionData({
							amount: 50000,
							type: 'income',
							categoryId: 101,
							date: '2024-01-20',
						})
					),
				])
			})

			it('Given: 収入・支出混在データ, When: type=incomeフィルター適用, Then: 収入データのみ返される', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions?type=income')
				const body = (await getResponseJson(res)) as Transaction[]

				expect(res.status).toBe(200)
				expect(body).toHaveLength(2)
				expect(body.every((t) => t.type === 'income')).toBe(true)
			})

			it('Given: 収入・支出混在データ, When: typeパラメータなし, Then: 全データが返される', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions')
				const body = (await getResponseJson(res)) as Transaction[]

				expect(res.status).toBe(200)
				expect(body).toHaveLength(4)
				expect(body.some((t: Transaction) => t.type === 'expense')).toBe(true)
				expect(body.some((t: Transaction) => t.type === 'income')).toBe(true)
			})

			it('Given: 無効なtypeパラメータ, When: GETリクエスト送信, Then: 400エラーが返される', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions?type=invalid')
				const body = (await getResponseJson(res)) as ErrorResponse

				expect(res.status).toBe(400)
				expect(body.error).toContain('Invalid type filter')
			})
		})

		describe('PUT /api/transactions/:id - 収入データの更新', () => {
			it('Given: 既存の収入データ, When: 有効な更新データでPUT, Then: データが更新される', async () => {
				// 収入データを作成
				const [transaction] = await db
					.insert(transactions)
					.values(
						createTransactionWithTimestamps(
							createTestTransactionData({
								amount: 300000,
								type: 'income',
								categoryId: 101,
								description: '月給',
							})
						)
					)
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
				const body = (await getResponseJson(res)) as Transaction

				// 重要度順にアサーション
				expect(res.status).toBe(200)
				expect(body.type).toBe('income') // typeは変更されない
				expect(body.amount).toBe(500000)
				expect(body.category?.id).toBe(102)
				expect(body.description).toBe('夏季ボーナス')
			})

			it('Given: 既存の収入データ, When: 負の金額で更新, Then: 400エラーが返される', async () => {
				// 収入データを作成
				const [transaction] = await db
					.insert(transactions)
					.values(
						createTransactionWithTimestamps(
							createTestTransactionData({
								amount: 300000,
								type: 'income',
								categoryId: 101,
							})
						)
					)
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
			it('Given: 既存の収入データ, When: DELETEリクエスト送信, Then: データが削除される', async () => {
				// 収入データを作成
				const [transaction] = await db
					.insert(transactions)
					.values(
						createTransactionWithTimestamps(
							createTestTransactionData({
								amount: 300000,
								type: 'income',
								categoryId: 101,
							})
						)
					)
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
			it('Given: 複数の収入・支出データ, When: 統計情報を取得, Then: 正しい集計値が返される', async () => {
				// テストデータの準備
				await db.insert(transactions).values([
					createTransactionWithTimestamps(
						createTestTransactionData({ amount: 5000, categoryId: 1, date: '2024-01-10' })
					),
					createTransactionWithTimestamps(
						createTestTransactionData({ amount: 3000, categoryId: 2, date: '2024-01-11' })
					),
					createTransactionWithTimestamps(
						createTestTransactionData({ amount: 2000, categoryId: 1, date: '2024-01-12' })
					),
					createTransactionWithTimestamps(
						createTestTransactionData({
							amount: 300000,
							type: 'income',
							categoryId: 101,
							date: '2024-01-15',
						})
					),
					createTransactionWithTimestamps(
						createTestTransactionData({
							amount: 100000,
							type: 'income',
							categoryId: 102,
							date: '2024-01-20',
						})
					),
				])

				const res = await createTestRequest(app, 'GET', '/api/transactions/stats')
				const body = (await getResponseJson(res)) as StatsResponse

				expect(res.status).toBe(200)
				expect(body.summary.totalExpense).toBe(10000) // 5000 + 3000 + 2000
				expect(body.summary.totalIncome).toBe(400000) // 300000 + 100000
				expect(body.summary.balance).toBe(390000) // 400000 - 10000
				expect(body.summary.transactionCount).toBe(5)
				expect(body.summary.expenseCount).toBe(3)
				expect(body.summary.incomeCount).toBe(2)
			})

			it('Given: データなし, When: 統計情報を取得, Then: すべて0が返される', async () => {
				const res = await createTestRequest(app, 'GET', '/api/transactions/stats')
				const body = (await getResponseJson(res)) as StatsResponse

				expect(res.status).toBe(200)
				expect(body.summary.totalExpense).toBe(0)
				expect(body.summary.totalIncome).toBe(0)
				expect(body.summary.balance).toBe(0)
				expect(body.summary.transactionCount).toBe(0)
			})
		})
	})

	describe('後方互換性の確認', () => {
		it('Given: typeパラメータ省略, When: GETリクエスト送信, Then: 支出・収入の両方が返される', async () => {
			await db.insert(transactions).values([
				createTransactionWithTimestamps(
					createTestTransactionData({ amount: 1000, date: '2024-01-10' })
				),
				createTransactionWithTimestamps(
					createTestTransactionData({
						amount: 300000,
						type: 'income',
						categoryId: 101,
						date: '2024-01-15',
					})
				),
			])

			const res = await createTestRequest(app, 'GET', '/api/transactions')
			const body = (await getResponseJson(res)) as Transaction[]

			expect(res.status).toBe(200)
			expect(body).toHaveLength(2)
		})

		it('Given: 支出データ作成, When: type=expenseフィルター, Then: 支出データのみ返される', async () => {
			// 支出データの作成
			const expenseData = createTestTransactionData({ amount: 1000 })
			const createRes = await createTestRequest(app, 'POST', '/api/transactions', expenseData)
			expect(createRes.status).toBe(201)

			// type=expenseでのフィルタリング
			const getRes = await createTestRequest(app, 'GET', '/api/transactions?type=expense')
			const body = (await getResponseJson(getRes)) as Transaction[]

			expect(getRes.status).toBe(200)
			expect(body.every((t: Transaction) => t.type === 'expense')).toBe(true)
		})
	})

	// エッジケーステスト
	describe('エッジケースと特殊ケース', () => {
		describe('小数点を含む金額', () => {
			it('Given: 小数点を含む金額, When: POSTリクエスト送信, Then: 400エラーが返される', async () => {
				const decimalAmountData = {
					...createTestTransactionData({ type: 'income', categoryId: 101 }),
					amount: 1000.5, // 小数点は許可されない
				}

				const res = await createTestRequest(app, 'POST', '/api/transactions', decimalAmountData)
				const body = (await getResponseJson(res)) as ErrorResponse

				expect(res.status).toBe(400)
				expect(body.error).toBeDefined()
			})
		})

		describe('日付のバリデーション', () => {
			it('Given: 未来の日付, When: POSTリクエスト送信, Then: 正常に作成される', async () => {
				const tomorrow = new Date()
				tomorrow.setDate(tomorrow.getDate() + 1)
				const futureDateData = createTestTransactionData({
					type: 'income',
					categoryId: 101,
					date: tomorrow.toISOString().split('T')[0],
				})

				const res = await createTestRequest(app, 'POST', '/api/transactions', futureDateData)
				const body = (await getResponseJson(res)) as Transaction

				expect(res.status).toBe(201)
				expect(body.date).toBe(futureDateData.date)
			})

			it('Given: 不正な日付形式, When: POSTリクエスト送信, Then: 400エラーが返される', async () => {
				const invalidDateFormats = [
					'2024/01/15', // スラッシュ区切り
					'01-15-2024', // MM-DD-YYYY
					'2024-13-01', // 存在しない月
					'2024-01-32', // 存在しない日
					'not-a-date', // 文字列
				]

				for (const invalidDate of invalidDateFormats) {
					const invalidData = createTestTransactionData({
						type: 'income',
						categoryId: 101,
						date: invalidDate,
					})

					const res = await createTestRequest(app, 'POST', '/api/transactions', invalidData)
					expect(res.status).toBe(400)
				}
			})
		})

		describe('並行操作のテスト', () => {
			it('Given: 同時に複数の取引作成, When: 並行リクエスト送信, Then: すべて正常に処理される', async () => {
				const promises = Array.from({ length: 5 }, (_, i) =>
					createTestRequest(
						app,
						'POST',
						'/api/transactions',
						createTestTransactionData({
							amount: 1000 * (i + 1),
							type: 'income',
							categoryId: 101,
							description: `並行テスト${i + 1}`,
						})
					)
				)

				const responses = await Promise.all(promises)
				const results = await Promise.all(responses.map((res) => getResponseJson(res)))

				// すべてのリクエストが成功することを確認
				responses.forEach((res) => {
					expect(res.status).toBe(201)
				})

				// 作成されたデータが正しいことを確認
				results.forEach((body, i) => {
					const transaction = body as Transaction
					expect(transaction.amount).toBe(1000 * (i + 1))
					expect(transaction.description).toBe(`並行テスト${i + 1}`)
				})
			})
		})
	})

	// クリーンアップ
	afterEach(async () => {
		await cleanupTestDatabase()
	})
})
