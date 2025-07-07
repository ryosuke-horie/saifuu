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
	// テスト環境では異なるDBドライバーを使用するため、型の変換が必要
	const testDatabase = drizzle(sqliteInstance, { schema }) as unknown as AnyDatabase

	// メインアプリと同じ構成のテストアプリを作成
	const app = new Hono<{
		Bindings: Env
		Variables: {
			db: AnyDatabase
		}
	}>()

	// ミドルウェア: テスト用データベースを設定
	app.use('/*', async (c, next) => {
		c.set('db', testDatabase)
		await next()
	})

	// ルートの設定（メインアプリと同じ構成）
	app.route('/categories', categoriesRouter)
	app.route('/subscriptions', createSubscriptionsApp({ testDatabase }))

	return app
}

export default createTestProductionApp()
