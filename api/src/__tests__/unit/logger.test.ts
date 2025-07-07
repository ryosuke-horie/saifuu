/**
 * Logger implementation test script
 *
 * This script tests if the logger can be imported and used without errors.
 */

import { describe, expect, test } from 'vitest'
import { createLogger } from '../../logger/index'

describe('Logger Implementation Test', () => {
	// Mock environment for testing
	const mockEnv = {
		LOG_LEVEL: 'debug',
		NODE_ENV: 'test',
		ENVIRONMENT: 'test',
	}

	test('should import logger successfully', () => {
		expect(createLogger).toBeDefined()
		expect(typeof createLogger).toBe('function')
	})

	test('should create logger instance with environment', () => {
		const logger = createLogger(mockEnv)
		expect(logger).toBeDefined()
		expect(typeof logger.info).toBe('function')
		expect(typeof logger.warn).toBe('function')
		expect(typeof logger.error).toBe('function')
		expect(typeof logger.debug).toBe('function')
	})

	test('should log different levels without errors', () => {
		const logger = createLogger(mockEnv)

		// These should not throw errors
		expect(() => logger.info('This is an info message')).not.toThrow()
		expect(() => logger.warn('This is a warning message')).not.toThrow()
		expect(() => logger.error('This is an error message')).not.toThrow()
		expect(() => logger.debug('This is a debug message')).not.toThrow()
	})

	test('should log with metadata without errors', () => {
		const logger = createLogger(mockEnv)

		const metadata = {
			userId: '123',
			action: 'test',
			timestamp: new Date().toISOString(),
		}

		expect(() => logger.info('Message with metadata', metadata)).not.toThrow()
	})

	test('should log errors without errors', () => {
		const logger = createLogger(mockEnv)

		const testError = new Error('Test error')
		expect(() => logger.error('Test error logging', { error: testError.message })).not.toThrow()
	})

	test('should handle different log levels based on environment', () => {
		const infoLogger = createLogger({ ...mockEnv, LOG_LEVEL: 'info' })
		const errorLogger = createLogger({ ...mockEnv, LOG_LEVEL: 'error' })

		// Both should not throw errors
		expect(() => infoLogger.info('Info message')).not.toThrow()
		expect(() => errorLogger.error('Error message')).not.toThrow()
	})
})
