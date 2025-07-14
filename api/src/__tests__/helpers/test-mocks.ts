import type { Context, Next } from 'hono'
import { vi } from 'vitest'
import { type AnyDatabase, type Env } from '../../db'
import { type LoggingVariables } from '../../middleware/logging'

/**
 * データベースエラーテスト用のモックユーティリティ
 * subscriptions.test.tsでの冗長なモック作成を共通化
 */

/**
 * SELECT操作でエラーを発生させるモックデータベース
 */
export function createSelectErrorMock() {
	return {
		select: vi.fn().mockImplementation(() => {
			throw new Error('Database connection failed')
		}),
	}
}

/**
 * INSERT操作でエラーを発生させるモックデータベース
 */
export function createInsertErrorMock() {
	return {
		insert: vi.fn().mockImplementation(() => ({
			values: vi.fn().mockImplementation(() => ({
				returning: vi.fn().mockImplementation(() => {
					throw new Error('Database connection failed')
				}),
			})),
		})),
	}
}

/**
 * UPDATE操作でエラーを発生させるモックデータベース
 */
export function createUpdateErrorMock() {
	return {
		update: vi.fn().mockImplementation(() => ({
			set: vi.fn().mockImplementation(() => ({
				where: vi.fn().mockImplementation(() => ({
					returning: vi.fn().mockImplementation(() => {
						throw new Error('Database connection failed')
					}),
				})),
			})),
		})),
	}
}

/**
 * DELETE操作でエラーを発生させるモックデータベース
 */
export function createDeleteErrorMock() {
	return {
		delete: vi.fn().mockImplementation(() => ({
			where: vi.fn().mockImplementation(() => ({
				returning: vi.fn().mockImplementation(() => {
					throw new Error('Database connection failed')
				}),
			})),
		})),
	}
}

/**
 * SELECT FROM WHERE操作でエラーを発生させるモックデータベース（個別取得用）
 */
export function createSelectByIdErrorMock() {
	return {
		select: vi.fn().mockImplementation(() => ({
			from: vi.fn().mockImplementation(() => ({
				where: vi.fn().mockImplementation(() => {
					throw new Error('Database connection failed')
				}),
			})),
		})),
	}
}

/**
 * テスト用Honoアプリを作成する共通関数
 * モックデータベースを使用してエラーハンドリングテストを行う
 */
export async function createMockTestApp(mockDatabase: AnyDatabase) {
	const { createSubscriptionsApp } = await import('../../routes/subscriptions')
	const { Hono } = await import('hono')
	const { loggingMiddleware } = await import('../../middleware/logging')

	const testApp = new Hono<{
		Bindings: Env
		Variables: { db: AnyDatabase } & LoggingVariables
	}>()
	testApp.use('*', loggingMiddleware({ NODE_ENV: 'test' }))
	testApp.use(
		'/api/*',
		async (
			c: Context<{ Bindings: Env; Variables: { db: AnyDatabase } & LoggingVariables }>,
			next: Next
		) => {
			c.set('db', mockDatabase as AnyDatabase)
			await next()
		}
	)
	testApp.route('/api/subscriptions', createSubscriptionsApp({ testDatabase: mockDatabase }))

	return testApp
}
