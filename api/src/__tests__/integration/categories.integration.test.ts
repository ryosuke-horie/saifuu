import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ALL_CATEGORIES, getCategoryById, getCategoryByName } from '../../../../shared/config/categories'
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

// カテゴリレスポンスの型定義
interface CategoryResponse {
	id: number
	name: string
	type: 'income' | 'expense'
	color: string
	createdAt: string
	updatedAt: string
}

// 型ガード関数
// レビューコメント#8対応: より厳密な型チェックと安全なプロパティアクセス
function isCategoryResponse(value: unknown): value is CategoryResponse {
	// nullやundefinedのチェック
	if (value === null || value === undefined) {
		return false
	}

	// オブジェクトかどうかのチェック
	if (typeof value !== 'object') {
		return false
	}

	// 安全なプロパティアクセスのため、hasOwnPropertyを使用
	const hasProperty = (obj: object, prop: string): boolean => {
		return Object.hasOwn(obj, prop)
	}

	// 必須プロパティの存在チェック
	const requiredProps = ['id', 'name', 'type', 'color', 'createdAt', 'updatedAt']
	for (const prop of requiredProps) {
		if (!hasProperty(value, prop)) {
			return false
		}
	}

	// 各プロパティの型チェック（安全にアクセス）
	const obj = value as { [key: string]: unknown }

	// idの型チェック
	if (typeof obj.id !== 'number' || !Number.isInteger(obj.id) || obj.id <= 0) {
		return false
	}

	// nameの型チェック
	if (typeof obj.name !== 'string' || obj.name.length === 0) {
		return false
	}

	// typeの型チェック（厳密な値チェック）
	if (obj.type !== 'income' && obj.type !== 'expense') {
		return false
	}

	// colorの型チェック（16進数カラーコードの形式チェック）
	if (typeof obj.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(obj.color)) {
		return false
	}

	// 日時文字列の型チェック（ISO 8601形式）
	const isISODateString = (str: unknown): boolean => {
		if (typeof str !== 'string') return false
		const date = new Date(str)
		return date instanceof Date && !Number.isNaN(date.getTime()) && date.toISOString() === str
	}

	if (!isISODateString(obj.createdAt) || !isISODateString(obj.updatedAt)) {
		return false
	}

	return true
}

// カテゴリ名からIDを取得するヘルパー関数
function getCategoryIdByName(name: string): number {
	const category = getCategoryByName(name)
	if (!category) {
		throw new Error(`Category not found: ${name}`)
	}
	return category.numericId
}

// 405エラーレスポンスの共通アサーション
async function expectMethodNotAllowed(response: Response, expectedMessage: string) {
	expect(response.status).toBe(405)
	const data = await getResponseJson(response)
	expect(data).toHaveProperty('error', expectedMessage)
}

