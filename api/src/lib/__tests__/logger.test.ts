import { type Context, Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Logger, type LogLevel, type LogMeta } from '../../logger/types'
import { type LoggingVariables } from '../../middleware/logging'
import {
	createRequestLogger,
	logDatabaseOperation,
	logValidationError,
	type RequestLogOptions,
} from '../logger'

// モックされたロガー
const mockLogger: Logger = {
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}

// Honoコンテキストのモック
function createMockContext(overrides: Partial<Context> = {}): Context {
	return {
		get: vi.fn((key: string) => {
			if (key === 'logger') return mockLogger
			if (key === 'requestId') return 'test-request-id'
			return undefined
		}),
		req: {
			path: '/api/test',
			method: 'GET',
			header: vi.fn(),
			param: vi.fn(),
		},
		...overrides,
	} as unknown as Context
}

describe('logger utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('createRequestLogger', () => {
		it('リクエストロガーを作成し、開始ログを出力する', () => {
			const context = createMockContext()
			const options: RequestLogOptions = {
				resource: 'subscriptions',
				operation: 'list',
			}

			const requestLogger = createRequestLogger(context, options)

			// 開始ログが出力されることを確認
			expect(mockLogger.info).toHaveBeenCalledWith(
				'サブスクリプション一覧取得を開始',
				expect.objectContaining({
					operationType: 'read',
					resource: 'subscriptions',
					operation: 'list',
				})
			)

			expect(requestLogger).toHaveProperty('success')
			expect(requestLogger).toHaveProperty('error')
			expect(requestLogger).toHaveProperty('warn')
		})

		it('カスタムメッセージとメタデータを使用できる', () => {
			const context = createMockContext()
			const options: RequestLogOptions = {
				resource: 'transactions',
				operation: 'create',
				message: 'カスタム取引作成メッセージ',
				meta: {
					userId: 'user-123',
					amount: 1000,
				},
			}

			createRequestLogger(context, options)

			expect(mockLogger.info).toHaveBeenCalledWith(
				'カスタム取引作成メッセージ',
				expect.objectContaining({
					operationType: 'write',
					resource: 'transactions',
					operation: 'create',
					userId: 'user-123',
					amount: 1000,
				})
			)
		})

		it('成功ログを適切に記録する', () => {
			const context = createMockContext()
			const requestLogger = createRequestLogger(context, {
				resource: 'categories',
				operation: 'list',
			})

			const result = { count: 10 }
			requestLogger.success(result)

			expect(mockLogger.info).toHaveBeenCalledWith(
				'カテゴリ一覧取得が完了',
				expect.objectContaining({
					resource: 'categories',
					operation: 'list',
					result: { count: 10 },
				})
			)
		})

		it('エラーログを適切に記録する', () => {
			const context = createMockContext()
			const requestLogger = createRequestLogger(context, {
				resource: 'transactions',
				operation: 'update',
			})

			const error = new Error('Database connection failed')
			requestLogger.error(error)

			expect(mockLogger.error).toHaveBeenCalledWith(
				'取引更新でエラーが発生',
				expect.objectContaining({
					resource: 'transactions',
					operation: 'update',
					error: 'Database connection failed',
					stack: expect.any(String),
				})
			)
		})

		it('警告ログを適切に記録する', () => {
			const context = createMockContext()
			const requestLogger = createRequestLogger(context, {
				resource: 'subscriptions',
				operation: 'delete',
			})

			requestLogger.warn('対象が見つかりません', { id: 123 })

			expect(mockLogger.warn).toHaveBeenCalledWith(
				'サブスクリプション削除: 対象が見つかりません',
				expect.objectContaining({
					resource: 'subscriptions',
					operation: 'delete',
					id: 123,
				})
			)
		})
	})

	describe('logDatabaseOperation', () => {
		it('データベース操作の開始と成功を記録する', async () => {
			const context = createMockContext()
			const operation = vi.fn().mockResolvedValue({ id: 1, name: 'Test' })

			const result = await logDatabaseOperation(context, 'subscriptions', 'create', operation, {
				name: 'Test',
			})

			// 開始ログ
			expect(mockLogger.info).toHaveBeenCalledWith(
				'データベース操作を開始: subscriptions.create',
				expect.objectContaining({
					resource: 'subscriptions',
					operation: 'create',
					operationType: 'write',
					input: { name: 'Test' },
				})
			)

			// 成功ログ
			expect(mockLogger.info).toHaveBeenCalledWith(
				'データベース操作が完了: subscriptions.create',
				expect.objectContaining({
					resource: 'subscriptions',
					operation: 'create',
					duration: expect.any(Number),
					result: { id: 1, name: 'Test' },
				})
			)

			expect(result).toEqual({ id: 1, name: 'Test' })
		})

		it('データベース操作のエラーを記録する', async () => {
			const context = createMockContext()
			const error = new Error('Connection timeout')
			const operation = vi.fn().mockRejectedValue(error)

			await expect(
				logDatabaseOperation(context, 'transactions', 'delete', operation, { id: 1 })
			).rejects.toThrow('Connection timeout')

			// エラーログ
			expect(mockLogger.error).toHaveBeenCalledWith(
				'データベース操作でエラーが発生: transactions.delete',
				expect.objectContaining({
					resource: 'transactions',
					operation: 'delete',
					error: 'Connection timeout',
					stack: expect.any(String),
					input: { id: 1 },
				})
			)
		})

		it('読み取り操作を適切に分類する', async () => {
			const context = createMockContext()
			const operation = vi.fn().mockResolvedValue([])

			await logDatabaseOperation(context, 'categories', 'findMany', operation)

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					operationType: 'read',
				})
			)
		})
	})

	describe('logValidationError', () => {
		it('バリデーションエラーを警告として記録する', () => {
			const context = createMockContext()
			const errors = [
				{ field: 'amount', message: '金額は必須です' },
				{ field: 'date', message: '日付の形式が不正です' },
			]

			logValidationError(context, 'transactions', 'create', errors)

			expect(mockLogger.warn).toHaveBeenCalledWith(
				'バリデーションエラー: transactions.create',
				expect.objectContaining({
					resource: 'transactions',
					operation: 'create',
					validationErrors: errors,
					errorCount: 2,
				})
			)
		})

		it('カスタムメタデータを含めることができる', () => {
			const context = createMockContext()
			const errors = [{ field: 'name', message: '名前が長すぎます' }]

			logValidationError(context, 'subscriptions', 'update', errors, {
				maxLength: 100,
				providedLength: 150,
			})

			expect(mockLogger.warn).toHaveBeenCalledWith(
				'バリデーションエラー: subscriptions.update',
				expect.objectContaining({
					resource: 'subscriptions',
					operation: 'update',
					validationErrors: errors,
					errorCount: 1,
					maxLength: 100,
					providedLength: 150,
				})
			)
		})
	})

	describe('LogContext', () => {
		it('異なる操作タイプで適切なログレベルとメタデータが設定される', () => {
			const context = createMockContext()

			// read操作のテスト
			createRequestLogger(context, {
				resource: 'transactions',
				operation: 'findMany',
			})
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					operationType: 'read',
				})
			)

			vi.clearAllMocks()

			// write操作のテスト
			createRequestLogger(context, {
				resource: 'subscriptions',
				operation: 'create',
			})
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					operationType: 'write',
				})
			)

			vi.clearAllMocks()

			// delete操作のテスト
			createRequestLogger(context, {
				resource: 'categories',
				operation: 'delete',
			})
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					operationType: 'delete',
				})
			)
		})
	})

	describe('メッセージ生成', () => {
		it('リソースと操作から適切な日本語メッセージを生成する', () => {
			const context = createMockContext()

			// 各リソースタイプのテスト
			const testCases = [
				{
					resource: 'subscriptions',
					operation: 'list',
					expectedStart: 'サブスクリプション一覧取得を開始',
					expectedComplete: 'サブスクリプション一覧取得が完了',
				},
				{
					resource: 'transactions',
					operation: 'create',
					expectedStart: '取引作成を開始',
					expectedComplete: '取引作成が完了',
				},
				{
					resource: 'categories',
					operation: 'update',
					expectedStart: 'カテゴリ更新を開始',
					expectedComplete: 'カテゴリ更新が完了',
				},
			]

			for (const testCase of testCases) {
				vi.clearAllMocks()
				const logger = createRequestLogger(context, {
					resource: testCase.resource,
					operation: testCase.operation,
				})

				expect(mockLogger.info).toHaveBeenCalledWith(testCase.expectedStart, expect.any(Object))

				logger.success()

				expect(mockLogger.info).toHaveBeenCalledWith(testCase.expectedComplete, expect.any(Object))
			}
		})
	})
})
