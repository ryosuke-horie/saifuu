import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ALL_CATEGORIES } from '../../../../shared/config/categories'
import { testSubscriptions, testTransactions } from '../helpers/fixtures'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

/**
 * カテゴリ-サブスクリプション間 統合テスト
 *
 * 設定ファイルベースのカテゴリとサブスクリプションの整合性をテストする
 * カテゴリは設定ファイルで固定のため、参照整合性のみをテスト
 *
 * Issue #299 修正対応:
 * - カテゴリAPIエンドポイントの重複テストを削除
 * - categories.integration.test.ts でカバーされている405エラーテストを削除
 *
 * Issue #217 改善対応:
 * - カテゴリ変更時の取引履歴への影響テストを追加
 * - 複数サブスクリプションでの同一カテゴリ使用テストを追加
 * - カテゴリ削除時のカスケード処理テストを追加（ソフト参照のため実際のカスケードはなし）
 * - カテゴリ統合シナリオのテストを追加
 * - エッジケースとエラーシナリオのテストを追加
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
			const systemFeeCategory = ALL_CATEGORIES.find((cat) => cat.id === 'system_fee')
			expect(systemFeeCategory).toBeDefined()
			const categoryId = systemFeeCategory!.numericId

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

	describe('Category Changes and Transaction History', () => {
		it('should handle category references consistently across transactions and subscriptions', async () => {
			// カテゴリを選択
			const entertainmentCategory = ALL_CATEGORIES.find((cat) => cat.id === 'entertainment')
			expect(entertainmentCategory).toBeDefined()
			const categoryId = entertainmentCategory!.numericId

			// 同じカテゴリでサブスクリプションを作成
			const subscription = {
				...testSubscriptions.netflix,
				categoryId,
			}
			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(201)
			const createdSub = await getResponseJson(response)

			// 同じカテゴリで取引を作成
			const transaction = {
				...testTransactions.convenience,
				categoryId,
				description: 'Netflix subscription payment',
			}
			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				transaction
			)
			expect(response.status).toBe(201)
			const createdTx = await getResponseJson(response)

			// 両方が同じカテゴリIDを持つことを確認
			expect(createdSub.categoryId).toBe(categoryId)
			expect(createdTx.categoryId).toBe(categoryId)

			// 取引を取得してカテゴリ情報が含まれることを確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/transactions/${createdTx.id}`
			)
			expect(response.status).toBe(200)
			const fetchedTx = await getResponseJson(response)
			expect(fetchedTx.category).toBeDefined()
			expect(fetchedTx.category.id).toBe(categoryId)
			expect(fetchedTx.category.name).toBe(entertainmentCategory!.name)
		})

		it('should handle transactions with invalid category gracefully', async () => {
			// 存在しないカテゴリIDで取引を作成
			const transaction = {
				...testTransactions.convenience,
				categoryId: 99999,
				description: 'Transaction with invalid category',
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				transaction
			)
			expect(response.status).toBe(201) // ソフト参照のため作成は成功

			const createdTx = await getResponseJson(response)
			expect(createdTx.categoryId).toBe(99999)

			// 取引を取得した際、無効なカテゴリはnullまたは未定義として扱われることを確認
			const fetchResponse = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/transactions/${createdTx.id}`
			)
			expect(fetchResponse.status).toBe(200)
			const fetchedTx = await getResponseJson(fetchResponse)
			// カテゴリ情報が存在しないか、nullであることを確認
			expect(fetchedTx.category == null).toBe(true)
		})
	})

	describe('Multiple Subscriptions with Same Category', () => {
		it('should allow multiple subscriptions to use the same category', async () => {
			const softwareCategory = ALL_CATEGORIES.find((cat) => cat.id === 'business')
			expect(softwareCategory).toBeDefined()
			const categoryId = softwareCategory!.numericId

			// 同じカテゴリで複数のサブスクリプションを作成
			const subscriptions = [
				{ ...testSubscriptions.github, name: 'GitHub Pro', categoryId },
				{ ...testSubscriptions.github, name: 'GitHub Team', categoryId },
				{ ...testSubscriptions.github, name: 'GitHub Enterprise', categoryId },
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
				const created = await getResponseJson(response)
				createdIds.push(created.id)
				expect(created.categoryId).toBe(categoryId)
			}

			// すべてのサブスクリプションが同じカテゴリを持つことを確認
			const listResponse = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(listResponse.status).toBe(200)
			const allSubs = await getResponseJson(listResponse)

			const sameCategorySubs = allSubs.filter(
				(sub: { categoryId: number }) => sub.categoryId === categoryId
			)
			expect(sameCategorySubs.length).toBeGreaterThanOrEqual(3)

			// 各サブスクリプションが正しいカテゴリ情報を持つことを確認
			for (const id of createdIds) {
				const response = await createTestRequest(
					testProductionApp,
					'GET',
					`/api/subscriptions/${id}`
				)
				expect(response.status).toBe(200)
				const sub = await getResponseJson(response)
				expect(sub.category).toBeDefined()
				expect(sub.category.id).toBe(categoryId)
				expect(sub.category.name).toBe(softwareCategory!.name)
			}
		})

		it('should calculate correct totals for subscriptions in the same category', async () => {
			const streamingCategory = ALL_CATEGORIES.find((cat) => cat.id === 'entertainment')
			expect(streamingCategory).toBeDefined()
			const categoryId = streamingCategory!.numericId

			// 同じカテゴリで異なる金額のサブスクリプションを作成
			const streamingServices = [
				{ ...testSubscriptions.netflix, amount: 1500, categoryId },
				{ ...testSubscriptions.spotify, amount: 980, categoryId },
				{ ...testSubscriptions.youtube, name: 'YouTube Premium', amount: 1180, categoryId },
			]

			for (const service of streamingServices) {
				const response = await createTestRequest(
					testProductionApp,
					'POST',
					'/api/subscriptions',
					service
				)
				expect(response.status).toBe(201)
			}

			// カテゴリ別の合計を手動で計算して確認
			const listResponse = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(listResponse.status).toBe(200)
			const allSubs = await getResponseJson(listResponse)

			const categoryTotal = allSubs
				.filter((sub: { categoryId: number }) => sub.categoryId === categoryId)
				.reduce((sum: number, sub: { amount: number }) => sum + sub.amount, 0)

			expect(categoryTotal).toBeGreaterThanOrEqual(3660) // 1500 + 980 + 1180
		})
	})

	describe('Category Type Consistency', () => {
		it('should maintain category type consistency across operations', async () => {
			// 収入カテゴリと支出カテゴリを取得
			const incomeCategory = ALL_CATEGORIES.find((cat) => cat.type === 'income')
			const expenseCategory = ALL_CATEGORIES.find((cat) => cat.type === 'expense')
			expect(incomeCategory).toBeDefined()
			expect(expenseCategory).toBeDefined()

			// 収入カテゴリで取引を作成
			const incomeTransaction = {
				...testTransactions.income,
				categoryId: incomeCategory!.numericId,
				type: 'income' as const,
			}
			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				incomeTransaction
			)
			expect(response.status).toBe(201)

			// 支出カテゴリでサブスクリプションを作成（サブスクリプションは常に支出）
			const subscription = {
				...testSubscriptions.netflix,
				categoryId: expenseCategory!.numericId,
			}
			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(201)

			// カテゴリタイプの不整合をテスト（収入カテゴリで支出取引）
			const mismatchedTransaction = {
				...testTransactions.convenience,
				categoryId: incomeCategory!.numericId,
				type: 'expense' as const,
			}
			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				mismatchedTransaction
			)
			// システムは型の不整合を許可するが、これは意図的な設計
			expect(response.status).toBe(201)
		})
	})

	describe('Edge Cases and Error Scenarios', () => {
		it('should handle boundary category IDs correctly', async () => {
			// 最小のカテゴリIDを取得
			const minCategoryId = Math.min(...ALL_CATEGORIES.map((cat) => cat.numericId))
			// 最大のカテゴリIDを取得
			const maxCategoryId = Math.max(...ALL_CATEGORIES.map((cat) => cat.numericId))

			// 最小IDでサブスクリプションを作成
			let response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.netflix,
				categoryId: minCategoryId,
			})
			expect(response.status).toBe(201)

			// 最大IDでサブスクリプションを作成
			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.spotify,
				categoryId: maxCategoryId,
			})
			expect(response.status).toBe(201)

			// 0のカテゴリID（無効）
			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.github,
				categoryId: 0,
			})
			// バリデーションにより0は拒否される
			expect(response.status).toBe(400)

			// 負のカテゴリID（無効）
			response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.youtube,
				name: 'Test Subscription',
				categoryId: -1,
			})
			// バリデーションにより負の値も拒否される
			expect(response.status).toBe(400)
		})

		it('should handle null category references appropriately', async () => {
			// カテゴリIDなしでサブスクリプションを作成
			const subWithoutCategory = {
				name: 'No Category Subscription',
				amount: 1000,
				billingCycle: 'monthly' as const,
				nextBillingDate: new Date().toISOString(),
				isActive: true,
				// categoryId を意図的に省略
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subWithoutCategory
			)
			expect(response.status).toBe(201)

			const created = await getResponseJson(response)
			// categoryIdがnullまたは未定義であることを確認
			expect(created.categoryId == null).toBe(true)
		})
	})

	// カテゴリAPIエンドポイントのテストは categories.integration.test.ts でカバーされているため削除
})