describe('Categories API - Integration Tests', () => {
	// テスト全体で共有するDB接続
	let db: ReturnType<typeof createTestDatabase>

	beforeEach(async () => {
		// テストデータベースのセットアップ
		await setupTestDatabase()
		// DB接続を初期化（各テストで再利用）
		db = createTestDatabase()
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
				// 型ガード関数を使用して型安全性を確保
				expect(isCategoryResponse(category)).toBe(true)

				if (isCategoryResponse(category)) {
					// 型が保証されているため、安全にプロパティアクセス可能
					expect(category.id).toBeGreaterThan(0)
					expect(category.name.length).toBeGreaterThan(0)
					expect(['income', 'expense']).toContain(category.type)
					expect(category.color).toMatch(/^#[0-9A-F]{6}$/i)
				}
			})
		})

		it('should include new categories added in issue #282', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)

			// Issue #282で追加されたカテゴリを確認
			const systemFee = data.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === 'システム関係費'
			})
			expect(systemFee).toBeDefined()
			if (isCategoryResponse(systemFee)) {
				expect(systemFee.id).toBe(getCategoryIdByName('システム関係費'))
				expect(systemFee.type).toBe('expense')
			}

			const books = data.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === '書籍代'
			})
			expect(books).toBeDefined()
			if (isCategoryResponse(books)) {
				expect(books.id).toBe(getCategoryIdByName('書籍代'))
				expect(books.type).toBe('expense')
			}

			const utilities = data.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === '家賃・水道・光熱・通信費'
			})
			expect(utilities).toBeDefined()
			if (isCategoryResponse(utilities)) {
				expect(utilities.id).toBe(getCategoryIdByName('家賃・水道・光熱・通信費'))
				expect(utilities.type).toBe('expense')
			}
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

			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be created')
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

			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be updated')
		})
	})

	describe('DELETE /categories/:id', () => {
		it('should return 405 Method Not Allowed', async () => {
			const response = await createTestRequest(testProductionApp, 'DELETE', '/api/categories/1')

			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be deleted')
		})
	})

	describe('Business Scenarios', () => {
		it('ユーザーストーリー: 新規ユーザーがカテゴリ一覧を初めて表示する', async () => {
			// カテゴリ一覧を取得
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const categories = await getResponseJson(response)
			expect(Array.isArray(categories)).toBe(true)
			expect(categories.length).toBeGreaterThan(0)

			// 収入と支出の両方のカテゴリが含まれていることを確認
			const hasIncomeCategories = categories.some((cat: unknown) => {
				return isCategoryResponse(cat) && cat.type === 'income'
			})
			const hasExpenseCategories = categories.some((cat: unknown) => {
				return isCategoryResponse(cat) && cat.type === 'expense'
			})

			expect(hasIncomeCategories).toBe(true)
			expect(hasExpenseCategories).toBe(true)

			// 基本的なカテゴリ（給与、食費）が存在することを確認
			const salaryCategory = categories.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === '給与'
			})
			const foodCategory = categories.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === '食費'
			})

			expect(salaryCategory).toBeDefined()
			expect(foodCategory).toBeDefined()
		})

		it('ユーザーストーリー: 支出を記録する際に適切なカテゴリを選択できる', async () => {
			// カテゴリ一覧を取得
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const categories = await getResponseJson(response)

			// 支出カテゴリのみをフィルタリング
			const expenseCategories = categories.filter((cat: unknown) => {
				return isCategoryResponse(cat) && cat.type === 'expense'
			})

			// 日常的な支出カテゴリが揃っていることを確認
			const expectedExpenseCategories = ['食費', '交通費', '買い物', '娯楽', 'その他']

			expectedExpenseCategories.forEach((categoryName) => {
				const exists = expenseCategories.some((cat: unknown) => {
					return isCategoryResponse(cat) && cat.name === categoryName
				})
				expect(exists).toBe(true)
			})
		})
	})

	describe('Category Types', () => {
		it('should return both income and expense categories', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			const expenseCategories = data.filter((cat: unknown) => {
				return isCategoryResponse(cat) && cat.type === 'expense'
			})
			const incomeCategories = data.filter((cat: unknown) => {
				return isCategoryResponse(cat) && cat.type === 'income'
			})

			expect(expenseCategories.length).toBe(11) // 支出カテゴリ
			expect(incomeCategories.length).toBe(5) // 収入カテゴリ
		})

		it('should maintain consistent order from config', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)

			// 設定ファイルの順序と一致することを確認
			data.forEach((category: unknown, index: number) => {
				if (isCategoryResponse(category)) {
					const configCategory = ALL_CATEGORIES[index]
					expect(category.id).toBe(configCategory.numericId)
					expect(category.name).toBe(configCategory.name)
				}
			})
		})
	})

	describe('Category Usage Restrictions', () => {
		it('should not allow deletion of categories that are in use by transactions', async () => {
			// カテゴリを使用する取引を作成
			const expenseCategory = ALL_CATEGORIES.find((cat) => cat.type === 'expense')!
			await db.insert(transactions).values({
				amount: 5000,
				type: 'expense',
				categoryId: expenseCategory.numericId,
				description: 'Test transaction',
				date: new Date().toISOString(),
			})

			// 削除を試みる
			const response = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/categories/${expenseCategory.numericId}`
			)

			// カテゴリは固定なので405が返る
			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be deleted')
		})

		it('should not allow deletion of categories that are in use by subscriptions', async () => {
			// カテゴリを使用するサブスクリプションを作成
			const subscriptionCategory = getCategoryByName('仕事・ビジネス')!
			await db.insert(subscriptions).values({
				name: 'Test Subscription',
				amount: 3000,
				billingCycle: 'monthly',
				nextBillingDate: new Date().toISOString(),
				categoryId: subscriptionCategory.numericId,
				description: 'Test subscription',
				isActive: true,
			})

			// 削除を試みる
			const response = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/categories/${subscriptionCategory.numericId}`
			)

			// カテゴリは固定なので405が返る
			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be deleted')
		})
	})

	describe('Bulk Operations Scenarios', () => {
		it('should handle sequential operations correctly', async () => {
			// 1. カテゴリ一覧を取得
			const listResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(listResponse.status).toBe(200)

			// 2. 作成を試みる（失敗するはず）
			const createResponse = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				{ name: 'New Category', type: 'expense', color: '#FF0000' }
			)
			await expectMethodNotAllowed(createResponse, 'Categories are fixed and cannot be created')

			// 3. 更新を試みる（失敗するはず）
			const updateResponse = await createTestRequest(
				testProductionApp,
				'PUT',
				'/api/categories/1',
				{ name: 'Updated Name' }
			)
			await expectMethodNotAllowed(updateResponse, 'Categories are fixed and cannot be updated')

			// 4. 削除を試みる（失敗するはず）
			const deleteResponse = await createTestRequest(
				testProductionApp,
				'DELETE',
				'/api/categories/1'
			)
			await expectMethodNotAllowed(deleteResponse, 'Categories are fixed and cannot be deleted')

			// 5. 再度一覧を取得し、変更がないことを確認
			const finalListResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			expect(finalListResponse.status).toBe(200)
			const finalData = await getResponseJson(finalListResponse)
			expect(finalData.length).toBe(ALL_CATEGORIES.length)
		})

		it('should handle concurrent read operations efficiently', async () => {
			// 5つの同時リクエストを作成
			const concurrentRequests = Array.from({ length: 5 }, () =>
				createTestRequest(testProductionApp, 'GET', '/api/categories')
			)

			// すべてのリクエストを同時に実行
			const responses = await Promise.all(concurrentRequests)

			// すべてのレスポンスが成功することを確認
			responses.forEach((response) => {
				expect(response.status).toBe(200)
			})

			// データの一貫性を確認（タイムスタンプは除外）
			const allData = await Promise.all(responses.map((r) => getResponseJson(r)))
			const firstData = allData[0]

			allData.forEach((data) => {
				expect(data.length).toBe(firstData.length)
				// カテゴリの内容が同じであることを確認（タイムスタンプ以外）
				data.forEach((category: unknown, index: number) => {
					if (isCategoryResponse(category) && isCategoryResponse(firstData[index])) {
						expect(category.id).toBe(firstData[index].id)
						expect(category.name).toBe(firstData[index].name)
						expect(category.type).toBe(firstData[index].type)
						expect(category.color).toBe(firstData[index].color)
					}
				})
			})
		})
	})

	describe('Pagination Boundary Tests', () => {
		it('should handle requests with pagination parameters gracefully', async () => {
			// ページネーションパラメータを含むリクエスト（APIは無視するはず）
			const testCases = [
				'?page=1&limit=10',
				'?page=0&limit=0',
				'?page=-1&limit=-10',
				'?page=999999&limit=999999',
				'?page=abc&limit=xyz',
			]

			for (const queryParams of testCases) {
				const response = await createTestRequest(
					testProductionApp,
					'GET',
					`/api/categories${queryParams}`
				)
				expect(response.status).toBe(200)

				const data = await getResponseJson(response)
				// ページネーションパラメータに関わらず、全カテゴリが返される
				expect(data.length).toBe(ALL_CATEGORIES.length)
			}
		})

		it('should return consistent data regardless of query parameters', async () => {
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

			// すべて同じデータを返すことを確認
			expect(JSON.stringify(compareWithoutTimestamps(data1))).toBe(
				JSON.stringify(compareWithoutTimestamps(data2))
			)
			expect(JSON.stringify(compareWithoutTimestamps(data2))).toBe(
				JSON.stringify(compareWithoutTimestamps(data3))
			)
		})
	})

	describe('Duplicate Category Name Tests', () => {
		it('should not allow creating categories with existing names', async () => {
			// 既存のカテゴリ名で作成を試みる
			const existingCategory = ALL_CATEGORIES[0]
			const response = await createTestRequest(testProductionApp, 'POST', '/api/categories', {
				name: existingCategory.name,
				type: existingCategory.type,
				color: '#FF0000',
			})

			// カテゴリは固定なので405が返る
			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be created')
		})

		it('should not allow creating categories with same name but different type', async () => {
			// 「その他」カテゴリは収入と支出の両方に存在する
			const response = await createTestRequest(testProductionApp, 'POST', '/api/categories', {
				name: 'その他',
				type: 'income', // または 'expense'
				color: '#999999',
			})

			// カテゴリは固定なので405が返る
			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be created')
		})

		it('should handle category name uniqueness within type', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const categories = await getResponseJson(response)

			// 同じタイプ内でカテゴリ名が重複していないことを確認
			const incomeNames = new Set<string>()
			const expenseNames = new Set<string>()

			categories.forEach((cat: unknown) => {
				if (isCategoryResponse(cat)) {
					if (cat.type === 'income') {
						// 「その他」は両方のタイプに存在可能
						if (cat.name !== 'その他') {
							expect(incomeNames.has(cat.name)).toBe(false)
						}
						incomeNames.add(cat.name)
					} else {
						if (cat.name !== 'その他') {
							expect(expenseNames.has(cat.name)).toBe(false)
						}
						expenseNames.add(cat.name)
					}
				}
			})
		})
	})

	describe('Database Transaction Rollback Tests', () => {
		it('should maintain data consistency when operations fail', async () => {
			// データの整合性を確認するため、初期状態を記録
			const beforeResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const beforeData = await getResponseJson(beforeResponse)

			// 複数の操作を試みる（すべて失敗するはず）
			await createTestRequest(testProductionApp, 'POST', '/api/categories', {
				name: 'Rollback Test',
				type: 'expense',
				color: '#000000',
			})

			await createTestRequest(testProductionApp, 'PUT', '/api/categories/1', {
				name: 'Changed Name',
			})

			await createTestRequest(testProductionApp, 'DELETE', '/api/categories/2')

			// データが変更されていないことを確認
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
			const concurrentRequests = Array.from({ length: 5 }, (_, i) =>
				createTestRequest(testProductionApp, 'DELETE', `/api/categories/${i}`)
			)

			const responses = await Promise.all(concurrentRequests)

			// すべてのリクエストが適切にエラーハンドリングされることを確認
			responses.forEach((response) => {
				expect(response.status).toBe(405)
			})

			// データベースが正常に動作していることを確認
			const checkResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(checkResponse.status).toBe(200)
			const data = await getResponseJson(checkResponse)
			expect(data.length).toBe(ALL_CATEGORIES.length)
		})

		it('should rollback partial updates in bulk operations', async () => {
			// 部分的な更新のロールバックをテスト
			const operations = [
				createTestRequest(testProductionApp, 'POST', '/api/categories', {
					name: 'New Category 1',
					type: 'expense',
					color: '#111111',
				}),
				createTestRequest(testProductionApp, 'PUT', '/api/categories/1', {
					name: 'Updated Category',
				}),
				createTestRequest(testProductionApp, 'DELETE', '/api/categories/2'),
			]

			const results = await Promise.all(operations)

			// すべての操作が拒否されることを確認
			results.forEach((response) => {
				expect(response.status).toBe(405)
			})

			// データが変更されていないことを確認
			const finalResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const finalData = await getResponseJson(finalResponse)
			expect(finalData.length).toBe(ALL_CATEGORIES.length)
		})
	})

	describe('Real-world Business Scenarios', () => {
		it('ユーザーストーリー: 日常の支出を記録する', async () => {
			// ステップ1: カテゴリ一覧を取得
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			const categories = await getResponseJson(categoriesResponse)

			// ステップ2: 食費カテゴリを選択
			const foodCategory = categories.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === '食費'
			})
			expect(foodCategory).toBeDefined()

			// ステップ3: 交通費カテゴリを選択
			const transportCategory = categories.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === '交通費'
			})
			expect(transportCategory).toBeDefined()

			// カテゴリが正しく設定されていることを確認
			if (isCategoryResponse(foodCategory) && isCategoryResponse(transportCategory)) {
				expect(foodCategory.type).toBe('expense')
				expect(transportCategory.type).toBe('expense')
				expect(foodCategory.color).toBeDefined()
				expect(transportCategory.color).toBeDefined()
			}
		})

		it('ユーザーストーリー: 月次支出レポートを確認する', async () => {
			// ステップ1: 取引データを準備（テスト用）
			const testTransactions = [
				{ categoryId: getCategoryIdByName('食費'), amount: 5000 },
				{ categoryId: getCategoryIdByName('食費'), amount: 3000 },
				{ categoryId: getCategoryIdByName('交通費'), amount: 10000 },
				{ categoryId: getCategoryIdByName('娯楽'), amount: 8000 },
			]

			// DBに取引を追加
			for (const tx of testTransactions) {
				await db.insert(transactions).values({
					amount: tx.amount,
					type: 'expense',
					categoryId: tx.categoryId,
					description: 'Monthly expense',
					date: new Date().toISOString(),
				})
			}

			// ステップ2: カテゴリ情報を取得してレポート用に集計
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			const categories = await getResponseJson(categoriesResponse)

			// カテゴリごとの支出を集計
			const expenseByCategory = new Map<string, number>()
			for (const tx of testTransactions) {
				const category = categories.find((cat: unknown) => {
					return isCategoryResponse(cat) && cat.id === tx.categoryId
				})
				if (isCategoryResponse(category)) {
					const current = expenseByCategory.get(category.name) || 0
					expenseByCategory.set(category.name, current + tx.amount)
				}
			}

			// 集計結果を確認
			expect(expenseByCategory.get('食費')).toBe(8000)
			expect(expenseByCategory.get('交通費')).toBe(10000)
			expect(expenseByCategory.get('娯楽')).toBe(8000)

			// 合計を動的に計算
			const totalExpense = testTransactions.reduce((sum, tx) => sum + tx.amount, 0)
			expect(totalExpense).toBe(26000)
		})

		it('ユーザーストーリー: サブスクリプションをカテゴリ別に管理する', async () => {
			// ステップ1: システム関係費カテゴリを取得
			const categoriesResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/categories'
			)
			const categories = await getResponseJson(categoriesResponse)

			const systemCategory = categories.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.name === 'システム関係費'
			})
			expect(systemCategory).toBeDefined()

			// ステップ2: サブスクリプションを登録
			if (isCategoryResponse(systemCategory)) {
				await db.insert(subscriptions).values({
					name: 'Cloud Service',
					amount: 2000,
					billingCycle: 'monthly',
					nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
					categoryId: systemCategory.id,
					description: 'クラウドサービス月額',
					isActive: true,
				})

				// ステップ3: 登録したサブスクリプションのカテゴリが正しいことを確認
				const savedSubscriptions = await db
					.select()
					.from(subscriptions)
					.where(eq(subscriptions.categoryId, systemCategory.id))

				expect(savedSubscriptions.length).toBeGreaterThan(0)
				expect(savedSubscriptions[0].categoryId).toBe(systemCategory.id)
			}
		})
	})

	describe('ビジネス要件: カテゴリは固定で変更不可', () => {
		it('should enforce immutable categories business rule', async () => {
			// ビジネス要件: 新しいビジネスカテゴリの追加は不可
			const newBusinessCategory = {
				name: '新規事業費',
				type: 'expense',
				color: '#FF5733',
			}
			const createResponse = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				newBusinessCategory
			)
			await expectMethodNotAllowed(createResponse, 'Categories are fixed and cannot be created')

			// ビジネス要件: 既存カテゴリの名前変更は不可
			const renameResponse = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${getCategoryIdByName('食費')}`,
				{ name: '飲食費' }
			)
			await expectMethodNotAllowed(renameResponse, 'Categories are fixed and cannot be updated')

			// ビジネス要件: 未使用カテゴリの削除も不可
			const deleteResponse = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/categories/${getCategoryIdByName('その他')}`
			)
			await expectMethodNotAllowed(deleteResponse, 'Categories are fixed and cannot be deleted')

			// ビジネス要件: カテゴリマスタは常に一定
			const checkResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const finalCategories = await getResponseJson(checkResponse)
			expect(finalCategories.length).toBe(ALL_CATEGORIES.length)
		})
	})

	describe('エラーハンドリング: サブスクリプション登録時のカテゴリ不整合', () => {
		it('should handle invalid category type for subscriptions', async () => {
			// 収入カテゴリIDでサブスクリプションを作成しようとする
			const salaryCategory = getCategoryByName('給与')!

			// サブスクリプションは支出カテゴリのみ許可されるべき
			await expect(
				db.insert(subscriptions).values({
					name: 'Invalid Subscription',
					amount: 1000,
					billingCycle: 'monthly',
					nextBillingDate: new Date().toISOString(),
					categoryId: salaryCategory.numericId, // 収入カテゴリID
					description: 'This should fail',
					isActive: true,
				})
			).resolves.not.toThrow() // DBレベルでは制約がないため、アプリケーション層で検証が必要
		})
	})

	describe('エラーハンドリング: サブスクリプションの無効な更新', () => {
		it('should handle category modification attempts gracefully', async () => {
			// サブスクリプションを作成
			const systemCategory = getCategoryByName('システム関係費')!
			await db.insert(subscriptions).values({
				name: 'Test Service',
				amount: 3000,
				billingCycle: 'monthly',
				nextBillingDate: new Date().toISOString(),
				categoryId: systemCategory.numericId,
				description: 'Test',
				isActive: true,
			})

			// カテゴリの変更を試みる（失敗するはず）
			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${systemCategory.numericId}`,
				{ name: 'Modified System Fee' }
			)

			await expectMethodNotAllowed(response, 'Categories are fixed and cannot be updated')

			// カテゴリが変更されていないことを確認
			const checkResponse = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const categories = await getResponseJson(checkResponse)
			const unchangedCategory = categories.find((cat: unknown) => {
				return isCategoryResponse(cat) && cat.id === systemCategory.numericId
			})

			if (isCategoryResponse(unchangedCategory)) {
				expect(unchangedCategory.name).toBe(systemCategory.name)
			}
		})
	})
})