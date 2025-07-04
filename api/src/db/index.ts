import SQLiteDatabase from 'better-sqlite3'
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/d1'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
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
export function createDevDatabase(path = './dev.db') {
	if (!devDatabase) {
		try {
			devDatabase = new SQLiteDatabase(path)
		} catch (error) {
			console.error('Failed to create SQLite database:', error)
			throw error
		}

		// テーブルを作成（存在しない場合）
		try {
			devDatabase.exec(`
			CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				type TEXT NOT NULL,
				color TEXT,
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
			const categoryCount = devDatabase
				.prepare('SELECT COUNT(*) as count FROM categories')
				.get() as {
				count: number
			}
			if (categoryCount.count === 0) {
				devDatabase.exec(`
				INSERT INTO categories (name, type, color) VALUES
				('エンターテイメント', 'expense', '#FF6B6B'),
				('仕事・ビジネス', 'expense', '#4ECDC4'),
				('学習・教育', 'expense', '#45B7D1'),
				('健康・フィットネス', 'expense', '#96CEB4'),
				('その他', 'expense', '#FFEAA7');
			`)
			}
		} catch (error) {
			console.error('Failed to create database tables:', error)
			throw error
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

// 共通のデータベースインターフェース
// D1とSQLiteで共通のメソッドのみを含む安全な型定義
export interface CommonDatabase {
	select: (...args: any[]) => any
	insert: (...args: any[]) => any
	update: (...args: any[]) => any
	delete: (...args: any[]) => any
}

// 型安全性を保ちつつ、実行時の柔軟性を提供
export type AnyDatabase = CommonDatabase & {
	[key: string]: any
}

export { schema }
