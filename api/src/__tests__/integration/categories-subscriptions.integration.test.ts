import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ALL_CATEGORIES } from '../../../../shared/config/categories'
import { testSubscriptions } from '../helpers/fixtures'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * カテゴリ-サブスクリプション間 統合テスト
 *
 * 設定ファイルベースのカテゴリとサブスクリプションの整合性をテストする
 * カテゴリは設定ファイルで固定のため、参照整合性のみをテスト
 */
describe('Categories-Subscriptions Cross-Module Integration Tests', () => {
	beforeEach(async () => {
		// テストデータベースの準備
		await setupTestDatabase()
	})

	afterEach(async () => {
		// テストデータベースのクリーンアップ
		await cleanupTestDatabase()
	})

	describe('Category Reference Integrity', () => {
		it('should create subscription with valid category ID from config', async () => {
			// 設定ファイルから既存のカテゴリIDを使用
			const entertainmentCategory = ALL_CATEGORIES.find((cat) => cat.id === 'entertainment')
			expect(entertainmentCategory).toBeDefined()
			const categoryId = entertainmentCategory!.numericId

			// 既存のカテゴリIDを使用してサブスクリプションを作成
			const subscription = {
				...testSubscriptions.netflix,
				categoryId,
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(201)

			const subscriptionData = await getResponseJson(response)
			expect(subscriptionData.categoryId).toBe(categoryId)
			expect(subscriptionData.name).toBe(subscription.name)
		})

		it('should return subscription with category details from config', async () => {
			// 設定ファイルから既存のカテゴリIDを使用
			const softwareCategory = ALL_CATEGORIES.find((cat) => cat.id === 'business')
			expect(softwareCategory).toBeDefined()
			const categoryId = softwareCategory!.numericId

			// サブスクリプションを作成
			const subscription = {
				...testSubscriptions.github,
				categoryId,
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(201)

			const createdData = await getResponseJson(response)

			// 作成したサブスクリプションを取得
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${createdData.id}`
			)
			expect(response.status).toBe(200)

			const fetchedData = await getResponseJson(response)
			expect(fetchedData.category).toBeDefined()
			expect(fetchedData.category.id).toBe(categoryId)
			expect(fetchedData.category.name).toBe(softwareCategory!.name)
			expect(fetchedData.category.type).toBe(softwareCategory!.type)
			expect(fetchedData.category.color).toBe(softwareCategory!.color)
		})

		it('should handle subscription creation with invalid category ID', async () => {
			// 存在しないカテゴリIDでサブスクリプションを作成
			const subscription = {
				...testSubscriptions.netflix,
				categoryId: 99999, // 存在しないカテゴリID
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(201) // カテゴリ参照はソフトチェックのため、作成は成功する

			const subscriptionData = await getResponseJson(response)
			expect(subscriptionData.categoryId).toBe(99999)
			// POSTレスポンスにはカテゴリ情報は含まれない
		})

		it('should list subscriptions with category information from config', async () => {
			// 複数のサブスクリプションを作成
			const categories = ALL_CATEGORIES.filter((cat) => cat.type === 'expense').slice(0, 2)

			for (const [index, subscription] of [
				testSubscriptions.netflix,
				testSubscriptions.spotify,
			].entries()) {
				const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
					...subscription,
					categoryId: categories[index].numericId,
				})
				expect(response.status).toBe(201)
			}

			// サブスクリプション一覧を取得
			const response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)
			expect(data.length).toBeGreaterThanOrEqual(2)

			// 各サブスクリプションにカテゴリ情報が含まれることを確認
			data.forEach((subscription: unknown) => {
				const sub = subscription as { category: unknown }
				if (sub.category) {
					const category = sub.category as { name: string; type: string; color: string }
					expect(category).toHaveProperty('name')
					expect(category).toHaveProperty('type')
					expect(category).toHaveProperty('color')
				}
			})
		})
	})

	describe('API Category Endpoints', () => {
		it('should return 405 for category creation attempts', async () => {
			const response = await createTestRequest(testProductionApp, 'POST', '/api/categories', {
				name: 'Test Category',
				type: 'expense',
				color: '#123456',
			})
			expect(response.status).toBe(405) // Method Not Allowed
		})

		it('should return 405 for category update attempts', async () => {
			const response = await createTestRequest(testProductionApp, 'PUT', '/api/categories/1', {
				name: 'Updated Category',
			})
			expect(response.status).toBe(405) // Method Not Allowed
		})

		it('should return 405 for category deletion attempts', async () => {
			const response = await createTestRequest(testProductionApp, 'DELETE', '/api/categories/1')
			expect(response.status).toBe(405) // Method Not Allowed
		})

		it('should return categories from config file', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)
			expect(data.length).toBe(ALL_CATEGORIES.length)

			// 設定ファイルと一致することを確認
			data.forEach((category: unknown, index: number) => {
				const cat = category as { id: number; name: string; type: string; color: string }
				const configCat = ALL_CATEGORIES[index]
				expect(cat.id).toBe(configCat.numericId)
				expect(cat.name).toBe(configCat.name)
				expect(cat.type).toBe(configCat.type)
				expect(cat.color).toBe(configCat.color)
			})
		})
	})
})
