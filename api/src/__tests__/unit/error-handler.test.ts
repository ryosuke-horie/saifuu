import { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Env } from '../../db'
import {
	ApiError,
	DatabaseError,
	errorHandler,
	handleError,
	NotFoundError,
	ValidationError,
} from '../../lib/error-handler'
import { type LoggingVariables } from '../../middleware/logging'

// モックのロガー
const mockLogger = {
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}

// モックのコンテキスト作成
function createMockContext(): Context<{
	Bindings: Env
	Variables: LoggingVariables
}> {
	const ctx = {
		json: vi.fn((object, status) => ({
			body: object,
			status: status || 200,
		})),
		get: vi.fn((key) => {
			if (key === 'logger') return mockLogger
			if (key === 'requestId') return 'test-request-id'
			return undefined
		}),
		req: {
			method: 'GET',
			path: '/test',
		},
	} as unknown as Context<{
		Bindings: Env
		Variables: LoggingVariables
	}>

	return ctx
}

describe('Error Handler', () => {
	let mockContext: Context<{
		Bindings: Env
		Variables: LoggingVariables
	}>

	beforeEach(() => {
		vi.clearAllMocks()
		mockContext = createMockContext()
	})

	describe('Error Classes', () => {
		it('ValidationErrorは正しいプロパティを持つ', () => {
			const errors = [
				{ field: 'name', message: '名前は必須です' },
				{ field: 'email', message: 'メールアドレスの形式が正しくありません' },
			]
			const error = new ValidationError('バリデーションエラー', errors)

			expect(error.message).toBe('バリデーションエラー')
			expect(error.statusCode).toBe(400)
			expect(error.errors).toEqual(errors)
			expect(error.name).toBe('ValidationError')
		})

		it('NotFoundErrorは正しいプロパティを持つ', () => {
			const error = new NotFoundError('リソースが見つかりません')

			expect(error.message).toBe('リソースが見つかりません')
			expect(error.statusCode).toBe(404)
			expect(error.name).toBe('NotFoundError')
		})

		it('DatabaseErrorは正しいプロパティを持つ', () => {
			const originalError = new Error('DB connection failed')
			const error = new DatabaseError('データベースエラー', originalError)

			expect(error.message).toBe('データベースエラー')
			expect(error.statusCode).toBe(500)
			expect(error.originalError).toBe(originalError)
			expect(error.name).toBe('DatabaseError')
		})

		it('ApiErrorはカスタムステータスコードを設定できる', () => {
			const error = new ApiError('認証エラー', 401)

			expect(error.message).toBe('認証エラー')
			expect(error.statusCode).toBe(401)
			expect(error.name).toBe('ApiError')
		})
	})

	describe('handleError', () => {
		it('ValidationErrorを正しく処理する', () => {
			const errors = [{ field: 'name', message: '名前は必須です' }]
			const error = new ValidationError('バリデーションエラー', errors)

			const response = handleError(mockContext, error)

			expect(mockContext.json).toHaveBeenCalledWith(
				{
					error: 'バリデーションエラー',
					details: errors,
				},
				400
			)
			expect(mockLogger.warn).toHaveBeenCalledWith(
				'バリデーションエラー',
				expect.objectContaining({
					requestId: 'test-request-id',
					resource: 'unknown',
					errors,
				})
			)
			expect(response).toEqual({
				body: { error: 'バリデーションエラー', details: errors },
				status: 400,
			})
		})

		it('NotFoundErrorを正しく処理する', () => {
			const error = new NotFoundError('取引が見つかりません')

			const _response = handleError(mockContext, error, 'transactions')

			expect(mockContext.json).toHaveBeenCalledWith(
				{
					error: '取引が見つかりません',
				},
				404
			)
			expect(mockLogger.warn).toHaveBeenCalledWith(
				'取引が見つかりません',
				expect.objectContaining({
					requestId: 'test-request-id',
					resource: 'transactions',
				})
			)
		})

		it('DatabaseErrorを正しく処理する', () => {
			const originalError = new Error('Connection timeout')
			const error = new DatabaseError('データベース接続エラー', originalError)

			const _response = handleError(mockContext, error, 'subscriptions')

			expect(mockContext.json).toHaveBeenCalledWith(
				{
					error: 'データベース接続エラー',
				},
				500
			)
			expect(mockLogger.error).toHaveBeenCalledWith(
				'データベース接続エラー',
				expect.objectContaining({
					requestId: 'test-request-id',
					resource: 'subscriptions',
					error: 'Connection timeout',
					stack: originalError.stack,
				})
			)
		})

		it('一般的なErrorを正しく処理する', () => {
			const error = new Error('予期しないエラー')

			const _response = handleError(mockContext, error)

			expect(mockContext.json).toHaveBeenCalledWith(
				{
					error: '予期しないエラーが発生しました',
				},
				500
			)
			expect(mockLogger.error).toHaveBeenCalledWith(
				'予期しないエラーが発生しました',
				expect.objectContaining({
					requestId: 'test-request-id',
					resource: 'unknown',
					error: '予期しないエラー',
					stack: error.stack,
				})
			)
		})

		it('文字列エラーを正しく処理する', () => {
			const error = 'エラー文字列'

			const _response = handleError(mockContext, error, 'categories')

			expect(mockContext.json).toHaveBeenCalledWith(
				{
					error: '予期しないエラーが発生しました',
				},
				500
			)
			expect(mockLogger.error).toHaveBeenCalledWith(
				'予期しないエラーが発生しました',
				expect.objectContaining({
					requestId: 'test-request-id',
					resource: 'categories',
					error: 'エラー文字列',
				})
			)
		})
	})

	describe('errorHandler (middleware)', () => {
		it('正常なリクエストはそのまま通す', async () => {
			const next = vi.fn().mockResolvedValue(undefined)
			const middleware = errorHandler()

			await middleware(mockContext, next)

			expect(next).toHaveBeenCalled()
			expect(mockContext.json).not.toHaveBeenCalled()
		})

		it('ApiErrorをキャッチして処理する', async () => {
			const error = new ApiError('認証が必要です', 401)
			const next = vi.fn().mockRejectedValue(error)
			const middleware = errorHandler()

			await middleware(mockContext, next)

			expect(mockContext.json).toHaveBeenCalledWith(
				{
					error: '認証が必要です',
				},
				401
			)
		})

		it('予期しないエラーをキャッチして処理する', async () => {
			const error = new Error('Unexpected error')
			const next = vi.fn().mockRejectedValue(error)
			const middleware = errorHandler()

			await middleware(mockContext, next)

			expect(mockContext.json).toHaveBeenCalledWith(
				{
					error: '予期しないエラーが発生しました',
				},
				500
			)
			expect(mockLogger.error).toHaveBeenCalled()
		})
	})
})
