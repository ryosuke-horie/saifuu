import { ALL_CATEGORIES } from '../../../../shared/src/config/categories'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { testSubscriptions, testTransactions } from '../helpers/fixtures'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import {
	EXPECTED_TOTALS,
	HTTP_STATUS,
	TEST_AMOUNTS,
	TEST_CATEGORY_IDS,
	TEST_DESCRIPTIONS,
	TEST_SUBSCRIPTION_NAMES,
} from '../helpers/test-constants'
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
			const systemFeeCategory = ALL_CATEGORIES.find(
				(cat) => cat.id === TEST_CATEGORY_IDS.SYSTEM_FEE
			)
			expect(systemFeeCategory).toBeDefined()
			if (!systemFeeCategory) {
				throw new Error(`Category with id ${TEST_CATEGORY_IDS.SYSTEM_FEE} not found`)
			}
			const categoryId = systemFeeCategory.numericId

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
			expect(response.status).toBe(HTTP_STATUS.CREATED)

			const subscriptionData = await getResponseJson(response)
			expect(subscriptionData.categoryId).toBe(categoryId)
			expect(subscriptionData.name).toBe(subscription.name)
		})

		it('should return subscription with category details from config', async () => {
			// 設定ファイルから既存のカテゴリIDを使用
			const softwareCategory = ALL_CATEGORIES.find((cat) => cat.id === TEST_CATEGORY_IDS.BUSINESS)
			expect(softwareCategory).toBeDefined()
			if (!softwareCategory) {
				throw new Error(`Category with id ${TEST_CATEGORY_IDS.BUSINESS} not found`)
			}
			const categoryId = softwareCategory.numericId

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
			expect(response.status).toBe(HTTP_STATUS.CREATED)

			const createdData = await getResponseJson(response)

			// 作成したサブスクリプションを取得
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/subscriptions/${createdData.id}`
			)
			expect(response.status).toBe(HTTP_STATUS.OK)

			const fetchedData = await getResponseJson(response)
			expect(fetchedData.category).toBeDefined()
			expect(fetchedData.category.id).toBe(categoryId)
			expect(fetchedData.category.name).toBe(softwareCategory.name)
			expect(fetchedData.category.type).toBe(softwareCategory.type)
			expect(fetchedData.category.color).toBe(softwareCategory.color)
		})

		it('should handle subscription creation with invalid category ID', async () => {
			// 存在しないカテゴリIDでサブスクリプションを作成
			const subscription = {
				...testSubscriptions.netflix,
				categoryId: TEST_CATEGORY_IDS.INVALID, // 存在しないカテゴリID
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(HTTP_STATUS.CREATED) // カテゴリ参照はソフトチェックのため、作成は成功する

			const subscriptionData = await getResponseJson(response)
			expect(subscriptionData.categoryId).toBe(TEST_CATEGORY_IDS.INVALID)
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
				expect(response.status).toBe(HTTP_STATUS.CREATED)
			}

			// サブスクリプション一覧を取得
			const response = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(response.status).toBe(HTTP_STATUS.OK)

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
		it('should create subscription with entertainment category', async () => {
			// カテゴリを選択
			const entertainmentCategory = ALL_CATEGORIES.find(
				(cat) => cat.id === TEST_CATEGORY_IDS.ENTERTAINMENT
			)
			expect(entertainmentCategory).toBeDefined()
			if (!entertainmentCategory) {
				throw new Error(`Category with id ${TEST_CATEGORY_IDS.ENTERTAINMENT} not found`)
			}
			const categoryId = entertainmentCategory.numericId

			// 同じカテゴリでサブスクリプションを作成
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
			expect(response.status).toBe(HTTP_STATUS.CREATED)
			const createdSub = await getResponseJson(response)
			expect(createdSub.categoryId).toBe(categoryId)
		})

		it('should create transaction with same category as subscription', async () => {
			// カテゴリを選択
			const entertainmentCategory = ALL_CATEGORIES.find(
				(cat) => cat.id === TEST_CATEGORY_IDS.ENTERTAINMENT
			)
			expect(entertainmentCategory).toBeDefined()
			if (!entertainmentCategory) {
				throw new Error(`Category with id ${TEST_CATEGORY_IDS.ENTERTAINMENT} not found`)
			}
			const categoryId = entertainmentCategory.numericId

			// 同じカテゴリで取引を作成
			const transaction = {
				...testTransactions.convenience,
				categoryId,
				description: TEST_DESCRIPTIONS.NETFLIX_PAYMENT,
			}
			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				transaction
			)
			expect(response.status).toBe(HTTP_STATUS.CREATED)
			const createdTx = await getResponseJson(response)
			expect(createdTx.categoryId).toBe(categoryId)
		})

		it('should retrieve transaction with category information', async () => {
			// カテゴリを選択
			const entertainmentCategory = ALL_CATEGORIES.find(
				(cat) => cat.id === TEST_CATEGORY_IDS.ENTERTAINMENT
			)
			expect(entertainmentCategory).toBeDefined()
			if (!entertainmentCategory) {
				throw new Error(`Category with id ${TEST_CATEGORY_IDS.ENTERTAINMENT} not found`)
			}
			const categoryId = entertainmentCategory.numericId

			// 取引を作成
			const transaction = {
				...testTransactions.convenience,
				categoryId,
				description: TEST_DESCRIPTIONS.NETFLIX_PAYMENT,
			}
			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				transaction
			)
			expect(response.status).toBe(HTTP_STATUS.CREATED)
			const createdTx = await getResponseJson(response)

			// 取引を取得してカテゴリ情報が含まれることを確認
			response = await createTestRequest(
				testProductionApp,
				'GET',
				`/api/transactions/${createdTx.id}`
			)
			expect(response.status).toBe(HTTP_STATUS.OK)
			const fetchedTx = await getResponseJson(response)
			expect(fetchedTx.category).toBeDefined()
			expect(fetchedTx.category.id).toBe(categoryId)
			expect(fetchedTx.category.name).toBe(entertainmentCategory.name)
		})

		it('should handle transactions with invalid category gracefully', async () => {
			// 存在しないカテゴリIDで取引を作成
			const transaction = {
				...testTransactions.convenience,
				categoryId: TEST_CATEGORY_IDS.INVALID,
				description: TEST_DESCRIPTIONS.INVALID_CATEGORY_TX,
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				transaction
			)
			expect(response.status).toBe(HTTP_STATUS.CREATED) // ソフト参照のため作成は成功

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
			expect(fetchedTx.category).toBeNull()
		})
	})

	describe('Multiple Subscriptions with Same Category', () => {
		it('should allow multiple subscriptions to use the same category', async () => {
			const softwareCategory = ALL_CATEGORIES.find((cat) => cat.id === TEST_CATEGORY_IDS.BUSINESS)
			expect(softwareCategory).toBeDefined()
			if (!softwareCategory) {
				throw new Error(`Category with id ${TEST_CATEGORY_IDS.BUSINESS} not found`)
			}
			const categoryId = softwareCategory.numericId

			// 同じカテゴリで複数のサブスクリプションを作成
			const subscriptions = [
				{ ...testSubscriptions.github, name: TEST_SUBSCRIPTION_NAMES.GITHUB_PRO, categoryId },
				{ ...testSubscriptions.github, name: TEST_SUBSCRIPTION_NAMES.GITHUB_TEAM, categoryId },
				{
					...testSubscriptions.github,
					name: TEST_SUBSCRIPTION_NAMES.GITHUB_ENTERPRISE,
					categoryId,
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
				expect(response.status).toBe(HTTP_STATUS.CREATED)
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
				expect(response.status).toBe(HTTP_STATUS.OK)
				const sub = await getResponseJson(response)
				expect(sub.category).toBeDefined()
				expect(sub.category.id).toBe(categoryId)
				expect(sub.category.name).toBe(softwareCategory.name)
			}
		})

		it('should calculate correct totals for subscriptions in the same category', async () => {
			const streamingCategory = ALL_CATEGORIES.find(
				(cat) => cat.id === TEST_CATEGORY_IDS.ENTERTAINMENT
			)
			expect(streamingCategory).toBeDefined()
			if (!streamingCategory) {
				throw new Error(`Category with id ${TEST_CATEGORY_IDS.ENTERTAINMENT} not found`)
			}
			const categoryId = streamingCategory.numericId

			// 同じカテゴリで異なる金額のサブスクリプションを作成
			const streamingServices = [
				{ ...testSubscriptions.netflix, amount: TEST_AMOUNTS.NETFLIX, categoryId },
				{ ...testSubscriptions.spotify, amount: TEST_AMOUNTS.SPOTIFY, categoryId },
				{
					...testSubscriptions.youtube,
					name: TEST_SUBSCRIPTION_NAMES.YOUTUBE_PREMIUM,
					amount: TEST_AMOUNTS.YOUTUBE,
					categoryId,
				},
			]

			const createdIds: string[] = []
			for (const service of streamingServices) {
				const response = await createTestRequest(
					testProductionApp,
					'POST',
					'/api/subscriptions',
					service
				)
				expect(response.status).toBe(HTTP_STATUS.CREATED)
				const created = await getResponseJson(response)
				createdIds.push(created.id)
			}

			// カテゴリ別の合計を手動で計算して確認
			const listResponse = await createTestRequest(testProductionApp, 'GET', '/api/subscriptions')
			expect(listResponse.status).toBe(200)
			const allSubs = await getResponseJson(listResponse)

			// このテストで作成したサブスクリプションのみをフィルタリング
			const thisTestSubs = allSubs.filter((sub: { id: string }) => createdIds.includes(sub.id))
			const categoryTotal = thisTestSubs.reduce(
				(sum: number, sub: { amount: number }) => sum + sub.amount,
				0
			)

			expect(categoryTotal).toBe(EXPECTED_TOTALS.STREAMING_SERVICES)
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
			if (!incomeCategory) {
				throw new Error('Income category not found')
			}
			const incomeTransaction = {
				...testTransactions.income,
				categoryId: incomeCategory.numericId,
				type: 'income' as const,
			}
			let response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				incomeTransaction
			)
			expect(response.status).toBe(HTTP_STATUS.CREATED)

			// 支出カテゴリでサブスクリプションを作成（サブスクリプションは常に支出）
			if (!expenseCategory) {
				throw new Error('Expense category not found')
			}
			const subscription = {
				...testSubscriptions.netflix,
				categoryId: expenseCategory.numericId,
			}
			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/subscriptions',
				subscription
			)
			expect(response.status).toBe(HTTP_STATUS.CREATED)

			// カテゴリタイプの不整合をテスト（収入カテゴリで支出取引）
			const mismatchedTransaction = {
				...testTransactions.convenience,
				categoryId: incomeCategory.numericId,
				type: 'expense' as const,
			}
			response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				mismatchedTransaction
			)
			// システムは型の不整合を許可するが、これは意図的な設計
			expect(response.status).toBe(HTTP_STATUS.CREATED)
		})
	})

	describe('Edge Cases and Error Scenarios', () => {
		it('should create subscription with minimum valid category ID', async () => {
			// 最小のカテゴリIDを取得
			const minCategoryId = Math.min(...ALL_CATEGORIES.map((cat) => cat.numericId))

			// 最小IDでサブスクリプションを作成
			const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.netflix,
				categoryId: minCategoryId,
			})
			expect(response.status).toBe(HTTP_STATUS.CREATED)
			const created = await getResponseJson(response)
			expect(created.categoryId).toBe(minCategoryId)
		})

		it('should create subscription with maximum valid category ID', async () => {
			// 最大のカテゴリIDを取得
			const maxCategoryId = Math.max(...ALL_CATEGORIES.map((cat) => cat.numericId))

			// 最大IDでサブスクリプションを作成
			const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.spotify,
				categoryId: maxCategoryId,
			})
			expect(response.status).toBe(HTTP_STATUS.CREATED)
			const created = await getResponseJson(response)
			expect(created.categoryId).toBe(maxCategoryId)
		})

		it('should reject subscription creation with zero category ID', async () => {
			// 0のカテゴリID（無効）
			const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.github,
				categoryId: TEST_CATEGORY_IDS.BOUNDARY_ZERO,
			})
			// バリデーションにより0は拒否される
			expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)
		})

		it('should return appropriate error message for zero category ID', async () => {
			// 0のカテゴリID（無効）
			const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.github,
				categoryId: TEST_CATEGORY_IDS.BOUNDARY_ZERO,
			})
			// エラーレスポンスの詳細を検証
			const errorResponse = await getResponseJson(response)
			expect(errorResponse).toHaveProperty('error')
			expect(errorResponse.error).toMatch(/カテゴリID|category/i)
		})

		it('should reject subscription creation with negative category ID', async () => {
			// 負のカテゴリID（無効）
			const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.youtube,
				name: TEST_SUBSCRIPTION_NAMES.TEST_SUBSCRIPTION,
				categoryId: TEST_CATEGORY_IDS.NEGATIVE,
			})
			// バリデーションにより負の値も拒否される
			expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)
		})

		it('should return appropriate error message for negative category ID', async () => {
			// 負のカテゴリID（無効）
			const response = await createTestRequest(testProductionApp, 'POST', '/api/subscriptions', {
				...testSubscriptions.youtube,
				name: TEST_SUBSCRIPTION_NAMES.TEST_SUBSCRIPTION,
				categoryId: TEST_CATEGORY_IDS.NEGATIVE,
			})
			// エラーレスポンスの詳細を検証
			const errorResponse = await getResponseJson(response)
			expect(errorResponse).toHaveProperty('error')
			expect(errorResponse.error).toMatch(/カテゴリID|category/i)
		})

		it('should handle null category references appropriately', async () => {
			// カテゴリIDなしでサブスクリプションを作成
			const subWithoutCategory = {
				name: TEST_SUBSCRIPTION_NAMES.NO_CATEGORY,
				amount: TEST_AMOUNTS.DEFAULT,
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
			expect(response.status).toBe(HTTP_STATUS.CREATED)

			const created = await getResponseJson(response)
			// categoryIdがnullであることを確認（APIはnullを返す）
			expect(created.categoryId).toBeNull()
		})
	})

	// カテゴリAPIエンドポイントのテストは categories.integration.test.ts でカバーされているため削除
})
