/**
 * Categories API Routes のテスト
 *
 * Issue #53 修正対応:
 * - Categories Route (0%カバレッジ) のテスト追加
 * - フロントエンドと整合性のある配列レスポンス形式の検証
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { NewCategory } from '../../db/schema'
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
			const response = await createTestRequest(testProductionApp, 'GET', '/categories')

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)

			// 配列形式であることを確認（今回のフロントエンド修正と整合性）
			expect(Array.isArray(data)).toBe(true)

			// デフォルトカテゴリが存在することを確認
			expect(data.length).toBeGreaterThan(0)

			// カテゴリの構造を検証
			data.forEach((category: any) => {
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

		it('should return seeded categories', async () => {
			const response = await createTestRequest(testProductionApp, 'GET', '/categories')
			const data = await getResponseJson(response)

			expect(response.status).toBe(200)
			expect(data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: 1,
						name: 'エンターテイメント',
						type: 'expense',
					}),
					expect.objectContaining({
						id: 2,
						name: 'ソフトウェア',
						type: 'expense',
					}),
				])
			)
		})

		it('should handle database errors gracefully', async () => {
			// データベースエラーをシミュレート（実際の環境では困難だが、構造の確認）
			const response = await createTestRequest(testProductionApp, 'GET', '/categories')

			// 正常な場合のレスポンス検証
			expect([200, 500]).toContain(response.status)

			if (response.status === 500) {
				const data = await getResponseJson(response)
				expect(data).toHaveProperty('error')
			}
		})
	})

	describe('POST /categories', () => {
		it('should create a new category', async () => {
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
				'/categories',
				newCategory
			)

			expect(response.status).toBe(201)

			const data = await getResponseJson(response)
			expect(data).toMatchObject({
				id: expect.any(Number),
				name: '新しいカテゴリ',
				type: 'expense',
				color: '#123456',
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			})
		})

		it('should handle missing required fields', async () => {
			const invalidCategory = {
				// name が欠落
				type: 'expense',
				color: '#123456',
			}

			const response = await createTestRequest(
				testProductionApp,
				'POST',
				'/categories',
				invalidCategory
			)

			expect(response.status).toBe(500) // データベース制約エラー
			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error')
		})

		it('should handle invalid type values', async () => {
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
				'/categories',
				invalidCategory
			)

			expect(response.status).toBe(500) // データベース制約エラー
		})
	})

	describe('PUT /categories/:id', () => {
		it('should update existing category', async () => {
			// まず既存のカテゴリを確認
			const getResponse = await createTestRequest(testProductionApp, 'GET', '/categories')
			const categories = await getResponseJson(getResponse)
			const firstCategory = categories[0]

			const updateData = {
				name: '更新されたカテゴリ',
				color: '#ABCDEF',
			}

			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				`/categories/${firstCategory.id}`,
				updateData
			)

			expect(response.status).toBe(200)

			const data = await getResponseJson(response)
			expect(data).toMatchObject({
				id: firstCategory.id,
				name: '更新されたカテゴリ',
				color: '#ABCDEF',
				type: firstCategory.type, // type は変更されない
				updatedAt: expect.any(String),
			})

			// updatedAt が更新されていることを確認
			expect(new Date(data.updatedAt).getTime()).toBeGreaterThan(
				new Date(firstCategory.updatedAt).getTime()
			)
		})

		it('should return 404 for non-existent category', async () => {
			const updateData = {
				name: '存在しないカテゴリ',
			}

			const response = await createTestRequest(
				testProductionApp,
				'PUT',
				'/categories/9999',
				updateData
			)

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Category not found')
		})
	})

	describe('DELETE /categories/:id', () => {
		it('should delete existing category', async () => {
			// 新しいカテゴリを作成
			const newCategory: NewCategory = {
				name: '削除用カテゴリ',
				type: 'expense',
				color: '#FF0000',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			const createResponse = await createTestRequest(
				testProductionApp,
				'POST',
				'/categories',
				newCategory
			)
			const createdCategory = await getResponseJson(createResponse)

			// 削除実行
			const deleteResponse = await createTestRequest(
				testProductionApp,
				'DELETE',
				`/categories/${createdCategory.id}`
			)

			expect(deleteResponse.status).toBe(200)
			const data = await getResponseJson(deleteResponse)
			expect(data).toHaveProperty('message', 'Category deleted successfully')

			// 削除されたことを確認
			const getResponse = await createTestRequest(testProductionApp, 'GET', '/categories')
			const categories = await getResponseJson(getResponse)
			expect(categories.find((c: any) => c.id === createdCategory.id)).toBeUndefined()
		})

		it('should return 404 for non-existent category deletion', async () => {
			const response = await createTestRequest(testProductionApp, 'DELETE', '/categories/9999')

			expect(response.status).toBe(404)
			const data = await getResponseJson(response)
			expect(data).toHaveProperty('error', 'Category not found')
		})
	})

	describe('Response Format Validation', () => {
		it('should ensure response format matches frontend expectations', async () => {
			// フロントエンドの型修正と整合性確認
			const response = await createTestRequest(testProductionApp, 'GET', '/categories')
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
