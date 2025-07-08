import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CloudflareLogger } from '../cloudflare-logger'
import { createLogger, LoggerFactory } from '../factory'

describe('LoggerFactory', () => {
	const mockEnv = {
		NODE_ENV: 'development',
		LOG_LEVEL: 'debug',
		LOG_BUFFER_SIZE: '10',
		LOG_FLUSH_INTERVAL: '1000',
		VERSION: '1.0.0',
	}

	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		LoggerFactory.reset()
		vi.restoreAllMocks()
	})

	describe('シングルトンパターン', () => {
		it('should return the same instance on multiple calls', () => {
			const logger1 = LoggerFactory.getInstance(mockEnv)
			const logger2 = LoggerFactory.getInstance()

			expect(logger1).toBe(logger2)
			expect(logger1).toBeInstanceOf(CloudflareLogger)
		})

		it('should throw error when no env provided on first call', () => {
			expect(() => {
				LoggerFactory.getInstance()
			}).toThrow('Environment variables required for logger initialization')
		})

		it('should work without env on subsequent calls', () => {
			// 最初の呼び出しで環境変数を提供
			const logger1 = LoggerFactory.getInstance(mockEnv)

			// 2回目以降は環境変数なしでもOK
			const logger2 = LoggerFactory.getInstance()

			expect(logger1).toBe(logger2)
		})
	})

	describe('設定管理', () => {
		it('should store and return config', () => {
			LoggerFactory.getInstance(mockEnv)
			const config = LoggerFactory.getConfig()

			expect(config).toEqual({
				environment: 'development',
				level: 'debug',
				bufferSize: 10,
				flushInterval: 1000,
				version: '1.0.0',
			})
		})

		it('should return null config when not initialized', () => {
			const config = LoggerFactory.getConfig()
			expect(config).toBeNull()
		})

		it('should handle production environment config', () => {
			const prodEnv = {
				...mockEnv,
				NODE_ENV: 'production',
				LOG_LEVEL: 'info',
				LOG_BUFFER_SIZE: '50',
				LOG_FLUSH_INTERVAL: '5000',
			}

			LoggerFactory.getInstance(prodEnv)
			const config = LoggerFactory.getConfig()

			expect(config).toEqual({
				environment: 'production',
				level: 'info',
				bufferSize: 50,
				flushInterval: 5000,
				version: '1.0.0',
			})
		})
	})

	describe('リセット機能', () => {
		it('should reset instance and config', () => {
			const logger = LoggerFactory.getInstance(mockEnv)
			expect(logger).toBeInstanceOf(CloudflareLogger)
			expect(LoggerFactory.getConfig()).not.toBeNull()

			LoggerFactory.reset()

			expect(LoggerFactory.getConfig()).toBeNull()

			// 新しいインスタンスが作成される
			expect(() => {
				LoggerFactory.getInstance()
			}).toThrow('Environment variables required for logger initialization')
		})

		it('should call destroy on existing instance', () => {
			const logger = LoggerFactory.getInstance(mockEnv)
			const destroySpy = vi.spyOn(logger as CloudflareLogger, 'destroy')

			LoggerFactory.reset()

			expect(destroySpy).toHaveBeenCalled()
		})

		it('should handle reset when no instance exists', () => {
			// インスタンスがない状態でリセット
			expect(() => {
				LoggerFactory.reset()
			}).not.toThrow()
		})
	})

	describe('createLogger ヘルパー関数', () => {
		it('should create logger using factory', () => {
			const logger = createLogger(mockEnv)
			const factoryLogger = LoggerFactory.getInstance()

			expect(logger).toBe(factoryLogger)
			expect(logger).toBeInstanceOf(CloudflareLogger)
		})

		it('should work with existing factory instance', () => {
			// ファクトリーでインスタンス作成
			const factoryLogger = LoggerFactory.getInstance(mockEnv)

			// ヘルパー関数で同じインスタンスを取得
			const helperLogger = createLogger()

			expect(factoryLogger).toBe(helperLogger)
		})
	})

	describe('環境変数の処理', () => {
		it('should handle missing optional environment variables', () => {
			const minimalEnv = {
				NODE_ENV: 'development',
			}

			const logger = LoggerFactory.getInstance(minimalEnv)
			const config = LoggerFactory.getConfig()

			expect(config).toEqual({
				environment: 'development',
				level: 'debug', // デフォルト値
				bufferSize: 10, // デフォルト値
				flushInterval: 1000, // デフォルト値
				version: '1.0.0', // デフォルト値
			})

			expect(logger).toBeInstanceOf(CloudflareLogger)
		})

		it('should handle production defaults', () => {
			const prodEnv = {
				NODE_ENV: 'production',
			}

			const logger = LoggerFactory.getInstance(prodEnv)
			const config = LoggerFactory.getConfig()

			expect(config).toEqual({
				environment: 'production',
				level: 'info', // 本番環境のデフォルト
				bufferSize: 50, // 本番環境のデフォルト
				flushInterval: 5000, // 本番環境のデフォルト
				version: '1.0.0',
			})

			expect(logger).toBeInstanceOf(CloudflareLogger)
		})

		it('should handle custom environment variables', () => {
			const customEnv = {
				NODE_ENV: 'production',
				LOG_LEVEL: 'warn',
				LOG_BUFFER_SIZE: '100',
				LOG_FLUSH_INTERVAL: '10000',
				VERSION: '2.0.0',
				CUSTOM_VAR: 'custom_value',
			}

			const logger = LoggerFactory.getInstance(customEnv)
			const config = LoggerFactory.getConfig()

			expect(config).toEqual({
				environment: 'production',
				level: 'warn',
				bufferSize: 100,
				flushInterval: 10000,
				version: '2.0.0',
			})

			expect(logger).toBeInstanceOf(CloudflareLogger)
		})
	})

	describe('統合テスト', () => {
		it('should create functional logger that can log messages', () => {
			const logger = LoggerFactory.getInstance(mockEnv)

			logger.info('Factory test message', { requestId: 'factory-test' })

			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Factory test message'))
		})

		it('should maintain logger functionality after multiple operations', () => {
			// 最初のロガー作成
			const logger1 = LoggerFactory.getInstance(mockEnv)
			logger1.info('Message 1')

			// 同じインスタンスを取得
			const logger2 = LoggerFactory.getInstance()
			logger2.warn('Message 2')

			// リセット後に新しいロガー作成
			LoggerFactory.reset()
			const logger3 = LoggerFactory.getInstance(mockEnv)
			logger3.error('Message 3')

			expect(console.log).toHaveBeenCalledTimes(3)
			expect(logger1).toBe(logger2)
			expect(logger1).not.toBe(logger3)
		})
	})
})
