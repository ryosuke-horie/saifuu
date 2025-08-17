// 開発環境用のデータベース接続モジュール

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// 開発環境用のデータベース初期化
export function createDevSqliteDatabase() {
	// 開発環境でのデータベースパス（Vite環境変数を使用）
	const dbPath = import.meta.env.DEV_DB_PATH || './dev.db'

	// SQLiteデータベースを作成（ファイルが存在しない場合は自動作成）
	const sqlite = new Database(dbPath)

	// Drizzle ORMインスタンスを作成
	return drizzle(sqlite, { schema })
}

// 型推論のためのデータベース型
export type DevDatabase = ReturnType<typeof createDevSqliteDatabase>
