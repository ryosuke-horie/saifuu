import type { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// D1Databaseのモックを作成
const createMockD1Database = (): D1Database =>
	({
		prepare: vi.fn(),
		dump: vi.fn(),
		batch: vi.fn(),
		exec: vi.fn(),
		withSession: vi.fn(),
	}) as D1Database

// drizzle-orm/d1のモックを設定
vi.mock('drizzle-orm/d1', () => ({
	drizzle: vi.fn(() => ({
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	})),
}))

import { drizzle } from 'drizzle-orm/d1'
// モック後にインポート
import { createDatabase, createDevDatabase, createTestDatabase } from '../../../db/index'

// drizzleをモック関数として型付け
const mockDrizzle = drizzle as unknown as ReturnType<typeof vi.fn>

describe('データベース接続モジュール', () => {
	beforeEach(() => {
		// 各テスト前にモックをリセット
		vi.clearAllMocks()
	})

	describe('createDatabase', () => {
		it('D1バインディングを受け取ってDrizzleインスタンスを返す', () => {
			const mockBinding = createMockD1Database()
			const db = createDatabase(mockBinding)

			// Drizzleインスタンスが正しく作成されることを確認
			expect(db).toBeDefined()
			expect(db.select).toBeDefined()
			expect(db.insert).toBeDefined()
			expect(db.update).toBeDefined()
			expect(db.delete).toBeDefined()
		})

		it('drizzleが正しい引数で呼び出される', () => {
			const mockBinding = createMockD1Database()
			createDatabase(mockBinding)

			// drizzleが正しい引数で呼び出されることを確認
			expect(mockDrizzle).toHaveBeenCalledWith(
				mockBinding,
				expect.objectContaining({
					schema: expect.any(Object),
				})
			)
			expect(mockDrizzle).toHaveBeenCalledTimes(1)
		})
	})

	describe('createDevDatabase', () => {
		it('開発環境用のD1バインディングを受け取ってDrizzleインスタンスを返す', () => {
			const mockBinding = createMockD1Database()
			const db = createDevDatabase(mockBinding)

			// Drizzleインスタンスが正しく作成されることを確認
			expect(db).toBeDefined()
			expect(db.select).toBeDefined()
			expect(db.insert).toBeDefined()
			expect(db.update).toBeDefined()
			expect(db.delete).toBeDefined()
		})

		it('drizzleが正しい引数で呼び出される', () => {
			const mockBinding = createMockD1Database()
			createDevDatabase(mockBinding)

			// drizzleが正しい引数で呼び出されることを確認
			expect(mockDrizzle).toHaveBeenCalledWith(
				mockBinding,
				expect.objectContaining({
					schema: expect.any(Object),
				})
			)
			expect(mockDrizzle).toHaveBeenCalledTimes(1)
		})
	})

	describe('createTestDatabase', () => {
		it('テスト環境用のD1バインディングを受け取ってDrizzleインスタンスを返す', () => {
			const mockBinding = createMockD1Database()
			const db = createTestDatabase(mockBinding)

			// Drizzleインスタンスが正しく作成されることを確認
			expect(db).toBeDefined()
			expect(db.select).toBeDefined()
			expect(db.insert).toBeDefined()
			expect(db.update).toBeDefined()
			expect(db.delete).toBeDefined()
		})

		it('drizzleが正しい引数で呼び出される', () => {
			const mockBinding = createMockD1Database()
			createTestDatabase(mockBinding)

			// drizzleが正しい引数で呼び出されることを確認
			expect(mockDrizzle).toHaveBeenCalledWith(
				mockBinding,
				expect.objectContaining({
					schema: expect.any(Object),
				})
			)
			expect(mockDrizzle).toHaveBeenCalledTimes(1)
		})
	})

	describe('型定義', () => {
		it('Database型が正しく推論される', () => {
			const mockBinding = createMockD1Database()
			const db = createDatabase(mockBinding)

			// TypeScriptの型推論が正しく動作することを確認
			// これはコンパイル時にチェックされる
			const _typeCheck: ReturnType<typeof createDatabase> = db
			expect(_typeCheck).toBeDefined()
		})

		it('DevDatabase型が正しく推論される', () => {
			const mockBinding = createMockD1Database()
			const db = createDevDatabase(mockBinding)

			// TypeScriptの型推論が正しく動作することを確認
			const _typeCheck: ReturnType<typeof createDevDatabase> = db
			expect(_typeCheck).toBeDefined()
		})

		it('TestDatabase型が正しく推論される', () => {
			const mockBinding = createMockD1Database()
			const db = createTestDatabase(mockBinding)

			// TypeScriptの型推論が正しく動作することを確認
			const _typeCheck: ReturnType<typeof createTestDatabase> = db
			expect(_typeCheck).toBeDefined()
		})
	})

	describe('エラーハンドリング', () => {
		it('無効なバインディングでエラーをスローする', () => {
			// drizzleがエラーをスローするようにモック
			mockDrizzle.mockImplementationOnce(() => {
				throw new Error('Invalid D1 binding')
			})

			const invalidBinding = null as unknown as D1Database

			// createDatabaseがエラーをスローすることを確認
			expect(() => createDatabase(invalidBinding)).toThrow('Invalid D1 binding')
		})

		it('スキーマが正しく渡されているか確認', () => {
			const mockBinding = createMockD1Database()

			// 3つの関数すべてを呼び出す
			createDatabase(mockBinding)
			createDevDatabase(mockBinding)
			createTestDatabase(mockBinding)

			// すべての呼び出しで同じスキーマオブジェクトが使用されることを確認
			const calls = mockDrizzle.mock.calls
			expect(calls.length).toBe(3)

			// すべての呼び出しで同じスキーマ参照が使用されているか確認
			const firstSchema = calls[0][1].schema
			expect(calls[1][1].schema).toBe(firstSchema)
			expect(calls[2][1].schema).toBe(firstSchema)
		})

		it('drizzleからエラーが伝播される', () => {
			const customError = new TypeError('Custom error from drizzle')
			mockDrizzle.mockImplementationOnce(() => {
				throw customError
			})

			const mockBinding = createMockD1Database()

			// エラーが正しく伝播されることを確認
			expect(() => createDatabase(mockBinding)).toThrow(customError)
		})
	})

	describe('環境別の設定', () => {
		it('すべての環境でD1バインディングが必須である', () => {
			// undefinedをバインディングとして渡した場合
			mockDrizzle.mockImplementationOnce(() => {
				throw new TypeError('Cannot read properties of undefined')
			})

			const undefinedBinding = undefined as unknown as D1Database

			// エラーがスローされることを確認
			expect(() => createDatabase(undefinedBinding)).toThrow(TypeError)
		})

		it('各関数が独立して動作する', () => {
			const binding1 = createMockD1Database()
			const binding2 = createMockD1Database()
			const binding3 = createMockD1Database()

			// 異なるバインディングで各関数を呼び出す
			createDatabase(binding1)
			createDevDatabase(binding2)
			createTestDatabase(binding3)

			// それぞれ独立して呼び出されることを確認
			expect(mockDrizzle).toHaveBeenCalledTimes(3)
			expect(mockDrizzle).toHaveBeenNthCalledWith(1, binding1, expect.any(Object))
			expect(mockDrizzle).toHaveBeenNthCalledWith(2, binding2, expect.any(Object))
			expect(mockDrizzle).toHaveBeenNthCalledWith(3, binding3, expect.any(Object))
		})
	})

	describe('型互換性', () => {
		it('すべてのデータベース関数が同じインターフェースを実装', () => {
			const mockBinding = createMockD1Database()

			const prodDb = createDatabase(mockBinding)
			const devDb = createDevDatabase(mockBinding)
			const testDb = createTestDatabase(mockBinding)

			// すべてが同じメソッドを持つことを確認
			;[prodDb, devDb, testDb].forEach((db) => {
				expect(typeof db.select).toBe('function')
				expect(typeof db.insert).toBe('function')
				expect(typeof db.update).toBe('function')
				expect(typeof db.delete).toBe('function')
			})
		})
	})
})
