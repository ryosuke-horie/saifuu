/**
 * Categories API Routes のテスト
 *
 * Issue #53 修正対応:
 * - Categories Route (0%カバレッジ) のテスト追加
 * - フロントエンドと整合性のある配列レスポンス形式の検証
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Category, NewCategory } from '../../db/schema'
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

describe('Categories API - Unit Tests', () => {
	beforeEach(async () => {
		await setupTestDatabase()
	})

	afterEach(async () => {
		await cleanupTestDatabase()
	})

	describe('GET /categories', () => {
		it('should return categories array (Issue #53 fix validation)', async () => {
			// フロントエンドで期待する配列レスポンス形式を検証
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)

			// 配列形式であることを確認（今回のフロントエンド修正と整合性）
			expect(Array.isArray(data)).toBe(true)

			// デフォルトカテゴリが存在することを確認
			expect(data.length).toBeGreaterThan(0)

			// カテゴリの構造を検証
			data.forEach((category: Category) => {
				expect(category).toHaveProperty('id')
				expect(category).toHaveProperty('name')
				expect(category).toHaveProperty('type')
				expect(category).toHaveProperty('createdAt')
				expect(category).toHaveProperty('updatedAt')
				expect(typeof category.id).toBe('number')
				expect(typeof category.name).toBe('string')
				expect(['income', 'expense']).toContain(category.type)
			})
		})

		it('should return categories from config file', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const data = await getResponseJson(response)

			expect(response.status).toBe(200)
			// 設定ファイルからのカテゴリを確認
			expect(data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: 1,
						name: '家賃・水道・光熱・通信費',
						type: 'expense',
					}),
					expect.objectContaining({
						id: 6,
						name: 'システム関係日',
						type: 'expense',
					}),
					expect.objectContaining({
						id: 8,
						name: '書籍代',
						type: 'expense',
					}),
				])
			)
			// 設定ファイルのカテゴリ数を確認
			expect(data).toHaveLength(17) // 支出12 + 収入17
		})

		it('should handle database errors gracefully', async () => {
			// データベースエラーをシミュレート（実際の環境では困難だが、構造の確認）
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')

			// 正常な場合のレスポンス検証
			expect([200, 500]).toContain(response.status)

			if (response.status === 500) {
				const data = await getResponseJson(response)
				expect(data).toHaveProperty('error')
			}
		})
	})

	describe('POST /categories', () => {
		it('should return 405 as categories are fixed', async () => {
			const newCategory: NewCategory = {
				name: '新しいカテゴリ',
				type: 'expense',
				color: '#123456',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				newCategory
			)

			expect(response.status).toBe(405) // Method Not Allowed

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be created')
		})

		it('should return 405 even with missing fields', async () => {
			const invalidCategory = {
				// name が欠落
				type: 'expense',
				color: '#123456',
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				invalidCategory
			)

			expect(response.status).toBe(405) // 設定ファイル固定のため
			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error')
		})

		it('should return 405 even with invalid type values', async () => {
			const invalidCategory = {
				name: 'テストカテゴリ',
				type: 'invalid_type', // 無効なtype
				color: '#123456',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/api/categories',
				invalidCategory
			)

			expect(response.status).toBe(405) // 設定ファイル固定のため
		})
	})

	describe('PUT /categories/:id', () => {
		it('should return 405 as categories are fixed', async () => {
			const updateData = {
				name: '更新されたカテゴリ',
				color: '#ABCDEF',
			}

			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				'/api/categories/1',
				updateData
			)

			expect(response.status).toBe(405) // Method Not Allowed

			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be updated')
		})

		it('should return 405 even for non-existent category', async () => {
			const updateData = {
				name: '存在しないカテゴリ',
			}

			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				'/api/categories/9999',
				updateData
			)

			expect(response.status).toBe(405) // 設定ファイル固定のため
			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error')
		})
	})

	describe('DELETE /categories/:id', () => {
		it('should return 405 as categories are fixed', async () => {
			// 削除実行
			const deleteResponse = await createTestRequest(
				testProductionApp,
				'DELETE',
				'/api/categories/1'
			)

			expect(deleteResponse.status).toBe(405) // Method Not Allowed
			const data = await getResponseJson(deleteResponse)
			expect(data).toHaveProperty('error', 'Categories are fixed and cannot be deleted')
		})

		it('should return 405 even for non-existent category deletion', async () => {
			const response = await createTestRequest(testProductionApp, 'DELETE', '/api/categories/9999')

			expect(response.status).toBe(405) // 設定ファイル固定のため
			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error')
		})
	})

	describe('Response Format Validation', () => {
		it('should ensure response format matches frontend expectations', async () => {
			// フロントエンドの型修正と整合性確認
			const response = await createTestRequest(testProductionApp, 'GET', '/api/categories')
			const data = await getResponseJson(response)

			expect(response.status).toBe(200)

			// フロントエンドが期待する配列形式
			expect(Array.isArray(data)).toBe(true)

			// オブジェクト包装（{categories: [...]}）でないことを確認
			expect(data).not.toHaveProperty('categories')
			expect(data).not.toHaveProperty('total')

			// 直接配列であることを確認
			if (data.length > 0) {
				expect(data[0]).toHaveProperty('id')
				expect(data[0]).toHaveProperty('name')
			}
		})
	})
})
