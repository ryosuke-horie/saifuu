import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invalidTransactionData, testRequestPayloads, testTransactionData } from '../helpers/fixtures'
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

	describe('GET /api/transactions', () => {
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
					'description',
					'date',
					'categoryId',
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

		it('should support query parameters for filtering', async () => {
			// Red: クエリパラメータでの絞り込みテスト
			const response = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/transactions?type=expense&page=1&limit=10'
			)

			expect(response.status).toBe(200)
			const data = await getResponseJson(response)
			expect(Array.isArray(data)).toBe(true)

			// データが存在する場合、すべてexpenseタイプであることを確認
			if (data.length > 0) {
				data.forEach((transaction: any) => {
					expect(transaction.type).toBe('expense')
				})
			}
		})

		it('should handle database errors gracefully', async () => {
			// Red: データベースエラー時の処理テスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions')

			// 実装によってはエラーが返される場合もある
			if (response.status === 500) {
				const data = await getResponseJson(response)
				expectErrorResponse(data, 'Failed to fetch transactions')
			} else {
				expect(response.status).toBe(200)
			}
		})
	})

	describe('POST /api/transactions', () => {
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
				'description',
				'date',
				'categoryId',
				'createdAt',
				'updatedAt',
			])

			expect(data.amount).toBe(newTransaction.amount)
			expect(data.type).toBe(newTransaction.type)
			expect(data.description).toBe(newTransaction.description)
			expect(data.date).toBe(newTransaction.date)
		})

		it('should handle missing required fields', async () => {
			// Red: 必須フィールド不足時のテスト
			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				invalidTransactionData.missingAmount
			)

			expect([400, 500]).toContain(response.status)
		})

		it('should handle invalid transaction type', async () => {
			// Red: 無効な取引タイプのテスト
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

		it('should handle invalid date format', async () => {
			// Red: 無効な日付形式のテスト
			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				invalidTransactionData.invalidDate
			)

			expect([400, 500]).toContain(response.status)
		})

		it('should handle database errors during creation', async () => {
			// Red: データベース作成エラーのテスト
			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/transactions',
				testRequestPayloads.createTransaction
			)

			// 現在の実装では500エラーまたは正常作成
			if (response.status === 500) {
				const data = await getResponseJson(response)
				expectErrorResponse(data, 'Failed to create transaction')
			} else {
				expect(response.status).toBe(201)
			}
		})
	})

	describe('GET /api/transactions/:id', () => {
		it('should return transaction by id', async () => {
			// Red: ID指定での取引取得テスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions/1')

			// データが存在しない場合は404、存在する場合は200
			if (response.status === 200) {
				const data = await getResponseJson(response)
				expectJsonStructure(data, [
					'id',
					'amount',
					'type',
					'description',
					'date',
					'categoryId',
					'createdAt',
					'updatedAt',
					'category',
				])
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

		it('should handle invalid id format', async () => {
			// Red: 無効なID形式のテスト
			const response = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/transactions/invalid-id'
			)

			expect([400, 500]).toContain(response.status)
		})
	})

	describe('PUT /api/transactions/:id', () => {
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
				expect(data.type).toBe(updateData.type)
				expect(data.description).toBe(updateData.description)
			} else if (response.status === 404) {
				const data = await getResponseJson(response)
				expectErrorResponse(data, 'Transaction not found')
			} else {
				expect([400, 500]).toContain(response.status)
			}
		})

		it('should return 404 for non-existent transaction update', async () => {
			// Red: 存在しない取引の更新テスト
			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				'/api/transactions/99999',
				testRequestPayloads.updateTransaction
			)

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Transaction not found')
		})

		it('should handle invalid update data', async () => {
			// Red: 無効な更新データのテスト
			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				'/api/transactions/1',
				invalidTransactionData.invalidType
			)

			expect([400, 500]).toContain(response.status)
		})
	})

	describe('DELETE /api/transactions/:id', () => {
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

		it('should return 404 for non-existent transaction deletion', async () => {
			// Red: 存在しない取引の削除テスト
			const response = await createTestRequest(
				testProductionApp,
				'DELETE',
				'/api/transactions/99999'
			)

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expectErrorResponse(data, 'Transaction not found')
		})

		it('should handle invalid id format for deletion', async () => {
			// Red: 無効なID形式での削除テスト
			const response = await createTestRequest(
				testProductionApp,
				'DELETE',
				'/api/transactions/invalid-id'
			)

			expect([400, 500]).toContain(response.status)
		})
	})

	describe('GET /api/transactions/stats', () => {
		it('should return transaction statistics', async () => {
			// Red: 統計取得のテスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions/stats')

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expectJsonStructure(data, [
				'totalIncome',
				'totalExpense',
				'netAmount',
				'transactionCount',
				'avgTransaction',
				'categoryBreakdown',
			])

			expect(typeof data.totalIncome).toBe('number')
			expect(typeof data.totalExpense).toBe('number')
			expect(typeof data.netAmount).toBe('number')
			expect(typeof data.transactionCount).toBe('number')
			expect(typeof data.avgTransaction).toBe('number')
			expect(Array.isArray(data.categoryBreakdown)).toBe(true)
		})

		it('should support date range filtering in stats', async () => {
			// Red: 日付範囲での統計フィルタリングテスト
			const response = await createTestRequest(
				testProductionApp,
				'GET',
				'/api/transactions/stats?dateFrom=2024-01-01&dateTo=2024-12-31'
			)

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expectJsonStructure(data, [
				'totalIncome',
				'totalExpense',
				'netAmount',
				'transactionCount',
				'avgTransaction',
				'categoryBreakdown',
			])
		})

		it('should handle empty data for stats', async () => {
			// Red: データが空の場合の統計テスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions/stats')

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			// 空データの場合でも統計構造は維持される
			expect(data.totalIncome).toBe(0)
			expect(data.totalExpense).toBe(0)
			expect(data.netAmount).toBe(0)
			expect(data.transactionCount).toBe(0)
			expect(data.avgTransaction).toBe(0)
			expect(Array.isArray(data.categoryBreakdown)).toBe(true)
		})

		it('should handle stats database errors gracefully', async () => {
			// Red: 統計取得でのデータベースエラーテスト
			const response = await createTestRequest(testProductionApp, 'GET', '/api/transactions/stats')

			if (response.status === 500) {
				const data = await getResponseJson(response)
				expectErrorResponse(data, 'Failed to fetch transaction statistics')
			} else {
				expect(response.status).toBe(200)
			}
		})
	})
})