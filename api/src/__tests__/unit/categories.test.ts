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
import { createTestRequest, getResponseJson } from '../helpers/test-app'
import { cleanupTestDatabase, setupTestDatabase } from '../helpers/test-db'
import testProductionApp from '../helpers/test-production-app'

// Matt Pocockの型定義原則に従った型定義
// 基本的な型定義を明示的に宣言
type CategoryType = 'income' | 'expense'

// カテゴリの型定義（設定ファイルベースのため、個別に定義）
interface Category {
	id: string // APIはIDを文字列として返す
	name: string
	type: CategoryType
	color?: string
	createdAt: string
	updatedAt: string
}

// HTTPメソッドの型定義
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

// テストケースの型定義（型安全性を保証）
interface MutationTestCase {
	method: Extract<HttpMethod, 'POST' | 'PUT' | 'DELETE'>
	path: string
	body: Record<string, unknown> | undefined
	expectedError: string
	description: string
}

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
				expect(typeof category.id).toBe('string') // APIはIDを文字列として返す
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
						id: '1', // APIはIDを文字列として返す
						name: '家賃・水道・光熱・通信費',
						type: 'expense',
					}),
					expect.objectContaining({
						id: '6',
						name: 'システム関係費',
						type: 'expense',
					}),
					expect.objectContaining({
						id: '8',
						name: '書籍代',
						type: 'expense',
					}),
					// Issue #297: 娯楽カテゴリの追加
					expect.objectContaining({
						id: '18',
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
		// カテゴリの不変性というビジネスルールをテスト
		// 型安全なテストケース定義
		const mutationTestCases: MutationTestCase[] = [
			{
				method: 'POST',
				path: '/api/categories',
				body: { name: '新しいカテゴリ', type: 'expense' },
				expectedError: 'Categories are fixed and cannot be created',
				description: 'POST request should return 405 (ビジネスルール: カテゴリは作成不可)',
			},
			{
				method: 'PUT',
				path: '/api/categories/1',
				body: { name: '更新されたカテゴリ' },
				expectedError: 'Categories are fixed and cannot be updated',
				description: 'PUT request should return 405 (ビジネスルール: カテゴリは更新不可)',
			},
			{
				method: 'DELETE',
				path: '/api/categories/1',
				body: undefined,
				expectedError: 'Categories are fixed and cannot be deleted',
				description: 'DELETE request should return 405 (ビジネスルール: カテゴリは削除不可)',
			},
		] satisfies MutationTestCase[]

		// 各テストケースを実行
		mutationTestCases.forEach((testCase) => {
			it(testCase.description, async () => {
				const response = await createTestRequest(
					testProductionApp,
					testCase.method,
					testCase.path,
					testCase.body
				)
				expect(response.status).toBe(405)
				const data = await getResponseJson(response)
				expect(data).toHaveProperty('error', testCase.expectedError)
			})
		})
	})
})
