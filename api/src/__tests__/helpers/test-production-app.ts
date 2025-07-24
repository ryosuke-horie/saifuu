import { drizzle } from 'drizzle-orm/better-sqlite3'
import { Hono } from 'hono'
import type { AnyDatabase, Env } from '../../db'
import * as schema from '../../db/schema'
import { type LoggingVariables, loggingMiddleware } from '../../middleware/logging'
import categoriesRouter from '../../routes/categories'
import { createSubscriptionsApp } from '../../routes/subscriptions'
import { createTransactionsApp } from '../../routes/transactions'
import { getTestSqliteInstance } from './test-db'

/**
 * テスト用の本番APIアプリインスタンス作成ヘルパー
 * 本番のindex.tsxと同様の構成でテスト用データベースを注入する
 * better-sqlite3版: テスト環境ではbetter-sqlite3のdrizzleアダプターを使用
 * Zodバリデーションを使用
 * @param db - オプショナル: 既存のデータベースインスタンスを使用する場合
 */
export function createTestProductionApp(db?: AnyDatabase) {
	const testDatabase =
		db || (drizzle(getTestSqliteInstance(), { schema }) as unknown as AnyDatabase)

	// メインアプリと同じ構成のテストアプリを作成
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		} & LoggingVariables
	}>()

	// ミドルウェア: ロギングミドルウェアを適用（テスト環境用の設定）
	app.use('*', loggingMiddleware({ NODE_ENV: 'test' }))

	// ミドルウェア: テスト用データベースを設定
	app.use('/api/*', async (c, next) => {
		c.set('db', testDatabase)
		await next()
	})

	// ルートの設定（メインアプリと同じ構成）
	app.route('/api/categories', categoriesRouter)
	app.route('/api/subscriptions', createSubscriptionsApp({ testDatabase }))
	app.route('/api/transactions', createTransactionsApp({ testDatabase }))

	return app
}

export default createTestProductionApp()
