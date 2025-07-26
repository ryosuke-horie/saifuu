import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ALL_CATEGORIES, getCategoryByName } from '../../../../shared/config/categories'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * カテゴリAPI 統合テスト
 *
 * 設定ファイルベースのカテゴリAPIをテストする
 * カテゴリは設定ファイルで固定のため、読み取り専用
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
function isCategoryResponse(value: unknown): value is CategoryResponse {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const obj = value as Record<string, unknown>
	return (
		typeof obj.id === 'number' &&
		typeof obj.name === 'string' &&
		(obj.type === 'income' || obj.type === 'expense') &&
		typeof obj.color === 'string' &&
		typeof obj.createdAt === 'string' &&
		typeof obj.updatedAt === 'string'
	)
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
})
