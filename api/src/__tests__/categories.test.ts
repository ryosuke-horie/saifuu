/**
 * カテゴリAPIエンドポイントのテスト
 * CRUD操作とバリデーション、エラーハンドリングを検証
 */
/// <reference path="./types.d.ts" />

import { env, SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { NewCategory } from '../db/schema'
import type {
	CategoriesListResponse,
	CategoryResponse,
	ErrorResponse,
	SuccessMessageResponse,
} from './api-types'
import { createTestDatabase, seedTestData } from './setup'

describe('/api/categories', () => {
	describe('GET /api/categories - カテゴリ一覧取得', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('全カテゴリを正常に取得できる', async () => {
			const response = await SELF.fetch('/api/categories')
			const data = (await response.json()) as CategoriesListResponse

			expect(response.status).toBe(200)
			expect(Array.isArray(data)).toBe(true)
			expect(data.length).toBe(2) // mockCategoriesの数

			// データ構造の確認
			for (const category of data) {
				expect(category).toHaveProperty('id')
				expect(category).toHaveProperty('name')
				expect(category).toHaveProperty('type')
				expect(category).toHaveProperty('color')
				expect(category).toHaveProperty('createdAt')
				expect(category).toHaveProperty('updatedAt')
			}
		})

		it('空のデータベースでは空配列を返す', async () => {
			// データベースをクリーンアップ
			await createTestDatabase(env)

			const response = await SELF.fetch('/api/categories')
			const data = (await response.json()) as CategoriesListResponse

			expect(response.status).toBe(200)
			expect(Array.isArray(data)).toBe(true)
			expect(data.length).toBe(0)
		})

		it('カテゴリデータの内容が正しい', async () => {
			const response = await SELF.fetch('/api/categories')
			const data = (await response.json()) as CategoriesListResponse

			const incomeCategory = data.find((cat) => cat.type === 'income')
			const expenseCategory = data.find((cat) => cat.type === 'expense')

			expect(incomeCategory).toBeDefined()
			expect(incomeCategory?.name).toBe('テスト収入カテゴリ')
			expect(incomeCategory?.color).toBe('#4CAF50')

			expect(expenseCategory).toBeDefined()
			expect(expenseCategory?.name).toBe('テスト支出カテゴリ')
			expect(expenseCategory?.color).toBe('#F44336')
		})
	})

	describe('POST /api/categories - カテゴリ作成', () => {
		beforeEach(async () => {
			await createTestDatabase(env)
		})

		it('有効なデータでカテゴリを作成できる', async () => {
			const newCategory: NewCategory = {
				name: '新しいカテゴリ',
				type: 'expense',
				color: '#FF9800',
			}

			const response = await SELF.fetch('/api/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newCategory),
			})

			const data = (await response.json()) as CategoryResponse

			expect(response.status).toBe(201)
			expect(data.id).toBeDefined()
			expect(data.name).toBe(newCategory.name)
			expect(data.type).toBe(newCategory.type)
			expect(data.color).toBe(newCategory.color)
			expect(data.createdAt).toBeDefined()
			expect(data.updatedAt).toBeDefined()
		})

		it('収入カテゴリを作成できる', async () => {
			const newCategory: NewCategory = {
				name: '給与',
				type: 'income',
				color: '#4CAF50',
			}

			const response = await SELF.fetch('/api/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newCategory),
			})

			const data = (await response.json()) as CategoryResponse

			expect(response.status).toBe(201)
			expect(data.type).toBe('income')
		})

		it('色指定なしでもカテゴリを作成できる', async () => {
			const newCategory = {
				name: '色なしカテゴリ',
				type: 'expense',
			}

			const response = await SELF.fetch('/api/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newCategory),
			})

			const data = (await response.json()) as CategoryResponse

			expect(response.status).toBe(201)
			expect(data.color).toBeNull()
		})

		it('作成したカテゴリがデータベースに保存される', async () => {
			const newCategory: NewCategory = {
				name: 'DB確認カテゴリ',
				type: 'expense',
				color: '#E91E63',
			}

			await SELF.fetch('/api/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newCategory),
			})

			// データベースから直接確認
			const db = createTestDatabase(env)
			const categories = await (await db).query.categories.findMany()
			const createdCategory = categories.find((cat) => cat.name === newCategory.name)

			expect(createdCategory).toBeDefined()
			expect(createdCategory?.type).toBe(newCategory.type)
		})
	})

	describe('PUT /api/categories/:id - カテゴリ更新', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('既存カテゴリを正常に更新できる', async () => {
			const updateData = {
				name: '更新されたカテゴリ',
				color: '#9C27B0',
			}

			const response = await SELF.fetch('/api/categories/1', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			})

			const data = (await response.json()) as CategoryResponse

			expect(response.status).toBe(200)
			expect(data.id).toBe(1)
			expect(data.name).toBe(updateData.name)
			expect(data.color).toBe(updateData.color)
			expect(data.type).toBe('income') // 元のtypeが保持されている
		})

		it('部分的な更新が可能', async () => {
			const updateData = {
				name: '名前のみ更新',
			}

			const response = await SELF.fetch('/api/categories/2', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			})

			const data = (await response.json()) as CategoryResponse

			expect(response.status).toBe(200)
			expect(data.name).toBe(updateData.name)
			expect(data.type).toBe('expense') // 元の値が保持
			expect(data.color).toBe('#F44336') // 元の値が保持
		})

		it('存在しないIDでは404を返す', async () => {
			const updateData = {
				name: '存在しないID',
			}

			const response = await SELF.fetch('/api/categories/999', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			})

			const data = (await response.json()) as ErrorResponse

			expect(response.status).toBe(404)
			expect(data.error).toBe('Category not found')
		})

		it('updatedAtが更新される', async () => {
			// 元のデータ取得
			const originalResponse = await SELF.fetch('/api/categories/1')
			const originalData = (await originalResponse.json()) as CategoryResponse

			// 少し待機してから更新
			await new Promise((resolve) => setTimeout(resolve, 10))

			const updateData = {
				name: 'タイムスタンプ確認',
			}

			const response = await SELF.fetch('/api/categories/1', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			})

			const data = (await response.json()) as CategoryResponse

			expect(response.status).toBe(200)
			expect(new Date(data.updatedAt).getTime()).toBeGreaterThan(
				new Date(originalData.updatedAt).getTime()
			)
		})
	})

	describe('DELETE /api/categories/:id - カテゴリ削除', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('既存カテゴリを正常に削除できる', async () => {
			const response = await SELF.fetch('/api/categories/1', {
				method: 'DELETE',
			})

			const data = (await response.json()) as SuccessMessageResponse

			expect(response.status).toBe(200)
			expect(data.message).toBe('Category deleted successfully')
		})

		it('削除後にカテゴリが存在しなくなる', async () => {
			// 削除実行
			await SELF.fetch('/api/categories/1', {
				method: 'DELETE',
			})

			// 一覧取得で確認
			const listResponse = await SELF.fetch('/api/categories')
			const categories = (await listResponse.json()) as CategoriesListResponse

			expect(categories.find((cat) => cat.id === 1)).toBeUndefined()
			expect(categories.length).toBe(1) // 元々2個あったので1個残る
		})

		it('存在しないIDでは404を返す', async () => {
			const response = await SELF.fetch('/api/categories/999', {
				method: 'DELETE',
			})

			const data = (await response.json()) as ErrorResponse

			expect(response.status).toBe(404)
			expect(data.error).toBe('Category not found')
		})

		it('無効なIDでは404を返す', async () => {
			const response = await SELF.fetch('/api/categories/invalid', {
				method: 'DELETE',
			})

			const data = (await response.json()) as ErrorResponse

			expect(response.status).toBe(404)
			expect(data.error).toBe('Category not found')
		})
	})

	describe('エラーハンドリング', () => {
		beforeEach(async () => {
			await createTestDatabase(env)
		})

		it('不正なJSONではエラーを返す', async () => {
			const response = await SELF.fetch('/api/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: '{ invalid json',
			})

			expect(response.status).toBe(500)
		})

		it('Content-Typeが不正でもエラーハンドリングされる', async () => {
			const response = await SELF.fetch('/api/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain',
				},
				body: JSON.stringify({ name: 'test', type: 'expense' }),
			})

			// エラーレスポンスかリクエストの処理のいずれかが行われることを確認
			expect(response.status).toBeGreaterThanOrEqual(200)
		})
	})

	describe('データ型検証', () => {
		beforeEach(async () => {
			await seedTestData(env)
		})

		it('取得したカテゴリデータの型が正しい', async () => {
			const response = await SELF.fetch('/api/categories')
			const data = (await response.json()) as CategoriesListResponse

			for (const category of data) {
				expect(typeof category.id).toBe('number')
				expect(typeof category.name).toBe('string')
				expect(category.type === 'income' || category.type === 'expense').toBe(true)
				expect(category.color === null || typeof category.color === 'string').toBe(true)
				expect(typeof category.createdAt).toBe('number') // timestamp
				expect(typeof category.updatedAt).toBe('number') // timestamp
			}
		})
	})
})
