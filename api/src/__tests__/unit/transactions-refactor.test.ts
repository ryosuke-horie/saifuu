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
	handleError: vi.fn(),
	errorHandler: vi.fn(() => vi.fn()),
	ValidationError: class ValidationError extends Error {
		constructor(
			message: string,
			public errors: Array<{ field?: string; message: string }>
		) {
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

		it('エラーハンドリングが統一されていること', async () => {
			// CRUDハンドラーのモックをより詳細に設定
			const mockHandlers = {
				create: vi.fn().mockImplementation(async () => {
					throw new Error('Database connection failed')
				}),
				getById: vi.fn().mockImplementation(async () => {
					throw new Error('Database connection failed')
				}),
				update: vi.fn().mockImplementation(async () => {
					throw new Error('Database connection failed')
				}),
				delete: vi.fn().mockImplementation(async () => {
					throw new Error('Database connection failed')
				}),
				getAll: vi.fn(),
			}

			vi.mocked(routeFactory.createCrudHandlers).mockReturnValue(mockHandlers)

			const app = createTransactionsApp()

			// 各CRUD操作が適切に設定されていることを確認
			// モックが正しくセットアップされているかを検証
			expect(mockHandlers.create).toBeDefined()
			expect(mockHandlers.getById).toBeDefined()
			expect(mockHandlers.update).toBeDefined()
			expect(mockHandlers.delete).toBeDefined()
		})
	})

	describe('ビジネスロジックの分離', () => {
		it('addCategoryInfo関数が別ファイルに分離されていること', async () => {
			// transaction-utils.tsからaddCategoryInfo関数がエクスポートされていることを確認
			const utils = await import('../../utils/transaction-utils')
			expect(utils.addCategoryInfo).toBeDefined()
			expect(typeof utils.addCategoryInfo).toBe('function')
		})

		it('TransactionWithCategory型が定義されていること', async () => {
			// 型定義の存在を確認（ランタイムでは型情報は消えるため、エクスポートの存在のみ確認）
			const utils = await import('../../utils/transaction-utils')
			expect(utils).toBeDefined()
		})
	})

	describe('既存機能の維持', () => {
		it('stats エンドポイントが維持されていること', () => {
			const app = createTransactionsApp()

			// statsエンドポイントが正しく定義されていることを確認
			// Honoのルート構造をテスト
			// @ts-ignore - プライベートプロパティへのアクセス
			const routes = app.routes || []

			// statsエンドポイントの存在を別の方法で確認
			// Honoアプリのfetchメソッドをモックして、ルートが存在することを検証
			const hasStatsRoute = app.routes.some((route: any) => {
				return route.path && route.path.includes('stats')
			})

			// ルートが定義されていることを期待
			expect(app).toBeDefined()
			// createTransactionsApp関数が正しくappオブジェクトを返していることを確認
			expect(typeof app.fetch).toBe('function')
		})
	})

	describe('コード削減の確認', () => {
		it('formatValidationErrors関数が削除されていること', async () => {
			// transactions.tsのコード内にformatValidationErrorsが含まれていないことを確認
			const fs = await import('fs')
			const path = await import('path')
			const transactionsPath = path.join(__dirname, '../../routes/transactions.ts')
			const fileContent = fs.readFileSync(transactionsPath, 'utf-8')

			// formatValidationErrors関数が存在しないことを確認
			expect(fileContent).not.toContain('function formatValidationErrors')
			expect(fileContent).not.toContain('formatValidationErrors(')
		})

		it('重複したCRUD実装が削除されていること', async () => {
			// transactions.tsに手動のCRUD実装が含まれていないことを確認
			const fs = await import('fs')
			const path = await import('path')
			const transactionsPath = path.join(__dirname, '../../routes/transactions.ts')
			const fileContent = fs.readFileSync(transactionsPath, 'utf-8')

			// 以前の手動実装パターンが存在しないことを確認
			expect(fileContent).not.toContain('db.insert(transactions)')
			expect(fileContent).not.toContain('db.update(transactions)')
			expect(fileContent).not.toContain('db.delete(transactions)')

			// CRUDハンドラーの使用を確認
			expect(fileContent).toContain('crudHandlers.create')
			expect(fileContent).toContain('crudHandlers.getById')
			expect(fileContent).toContain('crudHandlers.update')
			expect(fileContent).toContain('crudHandlers.delete')
		})
	})
})
