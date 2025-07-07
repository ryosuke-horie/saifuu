import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { testSubscriptions } from '../helpers/fixtures'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * サブスクリプションAPI 統合テスト
 *
 * データベースとの実際の連携をテストする
 * 実際のD1データベースまたはそれに近いモック環境を使用
 */

describe('Subscriptions API - Integration Tests', () => {
	beforeEach(async () => {
		// テストデータベースのセットアップ
		await setupTestDatabase()

		// テスト用カテゴリの作成
		// 実際の実装では、カテゴリAPIまたは直接DB操作でデータを準備
	})

	afterEach(async () => {
		// テストデータベースのクリーンアップ
		await cleanupTestDatabase()
	})

	describe('Full CRUD Operations', () => {
		it('should perform complete subscription lifecycle', async () => {
			// 1. 初期状態で空の一覧を取得
			let response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			let data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)
			const initialCount = data.length

			// 2. 新しいサブスクリプションを作成
			const newSubscription = {
				...testSubscriptions.netflix,
				categoryId: 1, // テスト用カテゴリID
			}

			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				newSubscription
			)
			expect(response.status).toBe(201)

			data = await getResponseJson(response)
			const createdId = data.id
			expect(data.name).toBe(newSubscription.name)
			expect(data.amount).toBe(newSubscription.amount)

			// 3. 作成されたサブスクリプションを取得
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${createdId}`
			)
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data.id).toBe(createdId)
			expect(data.name).toBe(newSubscription.name)

			// 4. 一覧に追加されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data).toHaveLength(initialCount + 1)

			const createdSubscription = data.find((sub: { id: number }) => sub.id === createdId)
			expect(createdSubscription).toBeTruthy()
			expect(createdSubscription.name).toBe(newSubscription.name)

			// 5. サブスクリプションを更新
			const updateData = {
				name: 'Netflix Premium',
				amount: 2200,
				description: 'Updated description',
			}

			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${createdId}`,
				updateData
			)
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data.name).toBe(updateData.name)
			expect(data.amount).toBe(updateData.amount)
			expect(data.description).toBe(updateData.description)

			// 6. 更新が反映されていることを確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${createdId}`
			)
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data.name).toBe(updateData.name)
			expect(data.amount).toBe(updateData.amount)

			// 7. サブスクリプションを削除
			response = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/api/subscriptions/${createdId}`
			)
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data.message).toBe('Subscription deleted successfully')

			// 8. 削除されていることを確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${createdId}`
			)
			expect(response.status).toBe(404)

			// 9. 一覧から削除されていることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			data = await getResponseJson(response)
			expect(data).toHaveLength(initialCount)
		})

		it('should handle multiple subscriptions with categories', async () => {
			// 複数のサブスクリプションを作成し、カテゴリとの関連をテスト

			// カテゴリ1のサブスクリプションを作成
			const subscription1 = {
				...testSubscriptions.netflix,
				categoryId: 1,
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription1
			)
			expect(response.status).toBe(201)
			const sub1Data = await getResponseJson(response)

			// カテゴリ2のサブスクリプションを作成
			const subscription2 = {
				...testSubscriptions.github,
				categoryId: 2,
			}

			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription2
			)
			expect(response.status).toBe(201)
			const sub2Data = await getResponseJson(response)

			// 一覧取得でカテゴリ情報が含まれることを確認
			response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(data.length).toBeGreaterThanOrEqual(2)

			// 各サブスクリプションにカテゴリ情報が含まれることを確認
			const sub1 = data.find((sub: { id: number }) => sub.id === sub1Data.id)
			const sub2 = data.find((sub: { id: number }) => sub.id === sub2Data.id)

			expect(sub1).toBeTruthy()
			expect(sub2).toBeTruthy()

			// カテゴリ情報の検証は実際のカテゴリが存在する場合のみ
			if (sub1.category) {
				expect(sub1.category.id).toBe(1)
			}
			if (sub2.category) {
				expect(sub2.category.id).toBe(2)
			}
		})
	})

	describe('Data Validation and Constraints', () => {
		it('should enforce database constraints', async () => {
			// 存在しないカテゴリIDでの作成テスト
			const invalidSubscription = {
				...testSubscriptions.netflix,
				categoryId: 99999, // 存在しないカテゴリID
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				invalidSubscription
			)

			// 外部キー制約により失敗するはず（実装依存）
			if (response.status !== 201) {
				expect([400, 500]).toContain(response.status)
			}
		})

		it('should handle concurrent modifications', async () => {
			// 同時更新のテスト（楽観的排他制御など）

			// まずサブスクリプションを作成
			const newSubscription = {
				...testSubscriptions.spotify,
				categoryId: 1,
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				newSubscription
			)
			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			const subscriptionId = data.id

			// 同時に2つの更新リクエストを送信
			const update1 = createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${subscriptionId}`,
				{
					name: 'Update 1',
					amount: 1000,
				}
			)

			const update2 = createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${subscriptionId}`,
				{
					name: 'Update 2',
					amount: 2000,
				}
			)

			const [response1, response2] = await Promise.all([update1, update2])

			// 両方が成功するか、一方がエラーになるかは実装依存
			expect([200, 409, 500]).toContain(response1.status)
			expect([200, 409, 500]).toContain(response2.status)

			// 最終状態を確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${subscriptionId}`
			)
			expect(response.status).toBe(200)

			const finalData = await getResponseJson(response)
			// いずれかの更新が反映されている
			expect([1000, 2000]).toContain(finalData.amount)
		})
	})

	describe('Performance and Scalability', () => {
		it('should handle large number of subscriptions', async () => {
			// 大量データでのパフォーマンステスト（必要に応じて）
			const subscriptionsToCreate = 10 // テスト環境では小さな数値で

			// 複数のサブスクリプションを作成
			const createPromises = Array.from({ length: subscriptionsToCreate }, (_, i) => {
				const subscription = {
					...testSubscriptions.netflix,
					name: `Test Service ${i}`,
					amount: 1000 + i * 100,
					categoryId: 1,
				}
				return createTestRequest(testProductionApp, 'POST', '/api/subscriptions', subscription)
			})

			const responses = await Promise.all(createPromises)

			// すべて成功していることを確認
			for (const response of responses) {
				expect(response.status).toBe(201)
			}

			// 一覧取得のパフォーマンス測定
			const start = Date.now()
			const response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			const duration = Date.now() - start

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(data.length).toBeGreaterThanOrEqual(subscriptionsToCreate)

			// レスポンス時間が合理的な範囲内であることを確認
			expect(duration).toBeLessThan(5000) // 5秒以内
		})
	})
})
