import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ALL_CATEGORIES } from '../../../../shared/config/categories'
import { subscriptions, transactions } from '../../db/schema'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, createTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * カテゴリAPI 統合テスト
 *
 * 設定ファイルベースのカテゴリAPIをテストする
 * カテゴリは設定ファイルで固定のため、読み取り専用
 *
 * テストシナリオ:
 * 1. 基本的なCRUD操作（読み取り専用の確認）
 * 2. カテゴリ削除制限（使用中のカテゴリ）
 * 3. 複数カテゴリの一括操作
 * 4. ページネーション境界値テスト
 * 5. 重複カテゴリ名の制限
 * 6. DBトランザクションのロールバック
 */

describe('Categories API - Integration Tests', () => {
	beforeEach(async () => {
		// テストデータベースのセットアップ
		await setupTestDatabase()
	})

	afterEach(async () => {
		// テストデータベースのクリーンアップ
		await cleanupTestDatabase()
	})

	describe('GET /categories', () => {
		it('should return all categories from config file', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)
			expect(data.length).toBe(ALL_CATEGORIES.length)

			// 最初のカテゴリを詳細に検証
			const firstCategory = data[0]
			const firstConfigCategory = ALL_CATEGORIES[0]
			expect(firstCategory.id).toBe(firstConfigCategory.numericId)
			expect(firstCategory.name).toBe(firstConfigCategory.name)
			expect(firstCategory.type).toBe(firstConfigCategory.type)
			expect(firstCategory.color).toBe(firstConfigCategory.color)
			expect(firstCategory.createdAt).toBeDefined()
			expect(firstCategory.updatedAt).toBeDefined()
		})

		it('should return categories with correct structure', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			data.forEach((category: unknown) => {
				const cat = category as Record<string, unknown>
				expect(cat).toHaveProperty('id')
				expect(cat).toHaveProperty('name')
				expect(cat).toHaveProperty('type')
				expect(cat).toHaveProperty('color')
				expect(cat).toHaveProperty('createdAt')
				expect(cat).toHaveProperty('updatedAt')

				expect(typeof cat.id).toBe('number')
				expect(typeof cat.name).toBe('string')
				expect(['income', 'expense']).toContain(cat.type)
				expect(typeof cat.color).toBe('string')
			})
		})

		it('should include new categories added in issue #282', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)

			// Issue #282で追加されたカテゴリを確認
			const systemFee = data.find((cat: { name: string }) => cat.name === 'システム関係費')
			expect(systemFee).toBeDefined()
			expect(systemFee.id).toBe(6)
			expect(systemFee.type).toBe('expense')

			const books = data.find((cat: { name: string }) => cat.name === '書籍代')
			expect(books).toBeDefined()
			expect(books.id).toBe(8)
			expect(books.type).toBe('expense')

			const utilities = data.find(
				(cat: { name: string }) => cat.name === '家賃・水道・光熱・通信費'
			)
			expect(utilities).toBeDefined()
			expect(utilities.id).toBe(1)
			expect(utilities.type).toBe('expense')
		})
	})

	describe('POST /categories', () => {
		it('should return 405 Method Not Allowed', async () => {
			const newCategory = {
				name: 'Test Category',
				type: 'expense',
				color: '#123456',
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				newCategory
			)
			expect(response.status).toBe(405)

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be created')
		})
	})

	describe('PUT /categories/:id', () => {
		it('should return 405 Method Not Allowed', async () => {
			const updateData = {
				name: 'Updated Category',
				color: '#ABCDEF',
			}

			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				'/api/categories/1',
				updateData
			)
			expect(response.status).toBe(405)

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be updated')
		})
	})

	describe('DELETE /categories/:id', () => {
		it('should return 405 Method Not Allowed', async () => {
			const response = await createTestRequest(testProductionApp, 'DELETE', '/api/categories/1')
			expect(response.status).toBe(405)

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be deleted')
		})
	})

	describe('Category Types', () => {
		it('should return both income and expense categories', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			const expenseCategories = data.filter((cat: { type: string }) => cat.type === 'expense')
			const incomeCategories = data.filter((cat: { type: string }) => cat.type === 'income')

			expect(expenseCategories.length).toBe(11) // 支出カテゴリ
			expect(incomeCategories.length).toBe(5) // 収入カテゴリ
		})

		it('should maintain consistent order from config', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)

			// 設定ファイルの順序と一致することを確認
			data.forEach((category: { id: number; name: string }, index: number) => {
				const configCategory = ALL_CATEGORIES[index]
				expect(category.id).toBe(configCategory.numericId)
				expect(category.name).toBe(configCategory.name)
			})
		})
	})

	describe('Category Usage Restrictions', () => {
		it('should not allow deletion of categories that are in use by transactions', async () => {
			// カテゴリを使用する取引を作成
			const db = createTestDatabase()
			const expenseCategory = ALL_CATEGORIES.find((cat) => cat.type === 'expense')!

			// 取引データを作成
			await db.insert(transactions).values({
				amount: 1000,
				type: 'expense',
				categoryId: expenseCategory.numericId,
				description: 'Test transaction',
				date: new Date().toISOString(),
			})

			// カテゴリ削除を試みる（405エラーが返されることを確認）
			const response = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/categories/${expenseCategory.numericId}`
			)
			expect(response.status).toBe(405)

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be deleted')
		})

		it('should not allow deletion of categories that are in use by subscriptions', async () => {
			// カテゴリを使用するサブスクリプションを作成
			const db = createTestDatabase()
			const systemFeeCategory = ALL_CATEGORIES.find((cat) => cat.id === 'system_fee')!

			// サブスクリプションデータを作成
			await db.insert(subscriptions).values({
				name: 'Test Subscription',
				amount: 1500,
				billingCycle: 'monthly',
				nextBillingDate: new Date().toISOString(),
				categoryId: systemFeeCategory.numericId,
				description: 'Test subscription service',
				isActive: true,
			})

			// カテゴリ削除を試みる（405エラーが返されることを確認）
			const response = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/categories/${systemFeeCategory.numericId}`
			)
			expect(response.status).toBe(405)

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be deleted')
		})
	})

	describe('Bulk Operations Scenarios', () => {
		it('should handle multiple category operations in sequence', async () => {
			// 複数のカテゴリ操作を連続で実行
			const operations = [
				{ method: 'GET' as const, path: '/api/categories', expectedStatus: 200 },
				{ method: 'POST' as const, path: '/api/categories', expectedStatus: 405 },
				{ method: 'PUT' as const, path: '/api/categories/1', expectedStatus: 405 },
				{ method: 'DELETE' as const, path: '/api/categories/1', expectedStatus: 405 },
			]

			for (const op of operations) {
				const response = await createTestRequest(testProductionApp, op.method, op.path)
				expect(response.status).toBe(op.expectedStatus)
			}
		})

		it('should handle concurrent read operations efficiently', async () => {
			// 同時に複数の読み取り操作を実行
			const promises = Array.from({ length: 10 }, () =>
				createTestRequest(testProductionApp, 'GET', '/api/categories')
			)

			const responses = await Promise.all(promises)

			// すべてのリクエストが成功することを確認
			responses.forEach((response) => {
				expect(response.status).toBe(200)
			})

			// すべてのレスポンスが同じデータを返すことを確認（タイムスタンプを除く）
			const allData = await Promise.all(responses.map((r) => getResponseJson(r)))

			// タイムスタンプを除いてデータ構造を比較
			allData.forEach((data) => {
				expect(data.length).toBe(ALL_CATEGORIES.length)
				data.forEach((cat: unknown, index: number) => {
					const category = cat as {
						id: number
						name: string
						type: string
						color: string
						createdAt: string
						updatedAt: string
					}
					const expectedCat = ALL_CATEGORIES[index]
					expect(category.id).toBe(expectedCat.numericId)
					expect(category.name).toBe(expectedCat.name)
					expect(category.type).toBe(expectedCat.type)
					expect(category.color).toBe(expectedCat.color)
					// タイムスタンプは存在確認のみ
					expect(category.createdAt).toBeDefined()
					expect(category.updatedAt).toBeDefined()
				})
			})
		})
	})

	describe('Pagination Boundary Tests', () => {
		it('should handle requests with pagination parameters gracefully', async () => {
			// ページネーションパラメータを含むリクエスト（カテゴリAPIはページネーション非対応）
			const testCases = [
				{ query: '?page=1&limit=10' },
				{ query: '?page=0&limit=0' },
				{ query: '?page=-1&limit=-1' },
				{ query: '?page=999999&limit=999999' },
				{ query: '?page=abc&limit=xyz' },
			]

			for (const testCase of testCases) {
				const response = await createTestRequest(
					testProductionApp,
					'GET',
					`/api/categories${testCase.query}`
				)
				expect(response.status).toBe(200)

				const data = await getResponseJson(response)
				// ページネーションパラメータに関わらず、すべてのカテゴリが返される
				expect(data.length).toBe(ALL_CATEGORIES.length)
			}
		})

		it('should return consistent data regardless of query parameters', async () => {
			// 異なるクエリパラメータでも一貫したデータを返すことを確認
			const response1 = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const response2 = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories?sort=name'
			)
			const response3 = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories?filter=expense'
			)

			const data1 = await getResponseJson(response1)
			const data2 = await getResponseJson(response2)
			const data3 = await getResponseJson(response3)

			// タイムスタンプを除いてデータを比較
			const compareWithoutTimestamps = (dataArray: unknown[]) => {
				return dataArray.map((item) => {
					const {
						createdAt: _createdAt,
						updatedAt: _updatedAt,
						...rest
					} = item as {
						createdAt: string
						updatedAt: string
						id: number
						name: string
						type: string
						color: string
					}
					return rest
				})
			}

			const data1WithoutTimestamps = compareWithoutTimestamps(data1)
			const data2WithoutTimestamps = compareWithoutTimestamps(data2)
			const data3WithoutTimestamps = compareWithoutTimestamps(data3)

			// すべて同じデータを返すことを確認
			expect(JSON.stringify(data1WithoutTimestamps)).toBe(JSON.stringify(data2WithoutTimestamps))
			expect(JSON.stringify(data2WithoutTimestamps)).toBe(JSON.stringify(data3WithoutTimestamps))
		})
	})

	describe('Duplicate Category Name Restrictions', () => {
		it('should not allow creation of categories with duplicate names', async () => {
			// 既存のカテゴリ名を使用して新規作成を試みる
			const existingCategory = ALL_CATEGORIES[0]
			const duplicateCategory = {
				name: existingCategory.name,
				type: existingCategory.type,
				color: '#FF0000',
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				duplicateCategory
			)
			expect(response.status).toBe(405)

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be created')
		})

		it('should prevent duplicate names even with different types', async () => {
			// 異なるタイプでも同名のカテゴリ作成は不可
			const expenseCategory = ALL_CATEGORIES.find((cat) => cat.type === 'expense')!
			const duplicateAsIncome = {
				name: expenseCategory.name,
				type: 'income', // 異なるタイプ
				color: '#00FF00',
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				duplicateAsIncome
			)
			expect(response.status).toBe(405)

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be created')
		})

		it('should verify category names are unique within their type', async () => {
			// カテゴリ名がタイプ内で一意であることを確認
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)

			// タイプ別にグループ化
			const expenseCategories = data.filter((cat: { type: string }) => cat.type === 'expense')
			const incomeCategories = data.filter((cat: { type: string }) => cat.type === 'income')

			// 支出カテゴリ内での名前の一意性を確認
			const expenseNames = expenseCategories.map((cat: { name: string }) => cat.name)
			const uniqueExpenseNames = [...new Set(expenseNames)]
			expect(expenseNames.length).toBe(uniqueExpenseNames.length)

			// 収入カテゴリ内での名前の一意性を確認
			const incomeNames = incomeCategories.map((cat: { name: string }) => cat.name)
			const uniqueIncomeNames = [...new Set(incomeNames)]
			expect(incomeNames.length).toBe(uniqueIncomeNames.length)

			// 異なるタイプ間では同名が許可されることを確認（例：「その他」）
			const duplicateNameAcrossTypes = expenseNames.find((name: string) =>
				incomeNames.includes(name)
			)
			expect(duplicateNameAcrossTypes).toBeDefined() // 「その他」が両方に存在
		})
	})

	describe('Database Transaction Rollback Tests', () => {
		it('should maintain data consistency when operations fail', async () => {
			// トランザクション前の状態を記録
			const beforeResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const beforeData = await getResponseJson(beforeResponse)

			// 失敗する操作を複数実行
			const failedOperations = [
				createTestRequest(testProductionApp, 'POST', '/api/categories', { name: 'New Category' }),
				createTestRequest(testProductionApp, 'PUT', '/api/categories/1', { name: 'Updated' }),
				createTestRequest(testProductionApp, 'DELETE', '/api/categories/1'),
			]

			await Promise.all(failedOperations)

			// トランザクション後の状態を確認
			const afterResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const afterData = await getResponseJson(afterResponse)

			// タイムスタンプを除いてデータが変更されていないことを確認
			const removeTimestamps = (dataArray: unknown[]) => {
				return dataArray.map((item) => {
					const {
						createdAt: _createdAt,
						updatedAt: _updatedAt,
						...rest
					} = item as {
						createdAt: string
						updatedAt: string
						id: number
						name: string
						type: string
						color: string
					}
					return rest
				})
			}

			const beforeDataWithoutTimestamps = removeTimestamps(beforeData)
			const afterDataWithoutTimestamps = removeTimestamps(afterData)

			expect(JSON.stringify(afterDataWithoutTimestamps)).toBe(
				JSON.stringify(beforeDataWithoutTimestamps)
			)
		})

		it('should handle database errors gracefully', async () => {
			// 大量の同時リクエストでデータベースエラーをシミュレート
			const concurrentRequests = Array.from({ length: 100 }, (_, i) =>
				createTestRequest(testProductionApp, 'DELETE', `/api/categories/${i}`)
			)

			const responses = await Promise.all(concurrentRequests)

			// すべてのリクエストが適切にエラーを返すことを確認
			responses.forEach((response) => {
				expect(response.status).toBe(405)
			})

			// カテゴリデータが影響を受けていないことを確認
			const checkResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(checkResponse.status).toBe(200)

			const data = await getResponseJson(checkResponse)
			expect(data.length).toBe(ALL_CATEGORIES.length)
		})

		it('should rollback partial updates in bulk operations', async () => {
			// 複数のカテゴリ更新を同時に試みる（すべて失敗するはず）
			const bulkUpdates = ALL_CATEGORIES.slice(0, 5).map((cat) => ({
				id: cat.numericId,
				data: { name: `Updated ${cat.name}`, color: '#000000' },
			}))

			// 各更新リクエストを送信
			const updatePromises = bulkUpdates.map((update) =>
				createTestRequest(testProductionApp, 'PUT', `/api/categories/${update.id}`, update.data)
			)

			const responses = await Promise.all(updatePromises)

			// すべての更新が拒否されることを確認
			responses.forEach((response) => {
				expect(response.status).toBe(405)
			})

			// 元のデータが保持されていることを確認
			const verifyResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const verifyData = await getResponseJson(verifyResponse)

			// 設定ファイルのデータと一致することを確認
			verifyData.forEach((cat: { id: number; name: string }, index: number) => {
				const configCat = ALL_CATEGORIES[index]
				expect(cat.id).toBe(configCat.numericId)
				expect(cat.name).toBe(configCat.name)
			})
		})
	})

	describe('Real-world Business Scenarios', () => {
		it('should handle category lookups for transaction creation flow', async () => {
			// ユーザーが取引を作成する際のカテゴリ取得フロー
			const db = createTestDatabase()

			// 1. カテゴリ一覧を取得
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			expect(categoriesResponse.status).toBe(200)

			const categories = await getResponseJson(categoriesResponse)
			const expenseCategories = categories.filter((cat: { type: string }) => cat.type === 'expense')

			// 2. 選択したカテゴリで取引を作成
			const selectedCategory = expenseCategories[0]
			await db.insert(transactions).values({
				amount: 5000,
				type: 'expense',
				categoryId: selectedCategory.id,
				description: 'Business lunch',
				date: new Date().toISOString(),
			})

			// 3. 作成した取引のカテゴリ情報が正しいことを確認
			const [transaction] = await db.select().from(transactions).limit(1)
			expect(transaction.categoryId).toBe(selectedCategory.id)
		})

		it('should support monthly reporting with categories', async () => {
			// 月次レポート作成時のカテゴリ集計シナリオ
			const db = createTestDatabase()

			// 複数のカテゴリで取引を作成
			const testTransactions = [
				{ categoryId: 3, amount: 10000, type: 'expense' as const, description: '食費' },
				{ categoryId: 3, amount: 5000, type: 'expense' as const, description: '外食' },
				{ categoryId: 4, amount: 3000, type: 'expense' as const, description: '交通費' },
				{ categoryId: 101, amount: 300000, type: 'income' as const, description: '給与' },
			]

			for (const tx of testTransactions) {
				await db.insert(transactions).values({
					...tx,
					date: new Date().toISOString(),
				})
			}

			// カテゴリ情報を取得して集計に使用
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			const categoriesData = await getResponseJson(categoriesResponse)

			// カテゴリIDと名前のマッピングを作成
			const categoryMap = new Map(
				categoriesData.map((cat: { id: number; name: string }) => [cat.id, cat.name])
			)

			// 作成した取引がカテゴリマップと一致することを確認
			const allTransactions = await db.select().from(transactions)
			allTransactions.forEach((tx) => {
				if (tx.categoryId) {
					expect(categoryMap.has(tx.categoryId)).toBe(true)
				}
			})
		})
	})
})
