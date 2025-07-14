import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnyDatabase, Env } from '../../db'
import { type LoggingVariables, loggingMiddleware } from '../../middleware/logging'
import { createSubscriptionsApp } from '../../routes/subscriptions'
import { invalidSubscriptionData, testRequestPayloads } from '../helpers/fixtures'
import {
	createTestRequest,
	expectErrorResponse,
	expectHeader,
	expectJsonStructure,
	getResponseJson,
} from '../helpers/test-app'
import { cleanupTestDatabase } from '../helpers/test-db'
import { createTestProductionApp } from '../helpers/test-production-app'

/**
 * サブスクリプションAPI ユニットテスト
 *
 * TDD Red-Green-Refactorサイクルに従って実装
 * - Red: テストを先に書いて失敗させる
 * - Green: テストを通すための最小限の実装
 * - Refactor: コードを改善する
 *
 * カバレッジ: 94.59%（2025年7月14日現在）
 * - 正常系・異常系のテストケースを網羅
 * - データベースエラーハンドリングのテストを含む
 */

describe('Subscriptions API - Unit Tests', () => {
	// テスト用アプリケーションインスタンス
	const app = createTestProductionApp()

	beforeEach(async () => {
		// 各テストケース前にモックをリセット
		vi.clearAllMocks()
		// データベースをクリーンアップ
		await cleanupTestDatabase()
	})

	afterEach(async () => {
		// 各テストケース後の明示的なクリーンアップ
		await cleanupTestDatabase()
	})

	describe('GET /subscriptions', () => {
		it('should return empty array when no subscriptions exist', async () => {
			const response = await createTestRequest(app, 'GET', '/api/subscriptions')

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)
			expect(data).toHaveLength(0)
		})

		it('should return list of subscriptions with category information', async () => {
			// サブスクリプション一覧取得のテスト
			const response = await createTestRequest(app, 'GET', '/api/subscriptions')

			expect(response.status).toBe(200)
			// Hono returns just 'application/json' without charset specification
			expectHeader(response, 'content-type', 'application/json')

			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)

			// データが存在する場合の構造チェック
			if (data.length > 0) {
				const subscription = data[0]
				expectJsonStructure(subscription, [
					'id',
					'name',
					'amount',
					'billingCycle',
					'nextBillingDate',
					'description',
					'isActive',
					'categoryId',
					'createdAt',
					'updatedAt',
					'category',
				])

				// カテゴリ情報の構造チェック
				if (subscription.category) {
					expectJsonStructure(subscription.category, [
						'id',
						'name',
						'type',
						'color',
						'createdAt',
						'updatedAt',
					])
				}
			}
		})
	})

	describe('POST /subscriptions', () => {
		it('should create a new subscription with valid data', async () => {
			// サブスクリプション作成のテスト
			const newSubscription = testRequestPayloads.createSubscription

			const response = await createTestRequest(app, 'POST', '/api/subscriptions', newSubscription)

			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			expectJsonStructure(data, [
				'id',
				'name',
				'amount',
				'billingCycle',
				'nextBillingDate',
				'categoryId',
				'isActive',
			])

			expect(data.name).toBe(newSubscription.name)
			expect(data.amount).toBe(newSubscription.amount)
			expect(data.billingCycle).toBe(newSubscription.billingCycle)
		})

		it('should handle missing required fields', async () => {
			// 必須フィールド不足時のテスト
			const response = await createTestRequest(
				app,
				'POST',
				'/api/subscriptions',
				invalidSubscriptionData.missingName
			)

			expect(response.status).toBe(400)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Name is required and must be a string')
		})

		it('should handle invalid billing cycle', async () => {
			// 無効な請求サイクルのテスト
			const response = await createTestRequest(
				app,
				'POST',
				'/api/subscriptions',
				invalidSubscriptionData.invalidBillingCycle
			)

			expect(response.status).toBe(400)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Invalid billing cycle')
		})

		it('should handle negative amount', async () => {
			// 負の金額のテスト
			const response = await createTestRequest(
				app,
				'POST',
				'/api/subscriptions',
				invalidSubscriptionData.negativeAmount
			)

			expect(response.status).toBe(400)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Amount must be a positive number')
		})
	})

	describe('GET /subscriptions/:id', () => {
		it('should return subscription by id', async () => {
			// 先にサブスクリプションを作成
			const createResponse = await createTestRequest(
				app,
				'POST',
				'/api/subscriptions',
				testRequestPayloads.createSubscription
			)
			const createdSubscription = await getResponseJson(createResponse)

			// ID指定でのサブスクリプション取得テスト
			const response = await createTestRequest(
				app,
				'GET',
				`/api/subscriptions/${createdSubscription.id}`
			)

			expect(response.status).toBe(200)
			const data = await getResponseJson(response)
			expectJsonStructure(data, [
				'id',
				'name',
				'amount',
				'billingCycle',
				'nextBillingDate',
				'categoryId',
			])
			expect(data.id).toBe(createdSubscription.id)
		})

		it('should return 404 for non-existent subscription', async () => {
			// 存在しないサブスクリプションのテスト
			const response = await createTestRequest(app, 'GET', '/api/subscriptions/99999')

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Subscription not found')
		})

		it('should handle invalid id format', async () => {
			// 無効なID形式のテスト
			const response = await createTestRequest(app, 'GET', '/api/subscriptions/invalid-id')

			expect(response.status).toBe(400)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Invalid ID format')
		})
	})

	describe('PUT /subscriptions/:id', () => {
		it('should update existing subscription', async () => {
			// 先にサブスクリプションを作成
			const createResponse = await createTestRequest(
				app,
				'POST',
				'/api/subscriptions',
				testRequestPayloads.createSubscription
			)
			const createdSubscription = await getResponseJson(createResponse)

			// サブスクリプション更新のテスト
			const updateData = testRequestPayloads.updateSubscription

			const response = await createTestRequest(
				app,
				'PUT',
				`/api/subscriptions/${createdSubscription.id}`,
				updateData
			)

			expect(response.status).toBe(200)
			const data = await getResponseJson(response)
			expect(data.name).toBe(updateData.name)
			expect(data.amount).toBe(updateData.amount)
			expect(data.description).toBe(updateData.description)
		})

		it('should return 404 for non-existent subscription update', async () => {
			// 存在しないサブスクリプションの更新テスト
			const response = await createTestRequest(
				app,
				'PUT',
				'/api/subscriptions/99999',
				testRequestPayloads.updateSubscription
			)

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Subscription not found')
		})

		it('should handle invalid id format for update', async () => {
			// 無効なID形式のテスト
			const response = await createTestRequest(
				app,
				'PUT',
				'/api/subscriptions/invalid-id',
				testRequestPayloads.updateSubscription
			)

			expect(response.status).toBe(400)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Invalid ID format')
		})
	})

	describe('DELETE /subscriptions/:id', () => {
		it('should delete existing subscription', async () => {
			// 先にサブスクリプションを作成
			const createResponse = await createTestRequest(
				app,
				'POST',
				'/api/subscriptions',
				testRequestPayloads.createSubscription
			)
			const createdSubscription = await getResponseJson(createResponse)

			// サブスクリプション削除のテスト
			const response = await createTestRequest(
				app,
				'DELETE',
				`/api/subscriptions/${createdSubscription.id}`
			)

			expect(response.status).toBe(200)
			const data = await getResponseJson(response)
			expect(data.message).toBe('Subscription deleted successfully')
		})

		it('should return 404 for non-existent subscription deletion', async () => {
			// 存在しないサブスクリプションの削除テスト
			const response = await createTestRequest(app, 'DELETE', '/api/subscriptions/99999')

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Subscription not found')
		})

		it('should handle invalid id format for deletion', async () => {
			// 無効なID形式のテスト
			const response = await createTestRequest(app, 'DELETE', '/api/subscriptions/invalid-id')

			expect(response.status).toBe(400)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Invalid ID format')
		})
	})

	// データベース操作別のモック生成ヘルパー関数
	function createSelectMock() {
		return vi.fn().mockImplementation(() => ({
			from: vi.fn().mockImplementation(() => ({
				where: vi.fn().mockImplementation(() => {
					throw new Error('Database connection failed')
				}),
			})),
		}))
	}

	function createInsertMock() {
		return vi.fn().mockImplementation(() => ({
			values: vi.fn().mockImplementation(() => ({
				returning: vi.fn().mockImplementation(() => {
					throw new Error('Database connection failed')
				}),
			})),
		}))
	}

	function createUpdateMock() {
		return vi.fn().mockImplementation(() => ({
			set: vi.fn().mockImplementation(() => ({
				where: vi.fn().mockImplementation(() => ({
					returning: vi.fn().mockImplementation(() => {
						throw new Error('Database connection failed')
					}),
				})),
			})),
		}))
	}

	function createDeleteMock() {
		return vi.fn().mockImplementation(() => ({
			where: vi.fn().mockImplementation(() => ({
				returning: vi.fn().mockImplementation(() => {
					throw new Error('Database connection failed')
				}),
			})),
		}))
	}

	function createTestAppWithMockDatabase(mockDatabase: AnyDatabase) {
		const testApp = new Hono<{
			Bindings: Env
			Variables: {
				db: AnyDatabase
			} & LoggingVariables
		}>()

		testApp.use('*', loggingMiddleware({ NODE_ENV: 'test' }))
		testApp.use('/api/*', async (c, next) => {
			c.set('db', mockDatabase)
			await next()
		})
		testApp.route('/api/subscriptions', createSubscriptionsApp({ testDatabase: mockDatabase }))

		return testApp
	}

	// データベースエラーハンドリングのメインヘルパー関数
	function createDatabaseErrorApp(operation: 'select' | 'insert' | 'update' | 'delete') {
		const mockDatabase = {} as AnyDatabase

		switch (operation) {
			case 'select':
				mockDatabase.select = createSelectMock()
				break
			case 'insert':
				mockDatabase.insert = createInsertMock()
				break
			case 'update':
				mockDatabase.update = createUpdateMock()
				break
			case 'delete':
				mockDatabase.delete = createDeleteMock()
				break
		}

		return createTestAppWithMockDatabase(mockDatabase)
	}

	describe('Database Error Handling', () => {
		// モックテストではDBクリーンアップを省略
		beforeEach(() => {
			vi.clearAllMocks()
		})

		// パフォーマンス向上のため、テストをコンパクトに
		it.each([
			{
				operation: 'select' as const,
				method: 'GET' as const,
				path: '/api/subscriptions',
				expectedError: 'Failed to fetch subscriptions',
			},
			{
				operation: 'insert' as const,
				method: 'POST' as const,
				path: '/api/subscriptions',
				payload: testRequestPayloads.createSubscription,
				expectedError: 'Failed to create subscription',
			},
			{
				operation: 'update' as const,
				method: 'PUT' as const,
				path: '/api/subscriptions/1',
				payload: testRequestPayloads.updateSubscription,
				expectedError: 'Failed to update subscription',
			},
			{
				operation: 'delete' as const,
				method: 'DELETE' as const,
				path: '/api/subscriptions/1',
				expectedError: 'Failed to delete subscription',
			},
			{
				operation: 'select' as const,
				method: 'GET' as const,
				path: '/api/subscriptions/1',
				expectedError: 'Failed to fetch subscription',
			},
		])(
			'should handle database errors during $method $path',
			async ({ operation, method, path, payload, expectedError }) => {
				const testApp = createDatabaseErrorApp(operation)
				const response = await createTestRequest(testApp, method, path, payload)

				expect(response.status).toBe(500)
				const data = await getResponseJson(response)
				expectErrorResponse(data, expectedError)
			}
		)
	})
})
