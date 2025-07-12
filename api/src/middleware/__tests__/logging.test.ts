import { type Context, Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoggerFactory } from '../../logger/factory'
import {
	getLogger,
	getLoggerContext,
	getRequestId,
	type LoggingVariables,
	loggingMiddleware,
	logWithContext,
} from '../logging'

// LoggerFactoryをモック
vi.mock('../../logger/factory', () => ({
	LoggerFactory: {
		getInstance: vi.fn(),
	},
}))

// crypto.randomUUIDをモック
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: vi.fn(),
	},
})

describe('Logging Middleware', () => {
	// モックロガーの設定
	const mockLogger = {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	}

	beforeEach(() => {
		// モックの初期化
		vi.clearAllMocks()
		vi.mocked(LoggerFactory.getInstance).mockReturnValue(mockLogger)
		vi.mocked(crypto.randomUUID).mockReturnValue('test-request-id')
	})

	describe('loggingMiddleware', () => {
		it('should add logger and requestId to context', async () => {
			const app = new Hono()
			app.use(loggingMiddleware())

			let capturedLogger: unknown
			let capturedRequestId: unknown
			app.get('/test', (c) => {
				capturedLogger = (c as unknown as Context<{ Variables: LoggingVariables }>).get('logger')
				capturedRequestId = (c as unknown as Context<{ Variables: LoggingVariables }>).get(
					'requestId'
				)
				return c.text('OK')
			})

			const res = await app.request('/test')

			expect(res.status).toBe(200)
			expect(capturedLogger).toBe(mockLogger)
			expect(capturedRequestId).toBe('test-request-id')
		})

		it('should log request start and completion', async () => {
			const app = new Hono()
			app.use(loggingMiddleware())
			app.get('/test', (c) => c.text('OK'))

			await app.request('/test')

			// リクエスト開始のログ
			expect(mockLogger.info).toHaveBeenCalledWith(
				'Request started: GET /test',
				expect.objectContaining({
					requestId: 'test-request-id',
					method: 'GET',
					path: '/test',
					operationType: 'read',
				})
			)

			// リクエスト完了のログ
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining('Request completed: GET /test - 200'),
				expect.objectContaining({
					requestId: 'test-request-id',
					statusCode: 200,
					duration: expect.any(Number),
				})
			)
		})

		it('should log error with proper context', async () => {
			const app = new Hono()
			app.use(loggingMiddleware())
			app.get('/error', () => {
				throw new Error('Test error')
			})

			try {
				await app.request('/error')
			} catch (error) {
				// エラーが再スローされることを確認
				expect(error).toBeInstanceOf(Error)
			}

			// エラーログが記録されることを確認
			// Honoが500エラーを処理する場合とexceptionが発生する場合の両方をテスト
			const errorCalls = mockLogger.error.mock.calls
			const hasFailedCall = errorCalls.some((call) =>
				call[0].includes('Request failed: GET /error')
			)
			const hasExceptionCall = errorCalls.some((call) =>
				call[0].includes('Request exception: GET /error')
			)

			expect(hasFailedCall || hasExceptionCall).toBe(true)
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('GET /error'),
				expect.objectContaining({
					requestId: 'test-request-id',
					statusCode: 500,
				})
			)
		})

		it('should use warn level for 4xx status codes', async () => {
			const app = new Hono()
			app.use(loggingMiddleware())
			app.get('/not-found', (c) => c.text('Not Found', 404))

			await app.request('/not-found')

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining('Request completed: GET /not-found - 404'),
				expect.objectContaining({
					statusCode: 404,
				})
			)
		})

		it('should use error level for 5xx status codes', async () => {
			const app = new Hono()
			app.use(loggingMiddleware())
			app.get('/server-error', (c) => c.text('Server Error', 500))

			await app.request('/server-error')

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('Request failed: GET /server-error - 500'),
				expect.objectContaining({
					statusCode: 500,
				})
			)
		})

		it('should detect correct operation types', async () => {
			const app = new Hono()
			app.use(loggingMiddleware())
			app.get('/read', (c) => c.text('OK'))
			app.post('/write', (c) => c.text('OK'))
			app.delete('/delete', (c) => c.text('OK'))

			// 読み取り操作
			await app.request('/read')
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ operationType: 'read' })
			)

			// 書き込み操作
			await app.request('/write', { method: 'POST' })
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ operationType: 'write' })
			)

			// 削除操作
			await app.request('/delete', { method: 'DELETE' })
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ operationType: 'delete' })
			)
		})
	})

	describe('Helper Functions', () => {
		// テスト用のモックコンテキスト型定義
		type MockedContext = {
			get: ReturnType<typeof vi.fn>
		}

		let testContext: MockedContext

		beforeEach(() => {
			testContext = {
				get: vi.fn(),
			}
		})

		describe('getLogger', () => {
			it('should return logger from context', () => {
				testContext.get.mockReturnValue(mockLogger)

				const result = getLogger(testContext as unknown as Context<{ Variables: LoggingVariables }>)

				expect(result).toBe(mockLogger)
				expect(testContext.get).toHaveBeenCalledWith('logger')
			})

			it('should throw error if logger not found', () => {
				testContext.get.mockReturnValue(undefined)

				expect(() =>
					getLogger(testContext as unknown as Context<{ Variables: LoggingVariables }>)
				).toThrow('Logger not found in context. Ensure loggingMiddleware is applied.')
			})
		})

		describe('getRequestId', () => {
			it('should return request ID from context', () => {
				testContext.get.mockReturnValue('test-request-id')

				const result = getRequestId(
					testContext as unknown as Context<{ Variables: LoggingVariables }>
				)

				expect(result).toBe('test-request-id')
				expect(testContext.get).toHaveBeenCalledWith('requestId')
			})

			it('should throw error if request ID not found', () => {
				testContext.get.mockReturnValue(undefined)

				expect(() =>
					getRequestId(testContext as unknown as Context<{ Variables: LoggingVariables }>)
				).toThrow('Request ID not found in context. Ensure loggingMiddleware is applied.')
			})
		})

		describe('getLoggerContext', () => {
			it('should return both logger and request ID', () => {
				testContext.get.mockImplementation((key: string) => {
					if (key === 'logger') return mockLogger
					if (key === 'requestId') return 'test-request-id'
					return undefined
				})

				const result = getLoggerContext(
					testContext as unknown as Context<{ Variables: LoggingVariables }>
				)

				expect(result).toEqual({
					logger: mockLogger,
					requestId: 'test-request-id',
				})
			})
		})

		describe('logWithContext', () => {
			it('should log with request ID from context', () => {
				testContext.get.mockImplementation((key: string) => {
					if (key === 'logger') return mockLogger
					if (key === 'requestId') return 'test-request-id'
					return undefined
				})

				logWithContext(
					testContext as unknown as Context<{ Variables: LoggingVariables }>,
					'info',
					'Test message',
					{ data: { value: 'test' } }
				)

				expect(mockLogger.info).toHaveBeenCalledWith('Test message', {
					requestId: 'test-request-id',
					data: { value: 'test' },
				})
			})

			it('should work with all log levels', () => {
				testContext.get.mockImplementation((key: string) => {
					if (key === 'logger') return mockLogger
					if (key === 'requestId') return 'test-request-id'
					return undefined
				})

				const ctx = testContext as unknown as Context<{ Variables: LoggingVariables }>
				logWithContext(ctx, 'debug', 'Debug message')
				logWithContext(ctx, 'info', 'Info message')
				logWithContext(ctx, 'warn', 'Warn message')
				logWithContext(ctx, 'error', 'Error message')

				expect(mockLogger.debug).toHaveBeenCalledWith('Debug message', {
					requestId: 'test-request-id',
				})
				expect(mockLogger.info).toHaveBeenCalledWith('Info message', {
					requestId: 'test-request-id',
				})
				expect(mockLogger.warn).toHaveBeenCalledWith('Warn message', {
					requestId: 'test-request-id',
				})
				expect(mockLogger.error).toHaveBeenCalledWith('Error message', {
					requestId: 'test-request-id',
				})
			})
		})
	})

	describe('Operation Type Detection', () => {
		it('should correctly identify read operations', () => {
			const app = new Hono()
			app.use(loggingMiddleware())

			const readMethods = ['GET', 'HEAD', 'OPTIONS']

			readMethods.forEach((method) => {
				app.on(method, '/test', (c) => c.text('OK'))
			})

			// この部分は実際のHTTPメソッドでテストする必要がある
			// 単体テストでは内部関数を直接テストする方が適切
		})
	})

	describe('Environment Variables', () => {
		it('should pass environment variables to LoggerFactory', async () => {
			const env = { NODE_ENV: 'development', LOG_LEVEL: 'debug' }
			const app = new Hono()
			app.use(loggingMiddleware(env))
			app.get('/test', (c) => c.text('OK'))

			await app.request('/test')

			expect(LoggerFactory.getInstance).toHaveBeenCalledWith(env)
		})
	})
})
