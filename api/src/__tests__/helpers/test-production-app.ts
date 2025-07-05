import { createTestDatabase } from '../../db'
import { createSubscriptionsApp } from '../../routes/subscriptions'
import { getTestSqliteInstance } from './test-db'

/**
 * テスト用の本番APIアプリインスタンス作成ヘルパー
 * 本番のsubscriptions.tsを使用しつつ、テスト用データベースを注入する
 * D1対応版: better-sqlite3インスタンスをD1として扱う
 */
export function createTestProductionApp() {
	const sqliteInstance = getTestSqliteInstance()
	// D1型としてキャストして統合テストで使用
	const testDatabase = createTestDatabase(sqliteInstance as any)

	return createSubscriptionsApp({ testDatabase })
}

export default createTestProductionApp()
