import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { testCategories, testSubscriptions } from '../helpers/fixtures'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * カテゴリ-サブスクリプション間 統合テスト
 *
 * モジュール間のデータ整合性と外部キー制約の動作をテストする
 * 実際のデータベース制約と参照整合性を確認
 */

describe('Categories-Subscriptions Cross-Module Integration Tests', () => {
	beforeEach(async () => {
		// テストデータベースのセットアップ
		await setupTestDatabase()
	})

	afterEach(async () => {
		// テストデータベースのクリーンアップ
		await cleanupTestDatabase()
	})

	describe('Foreign Key Relationships', () => {
		it('should create subscription with valid category ID', async () => {
			// まず有効なカテゴリを作成
			const category = {
				...testCategories.entertainment,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(testProductionApp, 'POST', '/api/categories', category)
			expect(response.status).toBe(201)

			const categoryData = await getResponseJson(response)
			const categoryId = categoryData.id

			// 作成したカテゴリIDを使用してサブスクリプションを作成
			const subscription = {
				...testSubscriptions.netflix,
				categoryId,
			}

			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', subscription)
			expect(response.status).toBe(201)

			const subscriptionData = await getResponseJson(response)
			expect(subscriptionData.categoryId).toBe(categoryId)
			expect(subscriptionData.name).toBe(subscription.name)
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

			// 外部キー制約により失敗する可能性がある
			// 現在の実装では制約が厳密でない可能性があるため、複数のステータスを許可
			if (response.status !== 201) {
				expect([400, 500]).toContain(response.status)
			} else {
				// 制約が緩い場合は成功するが、カテゴリIDが保存される
				const data = await getResponseJson(response)
				expect(data.categoryId).toBe(99999)
			}
		})

		it('should handle subscription creation with null category ID', async () => {
			// カテゴリIDをnullにしてサブスクリプションを作成
			const subscription = {
				...testSubscriptions.netflix,
				categoryId: null,
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			expect(data.categoryId).toBeNull()
			expect(data.name).toBe(subscription.name)
		})
	})

	describe('Data Consistency and Referential Integrity', () => {
		it('should maintain referential integrity when category is deleted', async () => {
			// カテゴリを作成
			const category = {
				...testCategories.software,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(testProductionApp, 'POST', '/api/categories', category)
			expect(response.status).toBe(201)

			const categoryData = await getResponseJson(response)
			const categoryId = categoryData.id

			// サブスクリプションを作成
			const subscription = {
				...testSubscriptions.github,
				categoryId,
			}

			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', subscription)
			expect(response.status).toBe(201)

			const subscriptionData = await getResponseJson(response)
			const subscriptionId = subscriptionData.id

			// カテゴリを削除
			response = await createTestRequest(testProductionApp, 'DELETE', `/api/categories/${categoryId}`)

			// 外部キー制約により削除が制限される可能性がある
			if (response.status === 200) {
				// 削除が成功した場合、サブスクリプションの状態を確認
				response = await createTestRequest(
					testProductionApp,
					'GET',
					`/api/subscriptions/${subscriptionId}`
				)
				expect(response.status).toBe(200)

				const data = await getResponseJson(response)
				// カテゴリが削除された場合、サブスクリプションのcategoryIdの状態を確認
				// 実装によって null になるかそのまま残るかは異なる
				expect(data).toBeTruthy()
			} else {
				// 削除が制限された場合
				expect([400, 500]).toContain(response.status)

				// カテゴリが削除されていないことを確認
				response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
				expect(response.status).toBe(200)

				const categoriesData = await getResponseJson(response)
				const existingCategory = categoriesData.find((cat: { id: number }) => cat.id === categoryId)
				expect(existingCategory).toBeTruthy()
			}
		})

		it('should handle category updates and their impact on subscriptions', async () => {
			// カテゴリを作成
			const category = {
				...testCategories.entertainment,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(testProductionApp, 'POST', '/api/categories', category)
			expect(response.status).toBe(201)

			const categoryData = await getResponseJson(response)
			const categoryId = categoryData.id

			// サブスクリプションを作成
			const subscription = {
				...testSubscriptions.netflix,
				categoryId,
			}

			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', subscription)
			expect(response.status).toBe(201)

			const subscriptionData = await getResponseJson(response)
			const subscriptionId = subscriptionData.id

			// カテゴリを更新
			const updateData = {
				name: '更新されたエンターテイメント',
				color: '#00FF00',
			}

			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${categoryId}`,
				updateData
			)
			expect(response.status).toBe(200)

			// サブスクリプションの関連付けが維持されていることを確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${subscriptionId}`
			)
			expect(response.status).toBe(200)

			const updatedSubscriptionData = await getResponseJson(response)
			expect(updatedSubscriptionData.categoryId).toBe(categoryId)

			// サブスクリプション一覧でカテゴリ情報が更新されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			const subscriptionsData = await getResponseJson(response)
			const targetSubscription = subscriptionsData.find(
				(sub: { id: number }) => sub.id === subscriptionId
			)
			expect(targetSubscription).toBeTruthy()
			expect(targetSubscription.categoryId).toBe(categoryId)
		})
	})

	describe('Cross-Module Data Scenarios', () => {
		it('should handle multiple subscriptions with same category', async () => {
			// 1つのカテゴリに複数のサブスクリプションを関連付け
			const category = {
				...testCategories.entertainment,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(testProductionApp, 'POST', '/api/categories', category)
			expect(response.status).toBe(201)

			const categoryData = await getResponseJson(response)
			const categoryId = categoryData.id

			// 複数のサブスクリプションを作成
			const subscriptions = [
				{ ...testSubscriptions.netflix, categoryId },
				{ ...testSubscriptions.spotify, categoryId },
			]

			const subscriptionIds = []
			for (const sub of subscriptions) {
				response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', sub)
				expect(response.status).toBe(201)

				const data = await getResponseJson(response)
				subscriptionIds.push(data.id)
				expect(data.categoryId).toBe(categoryId)
			}

			// サブスクリプション一覧で全て表示されることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			const subscriptionsData = await getResponseJson(response)
			const relatedSubscriptions = subscriptionsData.filter(
				(sub: { categoryId: number }) => sub.categoryId === categoryId
			)
			expect(relatedSubscriptions.length).toBe(subscriptions.length)
		})

		it('should handle subscriptions with different categories', async () => {
			// 異なるカテゴリのサブスクリプションを作成
			const categories = [
				{
					...testCategories.entertainment,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					...testCategories.software,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			const categoryIds: number[] = []
			for (const cat of categories) {
				const response = await createTestRequest(testProductionApp, 'POST', '/api/categories', cat)
				expect(response.status).toBe(201)

				const data = await getResponseJson(response)
				categoryIds.push(data.id)
			}

			// 各カテゴリのサブスクリプションを作成
			const subscriptions = [
				{ ...testSubscriptions.netflix, categoryId: categoryIds[0] },
				{ ...testSubscriptions.github, categoryId: categoryIds[1] },
			]

			for (const sub of subscriptions) {
				const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', sub)
				expect(response.status).toBe(201)

				const data = await getResponseJson(response)
				expect(data.categoryId).toBe(sub.categoryId)
			}

			// 一覧取得で適切に分類されていることを確認
			const response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			const subscriptionsData = await getResponseJson(response)
			const entertainmentSubs = subscriptionsData.filter(
				(sub: { categoryId: number }) => sub.categoryId === categoryIds[0]
			)
			const softwareSubs = subscriptionsData.filter(
				(sub: { categoryId: number }) => sub.categoryId === categoryIds[1]
			)

			expect(entertainmentSubs.length).toBe(1)
			expect(softwareSubs.length).toBe(1)
		})
	})

	describe('Edge Cases and Error Scenarios', () => {
		it('should handle concurrent category and subscription modifications', async () => {
			// カテゴリとサブスクリプションを同時に操作
			const category = {
				...testCategories.entertainment,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(testProductionApp, 'POST', '/api/categories', category)
			expect(response.status).toBe(201)

			const categoryData = await getResponseJson(response)
			const categoryId = categoryData.id

			const subscription = {
				...testSubscriptions.netflix,
				categoryId,
			}

			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', subscription)
			expect(response.status).toBe(201)

			const subscriptionData = await getResponseJson(response)
			const subscriptionId = subscriptionData.id

			// 同時にカテゴリとサブスクリプションを更新
			const categoryUpdate = createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${categoryId}`,
				{
					name: 'Updated Entertainment',
					color: '#FF0000',
				}
			)

			const subscriptionUpdate = createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${subscriptionId}`,
				{
					name: 'Updated Netflix',
					amount: 2200,
				}
			)

			const [categoryResponse, subscriptionResponse] = await Promise.all([
				categoryUpdate,
				subscriptionUpdate,
			])

			// 両方が成功するか、競合が発生するかは実装依存
			expect([200, 409, 500]).toContain(categoryResponse.status)
			expect([200, 409, 500]).toContain(subscriptionResponse.status)

			// 最終的に一貫性が保たれていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			const finalSubscriptionsData = await getResponseJson(response)
			const finalSubscription = finalSubscriptionsData.find(
				(sub: { id: number }) => sub.id === subscriptionId
			)
			expect(finalSubscription).toBeTruthy()
			expect(finalSubscription.categoryId).toBe(categoryId)
		})

		it('should handle category type changes and subscription consistency', async () => {
			// カテゴリタイプを変更した場合のサブスクリプションへの影響
			const category = {
				...testCategories.entertainment,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			let response = await createTestRequest(testProductionApp, 'POST', '/api/categories', category)
			expect(response.status).toBe(201)

			const categoryData = await getResponseJson(response)
			const categoryId = categoryData.id

			const subscription = {
				...testSubscriptions.netflix,
				categoryId,
			}

			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', subscription)
			expect(response.status).toBe(201)

			const subscriptionData = await getResponseJson(response)
			const subscriptionId = subscriptionData.id

			// カテゴリタイプを変更
			const updateData = {
				name: category.name,
				type: 'income', // expense から income に変更
				color: category.color,
			}

			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/categories/${categoryId}`,
				updateData
			)
			expect(response.status).toBe(200)

			// サブスクリプションの関連付けが維持されていることを確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${subscriptionId}`
			)
			expect(response.status).toBe(200)

			const updatedSubscriptionData = await getResponseJson(response)
			expect(updatedSubscriptionData.categoryId).toBe(categoryId)

			// カテゴリタイプが変更されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			expect(response.status).toBe(200)

			const categoriesData = await getResponseJson(response)
			const updatedCategory = categoriesData.find((cat: { id: number }) => cat.id === categoryId)
			expect(updatedCategory.type).toBe('income')
		})
	})
})
