import { createTestDatabaseAsD1 } from '../../db'
import { createSubscriptionsApp } from '../../routes/subscriptions'
import { getTestSqliteInstance } from './test-db'

/**
 * テスト用の本番APIアプリインスタンス作成ヘルパー
 * 本番のsubscriptions.tsを使用しつつ、テスト用データベースを注入する
 */
export function createTestProductionApp() {
	const sqliteInstance = getTestSqliteInstance()
	const testDatabase = createTestDatabaseAsD1(sqliteInstance)

	return createSubscriptionsApp({ testDatabase })
}

export default createTestProductionApp()
