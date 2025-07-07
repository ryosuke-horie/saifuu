import { drizzle } from 'drizzle-orm/better-sqlite3'
import { Hono } from 'hono'
import type { AnyDatabase, Env } from '../../db'
import * as schema from '../../db/schema'
import categoriesRouter from '../../routes/categories'
import { createSubscriptionsApp } from '../../routes/subscriptions'
import { getTestSqliteInstance } from './test-db'

/**
 * テスト用の本番APIアプリインスタンス作成ヘルパー
 * 本番のindex.tsxと同様の構成でテスト用データベースを注入する
 * better-sqlite3版: テスト環境ではbetter-sqlite3のdrizzleアダプターを使用
 */
export function createTestProductionApp() {
	const sqliteInstance = getTestSqliteInstance()
	// テスト環境ではbetter-sqlite3版のdrizzleを使用
	const testDatabase = drizzle(sqliteInstance, { schema }) as AnyDatabase

	// メインアプリと同じ構成のテストアプリを作成
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		}
	}>()

	// ミドルウェア: テスト用データベースを設定
	app.use('/api/*', async (c, next) => {
		c.set('db', testDatabase)
		await next()
	})

	// ルートの設定（メインアプリと同じ構成）
	app.route('/api/categories', categoriesRouter)
	app.route('/api/subscriptions', createSubscriptionsApp({ testDatabase }))

	return app
}

export default createTestProductionApp()
