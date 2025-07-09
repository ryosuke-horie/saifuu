import type { D1Database } from '@cloudflare/workers-types'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../db/schema'

/**
 * テスト用データベースヘルパー
 * テスト環境でのSQLiteデータベースのセットアップを管理する
 * better-sqlite3を使用してインメモリSQLiteデータベースを作成し、
 * Drizzle ORMを通じてアクセスする
 */

// グローバルなSQLiteインスタンス（テスト間で共有）
let globalSqliteInstance: Database.Database | null = null
let globalDrizzleInstance: ReturnType<typeof drizzle> | null = null

/**
 * テスト用SQLiteデータベースを初期化
 */
function initializeTestDatabase() {
	if (!globalSqliteInstance) {
		// インメモリSQLiteデータベースを作成
		globalSqliteInstance = new Database(':memory:')
		globalDrizzleInstance = drizzle(globalSqliteInstance, { schema })

		// テーブルを作成（新しいスキーマに合わせてTEXT型のタイムスタンプを使用）
		globalSqliteInstance.exec(`
			CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
				color TEXT,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			
			CREATE TABLE IF NOT EXISTS transactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				amount REAL NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
				category_id INTEGER REFERENCES categories(id),
				description TEXT,
				date TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			
			CREATE TABLE IF NOT EXISTS subscriptions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				amount REAL NOT NULL,
				billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')),
				next_billing_date TEXT NOT NULL,
				category_id INTEGER REFERENCES categories(id),
				description TEXT,
				is_active INTEGER NOT NULL DEFAULT 1,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
		`)

		// テスト用のカテゴリを挿入（ISO文字列形式のタイムスタンプを使用）
		const now = new Date().toISOString()
		globalSqliteInstance
			.prepare(`
			INSERT INTO categories (id, name, type, color, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`)
			.run(1, 'エンターテイメント', 'expense', '#FF6B6B', now, now)

		globalSqliteInstance
			.prepare(`
			INSERT INTO categories (id, name, type, color, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`)
			.run(2, 'ソフトウェア', 'expense', '#4ECDC4', now, now)
	}
}

/**
 * テスト用データベースインスタンスを取得
 * @returns テスト用のDrizzleデータベースインスタンス（better-sqlite3版）
 */
export function createTestDatabase() {
	initializeTestDatabase()
	return globalDrizzleInstance!
}

/**
 * テスト用のSQLiteインスタンスを取得
 * @returns テスト用のSQLiteデータベースインスタンス
 */
export function getTestSqliteInstance() {
	initializeTestDatabase()
	return globalSqliteInstance!
}

/**
 * テスト用のCloudflare環境変数モック
 * SQLiteデータベースをD1データベースとして提供する
 */
export function createTestEnv(): { DB: D1Database } {
	// SQLiteデータベースをD1として扱うためのアダプター
	initializeTestDatabase()

	// SQLiteデータベースをD1データベースインターフェースにアダプトする
	// 実際にはDrizzleを直接使用するため、この関数は環境互換性のためのダミー
	return {
		DB: globalSqliteInstance as unknown as D1Database,
	}
}

/**
 * テストデータベースのセットアップ
 * 各テストケース前に実行される初期化処理
 */
export async function setupTestDatabase() {
	initializeTestDatabase()

	// テストデータベースをクリーンアップ（subscriptionsとtransactionsテーブル）
	if (globalSqliteInstance) {
		globalSqliteInstance.prepare('DELETE FROM subscriptions').run()
		globalSqliteInstance.prepare('DELETE FROM transactions').run()
	}

	const db = createTestDatabase()
	return db
}

/**
 * テストデータベースのクリーンアップ
 * 各テストケース後に実行される後処理
 */
export async function cleanupTestDatabase() {
	// subscriptionsとtransactionsテーブルをクリーンアップ
	if (globalSqliteInstance) {
		globalSqliteInstance.prepare('DELETE FROM subscriptions').run()
		globalSqliteInstance.prepare('DELETE FROM transactions').run()
	}

	const db = createTestDatabase()
	return db
}
