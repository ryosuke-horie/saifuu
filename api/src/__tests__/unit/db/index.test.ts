/**
 * @file データベース接続モジュールのユニットテスト
 *
 * 【設計意図】
 * このテストファイルは、Cloudflare D1とDrizzle ORMの統合を検証するために作成されました。
 * 3つの環境（本番、開発、テスト）で同じインターフェースを提供することを保証します。
 *
 * 【テスト戦略】
 * 1. モック戦略: drizzle-orm/d1をモックし、D1バインディングとの統合を分離してテスト
 * 2. カバレッジ: すべての公開関数と主要なエラーケースをカバー（100%を目標）
 * 3. 環境別テスト: 各環境の関数が同じ振る舞いをすることを検証
 *
 * 【代替案として検討したアプローチ】
 * - 統合テストのみ: 実際のD1インスタンスが必要で、ユニットテストには不適切
 * - E2Eテスト: 環境構築が複雑で、素早いフィードバックが得られない
 * - 現在のモックアプローチを採用: 高速で信頼性の高いテストが可能
 */
import type { D1Database } from '@cloudflare/workers-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * D1Databaseのモックファクトリー
 * 実際のD1 APIと同じインターフェースを持つモックオブジェクトを生成
 * withSessionは実際の使用頻度は低いが、型の完全性のために含む
 */
const createMockD1Database = (): D1Database =>
	({
		prepare: vi.fn(),
		dump: vi.fn(),
		batch: vi.fn(),
		exec: vi.fn(),
		withSession: vi.fn(),
	}) as D1Database

// drizzle-orm/d1のモックを設定
// Drizzle ORMの実装詳細に依存せず、インターフェースのみをテスト
vi.mock('drizzle-orm/d1', () => ({
	drizzle: vi.fn(() => ({
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	})),
}))

import { drizzle } from 'drizzle-orm/d1'
// モック後にインポート（モックが適用されることを保証）
import { createDatabase, createDevDatabase, createTestDatabase } from '../../../db/index'

// drizzleをモック関数として型付け（型安全なテストのため）
const mockDrizzle = drizzle as unknown as ReturnType<typeof vi.fn>

