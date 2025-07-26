import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ALL_CATEGORIES, getCategoryById } from '../../../../shared/config/categories'
import { subscriptions, transactions } from '../../db/schema'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, createTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

// カテゴリレスポンスの型定義
interface CategoryResponse {
	id: number
	name: string
	type: string
	color: string
	createdAt: string
	updatedAt: string
}

// 型ガード関数（Matt Pocockの方針に従う）
function isCategoryResponse(value: unknown): value is CategoryResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		'name' in value &&
		'type' in value &&
		'color' in value &&
		'createdAt' in value &&
		'updatedAt' in value &&
		typeof (value as CategoryResponse).id === 'number' &&
		typeof (value as CategoryResponse).name === 'string' &&
		typeof (value as CategoryResponse).type === 'string' &&
		typeof (value as CategoryResponse).color === 'string' &&
		typeof (value as CategoryResponse).createdAt === 'string' &&
		typeof (value as CategoryResponse).updatedAt === 'string'
	)
}

// 405エラーアサーション用のヘルパー関数
async function assert405MethodNotAllowed(response: Response, expectedError: string): Promise<void> {
	expect(response.status).toBe(405)
	const data = await getResponseJson(response)
	expect(data).toHaveProperty('error', expectedError)
}

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
				// 型ガードを使用してタイプセーフに検証
				if (!isCategoryResponse(category)) {
					throw new Error('Invalid category response structure')
				}

				// 型ガードにより型が保証されているため、安全にアクセス可能
				expect(category.id).toBeTypeOf('number')
				expect(category.name).toBeTypeOf('string')
				expect(['income', 'expense']).toContain(category.type)
				expect(category.color).toBeTypeOf('string')
				expect(category.createdAt).toBeTypeOf('string')
				expect(category.updatedAt).toBeTypeOf('string')
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

			// 共通ヘルパーを使用
			await assert405MethodNotAllowed(response, 'Categories are fixed and cannot be created')
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

			// 共通ヘルパーを使用
			await assert405MethodNotAllowed(response, 'Categories are fixed and cannot be updated')
		})
	})

	describe('DELETE /categories/:id', () => {
		it('should return 405 Method Not Allowed', async () => {
			const response = await createTestRequest(testProductionApp, 'DELETE', '/api/categories/1')

			// 共通ヘルパーを使用
			await assert405MethodNotAllowed(response, 'Categories are fixed and cannot be deleted')
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

			// 共通ヘルパーを使用
			await assert405MethodNotAllowed(response, 'Categories are fixed and cannot be deleted')
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

			// 共通ヘルパーを使用
			await assert405MethodNotAllowed(response, 'Categories are fixed and cannot be deleted')
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
					// 型ガードを使用
					if (!isCategoryResponse(cat)) {
						throw new Error('Invalid category response structure')
					}

					const expectedCat = ALL_CATEGORIES[index]
					expect(cat.id).toBe(expectedCat.numericId)
					expect(cat.name).toBe(expectedCat.name)
					expect(cat.type).toBe(expectedCat.type)
					expect(cat.color).toBe(expectedCat.color)
					// タイムスタンプは存在確認のみ
					expect(cat.createdAt).toBeDefined()
					expect(cat.updatedAt).toBeDefined()
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

			// 共通ヘルパーを使用
			await assert405MethodNotAllowed(response, 'Categories are fixed and cannot be created')
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

			// 共通ヘルパーを使用
			await assert405MethodNotAllowed(response, 'Categories are fixed and cannot be created')
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
			// CI環境の安定性のため、同時リクエスト数を10に制限
			const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
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
		it('ユーザーストーリー: 日常の支出を記録する', async () => {
			// シナリオ: ユーザーがランチ代を記録したい
			const db = createTestDatabase()

			// 1. 支出カテゴリ一覧を取得して食費カテゴリを探す
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			expect(categoriesResponse.status).toBe(200)

			const categories = await getResponseJson(categoriesResponse)
			const foodCategory = categories.find((cat: unknown) => {
				if (!isCategoryResponse(cat)) return false
				return cat.name === '食費' && cat.type === 'expense'
			})

			expect(foodCategory).toBeDefined()
			expect(foodCategory.color).toBe('#FF6B6B') // 食費の色が正しいことを確認

			// 2. 食費カテゴリでランチ代を記録
			await db.insert(transactions).values({
				amount: 1200,
				type: 'expense',
				categoryId: foodCategory.id,
				description: 'ランチ（定食屋）',
				date: new Date().toISOString(),
			})

			// 3. 記録した取引が正しいカテゴリに紐付いていることを確認
			const [transaction] = await db.select().from(transactions).limit(1)
			expect(transaction.categoryId).toBe(foodCategory.id)
			expect(transaction.amount).toBe(1200)
		})

		it('ユーザーストーリー: 月次支出レポートを確認する', async () => {
			// シナリオ: ユーザーが今月の支出をカテゴリ別に確認したい
			const db = createTestDatabase()

			// 1. 今月の様々な支出を記録（リアルなシナリオ）
			const currentMonth = new Date()
			const testTransactions = [
				// 食費関連
				{ category: 'food', amount: 1200, description: 'ランチ（1日目）' },
				{ category: 'food', amount: 3500, description: 'スーパーでの買い物' },
				{ category: 'food', amount: 2800, description: '外食（ディナー）' },
				// 交通費
				{ category: 'transportation', amount: 220, description: '電車代（通勤）' },
				{ category: 'transportation', amount: 1500, description: 'タクシー代' },
				// システム関係費
				{ category: 'system_fee', amount: 1000, description: 'GitHub Pro' },
				{ category: 'system_fee', amount: 500, description: 'ドメイン更新' },
				// 収入
				{ category: 'salary', amount: 300000, description: '月給', type: 'income' as const },
			]

			// カテゴリ設定を取得
			for (const tx of testTransactions) {
				const category = getCategoryById(tx.category)
				if (!category) {
					throw new Error(`Category ${tx.category} not found`)
				}

				await db.insert(transactions).values({
					amount: tx.amount,
					type: tx.type || 'expense',
					categoryId: category.numericId,
					description: tx.description,
					date: currentMonth.toISOString(),
				})
			}

			// 2. カテゴリ情報を取得して集計準備
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			expect(categoriesResponse.status).toBe(200)
			await getResponseJson(categoriesResponse) // カテゴリ情報の取得確認

			// 3. カテゴリ別の集計を確認
			const allTransactions = await db.select().from(transactions)
			const categoryTotals = new Map<number, number>()

			allTransactions.forEach((tx) => {
				if (tx.categoryId && tx.type === 'expense') {
					const current = categoryTotals.get(tx.categoryId) || 0
					categoryTotals.set(tx.categoryId, current + tx.amount)
				}
			})

			// 4. 集計結果の検証
			const foodCategory = getCategoryById('food')!
			const transportCategory = getCategoryById('transportation')!
			const systemFeeCategory = getCategoryById('system_fee')!

			expect(categoryTotals.get(foodCategory.numericId)).toBe(7500) // 食費合計
			expect(categoryTotals.get(transportCategory.numericId)).toBe(1720) // 交通費合計
			expect(categoryTotals.get(systemFeeCategory.numericId)).toBe(1500) // システム関係費合計
		})

		it('ユーザーストーリー: サブスクリプションをカテゴリ別に管理する', async () => {
			// シナリオ: ユーザーが複数のサブスクリプションをカテゴリ別に整理したい
			const db = createTestDatabase()

			// 1. カテゴリ一覧を取得
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			const categories = await getResponseJson(categoriesResponse)

			// 2. システム関係費カテゴリを検索
			const systemFeeCategory = categories.find((cat: unknown) => {
				if (!isCategoryResponse(cat)) return false
				return cat.name === 'システム関係費'
			})

			expect(systemFeeCategory).toBeDefined()
			expect(systemFeeCategory.type).toBe('expense')

			// 3. 複数のサブスクリプションを登録
			const subscriptionServices = [
				{ name: 'GitHub Pro', amount: 1000, billingCycle: 'monthly' },
				{ name: 'AWS', amount: 3000, billingCycle: 'monthly' },
				{ name: 'Vercel Pro', amount: 2000, billingCycle: 'monthly' },
			]

			for (const service of subscriptionServices) {
				await db.insert(subscriptions).values({
					name: service.name,
					amount: service.amount,
					billingCycle: service.billingCycle as 'monthly',
					categoryId: systemFeeCategory.id,
					nextBillingDate: new Date().toISOString(),
					isActive: true,
					description: `${service.name}の月額プラン`,
				})
			}

			// 4. 登録したサブスクリプションがすべて正しいカテゴリに紐付いていることを確認
			const allSubscriptions = await db.select().from(subscriptions)
			expect(allSubscriptions.length).toBe(3)

			allSubscriptions.forEach((sub) => {
				expect(sub.categoryId).toBe(systemFeeCategory.id)
				expect(sub.isActive).toBe(true)
			})

			// 5. 月額費用の合計を計算
			const totalMonthlyCost = allSubscriptions.reduce((sum, sub) => sum + sub.amount, 0)
			expect(totalMonthlyCost).toBe(6000) // 合計月額費用
		})
	})
})
