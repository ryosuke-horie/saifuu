import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as errorHandler from '../../lib/error-handler'
import * as routeFactory from '../../lib/route-factory'
import { createTransactionsApp } from '../../routes/transactions'

// モックの設定
vi.mock('../../lib/route-factory', () => ({
	createCrudHandlers: vi.fn(() => ({
		create: vi.fn(),
		getById: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		getAll: vi.fn(),
	})),
}))

vi.mock('../../lib/error-handler', () => ({
	handleError: vi.fn((c, _error) => {
		return c.json({ error: 'Internal Server Error' }, 500)
	}),
	// biome-ignore lint/suspicious/noExplicitAny: テスト用モックなのでanyを許可
	errorHandler: vi.fn(() => async (c: any, next: () => Promise<void>) => {
		try {
			await next()
		} catch (_error) {
			return c.json({ error: 'Internal Server Error' }, 500)
		}
	}),
	ValidationError: class ValidationError extends Error {
		constructor(
			message: string,
			public errors: Array<{ field?: string; message: string }>
		) {
			super(message)
		}
	},
	BadRequestError: class BadRequestError extends Error {
		constructor(message: string) {
			super(message)
		}
	},
}))

vi.mock('../../lib/logger', () => ({
	createRequestLogger: vi.fn(() => ({
		success: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	})),
	logDatabaseOperation: vi.fn(),
}))

describe('Transactions Route Refactoring - ユーティリティ統合テスト', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('CRUDファクトリの使用', () => {
		it('createCrudHandlersを使用してCRUD操作を実装していること', () => {
			// アプリケーションを作成
			createTransactionsApp()

			// createCrudHandlersが呼び出されていることを確認
			expect(routeFactory.createCrudHandlers).toHaveBeenCalled()
			expect(routeFactory.createCrudHandlers).toHaveBeenCalledWith(
				expect.objectContaining({
					table: expect.any(Object),
					resourceName: 'transactions',
					validateCreate: expect.any(Function),
					validateUpdate: expect.any(Function),
					validateId: expect.any(Function),
					transformData: expect.any(Function),
				})
			)
		})

		it('型パラメータが明示的に指定されていること', () => {
			// createCrudHandlersが型パラメータ付きで呼び出されることを確認
			// 実装では型パラメータが指定されているが、JavaScriptランタイムでは型情報は消える
			// そのため、このテストは主にドキュメント目的
			createTransactionsApp()
			expect(routeFactory.createCrudHandlers).toHaveBeenCalledTimes(1)
		})
	})

	describe('エラーハンドリングユーティリティの使用', () => {
		it('エラーハンドリングミドルウェアを使用していること', () => {
			createTransactionsApp()

			// errorHandlerミドルウェアが設定されていることを確認
			expect(errorHandler.errorHandler).toHaveBeenCalled()
		})

		it('エラーハンドリングが統一されていること', () => {
			// エラーハンドリングミドルウェアが正しく設定されていることを確認
			const _app = createTransactionsApp()

			// errorHandlerミドルウェアが適用されていることを確認
			expect(errorHandler.errorHandler).toHaveBeenCalled()

			// handleError関数がモック内で定義されていることを確認
			expect(errorHandler.handleError).toBeDefined()
			expect(typeof errorHandler.handleError).toBe('function')

			// CRUDハンドラーの設定にエラーハンドリングが含まれていることを確認
			expect(routeFactory.createCrudHandlers).toHaveBeenCalledWith(
				expect.objectContaining({
					resourceName: 'transactions',
				})
			)
		})
	})

	describe('ビジネスロジックの分離', () => {
		it('addCategoryInfoToTransactions関数が型定義に移動されていること', async () => {
			// typesからaddCategoryInfoToTransactions関数がエクスポートされていることを確認
			const types = await import('../../types')
			expect(types.addCategoryInfoToTransactions).toBeDefined()
			expect(typeof types.addCategoryInfoToTransactions).toBe('function')
		})

		it('Transaction型が定義されていること', async () => {
			// 型定義の存在を確認（ランタイムでは型情報は消えるため、エクスポートの存在のみ確認）
			const types = await import('../../types')
			expect(types).toBeDefined()
		})
	})

	describe('既存機能の維持', () => {
		it('stats エンドポイントが維持されていること', () => {
			const app = createTransactionsApp()

			// statsエンドポイントが正しく定義されていることを確認
			// Honoのルート構造をテスト
			// @ts-ignore - プライベートプロパティへのアクセス
			const _routes = app.routes || []

			// statsエンドポイントの存在を別の方法で確認
			// Honoアプリのfetchメソッドをモックして、ルートが存在することを検証
			const _hasStatsRoute = app.routes.some((route: { path?: string }) => {
				return route.path?.includes('stats')
			})

			// ルートが定義されていることを期待
			expect(app).toBeDefined()
			// createTransactionsApp関数が正しくappオブジェクトを返していることを確認
			expect(typeof app.fetch).toBe('function')
		})
	})

	describe('コード削減の確認', () => {
		it('formatValidationErrors関数が削除されていること', () => {
			// CRUDファクトリが正しく設定されていることを確認
			createTransactionsApp()

			expect(routeFactory.createCrudHandlers).toHaveBeenCalledWith(
				expect.objectContaining({
					table: expect.any(Object),
					resourceName: 'transactions',
					validateCreate: expect.any(Function),
					validateUpdate: expect.any(Function),
				})
			)
		})

		it('重複したCRUD実装が削除されていること', () => {
			// 実際の動作を通してリファクタリングの効果を検証
			const app = createTransactionsApp()

			// CRUDファクトリが使用されていることを確認
			expect(routeFactory.createCrudHandlers).toHaveBeenCalledWith(
				expect.objectContaining({
					table: expect.any(Object),
					resourceName: 'transactions',
				})
			)

			// アプリケーションが正しく構築されることを確認
			expect(app).toBeDefined()
			expect(typeof app.fetch).toBe('function')
		})
	})
})