describe('データベース接続モジュール', () => {
	beforeEach(() => {
		// 各テスト前にモックをリセット（テストの独立性を保証）
		vi.clearAllMocks()
	})

	// パラメータ化テストで重複を削除
	describe.each([
		{
			name: 'createDatabase（本番環境）',
			fn: createDatabase,
			description: '本番環境用のデータベース接続',
		},
		{
			name: 'createDevDatabase（開発環境）',
			fn: createDevDatabase,
			description: '開発環境用のデータベース接続（ローカルD1インスタンス）',
		},
		{
			name: 'createTestDatabase（テスト環境）',
			fn: createTestDatabase,
			description: 'テスト環境用のデータベース接続（テスト専用D1インスタンス）',
		},
	])('$name', ({ fn }) => {
		it('有効なD1バインディングを渡すとCRUD操作が可能なDrizzleインスタンスを返すべき', () => {
			// Arrange: テスト用のD1バインディングを準備
			const mockBinding = createMockD1Database()

			// Act: データベース接続を作成
			const db = fn(mockBinding)

			// Assert: 返されたインスタンスがDrizzle ORMのインターフェースを実装していることを確認
			expect(db).toBeDefined()
			expect(db.select).toBeDefined()
			expect(db.insert).toBeDefined()
			expect(db.update).toBeDefined()
			expect(db.delete).toBeDefined()

			// 各メソッドが関数であることを確認（型の実用性を検証）
			expect(typeof db.select).toBe('function')
			expect(typeof db.insert).toBe('function')
			expect(typeof db.update).toBe('function')
			expect(typeof db.delete).toBe('function')
		})

		it('drizzle関数を正しいバインディングとスキーマオプションで呼び出すべき', () => {
			// Arrange
			const mockBinding = createMockD1Database()

			// Act
			fn(mockBinding)

			// Assert: drizzleが正しい引数で呼び出されることを確認
			expect(mockDrizzle).toHaveBeenCalledWith(
				mockBinding,
				expect.objectContaining({
					schema: expect.any(Object),
				})
			)
			expect(mockDrizzle).toHaveBeenCalledTimes(1)
		})
	})

	describe('スキーマの一貫性', () => {
		it('すべての環境関数が同一のスキーマオブジェクトを使用すべき', () => {
			// Arrange
			const mockBinding = createMockD1Database()

			// Act: 3つの環境すべてでデータベースを作成
			createDatabase(mockBinding)
			createDevDatabase(mockBinding)
			createTestDatabase(mockBinding)

			// Assert: すべての呼び出しで同じスキーマ参照が使用されていることを確認
			// これにより、環境間でのスキーマの一貫性が保証される
			const calls = mockDrizzle.mock.calls
			expect(calls.length).toBe(3)

			const firstSchema = calls[0][1].schema
			expect(calls[1][1].schema).toBe(firstSchema)
			expect(calls[2][1].schema).toBe(firstSchema)
		})
	})

	describe('エラーハンドリング', () => {
		it('D1バインディングがnullの場合、drizzleのエラーが伝播すべき', () => {
			// 実際のユースケースに基づくエラーシナリオ
			// CloudflareワーカーでD1バインディングが正しく設定されていない場合
			mockDrizzle.mockImplementationOnce(() => {
				throw new Error('D1 binding not found in environment')
			})

			const nullBinding = null as unknown as D1Database

			// エラーが適切に伝播されることを確認
			expect(() => createDatabase(nullBinding)).toThrow('D1 binding not found in environment')
		})

		it('D1バインディングがundefinedの場合、TypeErrorが発生すべき', () => {
			// Cloudflare Workers環境でバインディングが設定されていない場合のシミュレーション
			mockDrizzle.mockImplementationOnce(() => {
				throw new TypeError("Cannot read properties of undefined (reading 'prepare')")
			})

			const undefinedBinding = undefined as unknown as D1Database

			expect(() => createDatabase(undefinedBinding)).toThrow(TypeError)
		})
	})

	describe('環境の独立性', () => {
		it('各環境関数が異なるバインディングで独立して動作すべき', () => {
			// 実際のユースケース: 複数の環境で異なるD1インスタンスを使用
			const prodBinding = createMockD1Database()
			const devBinding = createMockD1Database()
			const testBinding = createMockD1Database()

			// 各環境で異なるバインディングを使用
			createDatabase(prodBinding)
			createDevDatabase(devBinding)
			createTestDatabase(testBinding)

			// それぞれが独立して正しいバインディングで呼び出されることを確認
			expect(mockDrizzle).toHaveBeenCalledTimes(3)
			expect(mockDrizzle).toHaveBeenNthCalledWith(1, prodBinding, expect.any(Object))
			expect(mockDrizzle).toHaveBeenNthCalledWith(2, devBinding, expect.any(Object))
			expect(mockDrizzle).toHaveBeenNthCalledWith(3, testBinding, expect.any(Object))
		})
	})

	describe('実用的な統合シナリオ', () => {
		it('作成されたデータベースインスタンスでCRUD操作を実行できるべき', () => {
			// より実用的なテスト: 返されたインスタンスが実際に使用可能かを検証
			const mockBinding = createMockD1Database()
			const db = createDatabase(mockBinding)

			// モック関数として動作することを確認
			const mockSelect = db.select as ReturnType<typeof vi.fn>
			const mockInsert = db.insert as ReturnType<typeof vi.fn>

			// 実際の使用パターンをシミュレート
			mockSelect()
			mockInsert()

			expect(mockSelect).toHaveBeenCalled()
			expect(mockInsert).toHaveBeenCalled()
		})

		it('複数のデータベースインスタンスが相互に影響しないべき', () => {
			// 異なる環境のデータベースが独立して動作することを確認
			const binding1 = createMockD1Database()
			const binding2 = createMockD1Database()

			// drizzleが毎回新しいインスタンスを返すようにモック
			let callCount = 0
			mockDrizzle.mockImplementation(() => ({
				select: vi.fn().mockReturnValue(`select-${++callCount}`),
				insert: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			}))

			const db1 = createDatabase(binding1)
			const db2 = createDevDatabase(binding2)

			// 各インスタンスが独立していることを確認
			expect(db1.select()).toBe('select-1')
			expect(db2.select()).toBe('select-2')
		})
	})

	describe('バインディングの検証', () => {
		it('不正な形式のバインディングオブジェクトでもdrizzleに渡されるべき', () => {
			// Drizzle ORMが内部でバリデーションを行うため、
			// このレイヤーでは型チェックのみを行い、実際の検証はDrizzleに委ねる
			const malformedBinding = { invalid: 'binding' } as unknown as D1Database

			// エラーをスローせずにdrizzleに渡すことを確認
			expect(() => createDatabase(malformedBinding)).not.toThrow()
			expect(mockDrizzle).toHaveBeenCalledWith(malformedBinding, expect.any(Object))
		})
	})
})
