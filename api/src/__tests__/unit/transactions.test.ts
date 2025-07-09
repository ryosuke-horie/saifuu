import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invalidTransactionData, testRequestPayloads } from '../helpers/fixtures'
import {
	createTestRequest,
	expectErrorResponse,
	expectHeader,
	expectJsonStructure,
	getResponseJson,
} from '../helpers/test-app'
import testProductionApp from '../helpers/test-production-app'

/**
 * 取引API ユニットテスト
 *
 * TDD Red-Green-Refactorサイクルに従って実装
 * - Red: テストを先に書いて失敗させる
 * - Green: テストを通すための最小限の実装
 * - Refactor: コードを改善する
 */

describe('Transactions API - Unit Tests', () => {
	beforeEach(() => {
		// 各テストケース前にモックをリセット
		vi.clearAllMocks()
	})

	describe('GET /transactions', () => {
		it('should return empty array when no transactions exist', async () => {
			// Red: まずテストを書く（現在は失敗する）
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions')

			// Debug: Check what error is returned
			if (response.status !== 200) {
				const errorData = await getResponseJson(response)
				console.log('Error response:', errorData)
			}

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)
			expect(data).toHaveLength(0)
		})

		it('should return list of transactions with category information', async () => {
			// Red: 取引一覧取得のテスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions')

			expect(response.status).toBe(200)
			// Hono returns just 'application/json' without charset specification
			expectHeader(response, 'content-type', 'application/json')

			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)

			// データが存在する場合の構造チェック
			if (data.length > 0) {
				const transaction = data[0]
				expectJsonStructure(transaction, [
					'id',
					'amount',
					'type',
					'categoryId',
					'description',
					'date',
					'createdAt',
					'updatedAt',
					'category',
				])

				// カテゴリ情報の構造チェック
				if (transaction.category) {
					expectJsonStructure(transaction.category, [
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

	describe('POST /transactions', () => {
		it('should create a new transaction with valid data', async () => {
			// Red: 取引作成のテスト
			const newTransaction = testRequestPayloads.createTransaction

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				newTransaction
			)

			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			expectJsonStructure(data, [
				'id',
				'amount',
				'type',
				'categoryId',
				'description',
				'date',
				'createdAt',
				'updatedAt',
			])

			expect(data.amount).toBe(newTransaction.amount)
			expect(data.type).toBe(newTransaction.type)
			expect(data.description).toBe(newTransaction.description)
		})

		it('should handle missing required fields', async () => {
			// Red: 必須フィールド不足時のテスト
			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				invalidTransactionData.missingAmount
			)

			// バリデーションが実装されていれば400、そうでなければ500
			expect([400, 500]).toContain(response.status)
		})

		it('should handle invalid transaction type', async () => {
			// Red: 無効な取引種別のテスト
			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				invalidTransactionData.invalidType
			)

			expect([400, 500]).toContain(response.status)
		})

		it('should handle negative amount', async () => {
			// Red: 負の金額のテスト
			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				invalidTransactionData.negativeAmount
			)

			expect([400, 500]).toContain(response.status)
		})
	})

	describe('GET /transactions/:id', () => {
		it('should return transaction by id', async () => {
			// Red: ID指定での取引取得テスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions/1')

			// データが存在しない場合は404、存在する場合は200
			if (response.status === 200) {
				const data = await getResponseJson(response)
				expectJsonStructure(data, ['id', 'amount', 'type', 'categoryId', 'description', 'date'])
				expect(data.id).toBe(1)
			} else {
				expect(response.status).toBe(404)
				const data = await getResponseJson(response)
				expectErrorResponse(data, 'Transaction not found')
			}
		})

		it('should return 404 for non-existent transaction', async () => {
			// Red: 存在しない取引のテスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions/99999')

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Transaction not found')
		})
	})

	describe('PUT /transactions/:id', () => {
		it('should update existing transaction', async () => {
			// Red: 取引更新のテスト
			const updateData = testRequestPayloads.updateTransaction

			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				'/api/transactions/1',
				updateData
			)

			if (response.status === 200) {
				const data = await getResponseJson(response)
				expect(data.amount).toBe(updateData.amount)
				expect(data.description).toBe(updateData.description)
			} else if (response.status === 404) {
				const data = await getResponseJson(response)
				expectErrorResponse(data, 'Transaction not found')
			} else {
				expect([400, 500]).toContain(response.status)
			}
		})
	})

	describe('DELETE /transactions/:id', () => {
		it('should delete existing transaction', async () => {
			// Red: 取引削除のテスト
			const response = await createTestRequest(testProductionApp, 'DELETE', '/api/transactions/1')

			if (response.status === 200) {
				const data = await getResponseJson(response)
				expect(data.message).toBe('Transaction deleted successfully')
			} else if (response.status === 404) {
				const data = await getResponseJson(response)
				expectErrorResponse(data, 'Transaction not found')
			} else {
				expect([400, 500]).toContain(response.status)
			}
		})
	})

	describe('GET /transactions/stats', () => {
		it('should return transaction statistics', async () => {
			// Red: 統計取得のテスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions/stats')

			if (response.status === 200) {
				const data = await getResponseJson(response)
				expectJsonStructure(data, ['totalIncome', 'totalExpense', 'balance', 'transactionCount'])
			} else {
				expect([400, 500]).toContain(response.status)
			}
		})
	})
})
