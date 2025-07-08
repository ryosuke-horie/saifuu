import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { testCategories } from '../helpers/fixtures'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * カテゴリAPI 統合テスト
 *
 * データベースとの実際の連携をテストする
 * 実際のSQLiteデータベースとの統合を確認
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

	describe('Full CRUD Operations', () => {
		it('should perform complete category lifecycle', async () => {
			// 1. 初期状態で既存のカテゴリ（テストデータ）を取得
			let response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			let data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)
			const initialCount = data.length
			expect(initialCount).toBeGreaterThanOrEqual(2) // テストデータのカテゴリ2つ

			// 2. 新しいカテゴリを作成
			const newCategory = {
				...testCategories.income,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			response = await createTestRequest(testProductionApp, 'POST', '/api/categories', newCategory)
			expect(response.status).toBe(201)

			data = await getResponseJson(response)
			const createdId = data.id
			expect(data.name).toBe(newCategory.name)
			expect(data.type).toBe(newCategory.type)
			expect(data.color).toBe(newCategory.color)
			expect(createdId).toBeDefined()

			// 3. 一覧に追加されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data).toHaveLength(initialCount + 1)

			const createdCategory = data.find((cat: { id: number }) => cat.id === createdId)
			expect(createdCategory).toBeTruthy()
			expect(createdCategory.name).toBe(newCategory.name)
			expect(createdCategory.type).toBe(newCategory.type)

			// 4. カテゴリを更新
			const updateData = {
				name: '更新された給与',
				color: '#00FF00',
				type: 'income',
			}

			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${createdId}`,
				updateData
			)
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data.name).toBe(updateData.name)
			expect(data.color).toBe(updateData.color)
			expect(data.type).toBe(updateData.type)
			expect(data.id).toBe(createdId)

			// 5. 更新が反映されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			const updatedCategory = data.find((cat: { id: number }) => cat.id === createdId)
			expect(updatedCategory.name).toBe(updateData.name)
			expect(updatedCategory.color).toBe(updateData.color)

			// 6. カテゴリを削除
			response = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/categories/${createdId}`
			)
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data.message).toBe('Category deleted successfully')

			// 7. 削除されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data).toHaveLength(initialCount)

			const deletedCategory = data.find((cat: { id: number }) => cat.id === createdId)
			expect(deletedCategory).toBeUndefined()
		})

		it('should handle multiple categories with different types', async () => {
			// 異なるタイプのカテゴリを作成し、型別での管理をテスト

			// 支出カテゴリを作成
			const expenseCategory = {
				...testCategories.entertainment,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				expenseCategory
			)
			expect(response.status).toBe(201)
			const expenseData = await getResponseJson(response)

			// 収入カテゴリを作成
			const incomeCategory = {
				...testCategories.income,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				incomeCategory
			)
			expect(response.status).toBe(201)
			const incomeData = await getResponseJson(response)

			// 一覧取得で両方のカテゴリが適切に管理されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(data.length).toBeGreaterThanOrEqual(4) // 初期2つ + 新規2つ

			// 支出カテゴリの検証
			const expenseCategory2 = data.find((cat: { id: number }) => cat.id === expenseData.id)
			expect(expenseCategory2).toBeTruthy()
			expect(expenseCategory2.type).toBe('expense')
			expect(expenseCategory2.name).toBe(expenseCategory.name)

			// 収入カテゴリの検証
			const incomeCategory2 = data.find((cat: { id: number }) => cat.id === incomeData.id)
			expect(incomeCategory2).toBeTruthy()
			expect(incomeCategory2.type).toBe('income')
			expect(incomeCategory2.name).toBe(incomeCategory.name)
		})
	})

	describe('Error Handling and Edge Cases', () => {
		it('should handle updates to non-existent categories', async () => {
			// 存在しないカテゴリの更新を試行
			const nonExistentId = 99999
			const updateData = {
				name: 'Non-existent Category',
				type: 'expense',
			}

			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${nonExistentId}`,
				updateData
			)
			expect(response.status).toBe(404)

			const data = await getResponseJson(response)
			expect(data.error).toBe('Category not found')
		})

		it('should handle deletion of non-existent categories', async () => {
			// 存在しないカテゴリの削除を試行
			const nonExistentId = 99999

			const response = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/categories/${nonExistentId}`
			)
			expect(response.status).toBe(404)

			const data = await getResponseJson(response)
			expect(data.error).toBe('Category not found')
		})

		it('should handle malformed request data', async () => {
			// 無効なデータでのカテゴリ作成を試行
			const invalidData = {
				name: '', // 空の名前
				type: 'invalid_type', // 無効なタイプ
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				invalidData
			)
			// 実装によってはバリデーションエラーが返される可能性がある
			// 現在の実装では500エラーが返される
			expect([400, 500]).toContain(response.status)
		})

		it('should handle concurrent modifications', async () => {
			// 同時更新のテスト

			// まずカテゴリを作成
			const newCategory = {
				...testCategories.software,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				newCategory
			)
			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			const categoryId = data.id

			// 同時に2つの更新リクエストを送信
			const update1 = createTestRequest(testProductionApp, 'PUT', `/api/categories/${categoryId}`, {
				name: 'Update 1',
				color: '#FF0000',
			})

			const update2 = createTestRequest(testProductionApp, 'PUT', `/api/categories/${categoryId}`, {
				name: 'Update 2',
				color: '#00FF00',
			})

			const [response1, response2] = await Promise.all([update1, update2])

			// 両方が成功するか、一方がエラーになるかは実装依存
			expect([200, 409, 500]).toContain(response1.status)
			expect([200, 409, 500]).toContain(response2.status)

			// 最終状態を確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const finalData = await getResponseJson(response)
			const finalCategory = finalData.find((cat: { id: number }) => cat.id === categoryId)

			// いずれかの更新が反映されている
			expect(['Update 1', 'Update 2']).toContain(finalCategory.name)
		})
	})

	describe('Data Validation and Constraints', () => {
		it('should enforce category type constraints', async () => {
			// 有効なタイプでのカテゴリ作成
			const validIncomeCategory = {
				name: 'Valid Income',
				type: 'income',
				color: '#00FF00',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				validIncomeCategory
			)
			expect(response.status).toBe(201)

			const validExpenseCategory = {
				name: 'Valid Expense',
				type: 'expense',
				color: '#FF0000',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				validExpenseCategory
			)
			expect(response.status).toBe(201)

			// 無効なタイプでの作成試行
			const invalidCategory = {
				name: 'Invalid Type',
				type: 'invalid_type',
				color: '#0000FF',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				invalidCategory
			)
			// SQLite制約により失敗するはず
			expect([400, 500]).toContain(response.status)
		})

		it('should handle optional color field', async () => {
			// 色なしでのカテゴリ作成
			const categoryWithoutColor = {
				name: 'No Color Category',
				type: 'expense',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				categoryWithoutColor
			)
			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			expect(data.name).toBe(categoryWithoutColor.name)
			expect(data.type).toBe(categoryWithoutColor.type)
			expect(data.color).toBeNull()
		})

		it('should maintain timestamp fields', async () => {
			// カテゴリ作成時のタイムスタンプ検証
			const beforeCreate = new Date().toISOString()

			const newCategory = {
				name: 'Timestamp Test',
				type: 'expense',
				color: '#FF0000',
				createdAt: beforeCreate,
				updatedAt: beforeCreate,
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				newCategory
			)
			expect(response.status).toBe(201)

			let data = await getResponseJson(response)
			expect(data.createdAt).toBe(beforeCreate)
			expect(data.updatedAt).toBe(beforeCreate)

			// 更新時のタイムスタンプ検証
			const beforeUpdate = new Date()
			const updateData = {
				name: 'Updated Name',
			}

			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${data.id}`,
				updateData
			)
			expect(response.status).toBe(200)
			const afterUpdate = new Date()

			data = await getResponseJson(response)
			expect(data.name).toBe(updateData.name)
			expect(data.createdAt).toBe(beforeCreate) // 作成日は変わらない
			
			// 更新日時が更新前後の時間範囲内にあることを確認（CI環境での時刻ズレ対応）
			const updatedAtTime = new Date(data.updatedAt)
			expect(updatedAtTime.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
			expect(updatedAtTime.getTime()).toBeLessThanOrEqual(afterUpdate.getTime())
		})
	})

	describe('Performance and Scalability', () => {
		it('should handle multiple categories efficiently', async () => {
			// 複数のカテゴリを作成してパフォーマンスをテスト
			const categoriesToCreate = 10 // テスト環境では小さな数値で

			// 複数のカテゴリを作成
			const createPromises = Array.from({ length: categoriesToCreate }, (_, i) => {
				const category = {
					name: `Test Category ${i}`,
					type: i % 2 === 0 ? 'expense' : 'income',
					color: `#${(i * 123456).toString(16).padStart(6, '0').substring(0, 6)}`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}
				return createTestRequest(testProductionApp, 'POST', '/api/categories', category)
			})

			const responses = await Promise.all(createPromises)

			// すべて成功していることを確認
			for (const response of responses) {
				expect(response.status).toBe(201)
			}

			// 一覧取得のパフォーマンス測定
			const start = Date.now()
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const duration = Date.now() - start

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(data.length).toBeGreaterThanOrEqual(categoriesToCreate + 2) // 初期データ + 新規作成

			// レスポンス時間が合理的な範囲内であることを確認
			expect(duration).toBeLessThan(2000) // 2秒以内
		})
	})
})
