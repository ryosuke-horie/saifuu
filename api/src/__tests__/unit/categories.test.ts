/**
 * Categories API Routes のテスト
 *
 * Issue #53 修正対応:
 * - Categories Route (0%カバレッジ) のテスト追加
 * - フロントエンドと整合性のある配列レスポンス形式の検証
 *
 * Issue #299 修正対応:
 * - 冗長なテストケースを削減
 * - カテゴリは読み取り専用のため、データベースエラーテストを削除
 * - 405エラーテストを統合
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// カテゴリの型定義（設定ファイルベースのため、個別に定義）
interface Category {
	id: number
	name: string
	type: 'income' | 'expense'
	color?: string
	createdAt: string
	updatedAt: string
}

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
						name: 'システム関係費',
						type: 'expense',
					}),
					expect.objectContaining({
						id: 8,
						name: '書籍代',
						type: 'expense',
					}),
					// Issue #297: 娯楽カテゴリの追加
					expect.objectContaining({
						id: 18,
						name: '娯楽',
						type: 'expense',
					}),
				])
			)
			// 設定ファイルのカテゴリ数を確認
			expect(data).toHaveLength(16) // 支出11個 + 収入5個
		})
	})

	describe('Mutation operations (POST, PUT, DELETE)', () => {
		it('should return 405 for all mutation operations', async () => {
			// POST テスト
			const postResponse = await createTestRequest(testProductionApp, 'POST', '/api/categories', {
				name: '新しいカテゴリ',
				type: 'expense',
			})
			expect(postResponse.status).toBe(405)
			const postData = await getResponseJson(postResponse)
			expect(postData).toHaveProperty('error', 'Categories are fixed and cannot be created')

			// PUT テスト
			const putResponse = await createTestRequest(testProductionApp, 'PUT', '/api/categories/1', {
				name: '更新されたカテゴリ',
			})
			expect(putResponse.status).toBe(405)
			const putData = await getResponseJson(putResponse)
			expect(putData).toHaveProperty('error', 'Categories are fixed and cannot be updated')

			// DELETE テスト
			const deleteResponse = await createTestRequest(
				testProductionApp,
				'DELETE',
				'/api/categories/1'
			)
			expect(deleteResponse.status).toBe(405)
			const deleteData = await getResponseJson(deleteResponse)
			expect(deleteData).toHaveProperty('error', 'Categories are fixed and cannot be deleted')
		})
	})
})
