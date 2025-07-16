import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ALL_CATEGORIES } from '../../../../shared/config/categories'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * カテゴリAPI 統合テスト
 *
 * 設定ファイルベースのカテゴリAPIをテストする
 * カテゴリは設定ファイルで固定のため、読み取り専用
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

			expect(expenseCategories.length).toBe(11) // 削除・変更済み
			expect(incomeCategories.length).toBe(0) // 収入カテゴリは削除済み
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
})
