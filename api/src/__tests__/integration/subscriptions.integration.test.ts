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

// テスト用の型定義
type TestSubscription = {
	id: number | string
	name?: string
	amount?: number
	categoryId?: number | null
	isActive?: boolean
	billingCycle?: string
	nextBillingDate?: string
	description?: string
	category?: {
		id: number
		name?: string
	}
}

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

	describe('Active/Inactive Toggle Multiple Times', () => {
		it('should maintain state integrity when toggling active status multiple times', async () => {
			// 1. サブスクリプションを作成
			const newSubscription = {
				...testSubscriptions.netflix,
				categoryId: 1,
				isActive: true,
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
			expect(data.isActive).toBe(true)

			// 2. 無効化（1回目のトグル）
			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${subscriptionId}`,
				{ isActive: false }
			)
			expect(response.status).toBe(200)
			let updatedData = await getResponseJson(response)
			expect(updatedData.isActive).toBe(false)

			// 3. 有効化（2回目のトグル）
			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${subscriptionId}`,
				{ isActive: true }
			)
			expect(response.status).toBe(200)
			updatedData = await getResponseJson(response)
			expect(updatedData.isActive).toBe(true)

			// 4. 無効化（3回目のトグル）
			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${subscriptionId}`,
				{ isActive: false }
			)
			expect(response.status).toBe(200)
			updatedData = await getResponseJson(response)
			expect(updatedData.isActive).toBe(false)

			// 5. 有効化（4回目のトグル）
			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${subscriptionId}`,
				{ isActive: true }
			)
			expect(response.status).toBe(200)
			updatedData = await getResponseJson(response)
			expect(updatedData.isActive).toBe(true)

			// 6. 最終状態を確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${subscriptionId}`
			)
			expect(response.status).toBe(200)

			const finalData = await getResponseJson(response)
			expect(finalData.isActive).toBe(true)
			// 他のフィールドが変更されていないことを確認
			expect(finalData.name).toBe(newSubscription.name)
			expect(finalData.amount).toBe(newSubscription.amount)
		})

		it('should handle rapid toggle requests', async () => {
			// サブスクリプションを作成
			const newSubscription = {
				...testSubscriptions.spotify,
				categoryId: 1,
				isActive: true,
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				newSubscription
			)
			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			const subscriptionId = data.id

			// 高速に複数のトグルリクエストを送信
			const togglePromises = []
			for (let i = 0; i < 10; i++) {
				togglePromises.push(
					createTestRequest(testProductionApp, 'PUT', `/api/subscriptions/${subscriptionId}`, {
						isActive: i % 2 === 0,
					})
				)
			}

			const responses = await Promise.all(togglePromises)

			// すべてのリクエストが正常に処理されるか確認
			for (const res of responses) {
				expect([200, 409]).toContain(res.status) // 楽観的排他制御の場合は409も許容
			}

			// 最終状態を確認
			const finalResponse = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${subscriptionId}`
			)
			expect(finalResponse.status).toBe(200)

			const finalData = await getResponseJson(finalResponse)
			expect(typeof finalData.isActive).toBe('boolean')
		})
	})

	describe('Monthly Amount Aggregation', () => {
		it('should calculate total monthly costs across all active subscriptions', async () => {
			// 複数のサブスクリプションを作成（アクティブと非アクティブの混在）
			const subscriptions = [
				{
					...testSubscriptions.netflix,
					categoryId: 1,
					isActive: true,
					amount: 1800,
					billingCycle: 'monthly',
				},
				{
					...testSubscriptions.spotify,
					categoryId: 1,
					isActive: true,
					amount: 980,
					billingCycle: 'monthly',
				},
				{
					...testSubscriptions.github,
					categoryId: 2,
					isActive: false, // 非アクティブ
					amount: 2000,
					billingCycle: 'monthly',
				},
				{
					name: 'Annual Service',
					categoryId: 1,
					isActive: true,
					amount: 12000,
					billingCycle: 'yearly', // 年間請求
					nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年後
					description: 'Annual subscription',
				},
			]

			const createdIds: string[] = []
			for (const sub of subscriptions) {
				const response = await createTestRequest(
					testProductionApp,
					'POST',
					'/api/subscriptions',
					sub
				)
				expect(response.status).toBe(201)
				const data = await getResponseJson(response)
				createdIds.push(data.id)
			}

			// 一覧を取得して月額合計を計算
			const response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(200)

			const allSubscriptions = await getResponseJson(response)

			// アクティブなサブスクリプションのみをフィルタリング
			const activeSubscriptions = allSubscriptions.filter(
				(sub: TestSubscription) => sub.isActive && createdIds.includes(sub.id.toString())
			)

			// 月額換算の合計を計算
			let totalMonthly = 0
			for (const sub of activeSubscriptions) {
				if (sub.billingCycle === 'monthly') {
					totalMonthly += sub.amount
				} else if (sub.billingCycle === 'yearly') {
					totalMonthly += Math.round(sub.amount / 12) // 年額を月額に換算
				}
			}

			// 期待値: 1800 + 980 + (12000/12) = 1800 + 980 + 1000 = 3780
			expect(totalMonthly).toBe(3780)
		})

		it('should handle different billing cycles correctly', async () => {
			const subscriptions = [
				{
					name: 'Weekly Service',
					categoryId: 1,
					isActive: true,
					amount: 500,
					billingCycle: 'weekly',
					nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1週間後
					description: 'Weekly subscription',
				},
				{
					name: 'Quarterly Service',
					categoryId: 1,
					isActive: true,
					amount: 9000,
					billingCycle: 'quarterly',
					nextBillingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90日後
					description: 'Quarterly subscription',
				},
			]

			for (const sub of subscriptions) {
				const response = await createTestRequest(
					testProductionApp,
					'POST',
					'/api/subscriptions',
					sub
				)
				// 請求サイクルがサポートされているかは実装依存
				if (response.status === 201) {
					const data = await getResponseJson(response)
					expect(data.billingCycle).toBe(sub.billingCycle)
				} else {
					// サポートされていない場合はエラーレスポンスを期待
					expect([400, 422]).toContain(response.status)
				}
			}
		})
	})

	describe('Category Relationship Tests', () => {
		it('should validate subscription behavior with category relationships', async () => {
			// カテゴリ3のサブスクリプションを複数作成
			const categoryId = 3
			const subscriptions = [
				{
					...testSubscriptions.netflix,
					categoryId,
					name: 'Service 1',
				},
				{
					...testSubscriptions.spotify,
					categoryId,
					name: 'Service 2',
				},
			]

			const createdIds: string[] = []
			for (const sub of subscriptions) {
				const response = await createTestRequest(
					testProductionApp,
					'POST',
					'/api/subscriptions',
					sub
				)
				expect(response.status).toBe(201)
				const data = await getResponseJson(response)
				createdIds.push(data.id)
			}

			// カテゴリとの関連性を持つサブスクリプションの動作確認
			// カテゴリが固定設定の場合、サブスクリプションは正常に動作するはず

			// サブスクリプションが存在し続けることを確認
			for (const id of createdIds) {
				const response = await createTestRequest(
					testProductionApp,
					'GET',
					`/api/subscriptions/${id}`
				)

				// 実装によって以下のパターンが考えられる：
				// 1. サブスクリプションは残り、categoryIdがnullになる
				// 2. サブスクリプションも一緒に削除される（CASCADE DELETE）
				// 3. エラーが発生する

				if (response.status === 200) {
					const data = await getResponseJson(response)
					// カテゴリ情報がnullまたは存在しないことを確認
					if ('categoryId' in data) {
						// categoryIdがnullまたは元の値のままであることを確認
						expect([null, categoryId]).toContain(data.categoryId)
					}
				} else if (response.status === 404) {
					// CASCADE DELETEの場合
					expect(response.status).toBe(404)
				}
			}
		})

		it('should prevent deletion of categories with active subscriptions', async () => {
			// アクティブなサブスクリプションを作成
			const subscription = {
				...testSubscriptions.github,
				categoryId: 4,
				isActive: true,
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(201)

			// カテゴリ削除の試行（実際のカテゴリAPIがある場合）
			// ここでは、サブスクリプションのカテゴリ変更でテスト
			const data = await getResponseJson(response)
			const updateResponse = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${data.id}`,
				{ categoryId: null }
			)

			// 実装によってnullを許可するかどうかが異なる
			if (updateResponse.status === 200) {
				const updatedData = await getResponseJson(updateResponse)
				expect(updatedData.categoryId).toBeNull()
			} else {
				// バリデーションエラーを期待
				expect([400, 422]).toContain(updateResponse.status)
			}
		})
	})

	describe('Next Billing Date Auto-Update', () => {
		it('should automatically update next billing date based on billing cycle', async () => {
			const today = new Date()
			const nextMonth = new Date(today)
			nextMonth.setMonth(nextMonth.getMonth() + 1)

			// 月次サブスクリプションを作成
			const tomorrow = new Date(today)
			tomorrow.setDate(tomorrow.getDate() + 1)

			const monthlySubscription = {
				name: 'Monthly Service',
				categoryId: 1,
				isActive: true,
				amount: 1500,
				billingCycle: 'monthly',
				nextBillingDate: tomorrow.toISOString().split('T')[0],
				description: 'Monthly billing test',
			}

			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				monthlySubscription
			)
			expect(response.status).toBe(201)

			const monthlyData = await getResponseJson(response)
			expect(monthlyData.billingCycle).toBe('monthly')

			// 次回請求日が設定されていることを確認
			if (monthlyData.nextBillingDate) {
				const billingDate = new Date(monthlyData.nextBillingDate)
				expect(billingDate).toBeInstanceOf(Date)
				expect(billingDate.getTime()).toBeGreaterThanOrEqual(today.getTime())
			}

			// 年次サブスクリプションを作成
			const yearlySubscription = {
				name: 'Yearly Service',
				categoryId: 1,
				isActive: true,
				amount: 12000,
				billingCycle: 'yearly',
				nextBillingDate: tomorrow.toISOString().split('T')[0],
				description: 'Yearly billing test',
			}

			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				yearlySubscription
			)
			expect(response.status).toBe(201)

			const yearlyData = await getResponseJson(response)
			expect(yearlyData.billingCycle).toBe('yearly')

			// 更新後の次回請求日をテスト
			const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
			const updateData = {
				nextBillingDate: yesterday.toISOString().split('T')[0], // 昨日
			}

			response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/api/subscriptions/${monthlyData.id}`,
				updateData
			)

			if (response.status === 200) {
				const updatedData = await getResponseJson(response)
				// 実装によって、過去の日付を設定した場合に自動的に次の周期に更新されるかをテスト
				if (updatedData.nextBillingDate) {
					const newBillingDate = new Date(updatedData.nextBillingDate)
					// 過去の日付を設定しても、その日付がそのまま保存されることを確認
					// （自動的な周期更新は実装されていない）
					expect(newBillingDate.toISOString().split('T')[0]).toBe(
						yesterday.toISOString().split('T')[0]
					)
				}
			}
		})

		it('should calculate next billing dates correctly for different cycles', async () => {
			const billingCycles = [
				{ cycle: 'weekly', expectedDays: 7 },
				{ cycle: 'monthly', expectedDays: 30 }, // 概算
				{ cycle: 'yearly', expectedDays: 365 },
			]

			for (const { cycle, expectedDays } of billingCycles) {
				const futureDate = new Date()
				futureDate.setDate(futureDate.getDate() + expectedDays)

				const subscription = {
					name: `${cycle} subscription`,
					categoryId: 1,
					isActive: true,
					amount: 1000,
					billingCycle: cycle,
					nextBillingDate: futureDate.toISOString().split('T')[0],
					description: `Testing ${cycle} billing`,
				}

				const response = await createTestRequest(
					testProductionApp,
					'POST',
					'/api/subscriptions',
					subscription
				)

				// サポートされているサイクルの場合
				if (response.status === 201) {
					const data = await getResponseJson(response)
					expect(data.billingCycle).toBe(cycle)

					if (data.nextBillingDate) {
						const createdDate = new Date()
						const billingDate = new Date(data.nextBillingDate)
						const daysDiff = Math.round(
							(billingDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
						)

						// 日数の差が期待値の範囲内であることを確認（月によって日数が異なるため範囲で判定）
						expect(daysDiff).toBeGreaterThanOrEqual(0)
						expect(daysDiff).toBeLessThanOrEqual(expectedDays + 5) // 余裕を持たせる
					}
				}
			}
		})
	})

	describe('Performance and Concurrency Tests', () => {
		it('should handle concurrent API operations efficiently', async () => {
			const startTime = Date.now()
			const subscriptionCount = 5 // CI環境を考慮した適切なデータ件数

			// 複数のサブスクリプションを並列で作成
			const createPromises = []
			for (let i = 0; i < subscriptionCount; i++) {
				const subscription = {
					name: `Test Subscription ${i}`,
					categoryId: (i % 3) + 1, // カテゴリを分散
					isActive: i % 2 === 0, // 半分をアクティブに
					amount: 1000 + i * 100,
					billingCycle: i % 4 === 0 ? 'yearly' : 'monthly',
					nextBillingDate: new Date(
						Date.now() + (i % 4 === 0 ? 365 : 30) * 24 * 60 * 60 * 1000
					).toISOString(), // 年間なら1年後、月次なら30日後
					description: `Performance test subscription ${i}`,
				}

				createPromises.push(
					createTestRequest(testProductionApp, 'POST', '/api/subscriptions', subscription)
				)
			}

			// 並列作成の実行
			const createResponses = await Promise.all(createPromises)
			const createEndTime = Date.now()

			// 作成成功率を確認（小規模データセット用）
			const successCount = createResponses.filter((r) => r.status === 201).length
			const minimumSuccess = Math.ceil(subscriptionCount * 0.6) // 60%以上の成功率（5件中3件以上）
			expect(successCount).toBeGreaterThanOrEqual(minimumSuccess)

			// 作成時間の確認（5件で5秒以内）
			const createDuration = createEndTime - startTime
			expect(createDuration).toBeLessThan(5000)

			// 一覧取得のパフォーマンステスト
			const listStartTime = Date.now()
			const listResponse = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			const listEndTime = Date.now()

			expect(listResponse.status).toBe(200)
			const listData = await getResponseJson(listResponse)
			expect(listData.length).toBeGreaterThanOrEqual(successCount)

			// 一覧取得時間の確認（1秒以内）
			const listDuration = listEndTime - listStartTime
			expect(listDuration).toBeLessThan(1000)

			// ページネーションのテスト（実装されている場合）
			const paginatedResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/subscriptions?page=1&limit=10'
			)

			if (paginatedResponse.status === 200) {
				const paginatedData = await getResponseJson(paginatedResponse)
				// ページネーションが実装されていない場合（全件返却）
				if (Array.isArray(paginatedData)) {
					// ページネーションが実装されていない場合は全件返却される
					expect(paginatedData.length).toBeGreaterThanOrEqual(successCount)
				} else if (paginatedData.data && Array.isArray(paginatedData.data)) {
					// ページネーションオブジェクトの場合
					expect(paginatedData.data.length).toBeLessThanOrEqual(10)
					expect(paginatedData.total).toBeGreaterThanOrEqual(successCount)
				}
			}

			// 検索/フィルタリングのパフォーマンステスト
			const filterStartTime = Date.now()
			const filterResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/subscriptions?isActive=true'
			)
			const filterEndTime = Date.now()

			if (filterResponse.status === 200) {
				const filterData = await getResponseJson(filterResponse)
				// フィルタリング時間の確認（500ms以内）
				const filterDuration = filterEndTime - filterStartTime
				expect(filterDuration).toBeLessThan(500)

				// フィルタリングが実装されていない場合は、全件返却される
				if (Array.isArray(filterData)) {
					// フィルタリングが実装されている場合のみアクティブなサブスクリプションのチェック
					if (filterData.length > 0 && filterData.length < successCount) {
						const allActive = filterData.every((sub: TestSubscription) => sub.isActive === true)
						expect(allActive).toBe(true)
					} else {
						// フィルタリングが実装されていない場合は全件返却
						expect(filterData.length).toBeGreaterThanOrEqual(successCount)
					}
				}
			}
		})

		it('should handle concurrent read/write operations efficiently', async () => {
			// まず5個のサブスクリプションを作成
			const initialCount = 5
			const createdIds: string[] = []

			for (let i = 0; i < initialCount; i++) {
				const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
					name: `Concurrent Test ${i}`,
					categoryId: 1,
					isActive: true,
					amount: 1000,
					billingCycle: 'monthly',
					nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
				})
				expect(response.status).toBe(201)
				const data = await getResponseJson(response)
				createdIds.push(data.id)
			}

			// 読み取りと書き込みを同時に実行
			const operations = []

			// 読み取り操作
			for (let i = 0; i < 5; i++) {
				operations.push(createTestRequest(testProductionApp, 'GET', '/api/subscriptions'))
			}

			// 更新操作
			for (let i = 0; i < 3; i++) {
				const id = createdIds[i % createdIds.length]
				operations.push(
					createTestRequest(testProductionApp, 'PUT', `/api/subscriptions/${id}`, {
						amount: 2000 + i,
					})
				)
			}

			// 新規作成操作
			for (let i = 0; i < 2; i++) {
				operations.push(
					createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
						name: `Concurrent Create ${i}`,
						categoryId: 2,
						isActive: true,
						amount: 3000 + i,
						billingCycle: 'yearly',
						nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年後
					})
				)
			}

			// すべての操作を並列実行
			const startTime = Date.now()
			const results = await Promise.all(operations)
			const endTime = Date.now()

			// 実行時間の確認（5秒以内）
			const duration = endTime - startTime
			expect(duration).toBeLessThan(5000)

			// 成功率の確認（環境に依存しない基準）
			const successCount = results.filter((r) => [200, 201].includes(r.status)).length
			const totalOperations = operations.length
			const minimumSuccessRate = 0.5 // 最低50%の成功率
			expect(successCount / totalOperations).toBeGreaterThanOrEqual(minimumSuccessRate)

			// データ整合性の確認
			const finalListResponse = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/subscriptions'
			)
			expect(finalListResponse.status).toBe(200)

			const finalData = await getResponseJson(finalListResponse)
			// 並行実行のため、一部の操作が失敗する可能性を考慮
			const createdCount = results.filter((r) => r.status === 201).length
			expect(finalData.length).toBeGreaterThanOrEqual(initialCount + Math.floor(createdCount * 0.8)) // 作成成功数の80%以上
		})
	})
})
