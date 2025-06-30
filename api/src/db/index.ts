import SQLiteDatabase from 'better-sqlite3'
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Cloudflare Workers環境の型定義
export interface Env {
	DB: D1Database
}

// 開発環境用のローカルSQLiteデータベースインスタンス
let devDatabase: SQLiteDatabase.Database | null = null

// データベース接続を初期化する関数
// 開発環境ではローカルのD1を使用し、本番環境では本番D1を使用
export function createDatabase(binding: D1Database) {
	return drizzle(binding, { schema })
}

// E2E テスト用のローカルSQLiteデータベース接続
export function createDevDatabase(path = './e2e-test.db') {
	if (!devDatabase) {
		devDatabase = new SQLiteDatabase(path)
		
		// テーブルを作成（存在しない場合）
		devDatabase.exec(`
			CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				type TEXT NOT NULL,
				description TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
			
			CREATE TABLE IF NOT EXISTS subscriptions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				amount REAL NOT NULL,
				billing_cycle TEXT NOT NULL,
				next_billing_date TEXT NOT NULL,
				category_id INTEGER NOT NULL,
				is_active INTEGER NOT NULL DEFAULT 1,
				description TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (category_id) REFERENCES categories (id)
			);
		`)
		
		// デフォルトカテゴリを挿入（存在しない場合）
		const categoryCount = devDatabase.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
		if (categoryCount.count === 0) {
			devDatabase.exec(`
				INSERT INTO categories (name, type, description) VALUES
				('エンターテイメント', 'expense', '動画配信、音楽配信、ゲームなど'),
				('仕事・ビジネス', 'expense', 'クラウドサービス、ソフトウェアライセンスなど'),
				('学習・教育', 'expense', 'オンライン学習、電子書籍など'),
				('健康・フィットネス', 'expense', 'フィットネスアプリ、健康管理など'),
				('その他', 'expense', 'その他のサブスクリプション');
			`)
		}
	}
	
	return drizzleSQLite(devDatabase, { schema })
}

// テスト用のSQLiteデータベース接続を初期化する関数
export function createTestDatabase(binding: SQLiteDatabase.Database) {
	return drizzleSQLite(binding, { schema })
}

// テスト用のSQLiteデータベースをD1型として作成する関数
export function createTestDatabaseAsD1(binding: SQLiteDatabase.Database) {
	return drizzleSQLite(binding, { schema }) as unknown as ReturnType<typeof createDatabase>
}

// 型推論のためのデータベース型
export type Database = ReturnType<typeof createDatabase>
export type DevDatabase = ReturnType<typeof createDevDatabase>
export type TestDatabase = ReturnType<typeof createTestDatabase>
export type AnyDatabase = Database | DevDatabase
export { schema }
