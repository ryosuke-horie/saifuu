import type SQLiteDatabase from 'better-sqlite3'
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Cloudflare Workers環境の型定義
export interface Env {
	DB: D1Database
}

// データベース接続を初期化する関数
// 開発環境ではローカルのD1を使用し、本番環境では本番D1を使用
export function createDatabase(binding: D1Database) {
	return drizzle(binding, { schema })
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
export type TestDatabase = ReturnType<typeof createTestDatabase>
export { schema }
