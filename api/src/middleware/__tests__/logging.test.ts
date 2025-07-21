import type { Context } from 'hono'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoggerFactory } from '../../logger/factory'
import type { LoggingVariables } from '../logging'
import { loggingMiddleware } from '../logging'

/**
 * Logging Middleware のテスト
 *
 * Issue #299 修正対応:
 * - 実装詳細のテストを削除
 * - ヘルパー関数のテストを削除（統合テストでカバー済み）
 * - 重複したテストを統合
 */

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

		// ステータスコードによるログレベルのテストをパラメータ化
		it.each([
			{ status: 404, level: 'warn', description: '4xx client error' },
			{ status: 500, level: 'error', description: '5xx server error' },
		])('should use $level level for $description', async ({ status, level }) => {
			const app = new Hono()
			app.use(loggingMiddleware())
			app.get('/test', (c) => {
				c.status(status as Parameters<typeof c.status>[0])
				return c.text('Response')
			})

			await app.request('/test')

			const logMethod = mockLogger[level as keyof typeof mockLogger]
			expect(logMethod).toHaveBeenCalledWith(
				expect.stringContaining(`GET /test - ${status}`),
				expect.objectContaining({
					statusCode: status,
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
