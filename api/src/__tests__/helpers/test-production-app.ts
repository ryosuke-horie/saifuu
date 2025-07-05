import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../db/schema'
import { createSubscriptionsApp } from '../../routes/subscriptions'
import { getTestSqliteInstance } from './test-db'

/**
 * テスト用の本番APIアプリインスタンス作成ヘルパー
 * 本番のsubscriptions.tsを使用しつつ、テスト用データベースを注入する
 * better-sqlite3版: テスト環境ではbetter-sqlite3のdrizzleアダプターを使用
 */
export function createTestProductionApp() {
	const sqliteInstance = getTestSqliteInstance()
	// テスト環境ではbetter-sqlite3版のdrizzleを使用
	const testDatabase = drizzle(sqliteInstance, { schema })

	return createSubscriptionsApp({ testDatabase })
}

export default createTestProductionApp()
