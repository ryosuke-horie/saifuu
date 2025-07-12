import type { D1Database } from '@cloudflare/workers-types'
import { describe, expect, it, vi } from 'vitest'
import { createDatabase, createDevDatabase, createTestDatabase } from '../index'

/**
 * データベース接続モジュール ユニットテスト
 *
 * D1バインディングの初期化とDrizzle ORMの接続確認
 */

describe('Database Module', () => {
	// モックD1データベースバインディング
	const mockD1Binding: Pick<D1Database, 'prepare' | 'batch' | 'exec' | 'dump'> = {
		prepare: vi.fn(),
		batch: vi.fn(),
		exec: vi.fn(),
		dump: vi.fn(),
	}

	describe('createDatabase', () => {
		it('should create database instance with D1 binding', () => {
			const db = createDatabase(mockD1Binding as D1Database)

			// Drizzleインスタンスが作成されることを確認
			expect(db).toBeDefined()
			expect(db.select).toBeDefined()
			expect(db.insert).toBeDefined()
			expect(db.update).toBeDefined()
			expect(db.delete).toBeDefined()
		})
	})

	describe('createDevDatabase', () => {
		it('should create development database instance with D1 binding', () => {
			const db = createDevDatabase(mockD1Binding as D1Database)

			// 開発環境用のDrizzleインスタンスが作成されることを確認
			expect(db).toBeDefined()
			expect(db.select).toBeDefined()
			expect(db.insert).toBeDefined()
			expect(db.update).toBeDefined()
			expect(db.delete).toBeDefined()
		})
	})

	describe('createTestDatabase', () => {
		it('should create test database instance with D1 binding', () => {
			const db = createTestDatabase(mockD1Binding as D1Database)

			// テスト環境用のDrizzleインスタンスが作成されることを確認
			expect(db).toBeDefined()
			expect(db.select).toBeDefined()
			expect(db.insert).toBeDefined()
			expect(db.update).toBeDefined()
			expect(db.delete).toBeDefined()
		})
	})

	describe('Type exports', () => {
		it('should export schema', async () => {
			// スキーマがエクスポートされていることを確認
			const { schema } = await import('../index')
			expect(schema).toBeDefined()
			expect(schema.transactions).toBeDefined()
			expect(schema.categories).toBeDefined()
			expect(schema.subscriptions).toBeDefined()
		})
	})
})
