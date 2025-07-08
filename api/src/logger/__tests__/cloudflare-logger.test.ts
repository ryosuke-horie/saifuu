import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CloudflareLogger } from '../cloudflare-logger'
import { LoggerConfig } from '../types'

describe('CloudflareLogger', () => {
	let logger: CloudflareLogger
	let mockConfig: LoggerConfig

	beforeEach(() => {
		mockConfig = {
			environment: 'development',
			level: 'debug',
			bufferSize: 10,
			flushInterval: 1000,
			version: '1.0.0',
		}

		logger = new CloudflareLogger(mockConfig)
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		logger.destroy()
		vi.restoreAllMocks()
	})

	describe('ログレベル機能', () => {
		it('should log debug messages in development environment', () => {
			logger.debug('Test debug message', { requestId: 'test-123' })

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test debug message'))
		})

		it('should log info messages', () => {
			logger.info('Test info message', { requestId: 'test-123' })

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test info message'))
		})

		it('should log warn messages', () => {
			logger.warn('Test warn message', { requestId: 'test-123' })

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test warn message'))
		})

		it('should log error messages', () => {
			logger.error('Test error message', { requestId: 'test-123' })

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test error message'))
		})
	})

	describe('ログレベルフィルタリング', () => {
		it('should respect log level filtering', () => {
			const infoLogger = new CloudflareLogger({ ...mockConfig, level: 'info' })

			infoLogger.debug('This should not be logged')
			expect(console.log).not.toHaveBeenCalled()

			infoLogger.info('This should be logged')
			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('This should be logged'))

			infoLogger.destroy()
		})

		it('should filter debug when level is info', () => {
			const infoLogger = new CloudflareLogger({ ...mockConfig, level: 'info' })

			infoLogger.debug('Debug message')
			expect(console.log).not.toHaveBeenCalled()

			infoLogger.destroy()
		})

		it('should filter debug and info when level is warn', () => {
			const warnLogger = new CloudflareLogger({ ...mockConfig, level: 'warn' })

			warnLogger.debug('Debug message')
			warnLogger.info('Info message')
			expect(console.log).not.toHaveBeenCalled()

			warnLogger.warn('Warn message')
			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Warn message'))

			warnLogger.destroy()
		})

		it('should only log error when level is error', () => {
			const errorLogger = new CloudflareLogger({ ...mockConfig, level: 'error' })

			errorLogger.debug('Debug message')
			errorLogger.info('Info message')
			errorLogger.warn('Warn message')
			expect(console.log).not.toHaveBeenCalled()

			errorLogger.error('Error message')
			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Error message'))

			errorLogger.destroy()
		})
	})

	describe('環境別動作', () => {
		it('should output immediately in development environment', () => {
			const devLogger = new CloudflareLogger({
				...mockConfig,
				environment: 'development',
			})

			devLogger.info('Development log')

			// 開発環境では即座に出力（フォーマット付き）
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('"message": "Development log"')
			)

			devLogger.destroy()
		})

		it('should buffer logs in production environment', () => {
			const prodLogger = new CloudflareLogger({
				...mockConfig,
				environment: 'production',
				bufferSize: 3,
			})

			// 3つのログを送信（バッファサイズ未満）
			prodLogger.info('Log 1')
			prodLogger.info('Log 2')

			// まだフラッシュされていない
			expect(console.log).not.toHaveBeenCalled()

			prodLogger.destroy()
		})

		it('should flush buffer when size limit is reached in production', () => {
			const prodLogger = new CloudflareLogger({
				...mockConfig,
				environment: 'production',
				bufferSize: 2,
			})

			// バッファサイズに達するまでログを送信
			prodLogger.info('Log 1')
			prodLogger.info('Log 2')

			// バッファがフラッシュされる
			expect(console.log).toHaveBeenCalledTimes(2)

			prodLogger.destroy()
		})
	})

	describe('ログエントリ構造', () => {
		it('should create proper log entry structure', () => {
			logger.info('Test message', {
				requestId: 'test-123',
				userId: 'user-456',
				operationType: 'read',
			})

			const logCall = vi.mocked(console.log).mock.calls[0]
			expect(logCall).toBeDefined()
			const logEntry = JSON.parse(logCall[0])

			expect(logEntry).toMatchObject({
				level: 'info',
				message: 'Test message',
				requestId: 'test-123',
				environment: 'development',
				service: 'saifuu-api',
				version: '1.0.0',
				meta: {
					requestId: 'test-123',
					userId: 'user-456',
					operationType: 'read',
				},
			})

			expect(logEntry.timestamp).toBeDefined()
			expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date)
		})

		it('should generate requestId when not provided', () => {
			logger.info('Test message without requestId')

			const logCall = vi.mocked(console.log).mock.calls[0]
			const logEntry = JSON.parse(logCall[0])

			expect(logEntry.requestId).toBeDefined()
			expect(typeof logEntry.requestId).toBe('string')
			expect(logEntry.requestId.length).toBeGreaterThan(0)
		})
	})

	describe('エラーハンドリング', () => {
		it('should handle flush errors gracefully', async () => {
			const prodLogger = new CloudflareLogger({
				...mockConfig,
				environment: 'production',
			})

			// console.log でエラーをシミュレート
			vi.mocked(console.log).mockImplementationOnce(() => {
				throw new Error('Flush error')
			})

			prodLogger.info('Test message')

			// flushBuffer を手動で呼び出し
			// biome-ignore lint/suspicious/noExplicitAny: Accessing private method for testing
			await (prodLogger as any).flushBuffer()

			// エラーログが出力される
			expect(console.error).toHaveBeenCalledWith('Failed to flush logs:', expect.any(Error))

			prodLogger.destroy()
		})
	})

	describe('リソース管理', () => {
		it('should clean up timer on destroy', () => {
			const prodLogger = new CloudflareLogger({
				...mockConfig,
				environment: 'production',
			})

			// タイマーがセットアップされていることを確認
			// biome-ignore lint/suspicious/noExplicitAny: Accessing private property for testing
			expect((prodLogger as any).flushTimer).not.toBeNull()

			prodLogger.destroy()

			// タイマーがクリアされていることを確認
			// biome-ignore lint/suspicious/noExplicitAny: Accessing private property for testing
			expect((prodLogger as any).flushTimer).toBeNull()
		})

		it('should not set timer in development environment', () => {
			const devLogger = new CloudflareLogger({
				...mockConfig,
				environment: 'development',
			})

			// 開発環境ではタイマーがセットされない
			// biome-ignore lint/suspicious/noExplicitAny: Accessing private property for testing
			expect((devLogger as any).flushTimer).toBeNull()

			devLogger.destroy()
		})

		it('should flush remaining buffer on destroy', async () => {
			const prodLogger = new CloudflareLogger({
				...mockConfig,
				environment: 'production',
				bufferSize: 10,
			})

			// バッファサイズ未満のログを送信
			prodLogger.info('Buffered log 1')
			prodLogger.info('Buffered log 2')

			// destroy でフラッシュされる
			prodLogger.destroy()

			expect(console.log).toHaveBeenCalledTimes(2)
		})
	})

	describe('メタデータ処理', () => {
		it('should handle complex metadata', () => {
			const complexMeta = {
				requestId: 'req-123',
				userId: 'user-456',
				operationType: 'write' as const,
				duration: 150,
				path: '/api/subscriptions',
				method: 'POST',
				statusCode: 201,
				data: { id: 1, name: 'Test Subscription' },
				customField: 'custom value',
			}

			logger.info('Complex metadata test', complexMeta)

			const logCall = vi.mocked(console.log).mock.calls[0]
			const logEntry = JSON.parse(logCall[0])

			expect(logEntry.meta).toEqual(complexMeta)
		})

		it('should handle empty metadata', () => {
			logger.info('No metadata test')

			const logCall = vi.mocked(console.log).mock.calls[0]
			const logEntry = JSON.parse(logCall[0])

			expect(logEntry.meta).toEqual({})
			expect(logEntry.requestId).toBeDefined()
		})
	})
})
